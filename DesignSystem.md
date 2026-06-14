# NexusOSINT Design System (NDS)
**Sürüm:** 1.0.0
**Son Güncelleme:** 2026

Bu doküman, NexusOSINT platformunun kurumsal tasarım dilini, bileşen (component) standartlarını, erişilebilirlik gereksinimlerini ve marka kimliğini tanımlar. Geliştirici ve tasarımcı ekiplerinin UI tutarlılığını sağlamak için kullanacağı ana referans kaynağıdır.

---

## 1. DESIGN SYSTEM FELSEFESİ

NexusOSINT Tasarım Sistemi (NDS), karmaşık siber güvenlik ve açık kaynak istihbaratı verilerini en anlaşılır, temiz ve erişilebilir şekilde sunmayı amaçlar.

### Tasarım Prensipleri
- **Karmaşıklığı Soyutlama:** Milyonlarca OSINT düğümü ve güvenlik açığı arasından sadece kullanıcının odaklanması gerekenleri ön plana çıkarma.
- **Güven Telkin Etme:** Siber güvenlik profesyonellerinin aracı olduğumuz için hata payı olmayan, keskin ve sağlam bir görsel dil kullanma.
- **Hız ve Fonksiyonalite:** Form ve fonksiyon dengesinde her zaman fonksiyonun kazanması. Arayüz elemanlarının performansı düşürmemesi.

### Marka Kimliği & UX Hedefleri
Tasarım kararları keyfi değil, veri güdümlüdür (Data-Driven). UI tutarlılığını garanti altına almak adına Atomic Design (Atomik Tasarım) ilkeleri benimsenmiştir. Ölçeklenebilirlik, Tailwind CSS ve ShadCN kullanılarak Design Tokens (Tasarım Jetonları) aracılığıyla sağlanır.

---

## 2. TASARIM İLKELERİ

### Basitlik
* **Açıklama:** Arayüzdeki gereksiz (cognitive load yaratan) tüm görsel gürültülerin kaldırılması.
* **Yapılması Gerekenler:** Beyaz boşlukları (white space) cömertçe kullanın.
* **Kaçınılması Gerekenler:** Gerekmedikçe ek border, gölge (shadow) veya farklı arka plan renkleri eklemeyin.

### Tutarlılık
* **Açıklama:** Aynı işlemi yapan butonların, aynı veriyi gösteren tabloların sistemin her yerinde aynı görünmesi.
* **Kullanım Örnekleri:** Tüm form gönderim (Submit) butonlarının sağ altta ve Primary stilde olması.

### Erişilebilirlik (Accessibility)
* **Açıklama:** Görme engelli veya renk körü kullanıcıların sistemi sorunsuz kullanabilmesi. WCAG 2.2 AA standartlarının sağlanması.
* **Yapılması Gerekenler:** Tüm görsellere `alt` tag'i ekleyin. Tıklanabilir alanları minimum 44x44px (Mobil) tutun.

### Performans
* **Açıklama:** UI bileşenlerinin DOM'u şişirmemesi ve 60fps akıcılıkta çalışması.
* **Kaçınılması Gerekenler:** Ağır CSS animasyonları yerine `transform` ve `opacity` kullanımı tercih edilmelidir.

### Mobil Öncelikli Tasarım (Mobile First)
* **Açıklama:** Tasarımın önce küçük ekranlar için yapılıp sonra büyük ekranlara doğru genişletilmesi (Progressive Enhancement).

### Responsive Tasarım
* **Açıklama:** Esnek grid ve sıvı tipografi ile her cihazda mükemmel uyum.

### Kullanıcı Odaklılık
* **Açıklama:** Teknik terimlerin bir SOC analisti tarafından anlaşılır biçimde sunulması. Tasarımın sistemin değil, kullanıcının iş akışına hizmet etmesi.

---

## 3. MARKA KİMLİĞİ

* **Marka Kişiliği:** Analitik, Keskin, Otoriter, Çevik.
* **Marka Değerleri:** Şeffaflık, Güvenlik, Veri Gizliliği, İnovasyon.
* **Marka Tonu:** 
  * *Profesyonel:* Argo veya gereksiz ünlemler kullanılmaz.
  * *Güvenilir:* Hata mesajları suçlayıcı değil, çözüm odaklıdır.
  * *Yenilikçi:* Modern siber güvenlik jargonuna (AI, ML, RAG) hakimdir.
  * *Modern:* Temiz ve köşeli, fütüristik ama abartısız bir dil.
  * *Samimi:* Kullanıcıya doğru yönlendirmeleri yorulmadan yapar.

---

## 4. RENK SİSTEMİ

