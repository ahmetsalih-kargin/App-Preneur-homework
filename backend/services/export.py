import asyncio
import csv
import io
from xml.sax.saxutils import escape as xml_escape
import datetime
import uuid
import os
from sqlalchemy.ext.asyncio import AsyncSession
from crud.osint import get_target_with_entities
from models.osint import EntityType

# ReportLab imports for PDF Generation
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

def _csv_safe(value: str) -> str:
    """
    CSV/Formül enjeksiyonu: değerler taranan sitelerden geliyor (ZAP/Nuclei URL'leri, başlıklar).
    '=', '+', '-', '@' ile başlayan bir hücre Excel/LibreOffice'te formül olarak çalışır
    (örn. =HYPERLINK(...) ile veri sızdırma). Başına ' eklenerek metne zorlanır.
    """
    if value and value[0] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + value
    return value


def _p(value: str) -> str:
    """ReportLab Paragraph mini-HTML ayrıştırır: kaçışsız '<' veya '&' içeren bir bulgu
    PDF üretimini çökertiyor (500) ya da <link>/<img> etiketi enjekte edilebiliyordu."""
    return xml_escape(value or "")


async def generate_csv_report(target_id: uuid.UUID, db: AsyncSession) -> io.StringIO:
    """Hedefe ait tüm istihbarat düğümlerini temiz bir CSV formatına çevirir."""
    target = await get_target_with_entities(db=db, target_id=target_id)
    if not target:
        raise ValueError("Hedef bulunamadı.")

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["Root Domain", "Entity Type", "Raw Value", "Source / TTP", "Confidence", "Discovered At"])
    
    # Rows
    for entity in target.entities:
        if not entity.is_ignored:
            writer.writerow([
                target.target_value,
                entity.entity_type.value,
                _csv_safe(entity.raw_value),
                _csv_safe(entity.source_url),
                f"{entity.confidence * 100:.0f}%",
                entity.created_at.isoformat() if entity.created_at else ""
            ])
            
    output.seek(0)
    return output


