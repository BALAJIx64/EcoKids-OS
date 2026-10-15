#!/usr/bin/env python3
with open("/usr/lib/x86_64-linux-gnu/qt6/plugins/plasma/applets/org.kde.plasma.kickoff.so", "rb") as f:
    data = f.read()

for term in [b"Avatar", b"avatar", b"userIcon", b"userImage", b"face", b"accounts", b"Account"]:
    p = 0
    matches = 0
    while True:
        p = data.find(term, p)
        if p == -1:
            break
        snippet = data[max(0, p-30):min(len(data), p+50)]
        # Filter printable
        clean = "".join(chr(b) if 32 <= b < 127 else "." for b in snippet)
        print(f"[{term.decode()}] {clean}")
        p += len(term)
        matches += 1
        if matches >= 5:
            break
