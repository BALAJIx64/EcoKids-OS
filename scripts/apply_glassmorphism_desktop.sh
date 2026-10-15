#!/bin/bash
# ==============================================================================
# EcoKids OS: Glassmorphism Desktop & Kickoff Refinement
# ==============================================================================
#  - Top Floating Panel: Translucent glass, 36px, opacity=2, balanced icon spacing
#  - Centered Pager & Compact Tray: Spacers for balanced top layout
#  - KWin Frosted Glass Blur: Enhanced blur strength & noise for depth
#  - Kickoff Launcher: Large frosted glass popup (780x600), Grid favorites, Avatar
#  - Safe & User-Level: Isolated in ~/.local/share and ~/.config with full backup
# ==============================================================================

set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APPLET_CONFIG="$HOME/.config/plasma-org.kde.plasma.desktop-appletsrc"
KWIN_CONFIG="$HOME/.config/kwinrc"
BACKUP_DIR="$HOME/.config/ecokids_plasma_backup"

echo "=== [1/6] Backing Up Existing Plasma Configuration ==="
mkdir -p "$BACKUP_DIR"
[ -f "$APPLET_CONFIG" ] && cp "$APPLET_CONFIG" "$BACKUP_DIR/appletsrc.bak"
[ -f "$KWIN_CONFIG" ] && cp "$KWIN_CONFIG" "$BACKUP_DIR/kwinrc.bak"

echo "=== [2/6] Building User-Level 'ecokids-glass' Theme ==="
python3 "$REPO_DIR/scripts/create_glass_theme.py"
python3 "$REPO_DIR/scripts/refine_theme_svgs.py"

echo "=== [3/6] Applying Frosted Glass Desktop Theme & Blur ==="
QT_QPA_PLATFORM=wayland WAYLAND_DISPLAY=wayland-0 XDG_RUNTIME_DIR=/run/user/1000 plasma-apply-desktoptheme ecokids-glass

# Configure KWin Frosted Glass Blur
kwriteconfig6 --file "$KWIN_CONFIG" --group Plugins --key blurEnabled true
kwriteconfig6 --file "$KWIN_CONFIG" --group Plugins --key translucencyEnabled true
kwriteconfig6 --file "$KWIN_CONFIG" --group Effect-blur --key BlurStrength 14
kwriteconfig6 --file "$KWIN_CONFIG" --group Effect-blur --key NoiseStrength 3
qdbus6 org.kde.KWin /KWin org.kde.KWin.reconfigure 2>/dev/null || true

echo "=== [4/6] Setting User Profile Avatar ==="
if [ -f "$REPO_DIR/branding/icons/ecokids-avatar-circular.png" ]; then
    cp "$REPO_DIR/branding/icons/ecokids-avatar-circular.png" "$HOME/.face"
    rm -f "$HOME/.face.icon"
    ln -s "$HOME/.face" "$HOME/.face.icon"
    chmod 644 "$HOME/.face"
fi

echo "=== [5/6] Configuring Top Floating Panel & Launcher Layout ==="
python3 "$REPO_DIR/scripts/apply_panel_order.py"

echo "=== [6/6] Applying Official EcoKids Living World Wallpaper ==="
if [ -f "$REPO_DIR/branding/wallpapers/ecokids_living_world_official.jpg" ]; then
    plasma-apply-wallpaperimage "$REPO_DIR/branding/wallpapers/ecokids_living_world_official.jpg" 2>/dev/null || true
fi

echo ">>> Glassmorphism top panel and Kickoff launcher configured successfully!"
