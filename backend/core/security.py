import logging
import os

from cryptography.fernet import Fernet

logger = logging.getLogger(__name__)

# .env dosyasından anahtarı okuruz ve yanlışlıkla konulmuş tırnak işaretlerini temizleriz.
raw_key = os.getenv("ENCRYPTION_KEY", "").strip().strip("\"'")

# GÜVENLİK: Eskiden ENCRYPTION_KEY eksik/geçersizse kaynak kodda açıkça yazılı bu anahtara
# SESSİZCE düşülüyordu. Repoyu gören herkes veritabanındaki "şifreli" bulguları çözebiliyordu;
# yani at-rest şifreleme fiilen yoktu. Artık uygulama anahtarsız başlamaz.
# Yerel geliştirmede eski verileri okumak için bilinçli olarak NEXUS_ALLOW_INSECURE_DEV_KEY=1 verilebilir.
_LEGACY_DEV_KEY = b"MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI="


def _load_cipher() -> Fernet:
    if raw_key:
        try:
            return Fernet(raw_key.encode("utf-8"))
        except (ValueError, TypeError) as e:
            raise RuntimeError(
                "ENCRYPTION_KEY geçersiz. Üretmek için: "
                "python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
            ) from e
    if os.getenv("NEXUS_ALLOW_INSECURE_DEV_KEY") == "1":
        logger.warning("GÜVENSİZ geliştirme anahtarı kullanılıyor. Üretimde ENCRYPTION_KEY tanımlayın.")
        return Fernet(_LEGACY_DEV_KEY)
    raise RuntimeError("ENCRYPTION_KEY tanımlı değil; bulgular şifrelenemez. .env dosyanıza geçerli bir Fernet anahtarı ekleyin.")


cipher_suite = _load_cipher()


def encrypt_data(text: str) -> str:
    if not text:
        return text
    return cipher_suite.encrypt(text.encode()).decode()


def decrypt_data(encrypted_text: str) -> str:
    if not encrypted_text:
        return encrypted_text
    return cipher_suite.decrypt(encrypted_text.encode()).decode()
