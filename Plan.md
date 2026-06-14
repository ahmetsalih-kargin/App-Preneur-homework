# Uygulama ve Teknik İş Planı (Plan.md)
**Proje:** NexusOSINT
**Durum:** Üretim Aşamasına (Production) Geçildi
**Doküman Sürümü:** 1.0.0

Bu belge, `PRD.md` (Ürün Gereksinimleri Dokümanı) içerisinde belirlenen ana özelliklerin (Epics) alt parçalara, Kullanıcı Hikayelerine (User Stories) ve teknik adımlara bölünmüş halidir. Ekibin Agile (Çevik) metodolojiyle çalışması için sprint planlamalarında kullanılır.

---

## EPIC 1: Otonom Tarama Motoru (Scanning Orchestrator)
**Açıklama:** Kullanıcının girdiği domain adresini alıp, arka planda (FastAPI + Celery) OSINT ve DAST araçlarını (ZAP, Amass, Nuclei) orkestre eden ana sistemin kurulması.

### User Story 1.1: Tek Tıkla Tarama Başlatma
> *"Bir güvenlik analisti olarak, sadece bir alan adı girerek tüm taramaları tek tıkla başlatmak istiyorum, böylece komut satırlarıyla uğraşmak zorunda kalmam."*

**Teknik Adımlar:**
- [x] **Frontend:** Ana sayfaya hedef alan adı girişi için React form bileşeninin (Input + Submit Button) yazılması.
- [x] **Backend:** FastAPI'de `POST /api/targets/` endpoint'inin oluşturulması.
- [x] **Backend:** Pydantic ile gelen verinin (Domain/IP) regex üzerinden SSRF saldırılarına karşı doğrulanması (Input Validation).

### User Story 1.2: Asenkron Görev Yönetimi
> *"Bir kullanıcı olarak, tarama devam ederken arayüzün donmamasını ve diğer işlemleri yapabilmeyi istiyorum."*

**Teknik Adımlar:**
- [x] **Altyapı:** Redis container'ının `docker-compose.yml` içerisine eklenmesi.
- [x] **Backend:** Celery Worker sisteminin ayağa kaldırılıp FastAPI'ye bağlanması.
- [x] **Backend:** Gelen tarama isteğinin doğrudan API'de işletilmek yerine `delay()` fonksiyonu ile Celery kuyruğuna (Message Broker) atılması.
- [x] **Güvenlik:** Redis'te hedef alan adına kilit (Lock/Atomic Counter) koyarak ayna hedefe çift tarama (Race Condition) yapılmasını engellemek.

### User Story 1.3: OWASP ZAP (DAST) Entegrasyonu
> *"Bir defans mühendisi olarak, web uygulamasının canlı çalışırken XSS, SQLi gibi açıkları barındırıp barındırmadığını test etmek istiyorum."*

**Teknik Adımlar:**
- [x] **Altyapı:** ZAP 2.15 (Headless) Docker imajının 8090 portundan sisteme eklenmesi.
- [x] **Backend (Worker):** Celery içindeki `_async_zap_scan` fonksiyonunun `httpx` kullanılarak ZAP REST API'si ile haberleşmesi.
- [x] **Backend (Hata Yönetimi):** ZAP örümceğinin (Spider) timeout olmasını engellemek için 30 dakikalık katı bir zaman aşımı sınırı ve Try/Except Error nodu basılmasının kodlanması.

---

## EPIC 2: İnteraktif Ağ Haritalaması (Graph Visualization)
**Açıklama:** Veritabanına (PostgreSQL) dolan on binlerce satır JSON sonucunun, kullanıcı arayüzünde fiziksel ağ düğümleri (Nodes & Edges) halinde görselleştirilmesi.

### User Story 2.1: Dinamik Harita Çizimi
> *"Bir analist olarak, tarama sonuçlarını JSON tablolarında okumak yerine birbirine bağlı interaktif ağ düğümleri olarak görmek istiyorum."*

**Teknik Adımlar:**
- [x] **Frontend:** `React Flow` ve `D3.js` kütüphanelerinin Next.js projesine entegre edilmesi.
- [x] **Backend:** `GET /api/targets/{id}/graph` endpoint'inin, DB'deki Varlık (Entity) ve İlişki (Edge) kayıtlarını React Flow formatına dönüştürüp frontend'e yollaması.
- [x] **Frontend:** React Flow performans optimizasyonu (Çok fazla düğümde tarayıcının çökmesini engelleme).

