#!/bin/bash
# ==============================================================================
# EcoKids OS: Desktop Application Installer
# Installs EcoKids as a first-class Linux Desktop Application:
#  - Standalone offline runtime (no Vite dev server needed)
#  - Native window with dark eco theme & icon
#  - Integrated into Application Menu (Education / Games)
#  - High-resolution application icon
#  - Manual launch only (NOT launched at boot or login)
# ==============================================================================

set -e

REPO_DIR="/media/sf_EcoKids-OS"
SOURCE_DIR="$REPO_DIR/app/dist-electron/linux-unpacked"
INSTALL_DIR="$HOME/.local/share/ecokids"
BIN_DIR="$HOME/.local/bin"
APPLICATIONS_DIR="$HOME/.local/share/applications"
ICON_DIR_256="$HOME/.local/share/icons/hicolor/256x256/apps"
ICON_DIR_SCALABLE="$HOME/.local/share/icons/hicolor/scalable/apps"

echo "=========================================================="
echo "      EcoKids OS: Desktop Application Installation        "
echo "=========================================================="

# 1. Check source files
if [ ! -d "$SOURCE_DIR" ]; then
    echo "ERROR: Packaged Linux app not found at: $SOURCE_DIR"
    echo "Please build the app first."
    exit 1
fi

echo "--> [1/6] Preparing directories..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$BIN_DIR"
mkdir -p "$APPLICATIONS_DIR"
mkdir -p "$ICON_DIR_256"
mkdir -p "$ICON_DIR_SCALABLE"

echo "--> [2/6] Installing application files into $INSTALL_DIR..."
# Copy application binaries and assets
rsync -av --delete "$SOURCE_DIR/" "$INSTALL_DIR/"

# Ensure correct executable permissions
chmod +x "$INSTALL_DIR/ecokids"

echo "--> [3/6] Setting up CLI launcher in $BIN_DIR/ecokids..."
rm -f "$BIN_DIR/ecokids"
cat << 'EOF' > "$BIN_DIR/ecokids"
#!/bin/bash
if [ -n "$WAYLAND_DISPLAY" ]; then
    PLATFORM_FLAG="--ozone-platform=wayland"
else
    PLATFORM_FLAG="--ozone-platform-hint=auto"
fi
exec "$HOME/.local/share/ecokids/ecokids" $PLATFORM_FLAG --enable-features=WaylandWindowDecorations "$@"
EOF
chmod +x "$BIN_DIR/ecokids"

echo "--> [4/6] Installing high-resolution application icons..."
if [ -f "$REPO_DIR/eco-os-logo.png" ]; then
    cp "$REPO_DIR/eco-os-logo.png" "$ICON_DIR_256/ecokids.png"
    cp "$REPO_DIR/eco-os-logo.png" "$ICON_DIR_SCALABLE/ecokids.png"
elif [ -f "$INSTALL_DIR/resources/app/electron/icons/icon.png" ]; then
    cp "$INSTALL_DIR/resources/app/electron/icons/icon.png" "$ICON_DIR_256/ecokids.png"
    cp "$INSTALL_DIR/resources/app/electron/icons/icon.png" "$ICON_DIR_SCALABLE/ecokids.png"
fi

echo "--> [5/6] Registering desktop menu entry..."
cat << EOF > "$APPLICATIONS_DIR/ecokids.desktop"
[Desktop Entry]
Version=1.0
Type=Application
Name=EcoKids
GenericName=Environmental Education Platform
Comment=Explore environmental adventures, recycle rush, wildlife missions, and eco games
Exec=$BIN_DIR/ecokids %U
Icon=ecokids
Terminal=false
StartupNotify=true
StartupWMClass=ecokids
Categories=Education;Science;KidsGame;Game;
Keywords=ecokids;environment;recycle;nature;education;kids;game;
EOF

chmod +x "$APPLICATIONS_DIR/ecokids.desktop"

# Update desktop and icon caches
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$APPLICATIONS_DIR" 2>/dev/null || true
fi
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
    gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true
fi

echo "--> [6/6] Verifying no autostart entries exist (manual launch only)..."
rm -f "$HOME/.config/autostart/ecokids.desktop" 2>/dev/null || true

echo "=========================================================="
echo " SUCCESS! EcoKids Desktop Application is now installed!"
echo " Location:       $INSTALL_DIR"
echo " Executable:     $BIN_DIR/ecokids"
echo " Desktop Entry:  $APPLICATIONS_DIR/ecokids.desktop"
echo " Applications:   EcoKids is now available in your Application Menu"
echo " Autostart:      DISABLED (Manual launch only)"
echo "=========================================================="
