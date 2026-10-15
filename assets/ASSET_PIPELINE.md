# EcoKids OS: Asset Pipeline & Media Generation Specifications

This document outlines the asset pipeline for artists, designers, and AI generation tools (Gemini Pro, Google Flow, Blender, GPT Go) for upcoming phases of EcoKids OS.

---

## 1. Phase 3: Living World Desktop Assets (Current)

* **Component Destination:** Native KDE Plasma 6 Desktop Plasmoid (`org.ecokids.livingworld`)
* **Storage Location:** `themes/plasma/plasmoids/org.ecokids.livingworld/contents/assets/` and `branding/living_world/`
* **Current Asset:** `planet.jpg` (1024×1024 px circular living planet with biosphere domes, turquoise oceans, and floating clouds).
* **Render Pipeline:** Rendered natively via QtQuick SceneGraph in user space, with GPU/CPU usage below 3%.

### Optional Enhanced Asset Generations (If upgrading to multi-biome loops):
If you wish to generate additional evolving biomes using Google Flow or Gemini Pro:
1. **Biome Stage 1 (Sprout Planet / Newborn Eco-World):**
   * **Subject:** Miniature lush planet with gentle green hills, a single clean solar dome, tiny baby sapling sprout at the top.
   * **Dimensions:** 1024×1024 px (1:1 aspect ratio).
   * **Format:** PNG with transparent background or high-contrast dark space background.
2. **Biome Stage 2 (Clean Archipelago / Current):**
   * **Subject:** Multiple floating biome islands, clean energy wind turbines, vibrant turquoise ocean, miniature waterfalls into space.
   * **Dimensions:** 1024×1024 px (1:1).
3. **Biome Stage 3 (Futuristic Eco-Metropolis):**
   * **Subject:** Thriving utopian green planet, harmonious treehouse biospheres, orbital solar sails, clean hyperloops, pure atmosphere.
   * **Dimensions:** 1024×1024 px (1:1).

---

## 2. Phase 4: SDDM Login Screen Specifications (Next Up)

* **Component Destination:** Custom SDDM Login Theme (`themes/sddm/ecokids/`)
* **Recommended Format:** WebM / MP4 looping background OR static high-res graphic with CSS/QML kinetic overlay.
* **Aspect Ratio:** 16:9 (1920×1080 px or 2560×1440 px).
* **Looping Requirements:** Seamless loop (duration: 6 to 10 seconds), with subtle slow drift of clouds and twinkling clean stars. No abrupt cuts.
* **Audio:** Silent.
* **Key Visual Elements:** Welcoming eco-gateway, soft morning sunlight illuminating the living planet, clean login card area in the center or left-third of the screen.

---

## 3. Phase 4: Plymouth Boot Splash Animation Specifications (Next Up)

* **Component Destination:** `/usr/share/plymouth/themes/ecokids/` (Module: `two-step` or `script`)
* **Format:** Sequence of transparent PNG frames (`frame-001.png` to `frame-048.png` or `frame-060.png`).
* **Frame Rate:** 24 fps to 30 fps (total animation duration ~2.0 to 2.5 seconds loopable).
* **Dimensions:** 256×256 px or 320×320 px (centered on dark `#10221c` background).
* **Subject:** A glowing golden seed that sprouts a vibrant emerald leaf, blossoms with clean energy light rings, and resolves into the circular EcoKids OS logo.
* **Transparency:** Must have 100% clean alpha channel (transparent background) so it blends seamlessly over any display resolution during boot.