NexusOSINT, siber güvenlik temasına uygun olarak **Dark Mode (Karanlık Mod)** ağırlıklı tasarlanmış olsa da tam uyumlu bir Light Mode destekler. Bütün renkler Tailwind konfigürasyonunda tanımlanmıştır.

### Primary Colors (Ana Renk - Mavi/Mor Tonları)
Markanın ana karakterini yansıtan güven verici dijital mavi/mor spektrumu.
* **Primary 50:** `#eff6ff` (Light Backgrounds)
* **Primary 100:** `#dbeafe`
* **Primary 200:** `#bfdbfe`
* **Primary 300:** `#93c5fd`
* **Primary 400:** `#60a5fa`
* **Primary 500:** `#3b82f6` (Ana Butonlar ve Vurgular)
* **Primary 600:** `#2563eb` (Hover State)
* **Primary 700:** `#1d4ed8`
* **Primary 800:** `#1e40af`
* **Primary 900:** `#1e3a8a` (Karanlık Arka Plan Elementleri)

### Secondary Colors (İkincil Renk - Teal/Turkuaz)
Analitik veriler ve OSINT düğümlerini (Nodes) vurgulamak için.
* **Secondary 500:** `#14b8a6`
* **Secondary 600:** `#0d9488`
* **Secondary 900:** `#134e4a`

### Accent Colors (Vurgu Rengi - Mor)
AI Copilot ve yapay zeka tarafından üretilen içerikleri belirtmek için.
* **Accent 500:** `#8b5cf6`
* **Accent 600:** `#7c3aed`

### Semantic Colors (Anlamsal Renkler)
Kullanıcıya durum bildirimleri vermek için kullanılır.

#### Success (Başarılı)
* Güvenli hedefler, tamamlanmış taramalar.
* Base: `#10b981` (Green)
* Background: `#064e3b` (Karanlık Mod Alert Arka Planı)

#### Warning (Uyarı)
* Low/Medium seviye zafiyetler.
* Base: `#f59e0b` (Amber/Yellow)
* Background: `#78350f`

#### Error (Hata/Kritik)
* High/Critical zafiyetler, kopan bağlantılar.
* Base: `#ef4444` (Red)
* Background: `#7f1d1d`

#### Info (Bilgi)
* Bilgilendirme amaçlı (Informational) uyarılar.
* Base: `#0ea5e9` (Sky Blue)

### Neutral Colors (Gri Tonlamalı)
Arayüz iskeleti, borderlar, arka planlar ve tipografi için.
* **Gray 50:** `#f8fafc` (Light Mode Ana Arka Plan)
* **Gray 100:** `#f1f5f9`
* **Gray 200:** `#e2e8f0` (Borders)
* **Gray 300:** `#cbd5e1`
* **Gray 400:** `#94a3b8` (Placeholder Text)
* **Gray 500:** `#64748b` (Muted Text)
* **Gray 600:** `#475569`
* **Gray 700:** `#334155`
* **Gray 800:** `#1e293b` (Dark Mode Cards / Panels)
* **Gray 900:** `#0f172a` (Dark Mode Ana Arka Plan)
* **Gray 950:** `#020617` (Deepest Dark)

---

## 5. TYPOGRAPHY SİSTEMİ

Net okunabilirlik (Legibility) siber güvenlik tablolarında hayati önem taşır.

### Font Ailesi
* **Başlıklar (Headings):** `Inter`. Temiz, kurumsal ve okunabilir. Rakamların (metriklerin) hizalanması için tabular-nums destekler. (Alternatifler: Poppins, Manrope)
* **İçerik (Body):** `Inter`. Sistem genelinde tek bir font ailesi ile bütünlük ve performans (düşük font load) sağlanır. (Alternatif: Source Sans Pro)
* **Kod / Log (Monospace):** `JetBrains Mono` veya `Fira Code`. Zafiyet payload'ları ve JSON logları için.

### Font Scale (Piksel ve Rem Değerleri)
*Kök font boyutu 16px (1rem) olarak kabul edilmiştir.*
* **Display XL:** 72px (4.5rem) - Sadece Landing Page
* **Display LG:** 60px (3.75rem)
* **Display MD:** 48px (3.0rem)
* **Display SM:** 36px (2.25rem)
* **H1:** 30px (1.875rem) - Ana sayfa başlıkları
* **H2:** 24px (1.5rem) - Panel / Kart Başlıkları
* **H3:** 20px (1.25rem)
* **H4:** 18px (1.125rem)
* **H5:** 16px (1.0rem)
* **H6:** 14px (0.875rem)
* **Body XL:** 20px (1.25rem)
* **Body LG:** 18px (1.125rem)
* **Body MD:** 16px (1.0rem) - Standart Metin
* **Body SM:** 14px (0.875rem) - Veri Tabloları
* **Caption:** 12px (0.75rem) - Alt bilgilendirmeler
* **Label:** 10px (0.625rem) - Rozetler, çok küçük elementler

