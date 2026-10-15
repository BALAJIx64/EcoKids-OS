#!/usr/bin/env python3
import subprocess
import os

def run_cmd(cmd):
    try:
        res = subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT)
        return res.decode().strip()
    except subprocess.CalledProcessError as e:
        return f"ERR: {e.output.decode() if e.output else str(e)}"

print("plasmarc Theme:", run_cmd("kreadconfig6 --file plasmarc --group Theme --key name"))
print("kdeglobals ColorScheme:", run_cmd("kreadconfig6 --file kdeglobals --group General --key ColorScheme"))
print("kdeglobals widgetStyle:", run_cmd("kreadconfig6 --file kdeglobals --group KDE --key widgetStyle"))
print("kwinrc Blur:", run_cmd("kreadconfig6 --file kwinrc --group Plugins --key blurEnabled"))
print("kwinrc Translucency:", run_cmd("kreadconfig6 --file kwinrc --group Plugins --key translucencyEnabled"))

# Check running plasmashell environment and Wayland compositor
print("WAYLAND_DISPLAY:", os.environ.get("WAYLAND_DISPLAY", "not set in ssh"))

# Check what desktop theme is physically being loaded by plasmashell
theme_name = run_cmd("kreadconfig6 --file plasmarc --group Theme --key name")
if not theme_name or theme_name.startswith("ERR"):
    theme_name = "default"

print(f"Active Theme Name: '{theme_name}'")
for prefix in [os.path.expanduser("~/.local/share/plasma/desktoptheme"), "/usr/share/plasma/desktoptheme"]:
    path = os.path.join(prefix, theme_name)
    if os.path.exists(path):
        print(f"Found theme directory at: {path}")
        # check dialogs and widgets
        for sub in ["dialogs/background.svg", "dialogs/background.svgz", "widgets/panel-background.svg", "widgets/panel-background.svgz", "widgets/translucentbackground.svg", "widgets/translucentbackground.svgz"]:
            p = os.path.join(path, sub)
            if os.path.exists(p):
                print(f"  Has {sub} ({os.path.getsize(p)} bytes)")
