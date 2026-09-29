"""
Unit and Integration Tests for EcoEngine (EcoKids OS).

Author: EcoKids OS Team
Description:
    Validates all EcoEngine requirements:
    - OOP structure and class naming
    - JSON file persistence and atomic writes
    - Accurate XP thresholds, levels, world stages, pet stages, and badges
    - Method presence and correct return values
    - Decoupled event-listener modularity for future modules (EcoBuddy, Living World, Eco Pet, etc.)
"""

import json
import os
import shutil
import tempfile
import sys
import unittest
from pathlib import Path

# Ensure eco_score is importable regardless of current working directory
_score_dir = Path(__file__).resolve().parent
_repo_root = _score_dir.parent
for _p in [str(_score_dir), str(_repo_root)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from eco_score.eco_engine import EcoEngine
except ImportError:
    from eco_engine import EcoEngine


class TestEcoEngine(unittest.TestCase):
    """Test suite covering the complete functionality of EcoEngine."""

    def setUp(self) -> None:
        """Create a temporary sandbox directory for each test run."""
        self.test_dir = tempfile.mkdtemp(prefix="ecokids_test_")
        self.test_data_path = Path(self.test_dir) / "eco_data.json"
        self.engine = EcoEngine(data_path=self.test_data_path)

    def tearDown(self) -> None:
        """Clean up the sandbox directory."""
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir, ignore_errors=True)

    # -------------------------------------------------------------------------
    # 1. Initialization & Default State
    # -------------------------------------------------------------------------

    def test_initial_state_defaults(self) -> None:
        """Verify the engine starts at Level 1, 0 XP, Dead Planet, Baby Panda, and no badges."""
        self.assertEqual(self.engine.xp, 0)
        self.assertEqual(self.engine.level, 1)
        self.assertEqual(self.engine.world_stage, "Dead Planet")
        self.assertEqual(self.engine.pet_stage, "Baby Panda")
        self.assertEqual(self.engine.badges, [])
        self.assertTrue(self.test_data_path.exists())

    def test_required_methods_exist(self) -> None:
        """Verify that all 8 required methods exist on EcoEngine."""
        required_methods = [
            "load_data",
            "save_data",
            "add_xp",
            "update_level",
            "update_world",
            "update_pet",
            "update_badges",
            "show_status",
        ]
        for method_name in required_methods:
            self.assertTrue(
                hasattr(self.engine, method_name),
                f"EcoEngine is missing required method: {method_name}",
            )
            self.assertTrue(
                callable(getattr(self.engine, method_name)),
                f"Attribute {method_name} must be callable",
            )

    # -------------------------------------------------------------------------
    # 2. XP Thresholds & Level Calculations
    # -------------------------------------------------------------------------

    def test_level_threshold_boundaries(self) -> None:
        """
        Verify exact XP thresholds:
            Level 1 = 0 XP
            Level 2 = 100 XP
            Level 3 = 250 XP
            Level 4 = 500 XP
            Level 5 = 1000 XP
        """
        threshold_cases = [
            (0, 1),
            (49, 1),
            (99, 1),
            (100, 2),
            (249, 2),
            (250, 3),
            (499, 3),
            (500, 4),
            (999, 4),
            (1000, 5),
            (2500, 5),
        ]
        for xp_val, expected_lvl in threshold_cases:
            self.engine.xp = xp_val
            current_lvl = self.engine.update_level(trigger_events=False)
            self.assertEqual(
                current_lvl,
                expected_lvl,
                f"At {xp_val} XP, expected Level {expected_lvl} but got {current_lvl}",
            )

    # -------------------------------------------------------------------------
    # 3. World & Pet Progression
    # -------------------------------------------------------------------------

    def test_world_and_pet_progression_matching_levels(self) -> None:
        """
        Verify that World and Pet stages advance correctly across all 5 stages.
        """
        expected_progression = [
            # (XP, Expected Level, Expected World, Expected Pet)
            (0, 1, "Dead Planet", "Baby Panda"),
            (100, 2, "Grassland", "Young Panda"),
            (250, 3, "Forest", "Teen Panda"),
            (500, 4, "Wildlife Returns", "Adult Panda"),
            (1000, 5, "Eco City", "Guardian Panda"),
        ]

        for xp_val, exp_lvl, exp_world, exp_pet in expected_progression:
            self.engine.xp = xp_val
            self.engine.update_level(trigger_events=False)
            self.engine.update_world(trigger_events=False)
            self.engine.update_pet(trigger_events=False)

            self.assertEqual(self.engine.level, exp_lvl)
            self.assertEqual(self.engine.world_stage, exp_world)
            self.assertEqual(self.engine.pet_stage, exp_pet)

    # -------------------------------------------------------------------------
    # 4. Badge Milestones & Deduping
    # -------------------------------------------------------------------------

    def test_badge_unlocks(self) -> None:
        """
        Verify badge award thresholds:
            50 XP   = Recycler Rookie
            200 XP  = Water Warrior
            500 XP  = Forest Hero
            1000 XP = Planet Guardian
        """
        # At 49 XP: No badges
        self.engine.xp = 49
        self.engine.update_badges()
        self.assertEqual(self.engine.badges, [])

        # At 50 XP: Recycler Rookie
        self.engine.xp = 50
        new_badges = self.engine.update_badges()
        self.assertIn("Recycler Rookie", self.engine.badges)
        self.assertEqual(new_badges, ["Recycler Rookie"])

        # Calling update_badges again does not duplicate badges
        new_badges_again = self.engine.update_badges()
        self.assertEqual(new_badges_again, [])
        self.assertEqual(self.engine.badges.count("Recycler Rookie"), 1)

        # At 200 XP: Water Warrior
        self.engine.xp = 200
        new_badges = self.engine.update_badges()
        self.assertIn("Water Warrior", self.engine.badges)
        self.assertEqual(new_badges, ["Water Warrior"])

        # At 500 XP: Forest Hero
        self.engine.xp = 500
        new_badges = self.engine.update_badges()
        self.assertIn("Forest Hero", self.engine.badges)
        self.assertEqual(new_badges, ["Forest Hero"])

        # At 1000 XP: Planet Guardian
        self.engine.xp = 1000
        new_badges = self.engine.update_badges()
        self.assertIn("Planet Guardian", self.engine.badges)
        self.assertEqual(new_badges, ["Planet Guardian"])

        # All 4 badges should now be unlocked
        self.assertEqual(
            self.engine.badges,
            ["Recycler Rookie", "Water Warrior", "Forest Hero", "Planet Guardian"],
        )

    # -------------------------------------------------------------------------
    # 5. add_xp Method Behavior & Validation
    # -------------------------------------------------------------------------

    def test_add_xp_incremental_progression(self) -> None:
        """Test continuous gradual XP additions simulating gameplay."""
        # 1. Earn 30 XP from Recycle Rush
        res1 = self.engine.add_xp(30)
        self.assertEqual(self.engine.xp, 30)
        self.assertEqual(self.engine.level, 1)
        self.assertFalse(res1["level_up"])
        self.assertEqual(res1["new_badges"], [])

        # 2. Earn another 20 XP (total 50 XP) -> Unlocks Recycler Rookie
        res2 = self.engine.add_xp(20)
        self.assertEqual(self.engine.xp, 50)
        self.assertEqual(res2["new_badges"], ["Recycler Rookie"])

        # 3. Earn 50 XP (total 100 XP) -> Level 2, Grassland, Young Panda
        res3 = self.engine.add_xp(50)
        self.assertEqual(self.engine.xp, 100)
        self.assertEqual(self.engine.level, 2)
        self.assertTrue(res3["level_up"])
        self.assertEqual(self.engine.world_stage, "Grassland")
        self.assertEqual(self.engine.pet_stage, "Young Panda")

    def test_add_xp_negative_or_invalid_raises_error(self) -> None:
        """Negative XP should raise ValueError, non-numeric should raise TypeError."""
        with self.assertRaises(ValueError):
            self.engine.add_xp(-10)

        with self.assertRaises(TypeError):
            self.engine.add_xp("hundred")  # type: ignore

    # -------------------------------------------------------------------------
    # 6. JSON File Persistence & Recovery
    # -------------------------------------------------------------------------

    def test_persistence_between_instances(self) -> None:
        """Ensure state written to eco_data.json is accurately restored by a new instance."""
        # Add 600 XP (Level 4, Adult Panda, Wildlife Returns, 3 badges)
        self.engine.add_xp(600)

        # Verify on-disk JSON
        with open(self.test_data_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertEqual(data["xp"], 600)
        self.assertEqual(data["level"], 4)
        self.assertEqual(data["world_stage"], "Wildlife Returns")
        self.assertEqual(data["pet_stage"], "Adult Panda")
        self.assertIn("Forest Hero", data["badges"])

        # Instantiate a completely fresh EcoEngine pointing to the same file
        engine2 = EcoEngine(data_path=self.test_data_path)
        self.assertEqual(engine2.xp, 600)
        self.assertEqual(engine2.level, 4)
        self.assertEqual(engine2.world_stage, "Wildlife Returns")
        self.assertEqual(engine2.pet_stage, "Adult Panda")
        self.assertEqual(
            engine2.badges,
            ["Recycler Rookie", "Water Warrior", "Forest Hero"],
        )

    def test_corrupt_json_recovery(self) -> None:
        """If eco_data.json is corrupted, engine should gracefully recover to defaults."""
        with open(self.test_data_path, "w", encoding="utf-8") as f:
            f.write("NOT_A_VALID_JSON{{{")

        recovered_engine = EcoEngine(data_path=self.test_data_path)
        self.assertEqual(recovered_engine.xp, 0)
        self.assertEqual(recovered_engine.level, 1)

    # -------------------------------------------------------------------------
    # 7. Modularity & Event Listeners (Future Module Integration)
    # -------------------------------------------------------------------------

    def test_event_listeners_for_companion_modules(self) -> None:
        """
        Simulate future module connections:
        - EcoBuddy: Celebrates level up & badge unlocked
        - Living World: Reacts to world stage change
        - Eco Pet: Reacts to pet evolution
        """
        ecobuddy_events = []
        living_world_events = []
        eco_pet_events = []

        # Hook up listeners
        self.engine.register_listener(
            "level_up",
            lambda old, new: ecobuddy_events.append(f"Level {old} -> {new}"),
        )
        self.engine.register_listener(
            "badge_unlocked",
            lambda badge: ecobuddy_events.append(f"Badge: {badge}"),
        )
        self.engine.register_listener(
            "world_changed",
            lambda old, new, num: living_world_events.append(f"World: {new} (Stage {num})"),
        )
        self.engine.register_listener(
            "pet_changed",
            lambda old, new, num: eco_pet_events.append(f"Pet: {new}"),
        )

        # Trigger 250 XP jump (Crosses Level 2 and Level 3, 2 badges)
        self.engine.add_xp(250)

        # Verify companion modules received their respective triggers
        self.assertTrue(any("Badge: Recycler Rookie" in e for e in ecobuddy_events))
        self.assertTrue(any("Badge: Water Warrior" in e for e in ecobuddy_events))
        self.assertEqual(living_world_events, ["World: Forest (Stage 3)"])
        self.assertEqual(eco_pet_events, ["Pet: Teen Panda"])

    # -------------------------------------------------------------------------
    # 8. Status Dashboard Rendering
    # -------------------------------------------------------------------------

    def test_show_status_output(self) -> None:
        """Verify show_status returns a formatted string containing key identifiers."""
        self.engine.add_xp(50)
        status_text = self.engine.show_status(print_output=False)

        self.assertIn("ECOKIDS OS - ECO ENGINE", status_text)
        self.assertIn("Total XP:    50", status_text)
        self.assertIn("Recycler Rookie", status_text)
        self.assertIn("Baby Panda", status_text)
        self.assertIn("Dead Planet", status_text)


if __name__ == "__main__":
    unittest.main()
