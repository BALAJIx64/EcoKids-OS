"""
EcoEngine - The Core Gamification & Progression Engine for EcoKids OS.

Author: EcoKids OS Team
Description:
    Manages user experience (XP), level progression, pet evolution,
    world restoration stages, and badge achievements. Designed with an
    event-driven architecture to seamlessly connect with companion modules:
    EcoBuddy, Living World, Eco Pet, Eco News, and mini-games like Recycle Rush.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple

# Ensure UTF-8 output support on Windows command lines
if sys.platform == "win32":
    try:
        if sys.stdout and hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        if sys.stderr and hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


class EcoEngine:
    """
    Central state and gamification engine for EcoKids OS.
    
    Tracks XP, Level, World Stage, Pet Stage, and Badges, persisting all
    progress to an eco_data.json file with atomic writes. Supports event
    listeners for decoupled module integration.
    """

    # XP Thresholds for Levels 1 through 5
    LEVEL_THRESHOLDS: Dict[int, int] = {
        1: 0,
        2: 100,
        3: 250,
        4: 500,
        5: 1000,
    }

    # World Progression mapping for Stages 1 through 5
    WORLD_STAGES: Dict[int, str] = {
        1: "Dead Planet",
        2: "Grassland",
        3: "Forest",
        4: "Wildlife Returns",
        5: "Eco City",
    }

    # Pet Progression mapping for Stages 1 through 5
    PET_STAGES: Dict[int, str] = {
        1: "Baby Panda",
        2: "Young Panda",
        3: "Teen Panda",
        4: "Adult Panda",
        5: "Guardian Panda",
    }

    # Badges awarded at specific XP milestones
    BADGE_THRESHOLDS: List[Tuple[int, str]] = [
        (50, "Recycler Rookie"),
        (200, "Water Warrior"),
        (500, "Forest Hero"),
        (1000, "Planet Guardian"),
    ]

    def __init__(self, data_path: Optional[str | Path] = None) -> None:
        """
        Initialize the EcoEngine.

        :param data_path: Optional path to eco_data.json. Defaults to
                          'eco_data.json' in the same directory as this file.
        """
        if data_path is None:
            local_path = Path(__file__).resolve().parent / "eco_data.json"
            root_path = Path(__file__).resolve().parent.parent / "eco_data.json"
            if local_path.exists():
                self.data_path = local_path
            elif root_path.exists():
                self.data_path = root_path
            else:
                self.data_path = local_path
        else:
            self.data_path = Path(data_path).resolve()

        # Core tracked properties
        self.xp: int = 0
        self.level: int = 1
        self.pet_stage: str = self.PET_STAGES[1]
        self.world_stage: str = self.WORLD_STAGES[1]
        self.badges: List[str] = []

        # Event hooks for external modules (EcoBuddy, Living World, Eco Pet, etc.)
        self._listeners: Dict[str, List[Callable[..., Any]]] = {
            "xp_added": [],
            "level_up": [],
            "world_changed": [],
            "pet_changed": [],
            "badge_unlocked": [],
        }

        # Load or initialize data file
        self.load_data()

    # -------------------------------------------------------------------------
    # Event Subscription (Modularity for EcoBuddy, Living World, etc.)
    # -------------------------------------------------------------------------

    def register_listener(self, event_name: str, callback: Callable[..., Any]) -> None:
        """
        Register a callback for an engine event.

        Supported events:
            - 'xp_added' (amount: int, total_xp: int)
            - 'level_up' (old_level: int, new_level: int)
            - 'world_changed' (old_stage: str, new_stage: str, stage_number: int)
            - 'pet_changed' (old_stage: str, new_stage: str, stage_number: int)
            - 'badge_unlocked' (badge_name: str)

        :param event_name: The event to listen to.
        :param callback: The callable function or handler.
        """
        if event_name not in self._listeners:
            self._listeners[event_name] = []
        self._listeners[event_name].append(callback)

    def _trigger_event(self, event_name: str, *args: Any, **kwargs: Any) -> None:
        """Safely trigger registered callbacks for a given event."""
        if event_name in self._listeners:
            for callback in self._listeners[event_name]:
                try:
                    callback(*args, **kwargs)
                except Exception as exc:
                    print(f"[EcoEngine Warning] Listener error for '{event_name}': {exc}", file=sys.stderr)

    # -------------------------------------------------------------------------
    # Data Persistence Methods
    # -------------------------------------------------------------------------

    def load_data(self) -> None:
        """
        Load user progress from eco_data.json.
        If the file does not exist or is invalid, initializes with defaults.
        """
        if not self.data_path.exists():
            self._reset_to_defaults()
            self.save_data()
            return

        try:
            with open(self.data_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            self.xp = int(data.get("xp", 0))
            if self.xp < 0:
                self.xp = 0

            # Recompute state to ensure internal consistency
            self.update_level(trigger_events=False)
            self.update_world(trigger_events=False)
            self.update_pet(trigger_events=False)
            self.update_badges(trigger_events=False)

            # Preserve any loaded badges that might be special achievements
            loaded_badges = data.get("badges", [])
            if isinstance(loaded_badges, list):
                for b in loaded_badges:
                    if isinstance(b, str) and b not in self.badges:
                        self.badges.append(b)

        except (json.JSONDecodeError, OSError, ValueError) as err:
            print(f"[EcoEngine Warning] Could not parse {self.data_path}: {err}. Resetting to defaults.", file=sys.stderr)
            self._reset_to_defaults()
            self.save_data()

    def save_data(self) -> None:
        """
        Atomically save the current progress to eco_data.json.
        Uses a temporary file and atomic replace to prevent data corruption.
        """
        payload = self.to_dict()
        payload["last_updated"] = datetime.now(timezone.utc).isoformat()

        # Ensure parent directory exists
        self.data_path.parent.mkdir(parents=True, exist_ok=True)

        temp_path = self.data_path.with_suffix(".tmp")
        try:
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=4, ensure_ascii=False)
            # Atomic file swap
            temp_path.replace(self.data_path)
        except OSError as err:
            if temp_path.exists():
                temp_path.unlink(missing_ok=True)
            raise OSError(f"Failed to save eco data to {self.data_path}: {err}") from err

    def _reset_to_defaults(self) -> None:
        """Reset state attributes to fresh default values."""
        self.xp = 0
        self.level = 1
        self.world_stage = self.WORLD_STAGES[1]
        self.pet_stage = self.PET_STAGES[1]
        self.badges = []

    def reset_progress(self) -> None:
        """Public method to reset all user progress and persist changes."""
        self._reset_to_defaults()
        self.save_data()

    # -------------------------------------------------------------------------
    # Core Game Logic & Progression
    # -------------------------------------------------------------------------

    def add_xp(self, amount: int) -> Dict[str, Any]:
        """
        Add XP to the user's progress and update all associated systems.

        :param amount: Positive integer of XP to add.
        :return: Dictionary summarizing the changes from this XP addition.
        :raises ValueError: If amount is negative.
        """
        if not isinstance(amount, (int, float)):
            raise TypeError(f"XP amount must be a number, got {type(amount).__name__}")
        amount_int = int(amount)
        if amount_int < 0:
            raise ValueError(f"XP amount cannot be negative ({amount_int})")
        if amount_int == 0:
            return {
                "xp_added": 0,
                "total_xp": self.xp,
                "level": self.level,
                "level_up": False,
                "world_stage": self.world_stage,
                "pet_stage": self.pet_stage,
                "new_badges": [],
            }

        prev_level = self.level
        prev_world = self.world_stage
        prev_pet = self.pet_stage
        prev_badges_count = len(self.badges)

        self.xp += amount_int
        self._trigger_event("xp_added", amount_int, self.xp)

        # Update dependent sub-systems
        self.update_level()
        self.update_world()
        self.update_pet()
        new_badges = self.update_badges()

        # Persist updated state
        self.save_data()

        return {
            "xp_added": amount_int,
            "total_xp": self.xp,
            "level": self.level,
            "level_up": self.level > prev_level,
            "levels_gained": max(0, self.level - prev_level),
            "world_stage": self.world_stage,
            "world_changed": self.world_stage != prev_world,
            "pet_stage": self.pet_stage,
            "pet_changed": self.pet_stage != prev_pet,
            "new_badges": new_badges,
        }

    def update_level(self, trigger_events: bool = True) -> int:
        """
        Recalculate the user's level based on current XP thresholds:
            Level 1: >= 0 XP
            Level 2: >= 100 XP
            Level 3: >= 250 XP
            Level 4: >= 500 XP
            Level 5: >= 1000 XP

        :param trigger_events: Whether to fire registered 'level_up' event listeners.
        :return: The current level.
        """
        target_level = 1
        # Check thresholds from highest to lowest
        for lvl in sorted(self.LEVEL_THRESHOLDS.keys(), reverse=True):
            if self.xp >= self.LEVEL_THRESHOLDS[lvl]:
                target_level = lvl
                break

        old_level = self.level
        self.level = target_level

        if trigger_events and self.level > old_level:
            self._trigger_event("level_up", old_level, self.level)

        return self.level

    def update_world(self, trigger_events: bool = True) -> str:
        """
        Update the Living World stage based on current level:
            Stage 1: Dead Planet
            Stage 2: Grassland
            Stage 3: Forest
            Stage 4: Wildlife Returns
            Stage 5: Eco City

        :param trigger_events: Whether to fire registered 'world_changed' event listeners.
        :return: Name of the current world stage.
        """
        stage_num = max(1, min(self.level, 5))
        new_stage = self.WORLD_STAGES.get(stage_num, self.WORLD_STAGES[1])
        old_stage = self.world_stage

        self.world_stage = new_stage

        if trigger_events and new_stage != old_stage:
            self._trigger_event("world_changed", old_stage, new_stage, stage_num)

        return self.world_stage

    def update_pet(self, trigger_events: bool = True) -> str:
        """
        Update the Eco Pet evolution stage based on current level:
            Stage 1: Baby Panda
            Stage 2: Young Panda
            Stage 3: Teen Panda
            Stage 4: Adult Panda
            Stage 5: Guardian Panda

        :param trigger_events: Whether to fire registered 'pet_changed' event listeners.
        :return: Name of the current pet stage.
        """
        stage_num = max(1, min(self.level, 5))
        new_stage = self.PET_STAGES.get(stage_num, self.PET_STAGES[1])
        old_stage = self.pet_stage

        self.pet_stage = new_stage

        if trigger_events and new_stage != old_stage:
            self._trigger_event("pet_changed", old_stage, new_stage, stage_num)

        return self.pet_stage

    def update_badges(self, trigger_events: bool = True) -> List[str]:
        """
        Check XP against badge milestones and award eligible badges:
            50 XP   -> Recycler Rookie
            200 XP  -> Water Warrior
            500 XP  -> Forest Hero
            1000 XP -> Planet Guardian

        :param trigger_events: Whether to fire registered 'badge_unlocked' event listeners.
        :return: List of newly unlocked badges in this check.
        """
        newly_awarded: List[str] = []
        for threshold_xp, badge_name in self.BADGE_THRESHOLDS:
            if self.xp >= threshold_xp and badge_name not in self.badges:
                self.badges.append(badge_name)
                newly_awarded.append(badge_name)
                if trigger_events:
                    self._trigger_event("badge_unlocked", badge_name)

        return newly_awarded

    # -------------------------------------------------------------------------
    # Auxiliary Helpers & Status Display
    # -------------------------------------------------------------------------

    def get_progress_to_next_level(self) -> Tuple[int, int, float]:
        """
        Calculate XP needed for the next level and percentage completion.

        :return: Tuple of (current_level_base_xp, next_level_xp, progress_ratio 0.0-1.0)
        """
        current_base = self.LEVEL_THRESHOLDS.get(self.level, 0)
        if self.level >= max(self.LEVEL_THRESHOLDS.keys()):
            # Max level reached
            return current_base, current_base, 1.0

        next_req = self.LEVEL_THRESHOLDS.get(self.level + 1, current_base)
        needed = next_req - current_base
        gained = self.xp - current_base
        ratio = min(1.0, max(0.0, gained / needed)) if needed > 0 else 1.0
        return current_base, next_req, ratio

    def to_dict(self) -> Dict[str, Any]:
        """
        Export engine state as a dictionary.

        :return: Dictionary containing xp, level, pet_stage, world_stage, badges.
        """
        return {
            "xp": self.xp,
            "level": self.level,
            "pet_stage": self.pet_stage,
            "world_stage": self.world_stage,
            "badges": list(self.badges),
        }

    def show_status(self, print_output: bool = True) -> str:
        """
        Format a child-friendly terminal dashboard showcasing all tracked metrics.

        :param print_output: If True, prints the status dashboard to standard output.
        :return: Formatted multi-line string representing the status dashboard.
        """
        _, next_xp, progress_ratio = self.get_progress_to_next_level()
        bar_length = 20
        filled = int(round(progress_ratio * bar_length))
        progress_bar = "█" * filled + "░" * (bar_length - filled)
        percent_str = f"{int(progress_ratio * 100)}%"

        if self.level >= 5:
            next_info = "MAX LEVEL REACHED!"
        else:
            next_info = f"{self.xp}/{next_xp} XP ({percent_str})"

        badge_display = ", ".join(self.badges) if self.badges else "No badges yet - start an adventure!"

        lines = [
            "╔══════════════════════════════════════════════════════════════════╗",
            "║                      🌍 ECOKIDS OS - ECO ENGINE 🐾               ║",
            "╠══════════════════════════════════════════════════════════════════╣",
            f"║  Level:       Level {self.level:<2} {'★' * self.level:<35} ║",
            f"║  Total XP:    {self.xp:<5} XP                                              ║",
            f"║  Progress:    [{progress_bar}] {next_info:<23} ║",
            "╟──────────────────────────────────────────────────────────────────╢",
            f"║  🐾 Eco Pet:    {self.pet_stage:<48} ║",
            f"║  🌱 World:      {self.world_stage:<48} ║",
            "╟──────────────────────────────────────────────────────────────────╢",
            f"║  🏅 Badges ({len(self.badges)}/4):                                              ║",
        ]

        # Display badges with bullet points
        all_badge_names = [b[1] for b in self.BADGE_THRESHOLDS]
        for threshold, name in self.BADGE_THRESHOLDS:
            unlocked = name in self.badges
            mark = "  ✓ [UNLOCKED]" if unlocked else "  ○ [LOCKED]  "
            lines.append(f"║    {mark} {name:<20} ({threshold:>4} XP)                   ║")

        lines.extend([
            "╚══════════════════════════════════════════════════════════════════╝",
        ])

        output = "\n".join(lines)
        if print_output:
            try:
                print(output)
            except UnicodeEncodeError:
                encoding = sys.stdout.encoding or "utf-8"
                print(output.encode(encoding, errors="replace").decode(encoding, errors="replace"))
        return output


# -----------------------------------------------------------------------------
# Command Line Interface (CLI) for Developer & Integration Testing
# -----------------------------------------------------------------------------

def _main() -> None:
    """CLI entry point for direct testing and debugging."""
    import argparse

    parser = argparse.ArgumentParser(description="EcoEngine CLI for EcoKids OS")
    parser.add_argument("--status", action="store_true", help="Display the current engine status")
    parser.add_argument("--add-xp", type=int, metavar="XP", help="Add experience points to the engine")
    parser.add_argument("--reset", action="store_true", help="Reset all progress back to defaults")
    parser.add_argument("--path", type=str, default=None, help="Custom path to eco_data.json")

    args = parser.parse_args()
    engine = EcoEngine(data_path=args.path)

    if args.reset:
        engine.reset_progress()
        print("EcoEngine progress reset successfully.")
        engine.show_status()
        return

    if args.add_xp is not None:
        result = engine.add_xp(args.add_xp)
        print(f"\n✨ Added {args.add_xp} XP! Total XP: {result['total_xp']}")
        if result["level_up"]:
            print(f"🎉 LEVEL UP! You reached Level {result['level']}!")
        if result["world_changed"]:
            print(f"🌍 World Evolved: {result['world_stage']}!")
        if result["pet_changed"]:
            print(f"🐾 Eco Pet Evolved: {result['pet_stage']}!")
        if result["new_badges"]:
            for b in result["new_badges"]:
                print(f"🏅 New Badge Unlocked: {b}!")
        print()

    # Default action or if --status specified
    engine.show_status()


if __name__ == "__main__":
    _main()
