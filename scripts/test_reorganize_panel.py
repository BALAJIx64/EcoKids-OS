#!/usr/bin/env python3
import subprocess

script = """
var p = panels()[0];

// Remove showdesktop (id=23) if present
var showdesktop = p.widgetById(23);
if (showdesktop) {
    showdesktop.remove();
    print("Removed showdesktop");
}

// Remove old marginsseparator (id=6)
var sep = p.widgetById(6);
if (sep) {
    sep.remove();
    print("Removed marginsseparator");
}

// Configure pager (id=4)
var pager = p.widgetById(4);
if (pager) {
    pager.currentConfigGroup = ["General"];
    pager.writeConfig("displayedText", 2); // 2 = None / dots
}

// Configure icontasks (id=5) - remove pinned launchers so it only shows active tasks or none
var icontasks = p.widgetById(5);
if (icontasks) {
    icontasks.currentConfigGroup = ["General"];
    icontasks.writeConfig("launchers", "");
    icontasks.currentConfigGroup = [];
    icontasks.writeConfig("launchers", "");
}

// Add two panelspacers if not already present
var widgets = p.widgets();
var spacerCount = 0;
for (var i = 0; i < widgets.length; ++i) {
    if (widgets[i].type === "org.kde.plasma.panelspacer") {
        spacerCount++;
    }
}

if (spacerCount < 2) {
    var sp1 = p.addWidget("org.kde.plasma.panelspacer");
    sp1.currentConfigGroup = ["General"];
    sp1.writeConfig("expanding", true);
    
    var sp2 = p.addWidget("org.kde.plasma.panelspacer");
    sp2.currentConfigGroup = ["General"];
    sp2.writeConfig("expanding", true);
    print("Added 2 spacers: id=" + sp1.id + ", " + sp2.id);
}

// Re-read widget IDs
print("Updated widgets: " + p.widgetIds.join(","));
"""

cmd = [
    "qdbus6", "org.kde.plasmashell", "/PlasmaShell", "org.kde.PlasmaShell.evaluateScript", script
]
try:
    res = subprocess.check_output(cmd, stderr=subprocess.STDOUT, env={"WAYLAND_DISPLAY": "wayland-0", "XDG_RUNTIME_DIR": "/run/user/1000", "LC_ALL": "C.UTF-8"})
    print("RESULT:\n" + res.decode().strip())
except subprocess.CalledProcessError as e:
    print("ERROR:\n" + e.output.decode().strip())
