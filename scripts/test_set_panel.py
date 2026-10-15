#!/usr/bin/env python3
import subprocess

script = """
var p = panels()[0];
print("Before: floating=" + p.floating + ", opacity=" + p.opacity + ", height=" + p.height);

p.floating = true;
p.height = 36;
// test what opacity accepts
// p.opacity = "translucent" or 2 or "opaque" or "adaptive"
p.opacity = "translucent";

print("After: floating=" + p.floating + ", opacity=" + p.opacity + ", height=" + p.height);
"""

cmd = [
    "qdbus6", "org.kde.plasmashell", "/PlasmaShell", "org.kde.PlasmaShell.evaluateScript", script
]
try:
    res = subprocess.check_output(cmd, stderr=subprocess.STDOUT, env={"WAYLAND_DISPLAY": "wayland-0", "XDG_RUNTIME_DIR": "/run/user/1000", "LC_ALL": "C.UTF-8"})
    print("RESULT:\n" + res.decode())
except subprocess.CalledProcessError as e:
    print("ERROR:\n" + e.output.decode())
