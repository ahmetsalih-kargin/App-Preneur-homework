"""
core/target_guard.py — Tarama hedefi güvenlik kontrolleri

Tarayıcı motorlar (ZAP aktif tarama, Nuclei) iç ağa yöneltilirse SSRF ile
Postgres/Redis/ZAP API ya da bulut metadata servisine (169.254.169.254) saldırı
yapılabilir. Bu modül hedefi tarama başlamadan önce doğrular.

Not: DNS rebinding'e karşı tam koruma için taramanın da çözümlenen IP'ye
sabitlenmesi gerekir; bu kontrol ilk savunma hattıdır.
"""
import ipaddress
import re
import socket

HOSTNAME_RE = re.compile(
    r"^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,61}[a-z0-9]$"
)


def is_valid_hostname(value: str) -> bool:
    return bool(HOSTNAME_RE.match(value))


def is_public_ip(value: str) -> bool:
    try:
        return ipaddress.ip_address(value).is_global
    except ValueError:
        return False


def resolve_ipv4(host: str) -> list[str]:
    """Senkron DNS çözümlemesi (worker içinde veya executor'da çağrılmalı)."""
    try:
        return sorted({info[4][0] for info in socket.getaddrinfo(host, None, socket.AF_INET)})
    except (socket.gaierror, UnicodeError):
        return []


def all_public(ips: list[str]) -> bool:
    return bool(ips) and all(is_public_ip(ip) for ip in ips)
