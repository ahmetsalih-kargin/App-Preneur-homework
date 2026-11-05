from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime

# Ortak özellikler
class TargetBase(BaseModel):
    target_value: str = Field(..., max_length=2048, description="Taranacak hedef (IP veya alan adı)")
    is_monitored: bool = Field(default=False, description="Sürekli izleme modunda mı?")

import ipaddress
import re
from pydantic import field_validator
from core.target_guard import is_valid_hostname

# Kullanıcıdan API'ye gelirken istenecek veri
class TargetCreate(TargetBase):
    @field_validator("target_value")
    @classmethod
    def sanitize_and_validate_target(cls, v: str) -> str:
        # Strip whitespaces
        v = v.strip().lower()
        # Remove protocols
        v = re.sub(r"^https?://", "", v)
        # Remove trailing slashes and paths
        v = v.split("/")[0]
        
        if not v:
            raise ValueError("Hedef alanı boş olamaz.")
        
        # Port, kullanıcı bilgisi ve sorgu dizesini at ("example.com:8080", "user@host", "a.com?x")
        v = v.split("?")[0].split("#")[0].rsplit("@", 1)[-1].split(":")[0].rstrip(".")

        # IPv4: eski regex 999.999.999.999'u ve 127.0.0.1 / 10.x / 169.254.169.254 gibi
        # iç adresleri kabul ediyordu → ZAP/Nuclei iç ağa yöneltilebiliyordu (SSRF).
        if re.fullmatch(r"[0-9.]+", v):
            try:
                ip = ipaddress.IPv4Address(v)
            except ValueError:
                raise ValueError("Geçersiz IP adresi.")
            if not ip.is_global:
                raise ValueError("Özel, yerel veya ayrılmış IP adresleri taranamaz.")
            return v

        if not is_valid_hostname(v):
            raise ValueError("Geçersiz hedef formatı. Lütfen geçerli bir IP adresi veya alan adı (Örn: example.com) girin.")
        if v == "localhost" or v.endswith((".localhost", ".local", ".internal", ".lan", ".home.arpa")):
            raise ValueError("Yerel ağ adları taranamaz.")

        return v

# API'den kullanıcıya dönerken verilecek veri
class TargetResponse(TargetBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    # SQLAlchemy modellerini Pydantic'e dönüştürmek için gerekli kural (Pydantic V2)
    model_config = ConfigDict(from_attributes=True)