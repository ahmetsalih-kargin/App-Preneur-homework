# 🛡️ NexusOSINT

<div align="center">
  <p><strong>Kurumsal Ağlar İçin Otonom DAST, OSINT ve AI Destekli Siber Tehdit Analiz Platformu</strong></p>
</div>

NexusOSINT, siber güvenlik uzmanlarının (Pentester, SOC, DevSecOps) saatler süren manuel keşif ve zafiyet tarama süreçlerini dakikalara indiren, yatay ölçeklenebilir ve yapay zeka destekli bir güvenlik platformudur.

Otonom olarak hedeflerin dış saldırı yüzeyini (Attack Surface) haritalar, bilinen zafiyetleri test eder ve elde edilen sonuçları interaktif ağ grafikleri üzerinden **AI Copilot** desteğiyle analiz eder.

---

## ✨ Temel Özellikler

* 🕷️ **Full DAST Entegrasyonu:** Arka planda çalışan **OWASP ZAP** motoru ile canlı web uygulamalarında dinamik güvenlik açıklarını (XSS, SQLi, CSRF vb.) keşfeder.
* 🔍 **Gelişmiş OSINT ve Zafiyet Taraması:** **Amass** ile derinlemesine alt alan adı (subdomain) tespiti ve **Nuclei** ile binlerce hazır şablon kullanılarak hızlı CVE/misconfiguration taraması yapar.
* 🧠 **AI SOC Copilot:** Geliştirilmiş *Context Condenser* (Bağlam Daraltıcı) algoritması sayesinde, ağ grafiğindeki binlerce "gürültü" verisini filtreler ve sadece kritik zafiyetleri OpenRouter LLM'ine (Yapay Zeka) sunarak halüsinasyonsuz çözüm/iyileştirme önerileri üretir.
* 🕸️ **İnteraktif Ağ Grafiği:** Sonuçlar sıkıcı tablolar yerine **React Flow** ve D3.js tabanlı, fizik motoruna sahip canlı ağ haritaları (Node Graph) üzerinden görselleştirilir.
* ⚡ **Asenkron ve Bloklamayan Mimari:** **FastAPI**, **Celery** ve **Redis** üçlüsü sayesinde ne kadar ağır bir tarama yaparsanız yapın arayüz donmaz; sonuçlar **WebSocket** üzerinden anlık olarak UI'a akar.

---

## 🛠️ Teknoloji Yığını (Tech Stack)

Tam mimari dokümantasyon ve teknik kararlar (ADR) için lütfen [TECH-STACK.md](./TECH-STACK.md) ve [DesignSystem.md](./DesignSystem.md) dosyalarını inceleyin.

* **Frontend:** Next.js, React, TailwindCSS, React Flow, ShadCN
* **Backend:** FastAPI (Python), PostgreSQL, Redis, Celery
* **Siber Güvenlik Motorları:** OWASP ZAP, Nuclei, Amass
* **Altyapı:** Docker & Docker Compose

---

## 🚀 Hızlı Başlangıç & Kurulum (Deployment)

NexusOSINT, tüm bağımlılıklarıyla birlikte bağımsız (isolated) konteynerler olarak çalışacak şekilde **Dockerize** edilmiştir.

### Gereksinimler
Sistemi ayağa kaldırmak için bilgisayarınızda veya sunucunuzda şunların kurulu olması gerekir:
* Docker Engine (v20.10+)
* Docker Compose (v2.x)

### 1. Projeyi Klonlayın
```bash
git clone https://github.com/your-org/nexusosint-app.git
cd nexusosint-app
```

### 2. Çevresel Değişkenleri (Environment Variables) Ayarlayın
Proje kök dizininde bulunan şablon dosyasını kopyalayarak kendi `.env` dosyanızı oluşturun:
```bash
cp .env.example .env
```
Ardından favori metin düzenleyiciniz ile `.env` dosyasını açın ve özellikle aşağıdaki alanları doldurun:
* `JWT_SECRET_KEY`: Güvenli bir token şifresi oluşturun.
* `OPENROUTER_API_KEY`: AI Copilot özelliğini kullanabilmek için zorunludur.

### 3. Docker Compose ile Sistemi Ayağa Kaldırın
Aşağıdaki komutu çalıştırarak API, UI, Veritabanı, Redis, Celery Worker'ları ve ZAP motorunu tek seferde başlatın:
```bash
docker-compose up -d --build
```

### 4. Sisteme Erişin ve Canlı URL (Web Deploy)
Konteynerler ayağa kalktıktan sonra sistem yerel ortamda aşağıdaki adreslerde çalışır:
* **Yerel Arayüz (UI):** [http://localhost:3000](http://localhost:3000)
* **Yerel API Dokümantasyonu:** [http://localhost:8000/docs](http://localhost:8000/docs)

**🌐 Canlıya Alma (Live Deployment):**
Bitirme projesi değerlendirme şartlarında istenilen "Uygulama mutlaka canlıya alınmış olmalıdır (Web Deploy)" kriterini karşılamak üzere sistem **ngrok** kullanılarak tünellenmiş ve canlıya alınmıştır.
Uygulamanın çalışan güncel Canlı URL linki demo videosu ve teslim formu ile birlikte eğitmenlere/asistanlara iletilecektir.

---

## 🛑 Servisleri Durdurma

Taramaları iptal etmek ve tüm sistemi kapatmak için:
```bash
docker-compose down
```
*(Veritabanı verilerinizin silinmemesi için volume'ler korunacaktır. Verileri tamamen sıfırlamak isterseniz `docker-compose down -v` komutunu kullanabilirsiniz.)*

---

## 📚 Dokümantasyon Referansları
Proje içerisindeki diğer önemli rehberler:
* `TECH-STACK.md`: Mimari, altyapı tercihleri, risk ve maliyet analizleri.
* `PROGRESS.md`: Proje geçmişi, Sprint notları, hata kayıtları ve alınan teknik kararlar.
* `DesignSystem.md`: UI/UX standartları, erişilebilirlik kuralları ve renk şablonları.

---
*NexusOSINT - Kurumsal güvenliği otonomlaştırır.*
