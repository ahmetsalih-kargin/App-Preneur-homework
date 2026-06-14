# NexusOSINT - Proje Gelişim ve Hafıza Dokümanı (PROGRESS.md)

**Belge Sürümü:** 1.0.0  
**Durum:** Aktif / Sürekli Güncellenen (Living Document)  
**Amacı:** Projenin yaşayan hafızası olmak; alınan kararları, teknik borçları, hataları ve AI tabanlı geliştirme süreçlerini şeffaf bir şekilde yeni ekip üyelerine (İnsan & AI Agent) aktarmak.

---

## 1. PROJE ÖZETİ

* **Proje Adı:** NexusOSINT
* **Amaç:** Kurumsal ağların dış saldırı yüzeyini (Attack Surface) otonom olarak haritalayan ve yapay zeka (AI Copilot) destekli analiz sağlayan bir platform sunmak.
* **Vizyon:** Siber güvenlik uzmanlarının manuel tarama eforunu %90 oranında azaltarak, saatler süren pentest süreçlerini dakikalara indirmek.
* **Hedef Kullanıcılar:** Penetrasyon Test Uzmanları, DevSecOps Mühendisleri, SOC Analistleri, CISO'lar.
* **MVP Hedefleri:** Temel hedef ekleme, arka planda Celery ile asenkron DAST (ZAP) ve OSINT (Nuclei, Amass) taramalarını çalıştırma, sonuçları React Flow tabanlı grafik arayüzde (UI) gösterme.
* **Production Hedefleri:** Kubernetes üzerinde tam otomatik yatay ölçeklenen, Multi-Tenant (çoklu kiracı) mimarisine sahip, sıfır veri kayıplı ve %99.9 Uptime oranlı kurumsal bir DevSecOps platformu oluşturmak.

---

## 2. PROJE DURUM PANOSU (Live Status)

*Aşağıdaki tablo projenin güncel durumunu yansıtır:*

| Alan | Durum | Sorumlu / Ekip | Son Güncelleme |
| :--- | :--- | :--- | :--- |
| **UI/UX & Tasarım Sistemi** | Tamamlandı | Design Team | YYYY-MM-DD |
| **Frontend (Next.js)** | Devam Ediyor | Frontend Ekibi | YYYY-MM-DD |
| **Backend (FastAPI)** | Devam Ediyor | Backend Ekibi | YYYY-MM-DD |
| **Task Engine (Celery/Redis)** | Tamamlandı | DevSecOps | YYYY-MM-DD |
| **Siber Güvenlik Motorları (ZAP vs)** | Tamamlandı | Security Team | YYYY-MM-DD |
| **Authentication (JWT/RBAC)** | Başlamadı | Backend Ekibi | - |
| **Veritabanı (PostgreSQL)** | Tamamlandı | DBA | YYYY-MM-DD |
| **Testing (Unit/E2E)** | Devam Ediyor | QA Ekibi | YYYY-MM-DD |
| **Deployment (Docker/K8s)** | Ngrok ile Canlıda | DevOps | 2026-06-14 |

---

## 3. MİLESTONE TAKİBİ

### Milestone 1: MVP ve Temel Asenkron Mimari
* **Amaç:** Sistemin ayağa kalkması, hedeflerin girilip asenkron taramanın Redis/Celery üzerinden tetiklenmesi.
* **Teslim Tarihi:** Belirlenecek
* **Durum:** `Tamamlandı`
* **Tamamlanan İşler:** FastAPI Gateway, Celery Worker altyapısı, Next.js React Flow grafikleri, DAST/OSINT Docker imajlarının entegrasyonu.
* **Eksikler:** Kimlik doğrulama (Auth) sistemi.
* **Riskler:** Taramaların beklenenden uzun sürmesi nedeniyle Time-out hataları.

### Milestone 2: AI Copilot & Beta Sürüm
* **Amaç:** Çıkan güvenlik sonuçlarının LLM tabanlı (Context Condenser) mekanizmayla analiz edilmesi.
* **Teslim Tarihi:** Belirlenecek
* **Durum:** `Devam Ediyor`
* **Tamamlanan İşler:** OpenRouter API bağlantısı, Context Condenser mantığının kurulması.
* **Eksikler:** Yanlış alarmların (False Positives) LLM tarafından daha iyi filtrelenmesi.
* **Riskler:** Token aşımı (Rate Limit) ve AI Halüsinasyonları.

### Milestone 3: Production & Kubernetes
* **Amaç:** Sistemin ölçeklenebilir (Scalable) bulut mimarisine aktarılması.
* **Durum:** `Başlamadı`

---

## 4. GÜNLÜK GELİŞİM GÜNLÜĞÜ (Changelog)

