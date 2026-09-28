"""Extract kebab-case endpoint paths from a JS bundle (AGMARKNET 2.0 API discovery)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

src = Path(sys.argv[1])
text = src.read_text(encoding="utf-8", errors="replace")

# string literals that look like REST path segments
cands = re.findall(r"""["'`](/[a-z0-9][a-z0-9\-/]{2,60})["'`]""", text)
print(f"=== path literals ({len(set(cands))}) ===")
for p in sorted(set(cands)):
    print(" ", p)

kebab = re.findall(r"""["'`]([a-z][a-z0-9]*(?:-[a-z0-9]+){1,5})["'`]""", text)
print(f"\n=== kebab-case tokens ({len(set(kebab))}) ===")
for p in sorted(set(kebab)):
    print(" ", p)

# find the context around the api base host
for m in re.finditer(r"api\.agmarknet\.gov\.in", text):
    a, b = max(0, m.start() - 400), m.start() + 400
    print("\n=== context ===")
    print(text[a:b].replace("\n", " ")[:800])
    break
