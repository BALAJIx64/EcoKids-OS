#!/usr/bin/env python3
import subprocess

script = """
var p = panels()[0];
var props = [];
for (var key in p) {
    props.push(key + ": " + p[key]);
}
print(props.join(", "));
"""

cmd = [
    "qdbus6", "org.kde.plasmashell", "/PlasmaShell", "org.kde.PlasmaShell.evaluateScript", script
]
try:
    res = subprocess.check_output(cmd, stderr=subprocess.STDOUT, env={"WAYLAND_DISPLAY": "wayland-0", "XDG_RUNTIME_DIR": "/run/user/1000", "LC_ALL": "C.UTF-8"})
    print("PROPS:\n" + res.decode().strip())
except subprocess.CalledProcessError as e:
    print("ERR:\n" + e.output.decode().strip())
