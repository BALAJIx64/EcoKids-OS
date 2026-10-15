#!/usr/bin/env python3
import subprocess
import os
import shutil

applet_config = os.path.expanduser("~/.config/plasma-org.kde.plasma.desktop-appletsrc")
kwin_config = os.path.expanduser("~/.config/kwinrc")
kdeglobals = os.path.expanduser("~/.config/kdeglobals")
backup_dir = os.path.expanduser("~/.config/ecokids_plasma_backup/refinement_stage")

os.makedirs(backup_dir, exist_ok=True)
if os.path.exists(applet_config):
    shutil.copy2(applet_config, os.path.join(backup_dir, "appletsrc.bak"))
if os.path.exists(kwin_config):
    shutil.copy2(kwin_config, os.path.join(backup_dir, "kwinrc.bak"))
if os.path.exists(kdeglobals):
    shutil.copy2(kdeglobals, os.path.join(backup_dir, "kdeglobals.bak"))
print("Backed up configs to", backup_dir)

# Helper to run kwriteconfig6
def kwrite(file_path, group_list, key, val):
    args = ["kwriteconfig6", "--file", file_path]
    for g in group_list:
        args.extend(["--group", str(g)])
    args.extend(["--key", str(key), str(val)])
    subprocess.run(args, check=True)

# 1. Update SVGs
subprocess.run(["python3", "/media/sf_EcoKids-OS/scripts/refine_glass_theme_v2.py"], check=True)

# 2. Stop plasmashell for clean configuration write
subprocess.run(["systemctl", "--user", "stop", "plasma-plasmashell.service"])

# 3. Configure Panel in appletsrc
kwrite(applet_config, ["Containments", "2"], "location", "3")
kwrite(applet_config, ["Containments", "2"], "floating", "1")
kwrite(applet_config, ["Containments", "2"], "thickness", "40")
kwrite(applet_config, ["Containments", "2"], "opacity", "2")

# Applet order: Kickoff(3), Spacer(26), Pager(4), Tasks(5), Spacer(27), Tray(7), Clock(22)
kwrite(applet_config, ["Containments", "2", "General"], "AppletOrder", "3;26;4;5;27;7;22")

# Configure Spacers
kwrite(applet_config, ["Containments", "2", "Applets", "26", "Configuration", "General"], "expanding", "true")
kwrite(applet_config, ["Containments", "2", "Applets", "27", "Configuration", "General"], "expanding", "true")

# Configure Pager (clean indicators without text clutter)
kwrite(applet_config, ["Containments", "2", "Applets", "4", "Configuration", "General"], "displayedText", "2")

# Configure Kickoff (target 720 x 540)
avatar_icon = os.path.expanduser("~/.face")
kwrite(applet_config, ["Containments", "2", "Applets", "3"], "popupWidth", "720")
kwrite(applet_config, ["Containments", "2", "Applets", "3"], "popupHeight", "540")
kwrite(applet_config, ["Containments", "2", "Applets", "3", "Configuration"], "popupWidth", "720")
kwrite(applet_config, ["Containments", "2", "Applets", "3", "Configuration"], "popupHeight", "540")
kwrite(applet_config, ["Containments", "2", "Applets", "3", "Configuration", "General"], "paneView", "0")
kwrite(applet_config, ["Containments", "2", "Applets", "3", "Configuration", "General"], "favoritesDisplay", "0")
kwrite(applet_config, ["Containments", "2", "Applets", "3", "Configuration", "General"], "showAppsByName", "true")
kwrite(applet_config, ["Containments", "2", "Applets", "3", "Configuration", "General"], "icon", avatar_icon)

# Configure Digital Clock (clean 12h bold without date)
kwrite(applet_config, ["Containments", "2", "Applets", "22", "Configuration", "Appearance"], "showDate", "false")
kwrite(applet_config, ["Containments", "2", "Applets", "22", "Configuration", "Appearance"], "showSeconds", "false")
kwrite(applet_config, ["Containments", "2", "Applets", "22", "Configuration", "Appearance"], "fontWeight", "700")

# Configure System Tray icon scaling
kwrite(applet_config, ["Containments", "2", "Applets", "7", "Configuration", "General"], "scaleIconsToFit", "true")

# 4. Configure Icon Theme in kdeglobals
kwrite(kdeglobals, ["Icons"], "Theme", "breeze-dark")

# 5. Configure KWin Frosted Glass Blur
kwrite(kwin_config, ["Plugins"], "blurEnabled", "true")
kwrite(kwin_config, ["Plugins"], "translucencyEnabled", "true")
kwrite(kwin_config, ["Effect-blur"], "BlurStrength", "14")
kwrite(kwin_config, ["Effect-blur"], "NoiseStrength", "3")
kwrite(kwin_config, ["Desktops"], "Number", "3")

# 6. Restart plasmashell and reconfigure KWin
subprocess.run(["systemctl", "--user", "start", "plasma-plasmashell.service"])
subprocess.run(["qdbus6", "org.kde.KWin", "/KWin", "org.kde.KWin.reconfigure"], stderr=subprocess.DEVNULL)

# 7. Ensure 3 virtual desktops exist via DBus
try:
    subprocess.run(["qdbus6", "org.kde.KWin", "/VirtualDesktopManager", "org.kde.KWin.VirtualDesktopManager.createDesktop", "1", "Eco 2"], stderr=subprocess.DEVNULL)
    subprocess.run(["qdbus6", "org.kde.KWin", "/VirtualDesktopManager", "org.kde.KWin.VirtualDesktopManager.createDesktop", "2", "Eco 3"], stderr=subprocess.DEVNULL)
except Exception:
    pass

print("Desktop refinement applied successfully!")
