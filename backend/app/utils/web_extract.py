from __future__ import annotations

import re
from typing import Dict, List
from urllib.parse import urljoin

from bs4 import BeautifulSoup

SOCIAL_DOMAINS = (
    "facebook.com",
    "instagram.com",
    "linkedin.com",
    "x.com",
    "twitter.com",
    "youtube.com",
    "tiktok.com",
)


def extract_contact_signals(html: str, base_url: str) -> Dict[str, List[str] | str]:
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup(["script", "style", "noscript"]):
        tag.extract()

    text = " ".join(soup.get_text(" ").split())
    email_pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
    phone_pattern = r"(?:\+?\d{1,3}[\s\-.]?)?(?:\(?\d{2,4}\)?[\s\-.]?)\d{3,4}[\s\-.]?\d{3,4}"

    emails = sorted(set(re.findall(email_pattern, text)))
    phone_numbers = sorted(set(re.findall(phone_pattern, text)))

    social_links: set[str] = set()
    for anchor in soup.find_all("a", href=True):
        href = anchor.get("href", "")
        absolute = urljoin(base_url, href)
        if any(domain in absolute.lower() for domain in SOCIAL_DOMAINS):
            social_links.add(absolute)

    return {
        "emails": emails[:10],
        "phones": phone_numbers[:10],
        "social_links": sorted(social_links)[:10],
        "snippet": text[:600],
    }

