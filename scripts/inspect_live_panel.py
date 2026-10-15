#!/usr/bin/env python3
import subprocess

script = """
var panels = panels();
print("Total panels: " + panels.length);
for (var i = 0; i < panels.length; ++i) {
    var p = panels[i];
    print("Panel " + i + ": id=" + p.id + " location=" + p.location + " floating=" + p.floating + " height=" + p.height + " lengthMode=" + p.lengthMode + " opacity=" + p.opacity);
    print("Widgets count: " + p.widgets().length);
    for (var j = 0; j < p.widgets().length; ++j) {
        var w = p.widgets()[j];
        print("  Widget " + j + ": " + w.type + " (id=" + w.id + ")");
    }
}
"""

cmd = [
    "qdbus6", "org.kde.plasmashell", "/PlasmaShell", "org.kde.PlasmaShell.evaluateScript", script
]
try:
    res = subprocess.check_output(cmd, stderr=subprocess.STDOUT, env={"WAYLAND_DISPLAY": "wayland-0", "XDG_RUNTIME_DIR": "/run/user/1000"})
    print("RESULT:\n" + res.decode())
except subprocess.CalledProcessError as e:
    print("ERROR:\n" + e.output.decode())
