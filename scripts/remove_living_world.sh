#!/bin/bash
# ==============================================================================
# EcoKids OS: Living World Plasmoid Remover / Rollback (Phase 3)
# Safely removes org.ecokids.livingworld widget from desktop and local registry
# ==============================================================================

set -e

export WAYLAND_DISPLAY="wayland-0"
export XDG_RUNTIME_DIR="/run/user/$(id -u)"

echo "=== [1/2] Removing Widget from Desktop Containment ==="
JS_FILE=$(mktemp /tmp/plasma_remove_XXXXXX.js)

cat << 'EOF' > "$JS_FILE"
var ds = desktops();
for (var i = 0; i < ds.length; i++) {
    var d = ds[i];
    var ws = d.widgets();
    for (var j = 0; j < ws.length; j++) {
        if (ws[j].type === "org.ecokids.livingworld") {
            ws[j].remove();
            print("REMOVED_WIDGET_SUCCESS");
        }
    }
}
EOF

SCRIPT_CONTENT=$(cat "$JS_FILE")
qdbus6 org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.evaluateScript "$SCRIPT_CONTENT"
rm -f "$JS_FILE"

echo "=== [2/2] Unregistering Plasmoid Package ==="
kpackagetool6 --type Plasma/Applet --remove org.ecokids.livingworld 2>/dev/null || true
rm -rf "$HOME/.local/share/plasma/plasmoids/org.ecokids.livingworld"

echo ">>> EcoKids Living World Widget successfully removed from desktop!"
