"""Explore Maharashtra State Data Bank (MAHASDB) sector pages for agriculture data."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tdcommon import RAW, ensure_dirs, fetch_bytes, log  # noqa: E402

BASE = "https://mahasdb.maharashtra.gov.in"
OUT = RAW / "maharashtra" / "mahasdb"
OUT.mkdir(parents=True, exist_ok=True)


def get(path: str):
    payload, status, mode = fetch_bytes(BASE + path, timeout=60, lax_ssl=True)
    if payload is None:
        log(f"FAIL {path} status={status}")
        return None
    text = payload.decode("utf-8", "replace")
    fn = OUT / (re.sub(r"[^A-Za-z0-9]+", "_", path).strip("_") or "index") 
    fn = fn.with_suffix(".html")
    fn.write_text(text, encoding="utf-8")
    return text


def main() -> None:
    ensure_dirs()
    found = {}
    for sec in range(1, 13):
        html = get(f"/sector.do?sec={sec}")
        if not html:
            continue
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "lxml")
        title = (soup.title.get_text(strip=True) if soup.title else "")[:90]
        # table headers often name the sector
        heads = [h.get_text(" ", strip=True)[:70] for h in soup.find_all(["h1", "h2", "h3"])][:6]
        links = [(a.get_text(" ", strip=True)[:60], a["href"]) for a in soup.find_all("a", href=True)
                 if re.search(r"\.do", a["href"] or "")][:40]
        found[f"sec={sec}"] = {"title": title, "heads": heads, "links": links}
        log(f"sec={sec} title={title!r} heads={heads}")
    (OUT / "sectors.json").write_text(json.dumps(found, indent=2, ensure_ascii=False),
                                      encoding="utf-8")
    log(f"wrote {OUT / 'sectors.json'}")


if __name__ == "__main__":
    main()
