#!/usr/bin/env python3
import xml.etree.ElementTree as ET
import re
import os

ET.register_namespace('', 'http://www.w3.org/2000/svg')
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')
ET.register_namespace('sodipodi', 'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd')
ET.register_namespace('inkscape', 'http://www.inkscape.org/namespaces/inkscape')

theme_dir = os.path.expanduser("~/.local/share/plasma/desktoptheme/ecokids-glass")
os.makedirs(theme_dir, exist_ok=True)

# 1. Dialog background
with open("/tmp/breeze_svg/dialog_background.svg", "r", encoding="utf-8") as f:
    dlg = f.read()

# Replace background opacity with 0.38 (balanced frosted glass with readable text)
dlg = re.sub(r'opacity:0\.8[0-9]*', 'opacity:0.38', dlg)
dlg = re.sub(r'opacity:0\.9[0-9]*', 'opacity:0.38', dlg)
dlg = re.sub(r'opacity:1(\.0)?(?=[;"])', 'opacity:0.38', dlg)

with open(os.path.join(theme_dir, "dialogs", "background.svg"), "w", encoding="utf-8") as f:
    f.write(dlg)

# 2. Panel background
with open("/tmp/breeze_svg/panel_background.svg", "r", encoding="utf-8") as f:
    pnl = f.read()

pnl = re.sub(r'opacity:0\.8[0-9]*', 'opacity:0.30', pnl)
pnl = re.sub(r'opacity:0\.9[0-9]*', 'opacity:0.30', pnl)
pnl = pnl.replace('fill-opacity:1', 'fill-opacity:0.30')

with open(os.path.join(theme_dir, "widgets", "panel-background.svg"), "w", encoding="utf-8") as f:
    f.write(pnl)

# 3. Translucent panel background
with open("/tmp/breeze_svg/translucentbackground.svg", "r", encoding="utf-8") as f:
    trans = f.read()

trans = re.sub(r'opacity:0\.8[0-9]*', 'opacity:0.28', trans)
trans = re.sub(r'opacity:0\.9[0-9]*', 'opacity:0.28', trans)
trans = trans.replace('fill-opacity:1', 'fill-opacity:0.28')

with open(os.path.join(theme_dir, "widgets", "translucentbackground.svg"), "w", encoding="utf-8") as f:
    f.write(trans)

print("Glass theme SVGs refined successfully for v2!")