### Font Weight Sistemi
Sadece aşağıdaki 3 kalınlık kullanılır (Font optimizasyonu için):
* **Regular (400):** Tüm body metinleri.
* **Medium (500):** Alt başlıklar, Butonlar ve önemli tabloların Header'ları.
* **SemiBold (600):** H1-H6 başlıkları ve metrik veriler.

### Line Height (Satır Yüksekliği) Kuralları
* Başlıklar için: `1.2` (Tight)
* Body metinleri için: `1.5` (Relaxed)
* Listeler ve tablolar: `1.25` (Snug)

### Letter Spacing (Harf Aralığı) Kuralları
* Display/H1: `-0.02em` (Tighter)
* Body: `0em` (Normal)
* Label/Caption (Sümü metin büyük harf - UPPERCASE): `0.05em` (Wider)

---

## 6. SPACING SİSTEMİ (BOŞLUKLAR)

NexusOSINT, **8-Point Grid System** kullanır. Bütün padding, margin, height ve width değerleri 8'in katları olmalıdır. Sadece çok dar alanlar için 4'ün katları kullanılabilir.

* **4px (0.25rem):** Micro spacing (İkon ve metin arası)
* **8px (0.5rem):** XS spacing (Liste öğeleri arası)
* **12px (0.75rem):** SM spacing (Buton içi padding)
* **16px (1rem):** MD spacing (Component içi standart boşluk, Form elementleri arası)
* **24px (1.5rem):** LG spacing (Kartlar arası, Section içi boşluk)
* **32px (2rem):** XL spacing (Ana bileşenler arası boşluk)
* **40px (2.5rem):** 2XL
* **48px (3rem):** 3XL (Büyük başlık ve içerik arası)
* **64px (4rem):** 4XL (Sayfa bölümleri arası)
* **80px (5rem):** 5XL
* **96px (6rem):** 6XL (Geniş container paddingleri)

---

## 7. LAYOUT SİSTEMİ

Sayfa düzenleri (Layouts) veriyi sıkıştırmadan en geniş alana yaymaya odaklanır.

### Container Yapısı
* OSINT ve Ağ Grafik sayfaları tam ekran (Full Width - 100vw) kullanır. `max-w-none`
* Raporlama ve Ayarlar sayfaları okumayı kolaylaştırmak için maksimum `max-w-7xl` (1280px) container ile sınırlandırılır.

### Breakpoint Sistemi (Tailwind Standart)
* **Mobile (sm):** `640px`
* **Tablet (md):** `768px`
* **Laptop (lg):** `1024px`
* **Desktop (xl):** `1280px`
* **Large Desktop (2xl):** `1536px`

### Grid Sistemi
* **Kolon Sayısı:** 12 Kolon (Desktop), 8 Kolon (Tablet), 4 Kolon (Mobil).
* **Gutter (Kolon Arası Boşluk):** 24px (Desktop), 16px (Mobil).
* **Margin (Ekran Kenar Boşluğu):** 32px (Desktop), 16px (Mobil).

---

## 8. ICONOGRAPHY (İKONLAR)

NexusOSINT, **Lucide Icons** kütüphanesini kullanır. Bu kütüphane temiz, modern ve SVG tabanlıdır.

### İkon Kuralları
* **Boyutlar:** 
  * Small: `16x16px` (Buton içleri)
  * Medium: `20x20px` (Menü öğeleri)
  * Large: `24x24px` (Kart başlıkları)
  * Extra Large: `32x32px` (Empty State / Boş sayfa ekranları)
* **Stroke Kalınlığı:** Sabit `2px`. Bütün ikonlar tutarlı bir çizgi kalınlığına sahip olmalıdır. Renk içi doldurulmuş (Filled) ikonlar kullanılmaz.
* **Kullanım Kuralları:** İkonlar tek başlarına değil, mutlaka yanında veya `aria-label` ile bir metin açıklaması barındırmalıdır.

---

## 9. COMPONENT MİMARİSİ (ATOMIC DESIGN)

Tasarım sistemi, Brad Frost'un Atomic Design metodolojisiyle yapılandırılmıştır:
1. **Atoms (Atomlar):** En küçük parçalar. Butonlar, Inputlar, İkonlar, Typography etiketleri.
2. **Molecules (Moleküller):** Atomların birleşimi. Bir Arama Input'u + Büyüteç İkonu + Ara Butonu.
3. **Organisms (Organizmalar):** Moleküllerin birleşimi. Navbar, Sidebar, Veri Tablosu.
4. **Templates (Şablonlar):** Gerçek verinin olmadığı, organizmaların sayfa içindeki iskelet dizilimi (Wireframe / Skeleton durumu).
5. **Pages (Sayfalar):** Şablonların gerçek API verileri ile doldurulmuş son kullanıcı hali. (Örn: Hedef Tarama Sayfası).

