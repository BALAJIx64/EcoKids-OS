#!/usr/bin/env python3
import re

with open("/usr/lib/x86_64-linux-gnu/qt6/plugins/plasma/applets/org.kde.plasma.kickoff.so", "rb") as f:
    data = f.read()

# Find all QML text blobs
matches = list(re.finditer(b"(import QtQuick[^\x00]{20,})", data))
print(f"Total QML blobs: {len(matches)}")

for i, m in enumerate(matches):
    text = m.group(1).decode("utf-8", errors="ignore")
    # Check for opacity, color, background, Rectangle
    rects = re.findall(r'(Rectangle\s*\{[^}]*\}|background\s*:\s*[^;\n]*)', text)
    if rects:
        print(f"--- Blob {i} has backgrounds/rectangles ---")
        for r in rects[:5]:
            print("  ", r.replace('\n', ' '))