*Şablon (Yeni bir kayıt eklendiğinde en üste yazılmalıdır):*

### YYYY-MM-DD
* **Sorumlu:** Antigravity (AI Agent) / Lead Engineer
* **Yapılan İşler:** ZAP aktif tarama sürelerindeki sessiz çökmeleri (Silent Timeout) engellemek için `httpx` isteklerine 30 dakikalık zaman aşımı süresi eklendi ve hata durumunda DB'ye `[ERROR]` node'u basılması sağlandı.
* **Alınan Kararlar:** Hatalı görevler (Failed Tasks) Celery kuyruğunda tekrar (Retry) edilmeyecek, anında başarısız (Fail-fast) kabul edilecek.
* **Karar Gerekçesi:** ZAP taramaları çok ağır olduğu için çöken bir görevi sonsuz döngüde tekrar etmek sunucu kaynaklarını tüketir.
* **Karşılaşılan Sorunlar:** `httpx`'in varsayılan timeout süresi 5 saniyeydi, bu da ZAP taramalarının anında fail etmesine neden oluyordu.
* **Çözüm:** `timeout=1800` parametresi ile süreç stabil hale getirildi.
* **Öğrenilen Dersler:** Güvenlik motorlarıyla (ZAP/Nuclei) API üzerinden haberleşirken asenkron bekleme süreleri her zaman maksimuma ayarlanmalıdır.
* **Sonraki Adımlar:** ZAP bulgularını veritabanına normalize ederek aktarmak.

---

## 5. TEKNİK KARAR KAYITLARI (ADR - Architecture Decision Records)

### ADR-001: Görev Yönetimi İçin Celery & Redis Kullanımı
* **Tarih:** YYYY-MM-DD
* **Problem:** ZAP ve Amass taramaları saatler sürüyor. HTTP istekleri bu süre boyunca açık kalamaz (Gateway Timeout).
* **Alternatifler:** RabbitMQ, Kafka, FastAPI Background Tasks.
* **Nihai Karar:** Celery (Worker) + Redis (Broker).
* **Karar Gerekçesi:** Python ekosisteminde asenkron görev takibi için en olgun sistem olması ve Redis'in aynı zamanda WebSocket Pub/Sub için kullanılabilmesi.
* **Beklenen Etki:** Sınırsız yatay ölçekleme (Yüzlerce hedef için yeni Worker eklenebilir).
* **Riskler:** Redis memory aşımı.
* **Sonuç:** Başarıyla uygulandı.

---

## 6. HATA VE PROBLEM GÜNLÜĞÜ

### Hata-001: Sonsuz Yüklenme (Infinite Spinner)
* **Tarih:** YYYY-MM-DD
* **Hata Tanımı:** Frontend, tarama bittiğinde sadece WebSocket mesajına güveniyordu. Bağlantı koparsa tarama UI'da sonsuza kadar "Devam Ediyor" görünüyordu.
* **Etkilenen Sistem:** Next.js Frontend (React Flow).
* **Öncelik:** `Kritik`
* **Kök Neden Analizi:** WebSocket kesintilerine karşı yedek bir HTTP Polling mekanizmasının olmaması.
* **Çözüm:** `useQuery` (React Query) ile 5 saniyede bir `GET /api/targets/status` isteği atan bir Fallback (Yedek) mekanizma kuruldu.
* **Önleyici Aksiyonlar:** Tüm WebSocket mimarileri mutlaka HTTP Polling ile desteklenecek.
* **Tekrarlandı mı:** Hayır.

---

## 7. LESSONS LEARNED (Öğrenilen Dersler)

* **Teknik Dersler:** AI modellerine tüm DB verisini yollamak Token limitine takılır ve halüsinasyona yol açar. "Context Condenser" mimarisiyle sadece zafiyet içeren (`THREAT` tipi) node'ların LLM'e yollanması gerektiği öğrenildi.
* **Ürün Geliştirme Dersleri:** Siber güvenlik arayüzlerinde gereksiz animasyonlardan kaçınılmalı, UI'ın hızı ve "karanlık mod" okunabilirliği ön planda olmalıdır.
* **Tasarım Dersleri:** `[INFO]` ve `[INFORMATIONAL]` gibi birbirine benzeyen ZAP çıktıları için tek tip UI Color Mapping kullanılmalı (False Positive renk paniğini önlemek için).

---

## 8. AI GELİŞTİRME GÜNLÜĞÜ (AI Collaboration Log)

*Proje yoğun bir şekilde AI Agent'lar (Antigravity vb.) kullanılarak inşa edilmektedir.*

