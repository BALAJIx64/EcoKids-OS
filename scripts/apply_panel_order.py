#!/usr/bin/env python3
import configparser
import subprocess
import os
import shutil

config_file = os.path.expanduser("~/.config/plasma-org.kde.plasma.desktop-appletsrc")

# 1. Stop plasmashell temporarily to safely edit appletsrc
subprocess.run(["systemctl", "--user", "stop", "plasma-plasmashell.service"])

# 2. Backup current config
backup_file = os.path.expanduser("~/.config/ecokids_plasma_backup/appletsrc.bak")
os.makedirs(os.path.dirname(backup_file), exist_ok=True)
shutil.copy2(config_file, backup_file)
print(f"Backed up {config_file} to {backup_file}")

# 3. Read and modify configuration
# We use kwriteconfig6 for atomic KDE config changes
def kwrite(group_list, key, val):
    args = ["kwriteconfig6", "--file", config_file]
    for g in group_list:
        args.extend(["--group", str(g)])
    args.extend(["--key", str(key), str(val)])
    subprocess.run(args, check=True)

# Set panel floating, top, 36px, translucent
kwrite(["Containments", "2"], "location", "3")
kwrite(["Containments", "2"], "floating", "1")
kwrite(["Containments", "2"], "thickness", "36")
kwrite(["Containments", "2"], "opacity", "2")

# Set AppletOrder: Kickoff (3), Spacer (26), Pager (4), Tasks (5), Spacer (27), SystemTray (7), Clock (22)
kwrite(["Containments", "2", "General"], "AppletOrder", "3;26;4;5;27;7;22")

# Set spacers expanding
kwrite(["Containments", "2", "Applets", "26", "Configuration", "General"], "expanding", "true")
kwrite(["Containments", "2", "Applets", "27", "Configuration", "General"], "expanding", "true")

# Set Pager to clean dots/rectangles without text
kwrite(["Containments", "2", "Applets", "4", "Configuration", "General"], "displayedText", "2")

# Set Kickoff popup geometry to large blurred glass card (780x600)
kwrite(["Containments", "2", "Applets", "3"], "popupWidth", "780")
kwrite(["Containments", "2", "Applets", "3"], "popupHeight", "600")
kwrite(["Containments", "2", "Applets", "3", "Configuration"], "popupWidth", "780")
kwrite(["Containments", "2", "Applets", "3", "Configuration"], "popupHeight", "600")

# Kickoff grid view & favorites
kwrite(["Containments", "2", "Applets", "3", "Configuration", "General"], "paneView", "0")
kwrite(["Containments", "2", "Applets", "3", "Configuration", "General"], "favoritesDisplay", "0")
kwrite(["Containments", "2", "Applets", "3", "Configuration", "General"], "showAppsByName", "true")
kwrite(["Containments", "2", "Applets", "3", "Configuration", "General"], "icon", os.path.expanduser("~/.local/share/icons/hicolor/scalable/apps/ecokids-logo.png"))

# Polished Clock
kwrite(["Containments", "2", "Applets", "22", "Configuration", "Appearance"], "showDate", "false")
kwrite(["Containments", "2", "Applets", "22", "Configuration", "Appearance"], "showSeconds", "false")
kwrite(["Containments", "2", "Applets", "22", "Configuration", "Appearance"], "fontWeight", "700")

# Restart plasmashell
subprocess.run(["systemctl", "--user", "start", "plasma-plasmashell.service"])
print("Configuration updated and plasmashell restarted!")
