"""Print context around a token inside a JS bundle (to reverse-engineer API params)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

src = Path(sys.argv[1])
token = sys.argv[2]
width = int(sys.argv[3]) if len(sys.argv) > 3 else 700
text = src.read_text(encoding="utf-8", errors="replace")

hits = list(re.finditer(re.escape(token), text))
print(f"token {token!r}: {len(hits)} hits in {src.name}")
for i, m in enumerate(hits):
    a, b = max(0, m.start() - width // 2), m.end() + width
    chunk = text[a:b]
    print(f"\n================ hit {i + 1} ================")
    print(chunk)
