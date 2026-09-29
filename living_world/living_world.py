"""
Living World Module for EcoKids OS.

Author: EcoKids OS Team
Description:
    Provides a real-time, interactive Tkinter visualization of the Living World.
    Reflects the player's environmental impact by rendering distinct visual stages
    (from Dead Planet to Eco City) driven directly by the Eco Engine and eco_data.json.
    Supports native PNG backgrounds with graceful procedural illustration fallbacks,
    manual refresh, and 3-second automatic polling.
"""

from __future__ import annotations

import math
import os
import sys
import tkinter as tk
from datetime import datetime
from pathlib import Path
from tkinter import ttk
from typing import Any, Dict, Optional, Tuple

# Optional Pillow support for high-quality image scaling
try:
    from PIL import Image, ImageTk
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

# Import the core EcoEngine from eco_score package or workspace
try:
    from eco_score import EcoEngine
except ImportError:
    try:
        from eco_score.eco_engine import EcoEngine
    except ImportError:
        try:
            from eco_engine import EcoEngine
        except ImportError:
            _repo_root = Path(__file__).resolve().parent.parent
            for _p in [str(_repo_root), str(_repo_root / "eco_score")]:
                if _p not in sys.path:
                    sys.path.insert(0, _p)
            try:
                from eco_score import EcoEngine
            except ImportError:
                from eco_engine import EcoEngine


