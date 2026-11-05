# NexusOSINT — Kod ve Güvenlik İncelemesi

Tarih: 5 Kasım 2026 · Kapsam: `frontend/src`, `backend/` (api, core, crud, models, schemas, services, workers), `docker-compose.yml`, Dockerfile'lar.

> **Not:** İstek bir "şifre oluşturucu" için yazılmıştı; bu klasörde şifre oluşturucu yok. İnceleme, onay üzerine buradaki
> NexusOSINT (Next.js + FastAPI + Celery OSINT/DAST platformu) için yapıldı. Şifre üretimine özgü kontrollerin bu projedeki
> karşılıkları en sondaki "Hassas veri ve günlükler" bölümünde.

Durum etiketleri: **Düzeltildi** (kodda değiştirildi) · **Kısmen** · **Öneri** (kod değişmedi, çözüm aşağıda).

---

## 1. Kritik

### K1 — Hiçbir uç noktada kimlik doğrulama yok · Öneri
**Nerede:** `backend/main.py`, tüm `api/endpoints/*`
**Etki:** API'ye ulaşan herkes tarama başlatabilir (ZAP aktif saldırısı dahil), tüm hedefleri listeleyebilir (`GET /api/targets`), herhangi bir hedefin grafiğini/PDF/CSV raporunu indirebilir ve OpenRouter bütçenizi harcayabilir. Diğer birçok bulgunun (IDOR, maliyet kötüye kullanımı) kök nedeni.
**Çözüm:** En az bir API anahtarı veya oturum/JWT katmanı. Basit başlangıç:

```python
# core/auth.py
import hmac, os
from fastapi import Header, HTTPException

API_TOKEN = os.environ["NEXUS_API_TOKEN"]  # tanımsızsa uygulama başlamasın

async def require_token(authorization: str = Header(default="")):
    if not hmac.compare_digest(authorization, f"Bearer {API_TOKEN}"):
        raise HTTPException(status_code=401, detail="Yetkisiz")

# main.py
app.include_router(target.router, prefix="/api/targets", dependencies=[Depends(require_token)])
```
WebSocket için token'ı ilk mesajda veya `Sec-WebSocket-Protocol` başlığında doğrulayın (URL'de değil: URL'ler günlüklere yazılır). Çok kullanıcılı kullanımda hedeflere `owner_id` ekleyip her sorguda filtreleyin.

### K2 — Worker'da kabuk komutu enjeksiyonu · Düzeltildi
**Nerede:** `backend/workers/tasks.py` → `_async_amass_scan`, `_async_nuclei_scan`
**Sorun:** `asyncio.create_subprocess_shell(f"amass enum -passive -d {domain} ...")` ve `f"nuclei -u {target_url} ..."`. Kök alan adı şema regex'inden geçse de, Amass çıktısındaki **her satır** (`if domain in sub`) doğrudan Nuclei komutuna gömülüyordu. Amass çıktısı dış kaynaklardan (sertifika kayıtları, pasif DNS) gelir; ayrıca Amass v4 satırları `sub.example.com (FQDN) --> a_record --> ...` biçiminde olabildiği için `(`, `>` gibi kabuk karakterleri zaten komuta giriyordu.
**Etki:** Worker konteynerinde uzaktan kod çalıştırma; konteynerde `ENCRYPTION_KEY`, `OPENROUTER_API_KEY`, `VIRUSTOTAL_API_KEY` ve DB erişimi var.
**Düzeltme:** `create_subprocess_exec` (argümanlar kabuktan geçmez); Amass satırının yalnızca ilk alanı alınıp katı hostname doğrulamasından (`core/target_guard.py`) ve `endswith(f".{domain}")` kontrolünden geçiriliyor. Zaman aşımında `process.wait()` ile zombi süreç bırakılmıyor; Nuclei stdout'u PIPE yerine DEVNULL (bellekte biriktirmiyor).

