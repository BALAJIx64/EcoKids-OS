#!/usr/bin/env python3
import xml.etree.ElementTree as ET
import re
import os

ET.register_namespace('', 'http://www.w3.org/2000/svg')

def refine_theme_svgs():
    theme_dir = os.path.expanduser("~/.local/share/plasma/desktoptheme/ecokids-glass")
    
    # 1. Refine dialogs/background.svg
    dlg_src = "/tmp/breeze_svg/dialog_background.svg"
    with open(dlg_src, "r", encoding="utf-8") as f:
        content = f.read()

    # Opacity for dialog background: 0.42 for rich frosted glass
    content = re.sub(r'opacity:0\.8[0-9]*', 'opacity:0.42', content)
    content = re.sub(r'opacity:0\.9[0-9]*', 'opacity:0.42', content)
    content = re.sub(r'opacity:1(\.0)?(?=[;"])', 'opacity:0.42', content)
    
    # Add subtle glass border highlight to ColorScheme-Background
    # In dialogs/background.svg, rect4148, rect4152, etc. form borders.
    # We can also add a subtle border style to the central dialog frame
    with open(os.path.join(theme_dir, "dialogs", "background.svg"), "w", encoding="utf-8") as f:
        f.write(content)
        
    # 2. Refine widgets/panel-background.svg
    pnl_src = "/tmp/breeze_svg/panel_background.svg"
    with open(pnl_src, "r", encoding="utf-8") as f:
        content_pnl = f.read()
    content_pnl = re.sub(r'opacity:0\.8[0-9]*', 'opacity:0.35', content_pnl)
    content_pnl = re.sub(r'opacity:0\.9[0-9]*', 'opacity:0.35', content_pnl)
    content_pnl = content_pnl.replace('fill-opacity:1', 'fill-opacity:0.35')
    with open(os.path.join(theme_dir, "widgets", "panel-background.svg"), "w", encoding="utf-8") as f:
        f.write(content_pnl)

    # 3. Refine widgets/translucentbackground.svg
    trans_src = "/tmp/breeze_svg/translucentbackground.svg"
    with open(trans_src, "r", encoding="utf-8") as f:
        content_trans = f.read()
    content_trans = re.sub(r'opacity:0\.8[0-9]*', 'opacity:0.32', content_trans)
    content_trans = re.sub(r'opacity:0\.9[0-9]*', 'opacity:0.32', content_trans)
    content_trans = content_trans.replace('fill-opacity:1', 'fill-opacity:0.32')
    with open(os.path.join(theme_dir, "widgets", "translucentbackground.svg"), "w", encoding="utf-8") as f:
        f.write(content_trans)

    print("Refined theme SVGs successfully!")

refine_theme_svgs()
