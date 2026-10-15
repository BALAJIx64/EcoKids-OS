# EcoKids OS: Typography & Font Licensing Strategy

## 1. Overview
The EcoKids OS master design brief specifies two expressive headline fonts:
* **Calisto MT** (Monotype Imaging Inc.)
* **Californian FB** (The Font Bureau / David Berlow)

## 2. Licensing Compliance & Legal Analysis
* **Local Development & Academic Testing:**
  The true `.TTF` font files for both typefaces were extracted from the local Windows 11 host environment (`C:\Windows\Fonts`) and placed in `branding/fonts/test_proprietary/` for private internal testing inside the `EcoOS` VirtualBox virtual machine.
* **Distributable ISO Restriction:**
  Neither *Calisto MT* nor *Californian FB* may be legally redistributed inside a public or open-source Linux ISO without a commercial OEM distribution license from Monotype and The Font Bureau.

## 3. Open-Source Font Fallback Map (OFL Compatible)
To maintain 100% legal compliance for the final bootable ISO, EcoKids OS implements a prioritized font stack using Open Font License (OFL) alternatives:

| Role | Brief Target Font | Open-Source Fallback (OFL) | Characteristics |
|---|---|---|---|
| **Branding Headings** | Calisto MT | **Cormorant Garamond** / **Alegreya** | Elegant, humanist serif with calligraphic charm and high legibility. |
| **Titles & Subtitles** | Californian FB | **Fredoka** / **Outfit** | Friendly, rounded geometric sans-serif specifically designed for child-centric and educational UI. |
| **System UI Controls** | System Default | **Ubuntu Sans** / **Noto Sans** | Clean, highly legible, pre-installed across Kubuntu 26.04. |
| **Monospace / Code** | System Default | **Ubuntu Sans Mono** | High-contrast monospace for learning terminals and Python editors. |

## 4. Packaging Strategy
1. The LookAndFeel package and educational modules specify the open fonts first in the CSS/QML font family lists.
2. If the user installs the proprietary fonts locally, the system will render them seamlessly.
3. The buildable ISO will package the SIL OFL fonts, ensuring clean distribution rights.
