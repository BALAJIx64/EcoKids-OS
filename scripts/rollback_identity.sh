#!/bin/bash
# ==============================================================================
# EcoKids OS: Rollback to Default Kubuntu Identity
# Restores:
#  - BreezeDark color scheme
#  - Default Kubuntu LookAndFeel
#  - Default Kubuntu day-night wallpaper
#  - Default Kubuntu application launcher icon
# ==============================================================================

set -e

export WAYLAND_DISPLAY="wayland-0"
export XDG_RUNTIME_DIR="/run/user/$(id -u)"

echo "=== Rolling back Color Scheme to BreezeDark ==="
plasma-apply-colorscheme BreezeDark

echo "=== Rolling back Wallpaper to Kubuntu ==="
plasma-apply-wallpaperimage "/usr/share/wallpapers/Kubuntu/contents/images/1920x1080.svg" 2>/dev/null || \
plasma-apply-wallpaperimage "/usr/share/wallpapers/Kubuntu/contents/images/7861x2545.svg"

echo "=== Rolling back Launcher Icon to start-here-kubuntu ==="
kwriteconfig6 --file plasma-org.kde.plasma.desktop-appletsrc \
    --group Containments --group 2 --group Applets --group 3 --group Configuration --group General \
    --key icon "start-here-kubuntu"

# Refresh shell
qdbus6 org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.refreshCurrentShell 2>/dev/null || true

echo ">>> Default Kubuntu identity successfully restored!"
