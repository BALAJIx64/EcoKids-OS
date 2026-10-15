#!/bin/bash
# ==============================================================================
# EcoKids OS: Top Floating Panel Configurator
# Reconfigures the Plasma 6 panel to match the glassmorphism reference:
#  - Top location (location=3)
#  - Floating panel mode (floating=1)
#  - Slim thickness (36px)
#  - Clean digital clock (12h, no date line clutter)
# ==============================================================================

set -e

CONFIG_FILE="$HOME/.config/plasma-org.kde.plasma.desktop-appletsrc"

echo "=== [1/3] Setting Panel to Top Floating Bar ==="
kwriteconfig6 --file "$CONFIG_FILE" --group Containments --group 2 --key location 3
kwriteconfig6 --file "$CONFIG_FILE" --group Containments --group 2 --key floating 1
kwriteconfig6 --file "$CONFIG_FILE" --group Containments --group 2 --key thickness 36

echo "=== [2/3] Configuring Clean Clock ==="
kwriteconfig6 --file "$CONFIG_FILE" --group Containments --group 2 --group Applets --group 22 --group Configuration --group Appearance --key showDate false
kwriteconfig6 --file "$CONFIG_FILE" --group Containments --group 2 --group Applets --group 22 --group Configuration --group Appearance --key fontWeight 600

echo "=== [3/3] Restarting Plasma Shell ==="
systemctl --user restart plasma-plasmashell.service
sleep 2

echo ">>> Top floating panel configured and restarted successfully!"