* **Tarih:** YYYY-MM-DD
* **Kullanılan AI:** Antigravity (Google DeepMind)
* **Görev:** ZAP ve Nuclei Worker'larının asenkron mimaride çökmesini (Race Condition) engelleyen kodların yazılması.
* **Üretilen Çıktı:** `tasks.py` içindeki ZAP asenkron mimarisi ve Celery konfigürasyonları.
* **İnsan İncelemesi Sonucu:** Başarılı (Approved).
* **Düzeltmeler:** Sadece `INFORMATIONAL` severity tipinin UI'da mavi rengi alması için küçük bir regex düzeltmesi yapıldı.
* **Öğrenilen Ders:** AI Agent'lara komut verirken güvenlik jargonları (DAST, RAG, Timeout) çok net belirtilmelidir.
* **Verimlilik Kazancı:** Manuel olarak 3 gün sürecek Worker stabilizasyonu 1 saatte tamamlandı.

---

## 9. FEATURE GELİŞİM TAKİBİ

### Feature: ZAP DAST Entegrasyonu
* **Durum:** `Yayında` (MVP seviyesinde)
* **Planlandı -> Tasarlandı -> Geliştirildi -> Test Edildi -> Yayında**
* **Açıklama:** OWASP ZAP'ın Headless container olarak sisteme eklenip, Celery üzerinden tetiklenmesi.
* **Bağımlılıklar:** Docker ZAP Container, `httpx` kütüphanesi.
* **Riskler:** Çok büyük domainlerde RAM şişmesi.
* **Son Güncelleme:** YYYY-MM-DD

---

## 10. TEKNİK BORÇ TAKİBİ (Technical Debt)

* **Teknik Borç ID:** TD-001
* **Açıklama:** Celery Worker'larda oluşan hatalar şu an sadece PostgreSQL'e yazılıyor, harici bir Monitoring aracına gitmiyor.
* **Oluşma Nedeni:** MVP aşamasında hızlı prototipleme.
* **Risk:** Üretim ortamında sessiz çökmelerin fark edilmemesi.
* **Çözüm Planı:** Sentry.io entegrasyonu ve ELK Stack kurulumu.
* **Öncelik:** `Yüksek`
* **Tahmini Efor:** 2 Gün

---

## 11. RİSK TAKİBİ

* **Risk ID:** RSK-001
* **Açıklama:** ZAP motorunun hedef sistemde formlara zararlı payload'lar basması sonucu hedef sitenin veritabanını bozması (Active Scan tehlikesi).
* **Olasılık:** Orta
* **Etki:** Çok Yüksek
* **Önlem:** Uygulama içinde "Sadece Pasif Tarama Yap" (Safe Mode) opsiyonu eklenecek. Kullanıcıdan feragatname onayı alınacak.
* **Güncel Durum:** İnceleniyor.

---

## 12. SPRINT KAYITLARI

