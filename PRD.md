# Product Requirements Document (PRD)
**Proje:** NexusOSINT
**Durum:** Onaylandı (Production Ready)
**Doküman Sürümü:** 1.0.0

Bu doküman, NexusOSINT platformunun "anayasasıdır". Ürünün neden var olduğunu, kimin için tasarlandığını, hangi problemleri çözdüğünü ve bu çözümleri sunarken hangi özellikleri barındırdığını tanımlar.

---

## 1. YÖNETİCİ ÖZETİ (Executive Summary)
Siber güvenlik dünyasında bir kurumun dijital ayak izini (Attack Surface) bulmak ve bunu zafiyet taramalarından geçirmek haftalar süren manuel bir süreçtir. **NexusOSINT**, OWASP ZAP (DAST) ve OSINT (Nuclei, Amass) motorlarını asenkron olarak orkestre eden, elde edilen devasa veriyi interaktif bir ağ grafiğinde (Node Graph) görselleştiren ve yapay zeka (AI Copilot) ile zafiyetleri açıklayan otonom bir siber tehdit istihbarat platformudur.

---

## 2. ÇÖZÜLEN PROBLEM (Problem Statement)
Geleneksel Penetrasyon Testi (Sızma Testi) ve Siber İstihbarat süreçleri şu sorunları barındırır:
1. **Araç Parçalanması (Tool Fragmentation):** Uzmanlar Amass, Nuclei, Nmap, ZAP gibi araçları ayrı ayrı terminal ekranlarında manuel çalıştırıp, çıktılarını not defterlerinde birleştirmeye çalışırlar.
2. **Bilgi Yükü ve Gürültü:** Taramalar sonucunda on binlerce satır JSON/Log veya birbirini tekrar eden False-Positive (yanlış alarm) uyarılar üretilir. İnsan beyni bu veriyi hızlıca haritalayamaz.
3. **Analiz Darboğazı:** Bulunan bir zafiyetin ("CVE-2021-44228 Log4j" gibi) nasıl sömürüleceğini veya nasıl yamanacağını araştırmak ekstra zaman alır. CISO'lar için bu durum teknik bir rapordan öteye geçemez.

---

## 3. HEDEF KULLANICILAR (Target Audience & Personas)

### Persona 1: "Hacker Can" (Penetration Tester / Bug Bounty Hunter)
* **İhtiyacı:** Hedef domaini sisteme verip kahvesini içmeye gitmek. Döndüğünde sistemin tüm subdomainleri bulmuş, zafiyetleri taramış ve hazır bir harita çıkarmış olmasını bekler.
* **Beklentisi:** Yüksek hız, asenkron tarama, otomatize ZAP payloadları.

### Persona 2: "Defans Ayşe" (SOC Analyst / DevSecOps Engineer)
* **İhtiyacı:** Kurumun dışarıya açık yüzünü sürekli izlemek. Eski bir test sunucusunun internete açılıp açılmadığını görmek.
* **Beklentisi:** Yanlış alarmların (False Positives) filtrelenmesi, AI destekli hızlı çözüm önerileri.

### Persona 3: "Yönetici Ahmet" (CISO / IT Security Manager)
* **İhtiyacı:** Teknik loglar arasında boğulmadan sadece "Şu an şirketimiz risk altında mı?" sorusunun cevabını almak.
* **Beklentisi:** Temiz KPI dashboardları, "Kritik" ve "Yüksek" seviyeli tehditlerin anlaşılır (AI Copilot ile özetlenmiş) açıklamaları.

---

## 4. TEMEL ÖZELLİKLER (Core Features / Epics)

### EPIC 1: Otonom Tarama Motoru (Scanning Orchestrator)
* **F1.1: Tek Tıkla Tarama (Single-Click Recon):** Kullanıcı sadece `ornek.com` yazar. Platform arka planda Amass, Nuclei ve ZAP motorlarını sırasıyla (veya paralel) Celery Worker'ları üzerinden tetikler.
* **F1.2: Asenkron Görev Yönetimi:** Taramalar frontend'i dondurmaz (Non-blocking). HTTP Polling ve WebSocket üzerinden ilerleme yüzdesi UI'a aktarılır.
* **F1.3: DAST (ZAP) Aktif Tarama:** ZAP Headless container üzerinden Spider (Örümcek) ve Active Scan tetiklenir. Çökmeleri önlemek için 30 dk timeout korumasına sahiptir.

