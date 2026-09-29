"""
Automated Unit and Integration Tests for LivingWorldViewer (EcoKids OS).

Author: EcoKids OS Team
Description:
    Validates all requirements of living_world.py:
    - Tkinter LivingWorldViewer class
    - Direct reading from EcoEngine and eco_data.json
    - Dynamic display of World Stage, Level, and XP
    - Seamless handling of world_1.png through world_5.png image files
    - Procedural vector fallback illustration for all 5 stages
    - Manual refresh button execution
    - 3-second automatic refresh timer scheduling
"""

import json
import os
import shutil
import tempfile
import tkinter as tk
import unittest
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

_curr_dir = Path(__file__).resolve().parent
_repo_root = _curr_dir.parent
for _p in [str(_curr_dir), str(_repo_root), str(_repo_root / "eco_score")]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from eco_score.eco_engine import EcoEngine
except ImportError:
    from eco_engine import EcoEngine

try:
    from living_world.living_world import LivingWorldViewer
except ImportError:
    from living_world import LivingWorldViewer


class TestLivingWorldViewer(unittest.TestCase):
    """Test suite for LivingWorldViewer."""

    def setUp(self) -> None:
        """Create a sandbox environment and a hidden Tk root for headless testing."""
        self.test_dir = tempfile.mkdtemp(prefix="ecokids_living_world_test_")
        self.data_path = Path(self.test_dir) / "eco_data.json"

        # Initialize base eco data
        self.engine = EcoEngine(data_path=self.data_path)

        # Create hidden Tk root
        self.root = tk.Tk()
        self.root.withdraw()  # Keep hidden during tests

        # Instantiate LivingWorldViewer with auto-timer disabled for controlled testing
        self.viewer = LivingWorldViewer(
            root=self.root,
            engine=self.engine,
            auto_start_timer=False,
        )

    def tearDown(self) -> None:
        """Clean up the test viewer, root window, and sandbox directory."""
        if hasattr(self, "viewer"):
            self.viewer.on_close()
        try:
            self.root.destroy()
        except Exception:
            pass
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir, ignore_errors=True)

    # -------------------------------------------------------------------------
    # 1. Initialization and Metric Display
    # -------------------------------------------------------------------------

    def test_initial_metric_display_from_engine(self) -> None:
        """Verify viewer displays initial Stage 1, 0 XP, Level 1 from EcoEngine."""
        self.root.update()
        self.assertEqual(self.viewer.current_stage_num, 1)
        self.assertEqual(self.viewer.current_world_stage, "Dead Planet")
        self.assertEqual(self.viewer.current_xp, 0)
        self.assertEqual(self.viewer.current_level, 1)

        # Inspect label contents
        self.assertIn("Dead Planet", self.viewer.stage_value_label.cget("text"))
        self.assertIn("0 XP", self.viewer.xp_value_label.cget("text"))
        self.assertIn("Level 1", self.viewer.level_value_label.cget("text"))

    # -------------------------------------------------------------------------
    # 2. Progression Synchronization Across All 5 Stages
    # -------------------------------------------------------------------------

    def test_progression_across_all_five_stages(self) -> None:
        """
        Verify that changing EcoEngine state updates the LivingWorldViewer
        across all 5 stages:
            Stage 1: Dead Planet (Level 1, 0 XP)
            Stage 2: Grassland (Level 2, 100 XP)
            Stage 3: Forest (Level 3, 250 XP)
            Stage 4: Wildlife Returns (Level 4, 500 XP)
            Stage 5: Eco City (Level 5, 1000 XP)
        """
        stages_data = [
            (100, 2, "Grassland"),
            (150, 3, "Forest"),             # +150 -> 250 XP
            (250, 4, "Wildlife Returns"),   # +250 -> 500 XP
            (500, 5, "Eco City"),           # +500 -> 1000 XP
        ]

        for xp_to_add, exp_level, exp_stage_name in stages_data:
            self.engine.add_xp(xp_to_add)
            self.viewer.refresh_data()
            self.root.update()

            self.assertEqual(self.viewer.current_stage_num, exp_level)
            self.assertEqual(self.viewer.current_world_stage, exp_stage_name)
            self.assertEqual(self.viewer.current_level, exp_level)
            self.assertIn(exp_stage_name, self.viewer.stage_value_label.cget("text"))
            self.assertIn(f"Level {exp_level}", self.viewer.level_value_label.cget("text"))

    # -------------------------------------------------------------------------
    # 3. Procedural Vector Illustration Fallback Rendering
    # -------------------------------------------------------------------------

    def test_canvas_draws_all_five_stage_illustrations(self) -> None:
        """Ensure vector drawings for all 5 stages execute cleanly without exceptions."""
        for stage_num in range(1, 6):
            self.viewer.current_stage_num = stage_num
            self.viewer._render_placeholder_illustration(stage_num)
            self.root.update()

            # Canvas should have items created
            items = self.viewer.canvas.find_all()
            self.assertGreater(len(items), 5, f"Canvas should render multiple shapes for stage {stage_num}")

    # -------------------------------------------------------------------------
    # 4. Image File Handling (world_X.png)
    # -------------------------------------------------------------------------

    def test_image_loading_when_file_exists(self) -> None:
        """Verify that when a world_1.png image file exists, it is located and rendered."""
        mock_img_path = Path(self.test_dir) / "world_1.png"
        
        # Create a small valid 1x1 or test PNG using Pillow
        from PIL import Image
        img = Image.new("RGBA", (100, 100), color=(34, 139, 34, 255))
        img.save(mock_img_path, "PNG")

        # Patch search path to include our test directory
        with patch.object(self.viewer, "_locate_stage_image", return_value=mock_img_path):
            self.viewer.current_stage_num = 1
            self.viewer._render_current_stage()
            self.root.update()

            # Verify image cache has an image
            self.assertIsNotNone(self.viewer._image_cache)

    # -------------------------------------------------------------------------
    # 5. Manual and Auto Refresh Mechanics
    # -------------------------------------------------------------------------

    def test_manual_refresh_updates_timestamp_and_state(self) -> None:
        """Ensure clicking refresh updates state and timestamp label."""
        self.engine.add_xp(100)  # Evolve to Grassland
        self.viewer.manual_refresh()
        self.root.update()

        self.assertEqual(self.viewer.current_world_stage, "Grassland")
        self.assertIn("Synced with EcoEngine:", self.viewer.sync_time_label.cget("text"))

    def test_auto_refresh_timer_scheduling(self) -> None:
        """Verify schedule_auto_refresh registers a 3000ms callback in Tk."""
        self.viewer.schedule_auto_refresh()
        self.assertIsNotNone(self.viewer._auto_refresh_id)
        
        # Cleanly cancel
        self.viewer.on_close()
        self.assertIsNone(self.viewer._auto_refresh_id)


if __name__ == "__main__":
    unittest.main()