---

## 10. BUTTON SİSTEMİ

Bütün butonlar `h-10` (40px) yüksekliğinde, `px-4 py-2` padding'inde ve `rounded-md` (6px radius) yapısındadır.

### Primary Button
*Kullanıcının yapması beklenen asıl aksiyon.*
* **Renk:** Background `Primary 500`, Metin `White`.
* **Hover:** Background `Primary 600`.
* **Active:** `scale-95` ile tıklama hissi, Background `Primary 700`.
* **Focus:** `ring-2 ring-Primary-500 ring-offset-2`.
* **Disabled:** Background `Gray 200`, Text `Gray 400` (Tıklanamaz ve imleç `not-allowed`).

### Secondary Button
*İkincil eylemler.*
* **Renk:** Background `Gray 100` (Light) / `Gray 800` (Dark), Metin `Gray 900` / `Gray 100`.
* **Hover:** Background `Gray 200` / `Gray 700`.
* **Active:** Background `Gray 300` / `Gray 600`.

### Outline Button
* **Renk:** Arka plan şeffaf. Border `1px solid Gray 300`. Metin `Gray 700`.
* **Hover:** Background `Gray 100`.
* **Focus:** `ring-2 ring-Gray-300 ring-offset-2`.

### Ghost Button
*Geri dönüş, iptal veya gizli kalması gereken eylemler.*
* **Renk:** Şeffaf arkaplan, bordersız.
* **Hover:** Background `Gray 100`.

### Danger Button
*Silme, durdurma, tehlikeli operasyonlar.*
* **Renk:** Background `Red 500`, Metin `White`.
* **Hover:** Background `Red 600`.

### Success Button
*Kaydetme, onaylama.*
* **Renk:** Background `Green 500`, Metin `White`.
* **Hover:** Background `Green 600`.

---

## 11. FORM SİSTEMİ

Formlar veri girişinin kalbidir. Her form elementi erişilebilir (Accessibility) olmalıdır.

* **Input & Textarea:** Arka plan Dark Mod'da `Gray 900` veya şeffaf, Border `Gray 700`. Focus durumunda border rengi `Primary 500` olur ve hafif bir `ring` (halo) efekti eklenir. `placeholder` metinleri `Gray 500` rengindedir.
* **Select (Dropdown):** Özel Radix UI tabanlı, native browser select'leri gizleyen modern dropdown'lar kullanılır.
* **Checkbox & Radio:** Accent rengi `Primary 500`. Tıklandığında SVG animasyonlu check işareti belirir.
* **Switch (Toggle):** Aktif ise `Primary 500`, pasif ise `Gray 300`.
* **Date Picker:** Takvim seçimi. Radix UI Calendar bileşeni tercih edilir.
* **Kurallar:** Bütün inputlar bir `<label>` etiketiyle eşleşmelidir. Hata durumlarında border kırmızı (`Red 500`) olur ve inputun hemen altında hata metni görüntülenir.

---

## 12. NAVIGATION COMPONENTS (NAVİGASYON)

* **Navbar:** Üst menü. Projelerde genellikle 64px (`h-16`) yüksekliğindedir. Profil, Bildirimler ve Global Arama barındırır.
* **Sidebar:** Sol menü. Masaüstünde her zaman açık (256px / `w-64`), tablette küçülen (icon-only), mobilde ise Hamburger menü (Drawer) ile açılan bir yapıdadır. Aktif sayfa linkleri arka plan rengiyle (`Primary 100` veya Dark modda `Gray 800`) belirtilir.
* **Breadcrumb (Ekmek Kırıntısı):** `Ana Sayfa / Taramalar / Hedef-Adı` şeklinde kullanıcının nerede olduğunu gösterir. Slash (`/`) veya Chevron (`>`) ikonu ile ayrılır.
* **Pagination:** Uzun listelerde (Zafiyet logları) sayfalama. `Önceki`, Rakamlar `1 2 3 ... 10` ve `Sonraki`.
* **Tabs:** Sayfa içi yatay geçişler. Aktif sekmenin altında `Primary 500` renginde 2px çizgi (Indicator) bulunur.
* **Drawer:** Sayfanın sağından/solundan kayarak açılan (Örn: Düğüm Detay Paneli) yan pencereler.

---

## 13. FEEDBACK COMPONENTS (GERİ BİLDİRİM)

Kullanıcıyı bilgilendirmek sistemin şeffaflığı açısından esastır.