### EPIC 2: İnteraktif Ağ Haritalaması (Graph Visualization)
* **F2.1: Fizik Motorlu Grafikler:** Taranan hedefler, IP'ler, Portlar ve Zafiyetler React Flow ve D3.js kullanılarak ağaç (Network Graph) yapısında gösterilir.
* **F2.2: Semantik Renklendirme:** Risk seviyelerine göre düğümler (Nodes) otomatik renk alır (Kırmızı = Kritik Tehdit, Mavi = Bilgi).
* **F2.3: Node Context Panel:** Grafikte herhangi bir düğüme tıklandığında sağdan açılan çekmecede (Drawer) o varlığın detayları, raw JSON çıktısı ve risk skoru belirir.

### EPIC 3: Yapay Zeka Güvenlik Asistanı (AI Copilot)
* **F3.1: Context Condenser (Bağlam Filtresi):** Sistemin token aşımından (Rate Limit/Crash) korunması için, on binlerce düğüm arasından sadece `THREAT` (Zafiyet) ve `MALICIOUS_RECORD` içeren kanıtlanmış bulgular LLM'e (Yapay zekaya) enjekte edilir.
* **F3.2: Zafiyet İzahı:** "Burada ne bulduk?" sorusuna AI Copilot, siber güvenlik uzmanı ağzıyla (OpenRouter API) Türkçe ve teknik bir yanıt üretir; açığın nasıl kapatılacağını söyler.
* **F3.3: Halüsinasyon Koruması:** LLM sadece sisteme (Nuclei/ZAP) tarafından sunulan kanıtlar üzerinden konuşmak üzere prompt engineering ile kilitlenmiştir.

---

## 5. KAPSAM DIŞI OLANLAR (Out of Scope for MVP)
İlk sürüme (MVP) bilerek **dahil edilmemiş** olan özellikler:
* RBAC (Çoklu takım/organizasyon desteği, Role-Based Access Control).
* Periyodik (Cron Job) zamanlanmış taramalar (Haftada bir otomatik tarama).
* Kendi özel Nuclei template'lerimizi (Custom Templates) arayüzden yükleme özelliği.
* PDF veya Word formatında sızma testi raporu çıktısı (Export) alma.

*(Not: Bu özellikler "PROGRESS.md" dosyasındaki Gelecek Yol Haritasında (Roadmap) planlanmıştır.)*

---

## 6. BAŞARI METRİKLERİ (KPIs)
Ürünün başarılı kabul edilmesi için takip edilecek ölçütler:
1. **Tarama Tamamlanma Oranı:** Başlatılan DAST/OSINT taramalarının en az %95'inin timeout'a düşmeden veya Worker çökmeden başarılı şekilde tamamlanması.
2. **Kullanıcı Karar Hızı (Time-to-Resolution):** Bulunan bir zafiyetin anlaşılıp iyileştirilme aksiyonuna geçilme süresini geleneksel metotlara kıyasla %70 oranında kısaltmak (AI Copilot sayesinde).
3. **Sistem Uptime:** Taramaların arka planda Redis/Celery mimarisi ile %99.9 oranında kesintisiz çalışması.
4. **False-Positive Oranı:** AI ve Regex filtrelerinin, "gereksiz/yanlış" tehdit uyarılarını maksimum %10 seviyesinde tutması.

---

## 7. OPERASYONEL VE TEKNİK GEREKSİNİMLER (Non-Functional Requirements)
* **Performans:** İnteraktif React Flow haritası 5.000 düğüme (Node) kadar tarayıcıda kasmadan (60fps) render edilebilmelidir.
* **Ölçeklenebilirlik:** Arka uç (Backend), Kubernetes üzerinde ZAP ve Celery Worker sayıları artırılarak anında yatay ölçeklenebilmelidir (Horizontal Scaling).
* **Güvenlik:** Hedef alınan domainlerdeki zafiyet verileri (Payload'lar) veritabanında şifrelenmeli; API uç noktaları katı doğrulama (Input Validation) kurallarından geçerek olası SSRF saldırılarını engellemelidir.
