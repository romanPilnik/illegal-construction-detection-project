from __future__ import annotations

import io
import json
import os
import unittest
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image

from app.inference import load_model, predict_change_mask
from app.postprocess import mask_to_boxes

BASELINE_PATH = Path(__file__).parent / "baselines" / "model_regression_baseline.json"
UPDATE_BASELINE = os.getenv("AI_REGRESSION_UPDATE_BASELINE", "false").lower() == "true"


def _make_image_bytes(arr: np.ndarray) -> bytes:
    image = Image.fromarray(arr.astype(np.uint8), mode="RGB")
    out = io.BytesIO()
    image.save(out, format="PNG")
    return out.getvalue()


def _create_fixture_pairs() -> dict[str, tuple[bytes, bytes]]:
    base = np.full((256, 256, 3), 120, dtype=np.uint8)

    # Fixture A: no visual change
    before_same = base.copy()
    after_same = base.copy()

    # Fixture B: deterministic changed region in "after"
    before_changed = base.copy()
    after_changed = base.copy()
    after_changed[96:168, 112:184] = np.array([240, 30, 30], dtype=np.uint8)

    # Fixture C: mild localized brightness drift
    before_brightness = base.copy()
    after_brightness = base.copy()
    patch = after_brightness[60:120, 60:120].astype(np.int16)
    patch = np.clip(patch + 35, 0, 255).astype(np.uint8)
    after_brightness[60:120, 60:120] = patch

    return {
        "no_change": (_make_image_bytes(before_same), _make_image_bytes(after_same)),
        "hard_change_patch": (
            _make_image_bytes(before_changed),
            _make_image_bytes(after_changed),
        ),
        "brightness_patch": (
            _make_image_bytes(before_brightness),
            _make_image_bytes(after_brightness),
        ),
    }


def _normalize_boxes(boxes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for box in boxes:
        normalized.append(
            {
                "x": int(box["x"]),
                "y": int(box["y"]),
                "width": int(box["width"]),
                "height": int(box["height"]),
                "confidence": round(float(box["confidence"]), 6),
            }
        )
    normalized.sort(key=lambda b: (b["x"], b["y"], b["width"], b["height"]))
    return normalized


def _run_snapshot() -> dict[str, Any]:
    model = load_model()
    model_version = str(getattr(model, "_model_version", "unknown"))
    fixtures = _create_fixture_pairs()
    cases: dict[str, Any] = {}

    for name, (before_bytes, after_bytes) in fixtures.items():
        mask = predict_change_mask(before_bytes, after_bytes)
        boxes = _normalize_boxes(mask_to_boxes(mask))
        cases[name] = {
            "anomalyDetected": len(boxes) > 0,
            "boxesCount": len(boxes),
            # Useful stable aggregate for regression diffs
            "maskPositivePixels": int(mask.sum()),
            "coordinates": boxes,
        }

    return {"modelVersion": model_version, "cases": cases}


class ModelRegressionTests(unittest.TestCase):
    maxDiff = None

    def test_prediction_output_contract(self) -> None:
        snapshot = _run_snapshot()
        self.assertIn("modelVersion", snapshot)
        self.assertIsInstance(snapshot["modelVersion"], str)
        self.assertIn("cases", snapshot)
        self.assertTrue(snapshot["cases"])

        for case_name, case in snapshot["cases"].items():
            self.assertIsInstance(case_name, str)
            self.assertIn("anomalyDetected", case)
            self.assertIn("boxesCount", case)
            self.assertIn("maskPositivePixels", case)
            self.assertIn("coordinates", case)
            self.assertIsInstance(case["anomalyDetected"], bool)
            self.assertIsInstance(case["boxesCount"], int)
            self.assertIsInstance(case["maskPositivePixels"], int)
            self.assertIsInstance(case["coordinates"], list)

    def test_regression_against_baseline(self) -> None:
        snapshot = _run_snapshot()

        if UPDATE_BASELINE:
            BASELINE_PATH.parent.mkdir(parents=True, exist_ok=True)
            BASELINE_PATH.write_text(
                json.dumps(snapshot, indent=2, sort_keys=True), encoding="utf-8"
            )
            self.skipTest(f"Baseline updated at {BASELINE_PATH}")

        if not BASELINE_PATH.exists():
            self.fail(
                "Regression baseline file is missing. "
                "Run `AI_REGRESSION_UPDATE_BASELINE=true python -m unittest "
                "tests.model_regression_test -v` inside ai-service to generate it."
            )

        baseline = json.loads(BASELINE_PATH.read_text(encoding="utf-8"))
        self.assertEqual(snapshot, baseline)


if __name__ == "__main__":
    unittest.main()
