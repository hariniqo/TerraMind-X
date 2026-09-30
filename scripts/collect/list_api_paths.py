"""List all API paths referenced through the axios client in a JS bundle."""
from __future__ import annotations

import re
import sys
from pathlib import Path

text = Path(sys.argv[1]).read_text(encoding="utf-8", errors="replace")

# endpoints passed directly to the http client, e.g. nC.get("/path?...") / nC.post("/path"
direct = re.findall(r"""nC\.(get|post|put|delete)\(\s*["'`]([^"'`]+)""", text)
consts = dict(re.findall(r"""(\w+)\s*=\s*["'`](/[a-z0-9][a-z0-9\-/]{3,80})["'`]""", text))

print(f"=== direct client calls ({len(direct)}) ===")
seen = set()
for verb, path in direct:
    if path in seen:
        continue
    seen.add(path)
    print(f"  {verb.upper():<6} {path[:130]}")

print(f"\n=== path constants ({len(consts)}) ===")
for name, path in sorted(consts.items()):
    if re.search(r"(price|arrival|report|commodit|market|district|state|msp)", path, re.I):
        print(f"  {name:<8} {path}")

print("\n=== get( const ) usages ===")
for m in re.finditer(r"""nC\.get\(([^)]{0,160})\)""", text):
    arg = m.group(1)
    if "concat" in arg or "?" in arg:
        print("  ", arg.replace("\n", " ")[:200])
