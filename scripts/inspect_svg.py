#!/usr/bin/env python3
import xml.etree.ElementTree as ET
import re

tree = ET.parse("/tmp/breeze_svg/dialog_background.svg")
root = tree.getroot()

print("Root tag:", root.tag)
ids = []
for elem in root.iter():
    elem_id = elem.attrib.get("id")
    if elem_id:
        ids.append((elem_id, elem.tag, elem.attrib.get("style", "")))

print(f"Total elements with id: {len(ids)}")
for elem in root.iter():
    if elem.attrib.get("id") == "current-color-scheme":
        print("current-color-scheme text:\n", elem.text)
print("\n--- panel_background.svg ---")
tree_panel = ET.parse("/tmp/breeze_svg/panel_background.svg")
for elem in tree_panel.getroot().iter():
    if elem.attrib.get("id") == "center":
        for child in elem:
            print(f"panel center child: tag={child.tag} attrib={child.attrib}")



