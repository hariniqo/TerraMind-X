"""Find API endpoints inside a downloaded JS bundle (for SPA-only gov portals)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

src = Path(sys.argv[1])
text = src.read_text(encoding="utf-8", errors="replace")
print(f"file: {src} ({len(text)} chars)")

api = sorted(set(re.findall(r"""["'`](/[A-Za-z0-9_\-/{}.:]*api[A-Za-z0-9_\-/{}.:]*)["'`]""", text, re.I)))
print(f"\n=== API-like paths ({len(api)}) ===")
for p in api[:120]:
    print(" ", p)

urls = sorted(set(re.findall(r"https?://[A-Za-z0-9_.\-]+(?:/[A-Za-z0-9_.\-/]*)?", text)))
print(f"\n=== absolute URLs ({len(urls)}) ===")
for u in urls[:60]:
    print(" ", u)

# common backend host hints used by Indian gov SPA bundles
hosts = sorted(set(re.findall(r"""["'`](https?://[A-Za-z0-9_.\-]+)["'`]""", text)))
print(f"\n=== quoted hosts ({len(hosts)}) ===")
for h in hosts[:60]:
    print(" ", h)
