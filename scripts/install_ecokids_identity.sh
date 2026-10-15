#!/bin/bash
# ==============================================================================
# EcoKids OS: Desktop Identity Installer (Phase 2)
# Applies:
#  - EcoKids Dark Color Scheme (~/.local/share/color-schemes)
#  - EcoKids Living World Wallpaper (~/.local/share/wallpapers)
#  - EcoKids LookAndFeel Package (~/.local/share/plasma/look-and-feel)
#  - EcoKids Launcher Logo Icon (~/.local/share/icons)
#  - Test Fonts (~/.local/share/fonts)
# ==============================================================================

set -e

REPO_DIR="/media/sf_EcoKids-OS"
USER_HOME="$HOME"

echo "=== [1/7] Installing Color Scheme ==="
mkdir -p "$USER_HOME/.local/share/color-schemes"
cp "$REPO_DIR/themes/plasma/EcoKidsDark.colors" "$USER_HOME/.local/share/color-schemes/"

echo "=== [2/7] Installing Wallpaper Package ==="
mkdir -p "$USER_HOME/.local/share/wallpapers/EcoKids/contents/images"
cp "$REPO_DIR/branding/wallpapers/EcoKids/metadata.json" "$USER_HOME/.local/share/wallpapers/EcoKids/"
cp "$REPO_DIR/branding/wallpapers/EcoKids/contents/screenshot.jpg" "$USER_HOME/.local/share/wallpapers/EcoKids/contents/"
cp "$REPO_DIR/branding/wallpapers/EcoKids/contents/images/1680x1050.jpg" "$USER_HOME/.local/share/wallpapers/EcoKids/contents/images/"

echo "=== [3/7] Installing LookAndFeel Package ==="
mkdir -p "$USER_HOME/.local/share/plasma/look-and-feel/org.ecokids.desktop/contents"
cp "$REPO_DIR/themes/plasma/look-and-feel/org.ecokids.desktop/metadata.json" "$USER_HOME/.local/share/plasma/look-and-feel/org.ecokids.desktop/"
cp "$REPO_DIR/themes/plasma/look-and-feel/org.ecokids.desktop/contents/defaults" "$USER_HOME/.local/share/plasma/look-and-feel/org.ecokids.desktop/contents/"

echo "=== [4/7] Installing Branding Icons ==="
mkdir -p "$USER_HOME/.local/share/icons/hicolor/256x256/apps"
mkdir -p "$USER_HOME/.local/share/icons/hicolor/scalable/apps"
cp "$REPO_DIR/branding/icons/ecokids-logo.jpg" "$USER_HOME/.local/share/icons/hicolor/256x256/apps/ecokids-logo.png"
cp "$REPO_DIR/branding/icons/ecokids-logo.jpg" "$USER_HOME/.local/share/icons/hicolor/scalable/apps/ecokids-logo.png"

echo "=== [5/7] Installing Typography Fonts (Local Testing) ==="
mkdir -p "$USER_HOME/.local/share/fonts/ecokids"
cp -r "$REPO_DIR/branding/fonts/test_proprietary/"*.TTF "$USER_HOME/.local/share/fonts/ecokids/" 2>/dev/null || true
fc-cache -f "$USER_HOME/.local/share/fonts"

echo "=== [6/7] Applying Color Scheme and Accent ==="
export WAYLAND_DISPLAY="wayland-0"
export XDG_RUNTIME_DIR="/run/user/$(id -u)"
plasma-apply-colorscheme EcoKidsDark
plasma-apply-colorscheme -a "#20bf6b" EcoKidsDark 2>/dev/null || true

echo "=== [7/7] Applying Desktop Wallpaper ==="
plasma-apply-wallpaperimage "$USER_HOME/.local/share/wallpapers/EcoKids/contents/images/1680x1050.jpg"

echo "=== [Optional] Customizing Application Launcher Icon ==="
kwriteconfig6 --file plasma-org.kde.plasma.desktop-appletsrc \
    --group Containments --group 2 --group Applets --group 3 --group Configuration --group General \
    --key icon "$USER_HOME/.local/share/icons/hicolor/scalable/apps/ecokids-logo.png"

# Reload plasmashell gracefully to reflect icon and panel styling
qdbus6 org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.refreshCurrentShell 2>/dev/null || true

echo ">>> EcoKids OS Desktop Identity successfully applied!"
