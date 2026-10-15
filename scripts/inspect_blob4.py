#!/usr/bin/env python3
import re

with open("/usr/lib/x86_64-linux-gnu/qt6/plugins/plasma/applets/org.kde.plasma.kickoff.so", "rb") as f:
    data = f.read()

matches = list(re.finditer(b"(import QtQuick[^\x00]{20,})", data))
b4 = matches[4].group(1).decode("utf-8", errors="ignore")
print("Length:", len(b4))
# Look for avatar or header
for line in b4.splitlines():
    if any(k in line.lower() for k in ["avatar", "user", "icon", "image", "header"]):
        print(line)
