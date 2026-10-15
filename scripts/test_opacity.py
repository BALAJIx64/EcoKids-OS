#!/usr/bin/env python3
import subprocess

for val in [0, 1, 2, "0", "1", "2", "translucent", "opaque", "adaptive"]:
    script = f"""
    var p = panels()[0];
    try {{
        p.opacity = {repr(val)};
        print("Set {val}: got " + p.opacity);
    }} catch(e) {{
        print("Set {val} failed: " + e);
    }}
    """
    cmd = [
        "qdbus6", "org.kde.plasmashell", "/PlasmaShell", "org.kde.PlasmaShell.evaluateScript", script
    ]
    try:
        res = subprocess.check_output(cmd, stderr=subprocess.STDOUT, env={"WAYLAND_DISPLAY": "wayland-0", "XDG_RUNTIME_DIR": "/run/user/1000", "LC_ALL": "C.UTF-8"})
        print(f"Test {val} =>", res.decode().strip())
    except subprocess.CalledProcessError as e:
        print(f"Test {val} err =>", e.output.decode().strip())
