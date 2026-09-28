"""Search extracted PDF tables for a text pattern and report matching tables."""
from __future__ import annotations

import re
import sys
from pathlib import Path

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("data/raw")
pattern = sys.argv[2] if len(sys.argv) > 2 else "Tamil Nadu"
limit = int(sys.argv[3]) if len(sys.argv) > 3 else 40

rx = re.compile(pattern, re.I)
hits = 0
for p in sorted(root.rglob("*.csv")):
    if "pdf_tables" not in p.parts:
        continue
    try:
        text = p.read_text(encoding="utf-8", errors="replace")
    except Exception:  # noqa: BLE001
        continue
    if not rx.search(text):
        continue
    hits += 1
    if hits > limit:
        break
    lines = [ln for ln in text.splitlines() if rx.search(ln)]
    print(f"\n########## {p}  (matches: {len(lines)}) ##########")
    for ln in lines[:6]:
        print("   ", ln[:400])
print(f"\ntotal matching tables (capped at {limit}): {hits}")
