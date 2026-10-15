#!/usr/bin/env python3
import subprocess

script = """
var p = panels()[0];
print("Current widgets: " + p.widgetIds.join(","));

// Let's inspect each widget
for (var i = 0; i < p.widgets().length; ++i) {
    var w = p.widgets()[i];
    print("Widget " + i + ": " + w.type + " (id=" + w.id + ")");
}
"""

cmd = [
    "qdbus6", "org.kde.plasmashell", "/PlasmaShell", "org.kde.PlasmaShell.evaluateScript", script
]
try:
    res = subprocess.check_output(cmd, stderr=subprocess.STDOUT, env={"WAYLAND_DISPLAY": "wayland-0", "XDG_RUNTIME_DIR": "/run/user/1000", "LC_ALL": "C.UTF-8"})
    print("RESULT:\n" + res.decode().strip())
except subprocess.CalledProcessError as e:
    print("ERROR:\n" + e.output.decode().strip())