async def generate_pdf_report(target_id: uuid.UUID, db: AsyncSession) -> io.BytesIO:
    """Hedefe ait tüm OSINT verilerini kapsayan Kurumsal Siber İstihbarat PDF'i oluşturur."""
    target = await get_target_with_entities(db=db, target_id=target_id)
    if not target:
        raise ValueError("Hedef bulunamadı.")

    # 1. Fontları Yükle (Türkçe karakter desteği için Roboto)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    font_path_reg = os.path.join(current_dir, "..", "assets", "fonts", "Roboto-Regular.ttf")
    font_path_bold = os.path.join(current_dir, "..", "assets", "fonts", "Roboto-Bold.ttf")
    
    font_regular = 'Helvetica'
    font_bold = 'Helvetica-Bold'
    
    if os.path.exists(font_path_reg):
        pdfmetrics.registerFont(TTFont('Roboto', font_path_reg))
        font_regular = 'Roboto'
        
    if os.path.exists(font_path_bold):
        pdfmetrics.registerFont(TTFont('Roboto-Bold', font_path_bold))
        font_bold = 'Roboto-Bold'

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=18)
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        name='TitleStyle',
        parent=styles['Heading1'],
        fontName=font_bold,
        fontSize=24,
        textColor=colors.HexColor("#0f172a"), # Dark Slate
        alignment=TA_CENTER,
        spaceAfter=20
    )
    
    subtitle_style = ParagraphStyle(
        name='Subtitle',
        parent=styles['Normal'],
        fontName=font_regular,
        fontSize=12,
        textColor=colors.gray,
        alignment=TA_CENTER,
        spaceAfter=30
    )
    
    # 2. Tablo içi Paragraph Stilleri (Text Wrapping İçin)
    cell_header_style = ParagraphStyle(
        name='CellHeader',
        parent=styles['Normal'],
        fontName=font_bold,
        fontSize=10,
        textColor=colors.whitesmoke,
        alignment=TA_LEFT
    )

    cell_style = ParagraphStyle(
        name='CellStyle',
        parent=styles['Normal'],
        fontName=font_regular,
        fontSize=9,
        leading=11, # Satır aralığı
        textColor=colors.black,
        alignment=TA_LEFT,
        wordWrap='CJK' # Uzun kelimeleri veya URL'leri kırmak için
    )
    
    cell_style_threat = ParagraphStyle(
        name='CellStyleThreat',
        parent=styles['Normal'],
        fontName=font_bold,
        fontSize=9,
        leading=11,
        textColor=colors.HexColor("#991b1b"), # Red 800
        alignment=TA_LEFT,
        wordWrap='CJK'
    )
    
    elements = []
    
    # --- 1. COVER PAGE (Kapak) ---
    elements.append(Spacer(1, 150))
    elements.append(Paragraph("NEXUS OSINT", title_style))
    elements.append(Paragraph("SİBER İSTİHBARAT VE TEHDİT ANALİZ RAPORU", title_style))
    
    elements.append(Spacer(1, 50))
    elements.append(Paragraph(f"Hedef Sistem: <b>{_p(target.target_value)}</b>", subtitle_style))
    elements.append(Paragraph(f"Rapor Tarihi: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", subtitle_style))
    
    elements.append(PageBreak())
    
    # --- 2. DATA TABLES (Tablolar) ---
    section_title = ParagraphStyle(name='SectionTitle', parent=styles['Heading2'], fontName=font_bold)
    elements.append(Paragraph("İstihbarat Bulguları", section_title))
    elements.append(Spacer(1, 10))
    
    # Table Header (Paragraph ile sarmalanmalı)
    data = [[
        Paragraph("Tür", cell_header_style),
        Paragraph("Bulgu (Değer)", cell_header_style),
        Paragraph("Kaynak Tespiti", cell_header_style),
        Paragraph("Keşif Tarihi", cell_header_style)
    ]]
    
    threat_rows = [] # Kırmızı işaretlenecek kritik tehdit satırlarının endeksi
    
    for entity in target.entities:
        if entity.is_ignored:
            continue
            
        is_threat = (entity.entity_type.value == "MALICIOUS_RECORD")
        current_cell_style = cell_style_threat if is_threat else cell_style
        
        # Kesme işlemi yapmıyoruz, Paragraph objesi kelimeleri wrap (kaydırma) yapacak.
        row = [
            Paragraph(entity.entity_type.value, current_cell_style),
            Paragraph(_p(entity.raw_value), current_cell_style),
            Paragraph(_p(entity.source_url), current_cell_style),
            Paragraph(entity.created_at.strftime("%Y-%m-%d %H:%M") if entity.created_at else "", current_cell_style)
        ]
        data.append(row)
        
        # Kritik Tehdit (VirusTotal vb.) ise PDF tablosunda arkaplanı Kan Kırmızısı yap
        if is_threat:
            # DÜZELTME: eskiden enumerate indeksi (i + 1) kullanılıyordu; atlanan (is_ignored)
            # kayıtlar indeksi kaydırdığı için yanlış satırlar kırmızı işaretleniyordu.
            threat_rows.append(len(data) - 1)
            
    # Table Styling
    # Sayfa genişliği (A4: 595.27 points). Sağ/Sol Margin 30'ar. Net Genişlik = 535 points.
    t = Table(data, colWidths=[90, 200, 155, 90], repeatRows=1)
    
    style_commands = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")), # Slate 900
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'), # Paragraph'lar yukarı hizalansın
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#f8fafc")), # Açık gri
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")), # Slate 300 kenarlıklar
    ]
    
    # Zararlı bağlantılar için kırmızı (Crimson) uyarı satırı
    for row_idx in threat_rows:
        style_commands.append(('BACKGROUND', (0, row_idx), (-1, row_idx), colors.HexColor("#fee2e2"))) # Red 100
        
    t.setStyle(TableStyle(style_commands))
    
    elements.append(t)
    
    # PDF'i derle — CPU-yoğun ve senkron; event loop'u bloklamaması için thread'de çalıştır.
    # (Eskiden büyük bir rapor üretilirken API'nin tüm istekleri ve WebSocket'leri donuyordu.)
    await asyncio.to_thread(doc.build, elements)
    buffer.seek(0)
    
    return buffer
