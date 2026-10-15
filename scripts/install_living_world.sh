#!/bin/bash
# ==============================================================================
# EcoKids OS: Living World Plasmoid Installer (Phase 3)
# Installs and registers the native Plasma 6 desktop widget:
#  org.ecokids.livingworld
# ==============================================================================

set -e

REPO_DIR="/media/sf_EcoKids-OS"
PACKAGE_SRC="$REPO_DIR/themes/plasma/plasmoids/org.ecokids.livingworld"

echo "=== [1/3] Registering Package with kpackagetool6 ==="
kpackagetool6 --type Plasma/Applet --upgrade "$PACKAGE_SRC" 2>/dev/null || \
kpackagetool6 --type Plasma/Applet --install "$PACKAGE_SRC" 2>/dev/null || true

echo "=== [2/3] Verifying Installed Applet ==="
kpackagetool6 --type Plasma/Applet --list | grep -i ecokids

echo "=== [3/3] Adding Living World Widget to Desktop Containment ==="
export WAYLAND_DISPLAY="wayland-0"
export XDG_RUNTIME_DIR="/run/user/$(id -u)"

JS_FILE=$(mktemp /tmp/plasma_add_XXXXXX.js)

cat << 'EOF' > "$JS_FILE"
var d = desktops()[0];
var existing = d.widgets();
var found = false;
for (var i = 0; i < existing.length; i++) {
    if (existing[i].type === "org.ecokids.livingworld") {
        found = true;
        break;
    }
}
if (!found) {
    var w = d.addWidget("org.ecokids.livingworld");
    print("ADDED_WIDGET_SUCCESS: " + (w ? w.id : "none"));
} else {
    print("WIDGET_ALREADY_EXISTS");
}
EOF

SCRIPT_CONTENT=$(cat "$JS_FILE")
qdbus6 org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.evaluateScript "$SCRIPT_CONTENT"
rm -f "$JS_FILE"

echo ">>> EcoKids Living World Widget successfully installed and active on desktop!"
