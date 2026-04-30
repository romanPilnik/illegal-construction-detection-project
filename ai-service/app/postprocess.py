from __future__ import annotations

from typing import Any

import cv2
import numpy as np

MIN_BOX_AREA = 64


def mask_to_boxes(mask: np.ndarray) -> list[dict[str, Any]]:
    if mask.ndim != 2:
        raise ValueError("Expected a 2D mask")

    mask_u8 = (mask > 0).astype(np.uint8) * 255
    kernel = np.ones((3, 3), np.uint8)
    cleaned = cv2.morphologyEx(mask_u8, cv2.MORPH_OPEN, kernel)
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    boxes: list[dict[str, Any]] = []
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        area = int(w * h)
        if area < MIN_BOX_AREA:
            continue

        region = cleaned[y : y + h, x : x + w]
        confidence = float(region.mean() / 255.0)
        boxes.append(
            {
                "x": int(x),
                "y": int(y),
                "width": int(w),
                "height": int(h),
                "confidence": round(confidence, 4),
            }
        )

    return boxes
