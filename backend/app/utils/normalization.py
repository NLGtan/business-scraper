from __future__ import annotations

import re
from urllib.parse import urlparse


def normalize_phone(phone: str | None) -> str | None:
    if not phone:
        return None
    digits = re.sub(r"[^\d+]", "", phone)
    if not digits:
        return None
    if digits.startswith("00"):
        digits = "+" + digits[2:]
    return digits


def normalize_website(website: str | None) -> str | None:
    if not website:
        return None
    site = website.strip()
    if not site:
        return None

    if not site.startswith(("http://", "https://")):
        site = f"https://{site}"

    parsed = urlparse(site)
    if not parsed.netloc:
        return None

    normalized = f"{parsed.scheme.lower()}://{parsed.netloc.lower()}{parsed.path or ''}"
    return normalized.rstrip("/")


def normalize_name_address(name: str, address: str) -> str:
    normalized_name = re.sub(r"\s+", " ", name).strip().lower()
    normalized_address = re.sub(r"\s+", " ", address).strip().lower()
    return f"{normalized_name}|{normalized_address}"