### User Story 2.2: Semantik Renkler (Risk Mapping)
> *"Bir CISO olarak, binlerce düğüm arasında sadece 'Kırmızı' (Kritik) olanları anında fark edebilmek istiyorum."*

**Teknik Adımlar:**
- [x] **Frontend:** Gelen JSON objesindeki `severity` (Önem Derecesi) alanının ayrıştırılması.
- [x] **Frontend:** `[INFORMATIONAL]` = Mavi, `[LOW]` = Sarı, `[MEDIUM]` = Turuncu, `[HIGH/CRITICAL]` = Kırmızı olacak şekilde düğüm stillerinin CSS/Tailwind ile dinamik eşleştirilmesi.

### User Story 2.3: Node Context Panel ve Canlı İzleme
> *"Bir siber uzman olarak, ağ haritasındaki kırmızı bir zafiyete tıkladığımda onun raw (ham) verisini ve detayını sağ panelden okumak istiyorum."*

**Teknik Adımlar:**
- [x] **Frontend:** Node tıklandığında (onClick event) ekranın sağından açılan bir Drawer (Panel) bileşeni tasarlanması.
- [x] **Altyapı:** ZAP ve Nuclei bulgu kaydettiğinde, Redis Pub/Sub üzerinden WebSocket mesajı fırlatılarak haritaya yeni düğümün (Node) sayfa yenilenmeden "canlı" olarak düşmesinin (Live View) sağlanması.

---

## EPIC 3: Yapay Zeka Güvenlik Asistanı (AI Copilot)
**Açıklama:** Sistemin tespit ettiği karmaşık zafiyetlerin LLM aracılığıyla filtrelenerek siber güvenlik jargonuna uygun Türkçe/İngilizce çözüm önerileri sunması.

### User Story 3.1: Tehdit Filtreleme (Context Condenser)
> *"Platform olarak, LLM (Yapay Zeka) modellerine milyonlarca anlamsız node (alt domain/IP) verisini gönderip Token Limit/Halüsinasyon sorunları yaşamak istemiyorum."*

**Teknik Adımlar:**
- [x] **Backend:** AI'a gidecek veriyi hazırlayan filtrenin yazılması. Sadece veritabanındaki türü `THREAT` veya etiketi `MALICIOUS_RECORD` olan verilerin bypass edilip LLM Prompt'una (sistem komutuna) eklenmesi. Subdomain, Port vb. gürültü verilerinin özetlenerek kısaltılması.

### User Story 3.2: AI Tabanlı İzah ve Çözüm (Rationale)
> *"Bir sızma testi uzmanı olarak, 'Log4j' zafiyetinin ne anlama geldiğini ve hedef sistemde bunu nasıl yamayabileceğimi tek tıkla öğrenmek istiyorum."*

**Teknik Adımlar:**
- [x] **Backend:** OpenRouter API bağlantısının (GPT-4o / Claude entegrasyonu) kurulması.
- [x] **Prompt Engineering:** "Sen bir SOC Copilot'sun, sadece sana gönderilen bağlamı baz alarak 3 cümlelik, teknik, Türkçe çözüm önerileri üret." direktifinin koda gömülmesi.
- [x] **Frontend:** Node Context Panel (Sağ çekmece) içerisine AI İzahı (AI Rationale) bölümünün eklenmesi ve API çağrısının buraya bağlanması.

---

## 📅 SPRINT VE YAYIN PLANI (Roadmap Execution)

### Faz 1: "The Core" (Tamamlandı)
* ZAP, Nuclei, Celery mimarisinin oturtulması. 
* React Flow haritasının çizilmesi.
* PostgreSQL veritabanı şemalarının ayağa kalkması.

### Faz 2: "The Brain" (Tamamlandı)
* AI Copilot, Context Condenser, Token Limit korumalarının kodlanması.
* Semantik renkler ve ZAP sessiz çökme (Silent timeout) güvenlik önlemleri.

### Faz 3: "The Shield" (Gelecek - Sıradaki Adımlar)
1. **Authentication (AuthZ / AuthN):** Sisteme izinsiz girişleri engellemek için `JWT` tabanlı kullanıcı girişi. (Bkz: PROGRESS.md)
2. **Rol Tabanlı Erişim (RBAC):** Ekiplerin (Teams) birbirinin tarama verilerini görmesini engelleyen veri izolasyonu (Tenant Isolation).
3. **Report Generation:** Taramaların sonucunun (Örn: Kritik bulgular) PDF formatında dışa aktarılması (Export to PDF).
