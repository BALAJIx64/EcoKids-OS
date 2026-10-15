#!/usr/bin/env python3
import xml.etree.ElementTree as ET

for name in ["dialog_background.svg", "panel_background.svg", "translucentbackground.svg"]:
    path = f"/tmp/breeze_svg/{name}"
    tree = ET.parse(path)
    root = tree.getroot()
    print(f"=== {name} ===")
    rects = []
    for elem in root.iter():
        elem_id = elem.attrib.get("id", "")
        style = elem.attrib.get("style", "")
        cls = elem.attrib.get("class", "")
        if "opacity" in style or elem.tag.endswith("rect") or elem.tag.endswith("path"):
            rects.append((elem_id, elem.tag.split("}")[-1], style, cls))
    print(f"Total rects/paths: {len(rects)}")
    for r in rects[:15]:
        print(f"  {r[0]:25s} [{r[1]}] class={r[3]} style={r[2]}")
