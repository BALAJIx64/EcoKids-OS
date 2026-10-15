#!/usr/bin/env python3
import xml.etree.ElementTree as ET
import re
import os

ET.register_namespace('', 'http://www.w3.org/2000/svg')
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')
ET.register_namespace('sodipodi', 'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd')
ET.register_namespace('inkscape', 'http://www.inkscape.org/namespaces/inkscape')

def transform_svg_opacity(src_path, dst_path, target_opacity=0.48, is_panel=False):
    with open(src_path, "r", encoding="utf-8") as f:
        content = f.read()

    # In Breeze SVGs, background fills have opacity:0.85 or opacity:0.9 or fill-opacity:1
    # Replace opacity:0.85, opacity:0.9 with target_opacity
    # Also adjust ColorScheme-Background in CSS
    def replace_style(m):
        style = m.group(1)
        # replace opacity
        style = re.sub(r'opacity\s*:\s*[0-9.]+', f'opacity:{target_opacity}', style)
        return f'style="{style}"'

    # Replace occurrences of style with ColorScheme-Background
    # Let's inspect raw text replacements
    new_content = re.sub(r'opacity:0\.8[0-9]*', f'opacity:{target_opacity}', content)
    new_content = re.sub(r'opacity:0\.9[0-9]*', f'opacity:{target_opacity}', new_content)
    new_content = re.sub(r'opacity:1(\.0)?(?=[;"])', f'opacity:{target_opacity}', new_content)

    # In thick-center or panel center:
    if is_panel:
        # For panel background, ensure thick-center is translucent
        new_content = new_content.replace('fill-opacity:1', f'fill-opacity:{target_opacity}')

    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
    with open(dst_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"Wrote transformed SVG to {dst_path}")

theme_dir = os.path.expanduser("~/.local/share/plasma/desktoptheme/ecokids-glass")
os.makedirs(theme_dir, exist_ok=True)

# 1. metadata.json
meta_content = """{
    "KPlugin": {
        "Authors": [
            {
                "Name": "EcoKids OS Team"
            }
        ],
        "Category": "",
        "Description": "EcoKids OS Frosted Glass Theme",
        "Id": "ecokids-glass",
        "License": "LGPL",
        "Name": "EcoKids Glass",
        "Version": "1.0",
        "Website": "https://ecokids.org"
    },
    "X-Plasma-API": "5.0"
}"""

with open(os.path.join(theme_dir, "metadata.json"), "w", encoding="utf-8") as f:
    f.write(meta_content)

# 2. dialogs/background.svg
transform_svg_opacity(
    "/tmp/breeze_svg/dialog_background.svg",
    os.path.join(theme_dir, "dialogs", "background.svg"),
    target_opacity=0.48,
    is_panel=False
)

# 3. widgets/panel-background.svg
transform_svg_opacity(
    "/tmp/breeze_svg/panel_background.svg",
    os.path.join(theme_dir, "widgets", "panel-background.svg"),
    target_opacity=0.38,
    is_panel=True
)

# 4. widgets/translucentbackground.svg
transform_svg_opacity(
    "/tmp/breeze_svg/translucentbackground.svg",
    os.path.join(theme_dir, "widgets", "translucentbackground.svg"),
    target_opacity=0.38,
    is_panel=True
)

print("ecokids-glass theme created successfully!")