* **Toast (Notification):** Ekranın sağ alt köşesinden çıkan anlık bildirimler. Başarı (Yeşil), Hata (Kırmızı), Bilgi (Mavi) durumlarında 5 saniye sonra otomatik kapanır.
* **Alert:** Sayfa içine gömülü, kalıcı uyarı kutuları. Sol tarafta bir ikon içerir.
* **Modal (Dialog):** Kullanıcının dikkatini tamamen merkeze çeken popup pencereleri. Arkada `backdrop-blur` (bulanıklık) uygulanır. Modal açıkken arkadaki sayfa scroll edilemez (`overflow: hidden`).
* **Tooltip:** Simgelerin veya karmaşık metinlerin üzerine gelindiğinde (Hover) açılan çok küçük açıklama kutuları.
* **Popover:** Tooltip'in tıklanabilir ve daha geniş içerikli (buton, form barındıran) hali.
* **Skeleton Loader:** Geleneksel "Dönen tekerlek" (Spinner) yerine, verinin geleceği yerlerde parlayan gri iskelet (skeleton) yapıların kullanılması.

---

## 14. DATA DISPLAY COMPONENTS (VERİ GÖSTERİMİ)

* **Table (Veri Tablosu):** Çoklu veri listelemeleri. Sütun başlıklarında sıralama (Sort) ikonları. Mobilde yatay scroll edilebilir olmalıdır (`overflow-x-auto`).
* **Card (Kart):** Bağımsız içerik grupları. Border `1px solid Gray 200/800`, Radius `rounded-xl`. Hafif gölgeler (`shadow-sm`) ile arka plandan ayrıştırılır.
* **Accordion:** Sık sorulan sorular veya ZAP request/response logları gibi gizlenip açılabilen bloklar.
* **Timeline:** Bir saldırının (Kill Chain) kronolojik ilerleyişini gösteren dikey çizgi ve noktalar ağı.
* **Badge (Rozet):** Statü bildirimleri (`Kritik`, `Aktif`, `Bekliyor`). Köşeleri tam yuvarlak (`rounded-full`) veya hafif yuvarlak (`rounded-md`). Metin boyutu `10px` veya `12px`.
* **Avatar:** Kullanıcı profilleri için yuvarlak görseller veya isim baş harfleri (Fallback).
* **Progress Bar:** Taramaların % kaçının bittiğini gösteren ince ilerleme çubukları.

---

## 15. DASHBOARD TASARIM STANDARTLARI

NexusOSINT gibi kompleks ürünlerin ana sayfası (Dashboard) bilgi bombardımanı yaratmamalıdır.

* **KPI Kartları:** Ekranın en üstünde, yan yana 3 veya 4 adet bulunan metrik kartları. Büyük puntolarla ana değer (Örn: "244 Zafiyet"), altında bir önceki haftaya göre değişim (%12 ↑).
* **Grafikler:** Çizgi grafikleri (Line chart) trendleri göstermek için, Donut/Pasta (Pie chart) grafikleri oranları (Severity dağılımı) göstermek için kullanılır. Recharts kütüphanesi önerilir.
* **Veri Tabloları:** Alt kısımda en güncel veya en kritik kayıtların 5-10 satırlık özeti. Tümü için `Daha Fazla Gör` butonu.
* **Filtreleme:** Tabloların sağ üstünde `Tarihe Göre`, `Önem Derecesine Göre` çoklu (Multi-select) filtreler.
* **Arama:** Tabloların üstünde gerçek zamanlı arama yapan (Debounced) bir Input alanı.

---

## 16. MOBİL TASARIM KURALLARI

Uygulamanın mobil versiyonu sadece masaüstünün sıkıştırılmış hali değil, dokunmatik cihazlara özel uyarlanmış versiyonudur.

* **Touch Target (Dokunma Alanı):** Mobilde tıklanabilir tüm elemanların minimum boyutu `44x44px` olmalıdır.
* **Bottom Navigation:** Kritik işlevler (Ana Sayfa, Taramalar, Arama) mobilde alt menüye (Tab Bar) taşınmalıdır.
* **Gesture Kuralları:** Ekranı sola kaydırarak menüyü açma (Swipe), listelerde sağa kaydırarak (Swipe-to-action) silme/arşivleme eylemleri desteklenmelidir.
* **Mobil Form Tasarımı:** Klavye açıldığında input alanlarının gizlenmesini önlemek için formların üstte olması, input tiplerinin doğru seçilmesi (Örn: numara için `type="tel"` veya `numeric`).

---

## 17. RESPONSIVE TASARIM STRATEJİSİ

Her breakpoint (ekran genişliği) için davranışlar:

