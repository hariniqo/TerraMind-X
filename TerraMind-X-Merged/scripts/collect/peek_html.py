"""Inspect a saved HTML page: list links, forms and candidate data endpoints."""
from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import urljoin

from bs4 import BeautifulSoup

p = Path(sys.argv[1])
mode = sys.argv[2] if len(sys.argv) > 2 else "links"
html = p.read_text(encoding="utf-8", errors="replace")
soup = BeautifulSoup(html, "lxml")

if mode == "links":
    seen = set()
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        txt = " ".join(a.get_text(" ", strip=True).split())[:70]
        if href.lower().startswith(("javascript:", "#")) or href in seen:
            continue
        seen.add(href)
        print(f"{txt!r:<75} -> {href[:160]}")
    print("\n=== FORMS ===")
    for f in soup.find_all("form"):
        print("action:", f.get("action"), "method:", f.get("method"))
        for el in f.find_all(["select", "input"]):
            if el.name == "select":
                opts = [o.get("value") for o in el.find_all("option")][:25]
                print(f"  SELECT name={el.get('name')} id={el.get('id')} options={opts}")
            else:
                print(f"  INPUT name={el.get('name')} type={el.get('type')} "
                      f"value={str(el.get('value'))[:60]}")
elif mode == "text":
    txt = soup.get_text("\n", strip=True)
    key = sys.argv[3] if len(sys.argv) > 3 else None
    lines = txt.splitlines()
    for i, ln in enumerate(lines):
        if key is None or re.search(key, ln, re.I):
            print(f"{i}: {ln[:180]}")
