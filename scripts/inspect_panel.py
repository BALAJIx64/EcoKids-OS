#!/usr/bin/env python3
import configparser
import subprocess
import os

config_path = os.path.expanduser("~/.config/plasma-org.kde.plasma.desktop-appletsrc")
with open(config_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Read {len(lines)} lines from {config_path}")

# Find Containments][2]
found = False
for line in lines:
    if "[Containments][2]" in line:
        found = True
    elif found and line.startswith("["):
        if not line.startswith("[Containments][2]"):
            break
    if found:
        print(line.rstrip())