* **Mobile (sm - 640px):** Tüm kartlar %100 genişlikte tek kolon alt alta. Sidebar gizli (Hamburger drawer olarak açılır). Tablolar yatay scroll bar alır. Modal'lar ekranı tam (Full-screen) kaplar.
* **Tablet (md - 768px):** Kartlar 2'li kolonlar halinde. Sidebar sadece ikon görünümünde daraltılmış.
* **Laptop (lg - 1024px):** Sidebar tam açık. Kartlar 3'lü kolonlar halinde dizilir. Modal'lar ortalanmış bir kutu halini alır.
* **Desktop (xl - 1280px / 2xl - 1536px):** Karmaşık ağ haritaları (React Flow) ve veri tabloları (Data Tables) için maksimum alan oluşturulur. Ekran çok genişlediğinde metin okunabilirliğini bozmamak için makale blokları sınırlandırılır.

---

## 18. ACCESSIBILITY (WCAG 2.2 AA)

Siber güvenlik araçlarında erişilebilirlik yasal ve ahlaki bir zorunluluktur.

* **Renk Kontrastı:** Metin ve arka plan renkleri arasında minimum `4.5:1` kontrast oranı (Normal metin) ve `3:1` kontrast oranı (Büyük metin) sağlanmalıdır. Kritik butonlar (Red 500) üzerinde her zaman beyaz (`White`) metin kullanılır.
* **Klavye Navigasyonu:** Sitedeki tüm aksiyonlar sadece klavye (`Tab` tuşu) kullanılarak yapılabilmelidir. Focus sırası (Tab order) mantıklı DOM hiyerarşisi izlemelidir.
* **Screen Reader (Ekran Okuyucu) Uyumluluğu:** Görsel grafiklerin veya ikonların her zaman `aria-label` veya `sr-only` class'ına sahip gizli metin alternatifleri olmalıdır. Resimler için `alt` kullanılmalıdır.
* **Focus States:** `outline: none` kesinlikle tek başına KULLANILAMAZ. Klavye ile odaklanılan elemanlar `ring-2 ring-primary-500 ring-offset-2` ile belirginleştirilmelidir.
* **ARIA Kuralları:** Açılır menülerde `aria-expanded`, sekmelerde `role="tab"`, listelerde `role="listbox"` gibi doğru ARIA attributeleri kullanılmalıdır.

---

## 19. MOTION DESIGN (ANİMASYON SİSTEMİ)

Hareketler kullanıcının dikkatini yönlendirmek içindir. Sistem hızlı ve akıcı (fluid) hissettirmelidir.

* **Hover Animasyonları:** Butonlar ve linklerde `transition-all duration-200 ease-in-out` kullanılır (200ms).
* **Loading Animasyonları:** Veri yüklenirken Skeleton'lar yavaş bir `animate-pulse` (opacity in/out) hareketi yapar. Sürekli dönen ağır yükler GPU'yu yormamalıdır.
* **Page Transitions:** Sayfa geçişlerinde ekranın aniden parlamaması için basit bir 150ms `fade-in` efekti (`opacity-0` to `opacity-100`) eklenir.
* **Modal Açılışları:** Modallar alttan yukarıya çok hafif bir kayma ve opaklık artışıyla gelir (`duration-300 ease-out`, `translate-y-4` to `translate-y-0`). Animasyonlar kapanırken biraz daha hızlı olmalıdır (200ms).
* **Kullanım Kuralı:** Eğer kullanıcı işletim sisteminde "Hareketleri Azalt" (Prefers Reduced Motion) seçeneğini işaretlemişse, TÜM animasyonlar Tailwind'deki `motion-reduce` kuralı ile anında (0ms) iptal edilmelidir.

---

## 20. DARK MODE STRATEJİSİ

NexusOSINT, siber güvenlik ekiplerini göz yorgunluğundan korumak için varsayılan olarak Dark Mode ağırlıklı tasarlanmıştır.

* **Renk Dönüşümleri:** 
  * Light Mode Background: `Gray 50` -> Dark Mode Background: `Gray 950` veya `Gray 900`.
  * Light Mode Surface (Card/Modal): `White` -> Dark Mode Surface: `Gray 800` veya `Gray 900`.
  * Metin Rengi: `Gray 900` -> Dark Mode Metin Rengi: `Gray 100`.
* **Kontrast Kuralları:** Saf siyah (`#000000`) yerine gözü daha az yoran lacivert/gri tonlu karanlık renkler (`#0f172a`, `#020617` vb.) kullanılır.
* **Component Davranışları:** Karanlık modda gölgeler (Shadows) belli olmayacağı için, elementler arası derinlik (elevation) **Border** renkleri (`border-gray-800`) veya açık renk tonu farklılıkları (lighter gray) ile sağlanır.

