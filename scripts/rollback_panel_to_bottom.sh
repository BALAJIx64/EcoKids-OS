#!/bin/bash
# ==============================================================================
# EcoKids OS: Rollback Panel & Theme to Standard Defaults
# ==============================================================================

set -e

CONFIG_FILE="$HOME/.config/plasma-org.kde.plasma.desktop-appletsrc"
BACKUP_DIR="$HOME/.config/ecokids_plasma_backup"

echo "=== Rolling back Plasma desktop to standard defaults ==="

# 1. Restore backed up appletsrc if available
if [ -f "$BACKUP_DIR/appletsrc.bak" ]; then
    cp "$BACKUP_DIR/appletsrc.bak" "$CONFIG_FILE"
    echo "Restored appletsrc from backup."
else
    kwriteconfig6 --file "$CONFIG_FILE" --group Containments --group 2 --key location 4
    kwriteconfig6 --file "$CONFIG_FILE" --group Containments --group 2 --key floating 0
    kwriteconfig6 --file "$CONFIG_FILE" --group Containments --group 2 --key thickness 44
    kwriteconfig6 --file "$CONFIG_FILE" --group Containments --group 2 --group Applets --group 22 --group Configuration --group Appearance --key showDate true
fi

# 2. Restore default desktop theme
QT_QPA_PLATFORM=wayland WAYLAND_DISPLAY=wayland-0 XDG_RUNTIME_DIR=/run/user/1000 plasma-apply-desktoptheme default 2>/dev/null || true

# 3. Restart plasmashell
systemctl --user restart plasma-plasmashell.service
sleep 2

echo ">>> Panel and theme restored to defaults!"