class LivingWorldViewer:
    """
    Tkinter GUI component and standalone application for visualizing
    the EcoKids OS Living World progression.
    """

    # Supported World Stages mapped by stage index
    STAGE_NAMES: Dict[int, str] = {
        1: "Dead Planet",
        2: "Grassland",
        3: "Forest",
        4: "Wildlife Returns",
        5: "Eco City",
    }

    # Color palettes and narrative descriptors for each stage
    STAGE_THEMES: Dict[int, Dict[str, Any]] = {
        1: {
            "title": "Stage 1: Dead Planet",
            "sky_color": "#2B2625",
            "ground_color": "#4A3B32",
            "accent_color": "#D35400",
            "badge_color": "#E74C3C",
            "description": "The planet is barren, dry, and blanketed in smog. No plants or animals remain. Complete recycling and conservation quests to restore life!",
            "status_banner": "⚠️ Critical Condition: Planet needs urgent restoration!",
            "icon": "🌋",
        },
        2: {
            "title": "Stage 2: Grassland",
            "sky_color": "#87CEEB",
            "ground_color": "#58A63D",
            "accent_color": "#27AE60",
            "badge_color": "#2ECC71",
            "description": "Fresh grass and tender green sprouts carpet the plains! Clean morning light breaks through the haze as soil nutrients return.",
            "status_banner": "🌱 Healing Begun: First sprouts and green fields emerging!",
            "icon": "🌾",
        },
        3: {
            "title": "Stage 3: Forest",
            "sky_color": "#5DADE2",
            "ground_color": "#2E7D32",
            "accent_color": "#1B5E20",
            "badge_color": "#27AE60",
            "description": "A magnificent forest canopy rises! Crystal-clear rivers cut across the glade and rich woodland trees oxygenate the atmosphere.",
            "status_banner": "🌲 Canopy Restored: Forests are breathing clean oxygen!",
            "icon": "🌳",
        },
        4: {
            "title": "Stage 4: Wildlife Returns",
            "sky_color": "#7FB3D5",
            "ground_color": "#388E3C",
            "accent_color": "#196F3D",
            "badge_color": "#F39C12",
            "description": "Wild fauna has returned! Birds soar in clear blue skies, fish swim in sparkling waters, and woodland creatures find safe sanctuary.",
            "status_banner": "🐾 Ecosystem Thriving: Native wildlife and biodiversity back!",
            "icon": "🦌",
        },
        5: {
            "title": "Stage 5: Eco City",
            "sky_color": "#A9CCE3",
            "ground_color": "#43A047",
            "accent_color": "#0E6251",
            "badge_color": "#9B59B6",
            "description": "A thriving green metropolis powered by 100% solar and wind energy. Humans, nature, and technology dwell in complete harmony.",
            "status_banner": "🌟 Planetary Paradise: Complete sustainability achieved!",
            "icon": "🏙️",
        },
    }

    def __init__(
        self,
        root: Optional[tk.Tk | tk.Toplevel | tk.Frame] = None,
        engine: Optional[EcoEngine] = None,
        data_path: Optional[str | Path] = None,
        auto_start_timer: bool = True,
    ) -> None:
        """
        Initialize the Living World Viewer.

        :param root: Parent Tk window/frame. If None, creates a new root tk.Tk window.
        :param engine: Pre-instantiated EcoEngine. If None, creates an instance.
        :param data_path: Optional custom path to eco_data.json.
        :param auto_start_timer: Whether to automatically schedule 3-second polling.
        """
        self._is_standalone = False
        if root is None:
            self.root = tk.Tk()
            self._is_standalone = True
            self.root.title("EcoKids OS — Living World Viewer 🌍")
            self.root.geometry("820x720")
            self.root.minsize(760, 640)
            self.root.configure(bg="#F4F7F6")
            # Intercept window close to stop background timers cleanly
            self.root.protocol("WM_DELETE_WINDOW", self.on_close)
        else:
            self.root = root

        # Connect to EcoEngine
        if engine is not None:
            self.engine = engine
        else:
            self.engine = EcoEngine(data_path=data_path)

        # State tracking
        self.current_stage_num: int = 1
        self.current_world_stage: str = "Dead Planet"
        self.current_xp: int = 0
        self.current_level: int = 1
        self.last_refreshed: Optional[datetime] = None

        # Image caching to prevent garbage collection
        self._image_cache: Optional[Any] = None
        self._auto_refresh_id: Optional[str] = None
        self._is_destroyed: bool = False

        # Build UI layout
        self._setup_styles()
        self._create_widgets()

        # Connect to engine pub/sub events for reactive updates
        self.engine.register_listener("world_changed", self._on_engine_world_changed)
        self.engine.register_listener("xp_added", self._on_engine_xp_added)
        self.engine.register_listener("level_up", self._on_engine_level_up)

        # Initial load and render
        self.refresh_data()

        # Schedule automatic refresh every 3 seconds (3000 ms)
        if auto_start_timer:
            self.schedule_auto_refresh()

    # -------------------------------------------------------------------------
    # Styling and Theme Configuration
    # -------------------------------------------------------------------------

    def _setup_styles(self) -> None:
        """Configure ttk styles for a modern, kid-friendly look."""
        self.style = ttk.Style()
        try:
            self.style.theme_use("clam")
        except tk.TclError:
            pass

        # Card / Header Frame
        self.style.configure(
            "Card.TFrame",
            background="#FFFFFF",
            relief="ridge",
            borderwidth=1,
        )

        # Header Title
        self.style.configure(
            "Header.TLabel",
            background="#1B4D3E",
            foreground="#FFFFFF",
            font=("Helvetica", 16, "bold"),
            padding=(12, 10),
        )

        # Subtitle
        self.style.configure(
            "SubHeader.TLabel",
            background="#1B4D3E",
            foreground="#A3E4D7",
            font=("Helvetica", 10),
            padding=(12, 0, 12, 10),
        )

        # Metric Labels
        self.style.configure(
            "MetricTitle.TLabel",
            background="#FFFFFF",
            foreground="#7F8C8D",
            font=("Helvetica", 9, "bold"),
        )
        self.style.configure(
            "MetricValue.TLabel",
            background="#FFFFFF",
            foreground="#2C3E50",
            font=("Helvetica", 14, "bold"),
        )

        # Action Buttons
        self.style.configure(
            "Accent.TButton",
            font=("Helvetica", 10, "bold"),
            background="#27AE60",
            foreground="#FFFFFF",
            padding=(12, 6),
        )
        self.style.map(
            "Accent.TButton",
            background=[("active", "#2ECC71"), ("pressed", "#1E8449")],
        )

    # -------------------------------------------------------------------------
    # UI Layout Construction
    # -------------------------------------------------------------------------

    def _create_widgets(self) -> None:
        """Create the entire visual hierarchy."""
        main_container = tk.Frame(self.root, bg="#F0F4F3")
        main_container.pack(fill=tk.BOTH, expand=True)

        # 1. Top Header Banner
        header_frame = tk.Frame(main_container, bg="#1B4D3E")
        header_frame.pack(fill=tk.X, side=tk.TOP)

        self.title_label = ttk.Label(
            header_frame,
            text="🌍 ECOKIDS OS — LIVING WORLD VIEWER",
            style="Header.TLabel",
        )
        self.title_label.pack(anchor="w")

        self.subtitle_label = ttk.Label(
            header_frame,
            text="Watch your ecosystem flourish in real time as you complete environmental missions!",
            style="SubHeader.TLabel",
        )
        self.subtitle_label.pack(anchor="w")

        # 2. Key Metrics Bar (Stage, Level, XP)
        metrics_bar = tk.Frame(main_container, bg="#F0F4F3", pady=10, padx=15)
        metrics_bar.pack(fill=tk.X)
        metrics_bar.columnconfigure(0, weight=1)
        metrics_bar.columnconfigure(1, weight=1)
        metrics_bar.columnconfigure(2, weight=1)

        # Metric 1: World Stage
        stage_card = ttk.Frame(metrics_bar, style="Card.TFrame", padding=10)
        stage_card.grid(row=0, column=0, sticky="nsew", padx=6)
        ttk.Label(stage_card, text="CURRENT WORLD STAGE", style="MetricTitle.TLabel").pack(anchor="w")
        self.stage_value_label = ttk.Label(stage_card, text="Dead Planet", style="MetricValue.TLabel")
        self.stage_value_label.pack(anchor="w", pady=(4, 0))

        # Metric 2: XP
        xp_card = ttk.Frame(metrics_bar, style="Card.TFrame", padding=10)
        xp_card.grid(row=0, column=1, sticky="nsew", padx=6)
        ttk.Label(xp_card, text="TOTAL EXPERIENCE (XP)", style="MetricTitle.TLabel").pack(anchor="w")
        self.xp_value_label = ttk.Label(xp_card, text="0 XP", style="MetricValue.TLabel")
        self.xp_value_label.pack(anchor="w", pady=(4, 0))

        # Metric 3: Level
        level_card = ttk.Frame(metrics_bar, style="Card.TFrame", padding=10)
        level_card.grid(row=0, column=2, sticky="nsew", padx=6)
        ttk.Label(level_card, text="PLAYER LEVEL", style="MetricTitle.TLabel").pack(anchor="w")
        self.level_value_label = ttk.Label(level_card, text="Level 1", style="MetricValue.TLabel")
        self.level_value_label.pack(anchor="w", pady=(4, 0))

        # 3. Canvas Container for World Visuals (Image or Vector Illustration)
        viewport_frame = tk.Frame(main_container, bg="#E2EAE7", padx=15, pady=4)
        viewport_frame.pack(fill=tk.BOTH, expand=True)

        self.canvas_width = 780
        self.canvas_height = 360
        self.canvas = tk.Canvas(
            viewport_frame,
            bg="#2B2625",
            width=self.canvas_width,
            height=self.canvas_height,
            highlightthickness=2,
            highlightbackground="#BDC3C7",
            relief="ridge",
        )
        self.canvas.pack(fill=tk.BOTH, expand=True)
        self.canvas.bind("<Configure>", self._on_canvas_resize)

        # 4. Narrative / Status Banner Below Canvas
        banner_frame = tk.Frame(main_container, bg="#FFFFFF", relief="ridge", bd=1, padx=15, pady=8)
        banner_frame.pack(fill=tk.X, padx=15, pady=(8, 4))

        self.status_banner_label = tk.Label(
            banner_frame,
            text="⚠️ Critical Condition: Planet needs urgent restoration!",
            bg="#FFFFFF",
            fg="#C0392B",
            font=("Helvetica", 11, "bold"),
            anchor="w",
        )
        self.status_banner_label.pack(fill=tk.X)

        self.description_label = tk.Label(
            banner_frame,
            text="",
            bg="#FFFFFF",
            fg="#566573",
            font=("Helvetica", 9),
            wraplength=750,
            justify="left",
            anchor="w",
        )
        self.description_label.pack(fill=tk.X, pady=(3, 0))

        # 5. Control & Status Footer
        footer_frame = tk.Frame(main_container, bg="#F0F4F3", padx=15, pady=8)
        footer_frame.pack(fill=tk.X, side=tk.BOTTOM)

        # Refresh Button
        self.refresh_btn = ttk.Button(
            footer_frame,
            text="🔄 Refresh World",
            command=self.manual_refresh,
            style="Accent.TButton",
        )
        self.refresh_btn.pack(side=tk.LEFT)

        # Auto-refresh Pulse Indicator
        self.auto_label = tk.Label(
            footer_frame,
            text="● Auto-refresh active (every 3s)",
            bg="#F0F4F3",
            fg="#27AE60",
            font=("Helvetica", 9, "bold"),
            padx=12,
        )
        self.auto_label.pack(side=tk.LEFT)

        # Last Synchronized Timestamp
        self.sync_time_label = tk.Label(
            footer_frame,
            text="Synced with EcoEngine: Just now",
            bg="#F0F4F3",
            fg="#7F8C8D",
            font=("Helvetica", 8),
        )
        self.sync_time_label.pack(side=tk.RIGHT)

    # -------------------------------------------------------------------------
    # Canvas Resizing & Viewport Handling
    # -------------------------------------------------------------------------

    def _on_canvas_resize(self, event: tk.Event) -> None:
        """Handle canvas resizing gracefully."""
        if event.width > 100 and event.height > 100:
            if abs(event.width - self.canvas_width) > 10 or abs(event.height - self.canvas_height) > 10:
                self.canvas_width = event.width
                self.canvas_height = event.height
                self._render_current_stage()

    # -------------------------------------------------------------------------
    # Data Reading & Synchronization with EcoEngine
    # -------------------------------------------------------------------------

    def _determine_stage_index(self, world_stage_name: str, level: int) -> int:
        """Resolve stage integer 1-5 from stage string or fallback to level."""
        for num, name in self.STAGE_NAMES.items():
            if name.lower() in world_stage_name.lower():
                return num
        # Clamp to 1..5 based on level
        return max(1, min(level, 5))

    def refresh_data(self) -> None:
        """
        Read the latest state directly from EcoEngine and eco_data.json,
        and update all UI components.
        """
        if self._is_destroyed:
            return

        # Trigger reload on EcoEngine
        self.engine.load_data()

        # Extract latest metrics directly from EcoEngine
        self.current_world_stage = self.engine.world_stage
        self.current_xp = self.engine.xp
        self.current_level = self.engine.level
        self.current_stage_num = self._determine_stage_index(self.current_world_stage, self.current_level)
        self.last_refreshed = datetime.now()

        # Update text widgets
        theme = self.STAGE_THEMES.get(self.current_stage_num, self.STAGE_THEMES[1])
        self.stage_value_label.config(
            text=f"{theme['icon']} Stage {self.current_stage_num}: {self.current_world_stage}"
        )
        self.xp_value_label.config(text=f"{self.current_xp:,} XP")
        self.level_value_label.config(text=f"Level {self.current_level} ({'★' * self.current_level})")

        self.status_banner_label.config(
            text=theme["status_banner"],
            fg=theme["badge_color"],
        )
        self.description_label.config(text=theme["description"])

        timestamp_str = self.last_refreshed.strftime("%H:%M:%S")
        self.sync_time_label.config(text=f"Synced with EcoEngine: {timestamp_str}")

        # Render stage visual
        self._render_current_stage()

    def manual_refresh(self) -> None:
        """Handle user clicking the Refresh button."""
        self.refresh_data()
        # Reset the timer cycle so we don't double refresh immediately
        self.schedule_auto_refresh()

    def schedule_auto_refresh(self) -> None:
        """Schedule automatic refresh every 3 seconds (3000 ms)."""
        if self._is_destroyed:
            return

        if self._auto_refresh_id is not None:
            try:
                self.root.after_cancel(self._auto_refresh_id)
            except Exception:
                pass

        self._auto_refresh_id = self.root.after(3000, self._on_auto_refresh_tick)

    def _on_auto_refresh_tick(self) -> None:
        """Periodic callback fired every 3 seconds."""
        if not self._is_destroyed:
            self.refresh_data()
            self.schedule_auto_refresh()

    # -------------------------------------------------------------------------
    # Reactive Event Hooks (EcoEngine Pub/Sub Integration)
    # -------------------------------------------------------------------------

    def _on_engine_world_changed(self, old_stage: str, new_stage: str, stage_num: int) -> None:
        """Reactive callback triggered when EcoEngine fires 'world_changed'."""
        self.root.after(0, self.refresh_data)

    def _on_engine_xp_added(self, amount: int, total_xp: int) -> None:
        """Reactive callback triggered when EcoEngine fires 'xp_added'."""
        self.root.after(0, self.refresh_data)

    def _on_engine_level_up(self, old_level: int, new_level: int) -> None:
        """Reactive callback triggered when EcoEngine fires 'level_up'."""
        self.root.after(0, self.refresh_data)

    # -------------------------------------------------------------------------
    # Image Discovery & Visual Rendering
    # -------------------------------------------------------------------------

    def _locate_stage_image(self, stage_num: int) -> Optional[Path]:
        """
        Check for world_{stage_num}.png in current directory, script directory,
        or assets directory.

        :param stage_num: 1 through 5
        :return: Path to image if found, else None.
        """
        target_name = f"world_{stage_num}.png"
        search_dirs = [
            Path.cwd(),
            Path(__file__).resolve().parent,
            Path(__file__).resolve().parent / "assets",
            Path(__file__).resolve().parent.parent / "assets",
            Path(__file__).resolve().parent / "living_world",
            Path(__file__).resolve().parent / "living_world" / "assets",
        ]

        for folder in search_dirs:
            candidate = folder / target_name
            if candidate.is_file():
                return candidate

        return None

    def _render_current_stage(self) -> None:
        """
        Renders either the PNG image (if present) or a high-detail procedural
        illustration for the active world stage onto the canvas.
        """
        self.canvas.delete("all")
        img_path = self._locate_stage_image(self.current_stage_num)

        if img_path is not None:
            self._render_stage_image(img_path)
        else:
            self._render_placeholder_illustration(self.current_stage_num)

    def _render_stage_image(self, img_path: Path) -> None:
        """Render a found PNG image onto the canvas, scaled to fit."""
        width = max(200, self.canvas.winfo_width())
        height = max(150, self.canvas.winfo_height())

        try:
            if HAS_PIL:
                pil_img = Image.open(img_path)
                # Resize with proportional aspect ratio
                pil_img = pil_img.resize((width, height), Image.Resampling.LANCZOS)
                self._image_cache = ImageTk.PhotoImage(pil_img)
            else:
                self._image_cache = tk.PhotoImage(file=str(img_path))

            self.canvas.create_image(
                width // 2,
                height // 2,
                image=self._image_cache,
                anchor="center",
            )
            # Overlay stage badge tag
            self.canvas.create_rectangle(
                12, 12, 180, 42,
                fill="#000000",
                stipple="gray50",
                outline="",
            )
            self.canvas.create_text(
                20, 27,
                text=f"📷 Image: {img_path.name}",
                fill="#FFFFFF",
                font=("Helvetica", 9, "bold"),
                anchor="w",
            )
        except Exception as exc:
            # Fallback to procedural illustration if image loading errors
            self._render_placeholder_illustration(self.current_stage_num)
            self.canvas.create_text(
                width // 2, 30,
                text=f"[Image Load Error: {exc}]",
                fill="#E74C3C",
                font=("Helvetica", 9),
            )

    # -------------------------------------------------------------------------
    # Procedural Kid-Friendly Vector Illustrations (Canvas Fallbacks)
    # -------------------------------------------------------------------------

    def _render_placeholder_illustration(self, stage_num: int) -> None:
        """
        Draw a detailed, beautiful themed vector illustration on the canvas
        when no static PNG image is found.
        """
        w = max(200, self.canvas.winfo_width() if self.canvas.winfo_width() > 1 else self.canvas_width)
        h = max(150, self.canvas.winfo_height() if self.canvas.winfo_height() > 1 else self.canvas_height)

        theme = self.STAGE_THEMES.get(stage_num, self.STAGE_THEMES[1])

        if stage_num == 1:
            self._draw_dead_planet(w, h)
        elif stage_num == 2:
            self._draw_grassland(w, h)
        elif stage_num == 3:
            self._draw_forest(w, h)
        elif stage_num == 4:
            self._draw_wildlife_returns(w, h)
        elif stage_num == 5:
            self._draw_eco_city(w, h)

        # Title & Stage Watermark Overlay
        self.canvas.create_rectangle(15, 15, 310, 52, fill="#1C2833", outline="#34495E", width=1)
        self.canvas.create_text(
            25, 33,
            text=f"STAGE {stage_num} • {self.STAGE_NAMES[stage_num].upper()}",
            fill="#F4D03F" if stage_num == 5 else "#FFFFFF",
            font=("Helvetica", 11, "bold"),
            anchor="w",
        )

        # Information tag in corner
        self.canvas.create_text(
            w - 20, 30,
            text="[Procedural Vector Mode • Add world_%d.png to customize]" % stage_num,
            fill="#ECF0F1",
            font=("Helvetica", 8, "italic"),
            anchor="e",
        )

    def _draw_dead_planet(self, w: int, h: int) -> None:
        """Stage 1: Smog, cracked dry barren ground, dead tree, toxic haze."""
        # Sky: Dark charcoal/brown
        self.canvas.create_rectangle(0, 0, w, h, fill="#2B2625", outline="")

        # Polluted Smog Clouds
        self.canvas.create_oval(w * 0.1, h * 0.1, w * 0.45, h * 0.35, fill="#423934", outline="")
        self.canvas.create_oval(w * 0.35, h * 0.05, w * 0.75, h * 0.3, fill="#38302C", outline="")
        self.canvas.create_oval(w * 0.6, h * 0.15, w * 0.95, h * 0.4, fill="#4A3D36", outline="")

        # Sickly dim red moon/sun
        self.canvas.create_oval(w * 0.75, h * 0.1, w * 0.88, h * 0.3, fill="#78281F", outline="#922B21", width=2)

        # Barren cracked hills
        horizon = h * 0.62
        self.canvas.create_polygon(
            0, horizon + 20,
            w * 0.3, horizon - 10,
            w * 0.7, horizon + 30,
            w, horizon,
            w, h,
            0, h,
            fill="#4A3B32", outline=""
        )
        self.canvas.create_polygon(
            0, horizon + 40,
            w * 0.4, horizon + 15,
            w * 0.8, horizon + 50,
            w, horizon + 35,
            w, h,
            0, h,
            fill="#382C24", outline=""
        )

        # Ground Cracks
        crack_color = "#1F1610"
        self.canvas.create_line(w * 0.2, h * 0.75, w * 0.28, h * 0.82, w * 0.25, h * 0.92, fill=crack_color, width=2)
        self.canvas.create_line(w * 0.65, h * 0.72, w * 0.72, h * 0.85, w * 0.8, h * 0.95, fill=crack_color, width=2)

        # Dead, barren leafless tree
        tx, ty = w * 0.48, h * 0.75
        self.canvas.create_line(tx, ty, tx, ty - 90, fill="#2C221C", width=6)
        self.canvas.create_line(tx, ty - 60, tx - 35, ty - 100, fill="#2C221C", width=4)
        self.canvas.create_line(tx, ty - 70, tx + 40, ty - 110, fill="#2C221C", width=4)
        self.canvas.create_line(tx - 20, ty - 80, tx - 45, ty - 75, fill="#2C221C", width=2)
        self.canvas.create_line(tx + 25, ty - 90, tx + 55, ty - 95, fill="#2C221C", width=2)

    def _draw_grassland(self, w: int, h: int) -> None:
        """Stage 2: Bright morning sky, glowing sun, rolling green plains, tiny flowers."""
        # Sky: Bright clear blue
        self.canvas.create_rectangle(0, 0, w, h, fill="#87CEEB", outline="")

        # Glowing Sun
        sx, sy, r = w * 0.82, h * 0.22, 38
        self.canvas.create_oval(sx - r, sy - r, sx + r, sy + r, fill="#F7DC6F", outline="#F39C12", width=3)
        # Sunbeams
        for angle in range(0, 360, 45):
            rad = math.radians(angle)
            x1 = sx + math.cos(rad) * (r + 8)
            y1 = sy + math.sin(rad) * (r + 8)
            x2 = sx + math.cos(rad) * (r + 20)
            y2 = sy + math.sin(rad) * (r + 20)
            self.canvas.create_line(x1, y1, x2, y2, fill="#F39C12", width=2)

        # Fluffy white clouds
        self._draw_cloud(w * 0.15, h * 0.18, 55)
        self._draw_cloud(w * 0.48, h * 0.14, 45)

        # Distant rolling hills
        self.canvas.create_oval(-w * 0.2, h * 0.45, w * 0.6, h * 1.1, fill="#7DCEA0", outline="")
        self.canvas.create_oval(w * 0.4, h * 0.42, w * 1.2, h * 1.1, fill="#52BE80", outline="")

        # Foreground Meadow
        self.canvas.create_oval(-w * 0.1, h * 0.58, w * 1.1, h * 1.2, fill="#27AE60", outline="")

        # Wildflower & sprout dots
        flower_colors = ["#E74C3C", "#F39C12", "#F4D03F", "#FFFFFF", "#9B59B6"]
        for i in range(18):
            fx = (w * (i * 0.053 + 0.04)) % (w * 0.95)
            fy = h * 0.72 + (i % 5) * 14
            col = flower_colors[i % len(flower_colors)]
            self.canvas.create_oval(fx - 3, fy - 3, fx + 3, fy + 3, fill=col, outline="")
            self.canvas.create_line(fx, fy, fx, fy + 8, fill="#196F3D", width=2)

    def _draw_forest(self, w: int, h: int) -> None:
        """Stage 3: Deep blue sky, lush trees, canopy, flowing sparkling river."""
        # Sky: Deep rich blue
        self.canvas.create_rectangle(0, 0, w, h, fill="#5DADE2", outline="")

        # Sun breaking through
        self.canvas.create_oval(w * 0.12 - 30, h * 0.18 - 30, w * 0.12 + 30, h * 0.18 + 30, fill="#F9E79F", outline="")

        # Clouds
        self._draw_cloud(w * 0.4, h * 0.12, 40)
        self._draw_cloud(w * 0.75, h * 0.16, 50)

        # Forest hills
        self.canvas.create_rectangle(0, h * 0.55, w, h, fill="#2E7D32", outline="")

        # Backdrop Trees (Pines and Oaks)
        for i in range(12):
            tx = w * (i * 0.085 + 0.02)
            ty = h * 0.52
            self._draw_pine_tree(tx, ty, size=0.75)

        # Sparkling River flowing through the glade
        self.canvas.create_polygon(
            w * 0.35, h * 0.55,
            w * 0.42, h * 0.55,
            w * 0.65, h,
            w * 0.45, h,
            fill="#29B6F6", outline="#81D4FA", width=2
        )

        # Foreground Oak Trees
        for i in range(6):
            tx = w * (i * 0.18 + 0.06)
            ty = h * 0.68 + (i % 2) * 20
            self._draw_oak_tree(tx, ty, size=1.0)

    def _draw_wildlife_returns(self, w: int, h: int) -> None:
        """Stage 4: Mountain backdrop, rich forest, pond, birds in flight, deer silhouette."""
        # Sky: Vibrant clear gradient
        self.canvas.create_rectangle(0, 0, w, h, fill="#7FB3D5", outline="")

        # Majestic Mountains in background
        self.canvas.create_polygon(0, h * 0.55, w * 0.25, h * 0.28, w * 0.5, h * 0.55, fill="#5D6D7E", outline="")
        self.canvas.create_polygon(w * 0.25, h * 0.28, w * 0.2, h * 0.34, w * 0.3, h * 0.34, fill="#F2F4F4", outline="")

        self.canvas.create_polygon(w * 0.35, h * 0.55, w * 0.65, h * 0.22, w * 0.95, h * 0.55, fill="#4D5656", outline="")
        self.canvas.create_polygon(w * 0.65, h * 0.22, w * 0.58, h * 0.30, w * 0.72, h * 0.30, fill="#F2F4F4", outline="")

        # Forest ground
        self.canvas.create_rectangle(0, h * 0.55, w, h, fill="#388E3C", outline="")

        # Clustered trees
        for i in range(8):
            self._draw_oak_tree(w * (i * 0.13 + 0.04), h * 0.58, size=0.85)

        # Sparkling Wildlife Lake/Pond
        self.canvas.create_oval(w * 0.45, h * 0.68, w * 0.88, h * 0.95, fill="#3498DB", outline="#AED6F1", width=2)

        # Flying Birds (V-shapes in sky)
        bird_positions = [(w * 0.2, h * 0.2), (w * 0.26, h * 0.17), (w * 0.32, h * 0.22), (w * 0.78, h * 0.15)]
        for bx, by in bird_positions:
            self.canvas.create_arc(bx - 12, by - 6, bx, by + 6, start=0, extent=180, style=tk.ARC, width=2, outline="#1B2631")
            self.canvas.create_arc(bx, by - 6, bx + 12, by + 6, start=0, extent=180, style=tk.ARC, width=2, outline="#1B2631")

        # Deer Silhouette near the lake
        dx, dy = w * 0.32, h * 0.78
        # Body
        self.canvas.create_oval(dx - 18, dy - 12, dx + 18, dy + 12, fill="#795548", outline="")
        # Neck & Head
        self.canvas.create_polygon(dx + 10, dy, dx + 22, dy - 22, dx + 28, dy - 20, dx + 14, dy + 4, fill="#795548")
        self.canvas.create_oval(dx + 20, dy - 26, dx + 30, dy - 16, fill="#795548", outline="")
        # Antlers
        self.canvas.create_line(dx + 24, dy - 26, dx + 22, dy - 38, fill="#5D4037", width=2)
        self.canvas.create_line(dx + 26, dy - 26, dx + 32, dy - 38, fill="#5D4037", width=2)
        # Legs
        self.canvas.create_line(dx - 12, dy + 8, dx - 12, dy + 28, fill="#795548", width=3)
        self.canvas.create_line(dx + 10, dy + 8, dx + 10, dy + 28, fill="#795548", width=3)

    def _draw_eco_city(self, w: int, h: int) -> None:
        """Stage 5: Rainbow, futuristic green skyscrapers, vertical rooftop gardens, wind turbines."""
        # Sky: Pure crystal cyan
        self.canvas.create_rectangle(0, 0, w, h, fill="#A9CCE3", outline="")

        # Celebratory Rainbow Arch
        rainbow_colors = ["#E74C3C", "#E67E22", "#F1C40F", "#2ECC71", "#3498DB", "#9B59B6"]
        rx, ry = w * 0.5, h * 0.65
        for idx, col in enumerate(rainbow_colors):
            rw = w * 0.85 + (idx * 10)
            rh = h * 0.75 + (idx * 10)
            self.canvas.create_arc(
                rx - rw // 2, ry - rh // 2,
                rx + rw // 2, ry + rh // 2,
                start=0, extent=180,
                style=tk.ARC, outline=col, width=4
            )

        # Green ground plateau
        self.canvas.create_rectangle(0, h * 0.65, w, h, fill="#43A047", outline="")

        # Modern Eco Skyscrapers with vertical gardens & solar roofs
        buildings = [
            (w * 0.12, 140, 60, "#34495E", "#1ABC9C"),
            (w * 0.22, 190, 75, "#2C3E50", "#2ECC71"),
            (w * 0.35, 230, 80, "#1F618D", "#27AE60"),
            (w * 0.50, 200, 70, "#2874A6", "#58D68D"),
            (w * 0.63, 160, 65, "#148F77", "#2ECC71"),
        ]

        for bx, b_height, b_width, b_color, garden_color in buildings:
            top_y = h * 0.65 - b_height
            # Main Building
            self.canvas.create_rectangle(bx, top_y, bx + b_width, h * 0.65, fill=b_color, outline="#17202A", width=1)
            # Rooftop Garden
            self.canvas.create_rectangle(bx - 3, top_y - 8, bx + b_width + 3, top_y, fill=garden_color, outline="")
            # Windows / Solar Panels grid
            for wy in range(int(top_y + 16), int(h * 0.65 - 10), 16):
                for wx in range(int(bx + 8), int(bx + b_width - 8), 14):
                    self.canvas.create_rectangle(wx, wy, wx + 8, wy + 9, fill="#F9E79F", outline="")

        # Futuristic High-Speed Eco Monorail
        rail_y = h * 0.67
        self.canvas.create_line(0, rail_y, w, rail_y, fill="#BDC3C7", width=5)
        # Train
        self.canvas.create_rectangle(w * 0.3, rail_y - 8, w * 0.55, rail_y + 2, fill="#E74C3C", outline="#C0392B", width=2)
        for tx in range(int(w * 0.33), int(w * 0.53), 22):
            self.canvas.create_rectangle(tx, rail_y - 6, tx + 14, rail_y - 1, fill="#EBF5FB", outline="")

        # Clean Wind Turbines on the green hills
        self._draw_wind_turbine(w * 0.82, h * 0.65, height=75)
        self._draw_wind_turbine(w * 0.92, h * 0.65, height=60)

    # -------------------------------------------------------------------------
    # Drawing Helper Primitives
    # -------------------------------------------------------------------------

    def _draw_cloud(self, cx: float, cy: float, size: float) -> None:
        """Draw a soft fluffy cloud on the canvas."""
        col = "#FFFFFF"
        self.canvas.create_oval(cx - size, cy - size * 0.4, cx + size, cy + size * 0.4, fill=col, outline="")
        self.canvas.create_oval(cx - size * 0.6, cy - size * 0.7, cx + size * 0.2, cy + size * 0.2, fill=col, outline="")
        self.canvas.create_oval(cx - size * 0.1, cy - size * 0.6, cx + size * 0.7, cy + size * 0.3, fill=col, outline="")

    def _draw_oak_tree(self, tx: float, ty: float, size: float = 1.0) -> None:
        """Draw a round, lush oak tree."""
        # Trunk
        trunk_w = 12 * size
        trunk_h = 35 * size
        self.canvas.create_rectangle(tx - trunk_w / 2, ty - trunk_h, tx + trunk_w / 2, ty, fill="#6E2C00", outline="")
        # Foliage Canopy
        foliage_r = 30 * size
        foliage_y = ty - trunk_h - 10 * size
        self.canvas.create_oval(tx - foliage_r, foliage_y - foliage_r, tx + foliage_r, foliage_y + foliage_r, fill="#196F3D", outline="")
        self.canvas.create_oval(tx - foliage_r * 0.7, foliage_y - foliage_r * 1.2, tx + foliage_r * 0.7, foliage_y, fill="#27AE60", outline="")

    def _draw_pine_tree(self, tx: float, ty: float, size: float = 1.0) -> None:
        """Draw an evergreen pine tree."""
        # Trunk
        self.canvas.create_rectangle(tx - 3 * size, ty - 12 * size, tx + 3 * size, ty, fill="#4A235A", outline="")
        # Triangular tiers
        tier_h = 16 * size
        for tier in range(3):
            base_y = ty - 10 * size - (tier * 12 * size)
            half_w = (20 - tier * 4) * size
            self.canvas.create_polygon(
                tx - half_w, base_y,
                tx + half_w, base_y,
                tx, base_y - tier_h,
                fill="#145A32", outline=""
            )

    def _draw_wind_turbine(self, tx: float, ty: float, height: float = 70.0) -> None:
        """Draw a sleek white wind turbine with spinning blades."""
        # Tower
        self.canvas.create_line(tx, ty, tx, ty - height, fill="#ECF0F1", width=3)
        # Hub
        hub_y = ty - height
        self.canvas.create_oval(tx - 4, hub_y - 4, tx + 4, hub_y + 4, fill="#BDC3C7", outline="")
        # 3 Blades
        blade_len = height * 0.42
        for angle in [0, 120, 240]:
            rad = math.radians(angle - 30)
            bx = tx + math.cos(rad) * blade_len
            by = hub_y + math.sin(rad) * blade_len
            self.canvas.create_line(tx, hub_y, bx, by, fill="#FFFFFF", width=3)

    # -------------------------------------------------------------------------
    # Lifecycle Management
    # -------------------------------------------------------------------------

    def on_close(self) -> None:
        """Cleanly cancel timers and shut down."""
        self._is_destroyed = True
        if self._auto_refresh_id is not None:
            try:
                self.root.after_cancel(self._auto_refresh_id)
            except Exception:
                pass
            self._auto_refresh_id = None
        if self._is_standalone and isinstance(self.root, tk.Tk):
            self.root.destroy()

    def run(self) -> None:
        """Start the Tkinter event loop for standalone execution."""
        if self._is_standalone and isinstance(self.root, tk.Tk):
            try:
                self.root.mainloop()
            except KeyboardInterrupt:
                self.on_close()


# -----------------------------------------------------------------------------
# Standalone Execution Entrypoint
# -----------------------------------------------------------------------------

def main() -> None:
    """Run the Living World Viewer application directly."""
    import argparse

    parser = argparse.ArgumentParser(description="Living World Viewer for EcoKids OS")
    parser.add_argument(
        "--data-path",
        type=str,
        default=None,
        help="Optional custom path to eco_data.json",
    )
    args = parser.parse_args()

    app = LivingWorldViewer(data_path=args.data_path)
    app.run()


if __name__ == "__main__":
    main()