---

## 21. TASARIM TOKENLARI (JSON Örneği)

Tasarım sistemi değerlerinin Tailwind.config.js veya bir tema JSON dosyasına dökülmüş referans hali:

```json
{
  "colors": {
    "primary": {
      "50": "#eff6ff",
      "500": "#3b82f6",
      "600": "#2563eb",
      "900": "#1e3a8a"
    },
    "surface": {
      "light": "#ffffff",
      "dark": "#0f172a"
    },
    "danger": "#ef4444",
    "success": "#10b981",
    "warning": "#f59e0b"
  },
  "typography": {
    "fontFamily": {
      "sans": ["Inter", "sans-serif"],
      "mono": ["JetBrains Mono", "monospace"]
    },
    "fontSize": {
      "body-sm": "0.875rem",
      "body-md": "1rem",
      "h1": "1.875rem",
      "h2": "1.5rem"
    }
  },
  "spacing": {
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px",
    "2xl": "40px"
  },
  "radius": {
    "sm": "4px",
    "md": "6px",
    "lg": "8px",
    "full": "9999px"
  },
  "shadows": {
    "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
  }
}
```

---

## 22. FIGMA ORGANİZASYONU

Tasarım ekibinin Figma dosyaları (Files) şu yapıya göre sınıflandırılmalı ve organize edilmelidir:

* **1. Foundations (Temeller):** Renk paletleri, Tipografi stilleri, Gölgeler, Boşluk ölçüleri.
* **2. Components (Bileşenler):** Variantlarıyla birlikte Butonlar, Inputlar, Kartlar (Master Components).
* **3. Patterns (Desenler):** Sık tekrar eden form blokları, Data tabloları, Navbar dizilimleri.
* **4. Templates (Şablonlar):** Gerçek verinin olmadığı, iskelet wireframe sayfaları.
* **5. Screens (Ekranlar):** Her bir flow (kullanıcı yolculuğu) için oluşturulmuş gerçek sayfa tasarımları ve prototipler.

---

## 23. UI KALİTE KONTROL LİSTESİ (CHECKLIST)

Geliştiriciler kodu Production'a (Canlıya) almadan veya Pull Request (PR) göndermeden önce en az aşağıdaki listeyi kontrol etmelidir:

