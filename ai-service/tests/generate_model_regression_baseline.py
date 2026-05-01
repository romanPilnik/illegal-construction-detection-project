from __future__ import annotations

import json
from pathlib import Path

from tests.model_regression_test import BASELINE_PATH, _run_snapshot


def main() -> None:
    snapshot = _run_snapshot()
    BASELINE_PATH.parent.mkdir(parents=True, exist_ok=True)
    BASELINE_PATH.write_text(
        json.dumps(snapshot, indent=2, sort_keys=True),
        encoding="utf-8",
    )
    print(f"Baseline written to {Path(BASELINE_PATH).resolve()}")
    print(f"Model version: {snapshot['modelVersion']}")


if __name__ == "__main__":
    main()
