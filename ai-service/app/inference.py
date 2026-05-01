from __future__ import annotations

from io import BytesIO
import os
from pathlib import Path
from typing import Any
from urllib.request import urlopen

import numpy as np
import torch
from PIL import Image
from torch import nn
from torchgeo.models import FCSiamDiff

_MODELS_DIR = Path(__file__).resolve().parents[1] / "models"


def _resolve_checkpoint_path() -> Path:
    """Prefer AI_MODEL_CHECKPOINT, then known filenames under models/."""
    env = os.getenv("AI_MODEL_CHECKPOINT", "").strip()
    if env:
        p = Path(env)
        if p.is_absolute():
            return p
        return (_MODELS_DIR / p).resolve()
    for name in ("levir_best.pth", "fc_siam_diff.pth"):
        candidate = _MODELS_DIR / name
        if candidate.exists() and candidate.stat().st_size > 0:
            return candidate
    return _MODELS_DIR / "fc_siam_diff.pth"


MODEL_PATH = _resolve_checkpoint_path()
IMAGE_SIZE = (256, 256)
MASK_THRESHOLD = 0.5
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
USE_IMAGENET_FALLBACK = os.getenv("AI_USE_IMAGENET_WEIGHTS", "true").lower() == "true"
MODEL_DOWNLOAD_URL = os.getenv("AI_MODEL_CHECKPOINT_URL", "").strip()
MODEL_DOWNLOAD_TIMEOUT_SECONDS = int(os.getenv("AI_MODEL_DOWNLOAD_TIMEOUT_SECONDS", "120"))
MODEL_INIT_SEED = int(os.getenv("AI_MODEL_INIT_SEED", "42"))

_model: nn.Module | None = None


def _extract_state_dict(ckpt: Any) -> dict[str, torch.Tensor]:
    if isinstance(ckpt, dict):
        for key in ("state_dict", "model_state_dict", "model", "net"):
            candidate = ckpt.get(key)
            if isinstance(candidate, dict):
                return candidate
        # Direct state dict format
        if ckpt and all(isinstance(v, torch.Tensor) for v in ckpt.values()):
            return ckpt
    raise ValueError("Unsupported checkpoint format for FC-Siam-Diff weights")


def _build_model() -> nn.Module:
    # TorchGeo can bootstrap from ImageNet encoder weights when custom
    # FC-Siam-Diff checkpoints are unavailable.
    return FCSiamDiff(
        encoder_name="resnet34",
        encoder_weights="imagenet" if USE_IMAGENET_FALLBACK else None,
        in_channels=3,
        classes=1,
    )


def _ensure_checkpoint_from_url_if_needed() -> bool:
    has_checkpoint = MODEL_PATH.exists() and MODEL_PATH.stat().st_size > 0
    if has_checkpoint:
        return True

    if not MODEL_DOWNLOAD_URL:
        return False

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    print(f"[ai-service] Downloading checkpoint from AI_MODEL_CHECKPOINT_URL -> {MODEL_PATH}")

    with urlopen(MODEL_DOWNLOAD_URL, timeout=MODEL_DOWNLOAD_TIMEOUT_SECONDS) as response:
        data = response.read()

    if not data:
        raise RuntimeError("Downloaded checkpoint is empty")
    if data.lstrip().startswith(b"<"):
        raise RuntimeError(
            "Downloaded content looks like HTML, not a model file. "
            "Check AI_MODEL_CHECKPOINT_URL direct download link."
        )

    MODEL_PATH.write_bytes(data)
    print(f"[ai-service] Checkpoint downloaded successfully ({len(data)} bytes)")
    return True


def load_model() -> nn.Module:
    global _model
    if _model is not None:
        return _model

    # Ensure deterministic initialization for any layers not loaded from checkpoint.
    torch.manual_seed(MODEL_INIT_SEED)
    np.random.seed(MODEL_INIT_SEED)
    model = _build_model().to(DEVICE)
    model_version = "torchgeo-imagenet"

    has_checkpoint = _ensure_checkpoint_from_url_if_needed()
    if has_checkpoint:
        checkpoint = torch.load(MODEL_PATH, map_location=DEVICE)
        state_dict = _extract_state_dict(checkpoint)
        model.load_state_dict(state_dict, strict=False)
        model_version = f"custom-checkpoint:{MODEL_PATH.name}"
    else:
        print(
            "[ai-service] No non-empty checkpoint in models/ (or AI_MODEL_CHECKPOINT); "
            "using TorchGeo ImageNet encoder weights."
        )

    model.eval()
    setattr(model, "_model_version", model_version)
    _model = model
    return _model


def get_runtime_inference_info() -> dict[str, object]:
    has_checkpoint = MODEL_PATH.exists() and MODEL_PATH.stat().st_size > 0
    return {
        "modelPath": str(MODEL_PATH),
        "checkpointExists": has_checkpoint,
        "checkpointSizeBytes": MODEL_PATH.stat().st_size if has_checkpoint else 0,
        "device": str(DEVICE),
        "maskThreshold": MASK_THRESHOLD,
        "usesImagenetFallback": USE_IMAGENET_FALLBACK,
        "downloadUrlConfigured": bool(MODEL_DOWNLOAD_URL),
    }


def _preprocess_image(image_bytes: bytes) -> torch.Tensor:
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    image = image.resize(IMAGE_SIZE, Image.BILINEAR)
    arr = np.asarray(image, dtype=np.float32) / 255.0
    arr = arr.transpose(2, 0, 1)  # HWC -> CHW
    return torch.from_numpy(arr)


def predict_change_mask(before_bytes: bytes, after_bytes: bytes) -> np.ndarray:
    model = load_model()

    before_tensor = _preprocess_image(before_bytes)
    after_tensor = _preprocess_image(after_bytes)

    # FCSiamDiff expects (B, T, C, H, W), T=2 for before/after
    x = torch.stack([before_tensor, after_tensor], dim=0).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        logits = model(x)
        probs = torch.sigmoid(logits).squeeze().detach().cpu().numpy()

    mask = (probs >= MASK_THRESHOLD).astype(np.uint8)
    return mask