1. [ ] Yeni eklenen butonlar Design System'deki Primary/Secondary kurallarına uyuyor mu?
2. [ ] Renk kodları manuel (`#123456`) mi yazıldı, yoksa token/class (`text-primary-500`) ile mi kullanıldı?
3. [ ] Margin ve Padding değerleri 8'in katı mı? (`p-4` = 16px).
4. [ ] Tüm köşelerdeki radius (yuvarlaklık) tutarlı mı? (Genelde `rounded-md`).
5. [ ] Font büyüklükleri (H1, Body vb.) hiyerarşiye uygun mu?
6. [ ] İkonların çizgi kalınlığı 2px mi ve butonlarla orantılı mı?
7. [ ] Boş (Empty) stateler tasarlandı mı?
8. [ ] Uzun metinler (overflow) doğru şekilde kesiliyor mu (`truncate`)?
9. [ ] Toast/Alert mesajlarındaki metinlerin dili profesyonel mi?
10. [ ] Butonlarda Hover ve Active (Tıklanma) stateleri var mı?
11. [ ] Tıklanabilir her elemanda imleç `cursor-pointer` mı?
12. [ ] Form gönderilirken buton Disabled veya Loading state'ine geçiyor mu?
13. [ ] Loading sırasında tüm form bloklanarak çift gönderim engelleniyor mu?
14. [ ] Sayfa geçişleri ani ve rahatsız edici mi?
15. [ ] Modal açıldığında arkadaki scroll durduruluyor mu (`overflow: hidden`)?
16. [ ] Dropdown ve Popover dışına tıklandığında menü kapanıyor mu?
17. [ ] Skeleton loaderlar asıl içerikle aynı boyutta mı? (CLS önleme).
18. [ ] Animasyon süreleri 200ms-300ms civarında (hızlı) mı?
19. [ ] `Prefers Reduced Motion` durumunda animasyonlar iptal ediliyor mu?
20. [ ] Kontrast oranı minimum 4.5:1 mi?
21. [ ] İkon butonlarında `aria-label` veya `title` var mı?
22. [ ] `Tab` tuşu ile sayfadaki tüm interaktif alanlara odaklanılabiliyor mu?
23. [ ] Odaklanılan (Focus) elementin etrafında odaklanma halkası (`ring`) çıkıyor mu?
24. [ ] Form inputları `label`lara `id` veya eşleştirme ile bağlı mı?
25. [ ] Hata bildirimleri sadece kırmızı renkle değil, metin ile de ifade ediliyor mu?
26. [ ] Görsellerde `alt` özelliği dolu mu?
27. [ ] Semantic HTML etiketleri (`<nav>`, `<main>`) kullanılmış mı?
28. [ ] Mobil dokunma alanları minimum 44x44px mi?
29. [ ] Modal açıldığında klavye odak noktası (focus) içeriye çekiliyor mu?
30. [ ] Modal `ESC` tuşuyla kapatılabiliyor mu?
31. [ ] Input alanlarında `placeholder` mevcut mu?
32. [ ] Email/Sayı gibi alanlarda doğru HTML5 `type` kullanılmış mı?
33. [ ] Şifre alanlarında "Göster/Gizle" butonu bulunuyor mu?
34. [ ] Satır içi (Inline) validasyon, Gönder butonuna basmadan önce çalışıyor mu?
35. [ ] Hata mesajları çözüm odaklı mı?
36. [ ] İşlem sonucunda net bir Success (Başarı) bildirimi çıkıyor mu?
37. [ ] Tehlikeli (Silme/Sıfırlama) aksiyonlarda Onay Modalı soruluyor mu?
38. [ ] Tehlikeli butonların rengi `Danger (Red)` mi?
39. [ ] Çok uzun form adımları sekmelere veya Stepper'a bölünmüş mü?
40. [ ] Kopyalama işlemlerinde "Kopyalandı" geri bildirimi (Tooltip/Toast) veriliyor mu?
41. [ ] iPhone SE (320px-375px) ekranında UI kırılıyor mu?
42. [ ] Tablet modunda (768px) kolonlar mantıklı mı?
43. [ ] 4K ekranlarda içerik iki uca saçılıp okunabilirliği bozuyor mu? (Max-width kontrolü).
44. [ ] Offline durumunda kullanıcıya uyarı (Banner) veriliyor mu?
45. [ ] Kırık görseller için Fallback avatar/harf ayarlandı mı?
46. [ ] Tablolarda 0 sonuç olduğunda "Kayıt bulunamadı" tasarımı mevcut mu?
47. [ ] Kullanıcı adları veya OSINT hedefleri çok uzunsa arayüz patlıyor mu?
48. [ ] Tablolarda yatay kaydırma (Horizontal scroll) yapıldığında scroll bar kullanışlı mı?
49. [ ] Açık (Light) / Koyu (Dark) mod geçişinde UI teması sorunsuz değişiyor mu?
50. [ ] Sayfa değiştirildiğinde sayfa scroll'u otomatik olarak en yukarı (Top) çıkıyor mu?

---

## 24. TASARIM YASAKLARI (KESİNLİKLE YAPILMAMASI GEREKENLER)

Tasarım ve geliştirme sürecinde aşağıdaki pratikler **kesinlikle yasaktır**:

1. **Rastgele Renk Kullanımı:** Tasarım sisteminde olmayan bir Hex kodunu (örn: `color: '#1a2b3c'`) satır içi (inline CSS) yazmak. Sadece sistemdeki tasarım jetonları kullanılmalıdır.
2. **Hardcoded ve Tutarsız Boşluklar:** `margin-top: 13px;` gibi rastgele boşluklar vermek. Tüm boşluklar 8'in katı olmalıdır.
3. **Farklı Border-Radius Kullanımı:** Bir butonu tam yuvarlak (`rounded-full`), diğerini köşeli (`rounded-none`) yapmak. NexusOSINT kartları ve form elementleri her zaman `rounded-md` (veya büyük kartlarda `rounded-xl`) dir.
4. **Çok Sayıda Primary Buton:** Aynı ekran içinde birden fazla Mavi/Primary buton kullanmak. Sadece asıl istenen eylem Primary olur.
5. **Kontrast Kurallarının İhlali:** Gri arka plan üzerine açık gri yazı yazmak. WCAG testini geçemeyen hiçbir metin renk kombinasyonu koda dahil edilemez.
6. **Div Tıklatmaları (Inaccessible Buttons):** Bir tıklama olayı için `<div>onClick={...}</div>` kullanmak yasaktır. Her zaman erişilebilir `<button>` elementi kullanılmalıdır.
7. **Native Tarayıcı Elementlerinin Bırakılması:** HTML'in varsayılan, stillendirilmemiş form elementlerini (Örn. çirkin browser alert'leri veya file inputları) tasarım sistemine uyarlamadan arayüzde bırakmak.

---
*NexusOSINT Design System dokümantasyonu yaşayan bir belgedir. Sektör ve kullanıcı ihtiyaçları geliştikçe, tasarımcılar ve geliştiricilerin ortak kararı ile güncellenmelidir.*
