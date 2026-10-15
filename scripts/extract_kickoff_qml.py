#!/usr/bin/env python3
import re
import os

with open("/usr/lib/x86_64-linux-gnu/qt6/plugins/plasma/applets/org.kde.plasma.kickoff.so", "rb") as f:
    data = f.read()

# Let's search for qml snippets
matches = list(re.finditer(b"(import QtQuick[^\x00]{20,})", data))
print(f"Found {len(matches)} QML text blobs in binary")
for i, m in enumerate(matches):
    text = m.group(1).decode("utf-8", errors="ignore")
    first_lines = text[:200]
    print(f"--- Blob {i} ({len(text)} bytes) ---")
    print(first_lines)
    if "Header" in text or "Avatar" in text or "avatar" in text or "userName" in text or "name:" in text:
        print(">>> MATCHES HEADER/AVATAR! <<<")
        print(text[:1500])