### K3 — SSRF: tarayıcılar iç ağa yöneltilebiliyordu · Düzeltildi (DNS rebinding notuyla)
**Nerede:** `backend/schemas/osint.py` → `sanitize_and_validate_target`; `backend/workers/tasks.py` → `run_full_osint_scan`, Amass alt alan adı döngüsü
**Sorun:** IPv4 regex'i `127.0.0.1`, `10.x`, `172.16/12`, `169.254.169.254` (bulut metadata) ve hatta `999.999.999.999` kabul ediyordu. Alan adları için DNS kontrolü ZAP/Nuclei/Amass **kuyruğa atıldıktan sonra** yapılıyordu; iç IP'ye çözümlenen bir alan adı (örn. kendi DNS'inizde `x.saldirgan.com → 10.0.0.5`) da taranıyordu.
**Etki:** ZAP aktif taraması ve Nuclei ile Postgres/Redis/ZAP API'sine, iç servislere veya bulut kimlik bilgisi uç noktasına saldırı.
**Düzeltme:** IP'ler `ipaddress.is_global` ile; `localhost`, `.local`, `.internal` vb. reddediliyor. Worker, aktif taramaları başlatmadan önce hedefi çözümlüyor ve tüm IP'ler genel değilse taramayı başlatmıyor; Amass'ın bulduğu her alt alan adı da Nuclei'den önce aynı kontrolden geçiyor.
**Kalan risk:** DNS rebinding (kontrol anında genel IP, tarama anında iç IP). Tam çözüm: worker konteynerine egress güvenlik duvarı (iç ağ ve 169.254.0.0/16'ya çıkışı engelleyin) veya taramayı doğrulanan IP'ye sabitlemek.

### K4 — ZAP API anahtarsız ve ağa açık · Düzeltildi
**Nerede:** `docker-compose.yml` → `zap` servisi
**Sorun:** `api.disablekey=true`, `api.addrs.addr.name=.*` ve `8090:8080` tüm arayüzlere yayınlanmış. ZAP API dosya okuma/yazma, betik yükleme/çalıştırma işlemlerini destekler.
**Etki:** Aynı ağdaki herkes için ZAP konteynerinde kod çalıştırma ve iç Docker ağına (db, redis) pivot.
**Düzeltme:** `api.key=${ZAP_API_KEY}` zorunlu, host port eşlemesi kaldırıldı; worker anahtarı `X-ZAP-API-Key` başlığıyla gönderiyor, ZAP parametreleri `params=` ile URL-kodlanıyor. **.env dosyanıza `ZAP_API_KEY` eklemeniz gerekiyor** (yoksa `docker compose` başlamaz, bilinçli olarak).

---

## 2. Yüksek

| # | Sorun | Nerede | Etki | Durum |
|---|---|---|---|---|
| Y1 | `ENCRYPTION_KEY` yoksa **kaynak koda gömülü sabit Fernet anahtarına** sessizce düşülüyordu | `core/security.py` | Repoyu gören herkes "şifreli" bulguları çözebilir; at-rest şifreleme fiilen yoktu | **Düzeltildi:** anahtarsız başlamıyor. Eski geliştirme verisini okumak için bilinçli olarak `NEXUS_ALLOW_INSECURE_DEV_KEY=1` |
| Y2 | `CORS allow_origins=["*"]` + `allow_credentials=True` | `main.py` | Ziyaret edilen herhangi bir site, kullanıcının tarayıcısı üzerinden yerel API'ye tarama başlatıp sonuçları okuyabilir | **Düzeltildi:** `CORS_ALLOWED_ORIGINS` (varsayılan `http://localhost:3000`), credentials kapalı, yalnız GET/POST |
| Y3 | Postgres 5432 ve **parolasız Redis** 6379 tüm arayüzlere açık | `docker-compose.yml` | Redis Celery broker olduğu için ağdaki herkes görev kuyruğuna iş atabilir; DB'ye kaba kuvvet | **Düzeltildi:** tüm portlar `127.0.0.1`'e bağlı. **Öneri:** Redis'e `--requirepass` ve `REDIS_URL=redis://:parola@redis:6379/0` |
| Y4 | E-postalar, **API anahtarları ve parola özetleri** olduğu gibi üçüncü taraf LLM'e (OpenRouter) gönderiliyordu | `api/endpoints/chat.py`, `node.py` | Hassas sızıntı verisinin dışarı aktarılması; `.cursorrules` §5 ihlali | **Düzeltildi:** sohbete yalnız `MALICIOUS_RECORD` kayıtları + tür sayıları gidiyor; `API_KEY`/`PWD_HASH` değeri düğüm yorumunda `[gizlendi]` |
| Y5 | Sohbette `role` serbest metin, mesaj sayısı/uzunluğu sınırsız | `chat.py` → `ChatMessage` | İstemci `system` rolüyle talimatları ezebilir; kimlik doğrulama olmadığından sınırsız token maliyeti | **Düzeltildi:** `Literal["user","assistant"]`, ≤20 mesaj, ≤4000 karakter. **Öneri:** IP/kullanıcı başına hız sınırı (örn. `slowapi`) |
| Y6 | PDF'te bulgu metni kaçışsız `Paragraph`'a veriliyordu | `services/export.py` | `<script>` içeren bir ZAP URL'si raporu **çökertiyor** (500, doğrulandı); `<link href="javascript:…">` gibi etiketler PDF'e enjekte edilebiliyor (doğrulandı) | **Düzeltildi:** `xml.sax.saxutils.escape` |
| Y7 | WebSocket bağlantı sızıntısı | `api/endpoints/target.py` → `websocket_target_graph` | `async for … pubsub.listen()` kopmayı ancak bir sonraki Redis mesajında fark ediyordu; taraması bitmiş hedefte mesaj gelmediği için kapatılan her sekme bir coroutine + Redis bağlantısını kalıcı tutuyordu | **Düzeltildi:** kopma ayrı görevle izleniyor; abonelik ilk gönderimden önce (yarış koşulu giderildi); ardışık güncellemeler 300 ms'de birleştiriliyor; tek Redis havuzu. Sahte pubsub ile test edildi |
| Y8 | `Depends(deps.AsyncSessionLocal)` — oturum hiç kapanmıyor | `api/endpoints/node.py` | Her düğüm tıklaması bir DB bağlantısı sızdırıyor → havuz tükenir, API kilitlenir. Ayrıca her istekte kapatılmayan yeni `AsyncOpenAI` istemcisi | **Düzeltildi:** `Depends(deps.get_db)`, modül düzeyinde tek istemci |
| Y9 | Arayüzde **sahte saldırı verisi** üretiliyordu | eski `components/investigation-graph.tsx` (Kill-Chain "MOCK DATA FIX") | "Saldırı yolu" modunda her hedefe `3389/RDP (Exposed)` ve `admin:P@ssw0rd123 (Compromised)` düğümleri ekleniyordu; bir güvenlik aracında gerçek bulgu gibi görünen uydurma kayıt | **Düzeltildi:** kaldırıldı |
| Y10 | `simulate_zero_day_hook` her 5 dakikada rastgele bir hedefe uydurma `CRITICAL: GitLab CVE-2026-9999` kaydı yazıyor | `workers/tasks.py`, `workers/celery_app.py` (`beat_schedule`) | Sahte kritik bulgu PDF/CSV raporlarına ve LLM bağlamına girer; müşteri raporlarının güvenilirliği | **Öneri** (compose'da `celery beat` servisi yok, bu yüzden şu an çalışmıyor): görevi ve `beat_schedule` girdisini silin ya da yalnızca `DEMO_MODE=1` iken, kaydı `source_url="demo"` ve açık bir "DEMO" etiketiyle yazın |
| Y11 | Herhangi bir alan adına **onaysız otomatik ZAP aktif tarama** + Nuclei | `workers/tasks.py` → `run_full_osint_scan` | Yetkisiz sızma testi yasal sorumluluk doğurur (TCK 243–244 / benzeri mevzuat) | **Öneri:** kapsam izin listesi (`SCAN_SCOPE_ALLOWLIST`) veya hedef başına yetki onayı alanı; aktif taramayı pasif keşiften ayrı, açık bir kullanıcı eylemine bağlayın. Arayüze uyarı metni eklendi |
| Y12 | Veritabanı parolası kaynak koda gömülü varsayılan (`supersecretpassword`) | `core/database.py`, `api/deps.py`, `workers/tasks.py`, `workers/tasks_ingestion.py`, `alembic/env.py` | `DATABASE_URL` unutulursa bilinen parolayla bağlanmaya çalışır; parola repoda | **Öneri:** `DATABASE_URL = os.environ["DATABASE_URL"]` (yoksa başlamasın); tekrarlanan tanımları `core/database.py`'da toplayın |

---

## 3. Orta

| # | Sorun | Nerede | Durum / Çözüm |
|---|---|---|---|
| O1 | CSV formül enjeksiyonu (`=HYPERLINK(...)` gibi taranan değerler Excel'de çalışır) | `services/export.py` → `generate_csv_report` | **Düzeltildi:** `= + - @ \t \r` ile başlayan hücrelere `'` öneki (test edildi) |
| O2 | Dolaylı prompt injection: taranan sitelerin metni LLM'e talimat gibi gidiyor | `chat.py`, `node.py` | **Kısmen:** veri `<data>` içinde, "güvenilmeyen veri" talimatı. Model çıktısı arayüzde düz metin olarak gösteriliyor (HTML yok → XSS yok). Tam çözüm yok; çıktıyı karar mekanizmasına bağlamayın |
| O3 | Hata ayrıntıları (`str(e)`) istemciye dönüyor | `chat.py`, `node.py` | **Düzeltildi:** ayrıntı yalnız `logger.exception` ile sunucuda |
| O4 | PDF üretimi senkron ve CPU-yoğun, async uç noktada | `services/export.py` | **Düzeltildi:** `asyncio.to_thread(doc.build, …)` |
| O5 | PDF'te kırmızı satır indeksi yanlış (`enumerate` indeksi, atlanan kayıtlar kaydırıyor) | `services/export.py` | **Düzeltildi:** `len(data) - 1` |
| O6 | Amass'ın bulduğu her alt alan adı için sınırsız Nuclei görevi | `workers/tasks.py` | **Düzeltildi:** `MAX_NUCLEI_SUBDOMAINS` (varsayılan 25) |
| O7 | Hata yolunda sayaç tutarsızlığı: görevler kuyruğa atıldıktan sonra hata olursa `_handle_scan_failure` sayacı silip alt görevler sürerken bitti sinyali yayınlıyordu | `workers/tasks.py` | **Kısmen:** DNS/IP kontrolü artık sayaç ve görevlerden önce. Sonraki adımlardaki hatalar için sayacı silmek yerine yalnızca ana görevin payını düşürün |
| O8 | `requirements.txt` sürüm sabitlemiyor; güncel SQLAlchemy (2.1) `greenlet`'i artık otomatik kurmuyor → `sqlalchemy.ext.asyncio` içe aktarılamıyor, API başlamıyor (yerelde yeniden üretildi) | `backend/requirements.txt` | **Düzeltildi:** `sqlalchemy[asyncio]`. **Öneri:** tüm bağımlılıkları sabitleyin (`pip-compile` / `uv lock`) |
| O9 | İki ayrı engine + bağlantı havuzu | `core/database.py` ve `api/deps.py` | **Öneri:** `deps.py` içindeki engine'i silip `from core.database import AsyncSessionLocal, get_db` |
| O10 | Bulgular DB'de şifreli ama **düz metin olarak günlüğe** yazılıyor (alt alan adları, IP'ler, portlar, VT sonuçları, ZAP URL'leri) | `services/scanner.py`, `workers/tasks.py` (`logger.info(...)`) | **Öneri:** değerleri değil sayıları loglayın (`logger.info("[crt.sh] %d subdomain", len(results))`); ayrıntıyı `DEBUG` seviyesine alın |
| O11 | Konteyner sertleştirme: Amass/Nuclei ikilileri **checksum doğrulamadan** indiriliyor; `uvicorn --reload` ve `next dev` üretimde; konteynerler root | `backend/Dockerfile`, `frontend/Dockerfile` | **Öneri:** `sha256sum -c` ile doğrulama, `USER app`, `--reload` kaldırma, frontend için `next build && next start` çok aşamalı imaj |
| O12 | `workers/tasks_ingestion.py` var olmayan `app` nesnesini içe aktarıyor (`from workers.celery_app import app`) | `workers/tasks_ingestion.py` | **Öneri:** ölü/bozuk modül; silin (Celery `include` listesinde de yok) |
| O13 | Aynı hedef tekrar girilirse eski kayıt dönüyor, yeni tarama hiç başlamıyor | `api/endpoints/target.py` → `create_target_endpoint` | **Öneri:** "yeniden tara" uç noktası veya tarama kayıtlarını (scan run) hedeften ayırın |
| O14 | Gerçek zamanlı gelen yeni düğümler gizli kalıyordu: zaman çizelgesi ilk yüklemede "en son" tarihe kilitleniyor, sonradan gelen düğümler "gelecek" sayılıyordu | eski `app/page.tsx` | **Düzeltildi:** `null` = canlı mod; kaydırıcı sağ uca gelince canlıya döner |
| O15 | `fitView` yalnızca ilk render'da, boş yer tutucu düğüme yapılıyordu (gerçek grafik ekran dışında kalıyordu) | eski `investigation-graph.tsx` | **Düzeltildi:** düğümler ölçülünce ve sayı değişince; kullanıcı kaydırdıysa dokunmuyor |
| O16 | Grafik algoritmaları her mod değişiminde O(V·(V+E)) ve kill-chain'de iç içe `.find` ile daha kötü; her düğüm için `filter` ile çocuk sayımı | eski `investigation-graph.tsx` | **Düzeltildi:** `lib/graph-analysis.ts` komşuluk indeksi, O(V+E); yerleşim yalnızca veri değişince, 200+ düğümde `onlyRenderVisibleElements` |
| O17 | İki ayrı `QueryClient` (sayfa kendi istemcisini `gcTime: 0` ile oluşturup `Providers`'ı gölgeliyordu) | eski `app/page.tsx` | **Düzeltildi** |
| O18 | API adresi tutarsız: `api.ts` sabit `localhost:8000`, WS/dışa aktarım `NEXT_PUBLIC_API_URL` | eski `lib/api.ts` | **Düzeltildi:** `lib/config.ts` tek kaynak |
| O19 | Düğüm yorumu her tıklamada yeni (ücretli) LLM çağrısı; panel kapanınca istek iptal edilmiyor | eski `node-context-panel.tsx` | **Düzeltildi:** React Query önbelleği + `AbortSignal` |
| O20 | Docker imajında WebSocket kütüphanesi yoktu (`uvicorn` ekstrasız kuruluyordu); backend WS isteklerini 404 ile reddediyor, "gerçek zamanlı" güncelleme hiç çalışmıyor, yalnızca 5 sn'lik yedek yoklama işliyordu | `backend/requirements.txt` | **Düzeltildi:** `uvicorn[standard]` (Docker'da doğrulandı: bağlantı `[accepted]`) |
| O21 | Yedek yoklama tamamlanmayı görünce önce yeşil "tamamlandı", grafik gelince "başarısız" gösteriyordu | `frontend/src/app/page.tsx` | **Düzeltildi:** durum, son grafik çekildikten sonra belirleniyor |

---

## 4. Erişilebilirlik (WCAG 2.2 AA)

Hepsi yeni arayüzde **düzeltildi**:

- Yalnız ikonlu düğmelerde erişilebilir ad yoktu (mobil menü, asistan aç/kapat, gönder). → `aria-label`, `aria-expanded`, `aria-controls`.
- Hedef alanının etiketi yoktu, hata mesajı duyurulmuyordu. → `<label>`, `aria-describedby`, `aria-invalid`, `role="alert"`.
- Kontrast: siyah zemin üzerinde `text-neutral-700/800` ve 9–10 px metinler (≈1.5:1). → en az `zinc-400` (≈7:1), en küçük metin 12 px.
- Tarama durumu ekran okuyucuya bildirilmiyordu. → `role="status"`; sohbet `role="log"`, yorum alanı `aria-live`.
- Grafik düğümleri klavyeyle açılamıyordu; grup başlığı tıklanabilir `div`. → Tab + Enter/Space detay panelini açar, odak panel başlığına taşınır, Escape kapatır; grup başlığı `button[aria-expanded]`; düğümlerde `aria-label` ("Açık servis: 22/SSH").
- Mobil çekmece kapalıyken ekran dışında ama odaklanabilirdi. → kapalıyken `invisible`, Escape ile kapanır, odak menü düğmesine döner.
- `lang="en"` ama arayüz Türkçe. → `lang="tr"`, karışık İngilizce/Türkçe metinler Türkçeleştirildi.
- Emoji ikonlar ve sürekli yanıp sönen rozetler. → Lucide ikonları (`aria-hidden`), `prefers-reduced-motion` desteği, görünür `:focus-visible` halkası, "Grafiğe atla" bağlantısı.
- Zaman kaydırıcısının etiketi yoktu. → `<label>`, `aria-valuetext`, `<output>`.

**Kalan:** Grafik doğası gereği görsel; ekran okuyucu kullanıcıları için bulguların tablo/liste görünümü eklenmesi önerilir. Mobil çekmecede tam odak tuzağı yok (Escape + gizleme var).

---

## 5. Hassas veri ve günlükler (şifre oluşturucu kontrollerinin karşılığı)

- **Rastgelelik:** Projede parola/anahtar üretimi yok. Kullanılan rastgelelik `uuid.uuid4()` (işletim sistemi CSPRNG'si) ve Fernet; ikisi de uygun. Zayıf `random`/`Math.random` kullanımı bulunmadı.
- **Saklama:** `API_KEY` ve `PWD_HASH` türleri DB'de Fernet ile şifreleniyor, ancak sabit yedek anahtar yüzünden (Y1) bu koruma fiilen yoktu; düzeltildi. Aynı değerler PDF/CSV dışa aktarımlarında düz metin; bu raporları hassas belge olarak ele alın. `target_value` şifrelenmiyor (indeksli sorgu için).
- **Üçüncü taraflar:** Hassas değerler LLM'e gidiyordu (Y4), düzeltildi. VirusTotal'a hedef alan adı/IP'ler gönderiliyor (ürünün doğası gereği).
- **Günlükler:** API anahtarları (OpenRouter, VirusTotal) günlüğe yazılmıyor. Taranan değerler `INFO` seviyesinde düz metin yazılıyor (O10, öneri). Frontend'deki `console.log`/`console.error` çağrıları kaldırıldı; tarayıcıda hassas değer loglanmıyor.
- **Tarayıcı depolama:** `localStorage`/`sessionStorage`/çerez kullanılmıyor.
- **Sabit kodlanmış sırlar:** Fernet yedek anahtarı (düzeltildi), DB parolası varsayılanı (Y12, öneri), eski arayüzdeki sahte `admin:P@ssw0rd123` (kaldırıldı).

---

## 6. Frontend yeniden tasarımı — ne değişti, neden

Teknoloji yığını aynı: Next.js 14 (App Router), React 18, Tailwind 3, React Flow 11, TanStack Query 5, lucide-react. Tüm işlevler korundu: tarama başlatma, canlı WebSocket güncellemeleri + yedek yoklama, grup aç/kapa, odak modu, saldırı yolu (kill-chain), etki alanı (blast radius), zaman çizelgesi, düğüm detayı + yapay zekâ yorumu, PDF/CSV dışa aktarma, asistan.

- Görsel dil: tek nötr koyu palet (zinc), tek vurgu rengi (mavi), önem renkleri `.cursorrules` eşlemesine uygun. Parlama, gradyan, terminal taklidi, emoji ve BÜYÜK HARF etiketler kaldırıldı; boş alan ve tipografiyle hiyerarşi.
- Kenarlar merkezden merkeze düz çizgi; etiketler yalnız vurgulanan yollarda (gürültü azaldı).
- Önem derecesi düğümde sol şerit, panelde rozet; kenar çubuğunda önem dağılımı özeti.
- Kaldırılan ölü kod: `lib/mockApi.ts`, `lib/GraphDataAdapter.ts`, iki ayrı kullanılmayan zustand store, `entities/graph/types.ts`, `types/osint.types.ts`, kopya `components/scan/scan-launcher.tsx`, `custom-group-node.tsx` (yerini `components/graph/nodes.tsx` aldı).
- `tsconfig.json` `target: es5 → es2017`: `Set`/`Map` üzerinde yineleme için gerekli (es5 ile tip denetimi başarısız oluyordu).
- `layout.tsx`'teki `force-dynamic` / `fetchCache` / `revalidate` kaldırıldı: sayfa tamamen istemci tarafında veri çekiyor, sunucu önbelleğiyle ilgisi yok; sayfa artık statik olarak önceden oluşturuluyor.
- **Öneri:** Kullanılmayan bağımlılıkları kaldırın: `npm uninstall react-force-graph-2d zustand`. ESLint yüklü değil (`next build` lint adımını atlıyor): `npm i -D eslint eslint-config-next@14`.

---

## 7. Doğrulananlar ve doğrulanmayanlar

**Doğrulandı:**
- Frontend: `tsc --noEmit` hatasız, `next build` başarılı. Sahte bir API ile tarayıcıda: tarama başlatma, grafik sığdırma, detay paneli, yapay zekâ yorumu yüklenmesi, saldırı yolu modu, asistan, doğrulama hata mesajı, mobil (375 px) çekmece ve grafik, klavyeyle düğüm açma ve Escape ile kapatma.
- Backend (geçici sanal ortamda, gerçek DB/Redis olmadan): tüm modüller içe aktarılıyor; CORS (yabancı köken reddediliyor), iç IP/`localhost` hedef reddi, sohbette `system` rolü ve >20 mesaj reddi, WebSocket kopunca aboneliğin kapanması (sahte pubsub ile), zararlı içerikle PDF üretimi ve CSV önekleme.

- Tam yığın `docker compose` ile (6 konteyner): Alembic göçleri tabloları ve enum'ları oluşturdu; `169.254.169.254` API'de reddedildi; ZAP 2.17 anahtarlı isteğe yanıt verip anahtarsızı reddetti; çözümlenemeyen bir alan adıyla uçtan uca akış (API → Celery → şifreli DB kaydı → WebSocket/yoklama → arayüzde "Tarama tamamlanamadı") ve hiçbir tarayıcının başlatılmadığı doğrulandı.

**Doğrulanmadı (ek bağlam/ortam gerekir):**
- Gerçek bir hedefe karşı Amass/Nuclei/ZAP taramaları (Amass v4 çıktı biçimi varsayımı, Nuclei `-silent` bayrağı, ZAP spider/aktif tarama akışı) — üçüncü taraf sistemleri izinsiz taramamak için çalıştırılmadı.
- OpenRouter ve VirusTotal entegrasyonları (anahtar tanımlı değil).
- `prodocs/` (frontend'in eski bir kopyası), `qa_test.py`, `test_api.*`, `TECH-STACK.md`/`PROGRESS.md` incelenmedi; `tasks_ingestion.py` yalnızca yüzeysel okundu.
- Bağımlılıkların bilinen CVE taraması (`npm audit`, `pip-audit`) çalıştırılmadı.