### Sprint 1: MVP Foundation
* **Başlangıç:** YYYY-MM-DD | **Bitiş:** YYYY-MM-DD
* **Hedefler:** Backend, UI ve Database bağlantılarının iskeletinin kurulması.
* **Tamamlanan İşler:** FastAPI kurulumu, UI React Flow tasarımı, PostgreSQL Schema.
* **Tamamlanamayan İşler:** Amass OSINT entegrasyonu (Sprint 2'ye devredildi).
* **Sprint Retrospective:** UI render hızları beklenenden iyiydi ancak Celery entegrasyonu tahmin edilenden zor oldu. Docker networking yapılandırmasına daha çok zaman ayrılmalı.

---

## 13. PERFORMANS TAKİBİ

* **Lighthouse Skoru (UI):** Mobil: 92 | Desktop: 98 (Test Tarihi: YYYY-MM-DD)
* **API Yanıt Süreleri (Ortalama):** ~45ms (Zafiyetleri getiren Endpoint)
* **Celery Kuyruk Gecikmesi:** ~100ms
* **ZAP Headless Bellek Tüketimi:** Boşta ~500MB, Tarama anında ~2GB. (Optimizasyon gerekiyor).

---

## 14. GÜVENLİK OLAY KAYITLARI (Security Incidents)

*Henüz bir güvenlik olayı (Breach) yaşanmamıştır. Yaşandığında bu alana kaydedilecektir.*

---

## 15. DEPLOYMENT GEÇMİŞİ

### Deployment ID: DEP-001 (Local Docker)
* **Tarih:** YYYY-MM-DD
* **Versiyon:** 0.1.0-alpha
* **Değişiklikler:** İlk tam yığın (Full Stack) docker-compose ayağa kaldırılması.
* **Rollback Gerekti mi?:** Hayır.
* **Sonuç:** Başarılı. Redis, Celery, Backend ve UI sorunsuz haberleşti.

### Deployment ID: DEP-002 (Ngrok Web Deploy)
* **Tarih:** 2026-06-14
* **Versiyon:** 0.1.1-beta
* **Değişiklikler:** Bitirme projesi "Web Deploy" şartını sağlamak amacıyla sistem ngrok üzerinden tünellenerek dış internete canlıya alındı.
* **Rollback Gerekti mi?:** Hayır.
* **Sonuç:** Başarılı. Canlı URL üzerinden arayüz ve API dünyanın her yerinden erişilebilir hale getirildi.

---

## 16. RELEASE NOTES GEÇMİŞİ

### v0.1.0-alpha (MVP Release)
* **Yeni Özellikler:**
  * Hedef tarama başlatma arayüzü.
  * ZAP ve Nuclei taramalarının arka planda asenkron çalışması.
  * Node tabanlı etkileşimli grafik (React Flow).
* **İyileştirmeler:** Severity renkleri standardize edildi (`INFORMATIONAL` vs `CRITICAL`).
* **Hata Düzeltmeleri:** Race condition engellendi. WebSocket fallback mekanizması eklendi.
* **Bilinen Sorunlar:** Çok kalabalık hedeflerde (10k+ Subdomain) Node grafiği yavaşlıyor.

---

## 17. EKİP KARARLARI (Meeting Notes)

* **Tarih:** YYYY-MM-DD
* **Gündem:** Tarama Motoru Kısıtlamaları
* **Kararlar:** Nuclei'nin tüm template'lerini koşturmak yerine, sadece kritik ve yüksek seviye (High/Critical) template'leri koşturarak tarama hızının artırılmasına karar verildi.
* **Aksiyon Maddeleri:** Backend ekibi Celery `tasks.py` içindeki subprocess komutuna `-severity high,critical` bayrağını ekleyecek.

---

## 18. PROJE METRİKLERİ

* **Toplam Feature Sayısı:** 14
* **Açık Bug Sayısı:** 2
* **Kapanan Bug Sayısı:** 8
* **Teknik Borç Sayısı:** 3
* **Test Coverage (Kapsam):** %45 (Artırılması gerekiyor)
* **AI Kullanım Sayısı:** 50+ (Prompt/Task bazlı)

---

## 19. GELECEK PLANLARI

* **Kısa Vadeli (0-3 Ay):** Kullanıcı Girişi (JWT), Sentry monitoring, Raporlama (PDF çıktısı alma).
* **Orta Vadeli (3-6 Ay):** Takım çalışması özelliği (Role Based Access Control - RBAC), Tarama zamanlama (Cron Jobs).
* **Uzun Vadeli (6+ Ay):** Agentic AI ile bulduğumuz zafiyetleri otonom olarak simüle etme (Auto-Exploitation).

---

## 20. AI AGENT TALİMATLARI (AI Onboarding & Context)

**DİKKAT:** *Bu bölüm, bu GitHub reposuna katılan yeni bir Yapay Zeka (AI Agent / Copilot) asistanın okuması gereken ilk yerdir. AI Agent, kod üretmeden veya komut çalıştırmadan önce aşağıdaki kurallara mutlaka uymalıdır.*

1. **Projenin Mevcut Durumu:** NexusOSINT, FastAPI ve Next.js (React Flow) tabanlı tam asenkron bir siber güvenlik ürünüdür. Arka planda Celery ve Dockerized ZAP/Nuclei kullanır.
2. **Mimari Kurallar:** 
   * Uzun süren **hiçbir işlemi** FastAPI endpointlerinde (senkron) yapma. Mutlaka Celery Worker'lara (`backend/workers/`) havale et.
   * Dosya ve veritabanı okumaları asenkron (`asyncpg` veya asenkron ORM) yapılmalıdır.
3. **Kaçınılması Gereken Yaklaşımlar:** 
   * Zafiyetleri silen veya manipüle eden "mock" (sahte) senaryolar yazma; OSINT ciddiyetine (Forensic integrity) saygı göster.
   * UI tarafında gereksiz kütüphaneler ekleme; halihazırda TailwindCSS, ShadCN ve `DesignSystem.md`'de belirtilen standartları kullan.
4. **Bilinen Problemler:** 
   * ZAP taramaları çok uzun sürüyor. Zaman aşımı (Timeout) durumlarında her zaman logları (`logger.error`) ve DB hata güncellemelerini yazmayı unutma.
5. **AI Sonraki Öncelikleri:** Mevcut altyapıyı bozmadan kodu stabilize et, TypeScript tip tanımlarını (Interfaces) katı (strict) tut, gerekiyorsa Test Coverage oranını artıracak Unit Testler yaz.

> **AI Agent'a Not:** Sistemde yapacağın herhangi bir değişikliği `task.md` veya `implementation_plan.md` üzerinden bildir. Sistem mimarisini kökten değiştirecek kararlar için mutlaka **insan onayı (User Approval)** bekle.
