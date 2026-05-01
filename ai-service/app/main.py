from __future__ import annotations

import logging
import os
import time
from uuid import uuid4
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Header, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from .inference import get_runtime_inference_info, load_model, predict_change_mask
from .postprocess import mask_to_boxes

INTERNAL_API_KEY = os.getenv("AI_SERVICE_API_KEY")
logger = logging.getLogger("ai-service")
logging.basicConfig(level=os.getenv("AI_LOG_LEVEL", "INFO").upper())


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Load the model once on startup so requests stay fast.
    logger.info(
        "AI service starting",
        extra={
            "env": os.getenv("NODE_ENV", "unknown"),
            "internalAuthEnabled": bool(INTERNAL_API_KEY),
        },
    )
    model = load_model()
    logger.info(
        "Model loaded",
        extra={
            "modelVersion": getattr(model, "_model_version", "unknown"),
            **get_runtime_inference_info(),
        },
    )
    yield


app = FastAPI(title="AI Inference Service", version="1.0.0", lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.middleware("http")
async def request_observability_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id", str(uuid4()))
    start = time.perf_counter()
    logger.info("Request started: %s %s [id=%s]", request.method, request.url.path, request_id)
    try:
        response = await call_next(request)
    except Exception:  # noqa: BLE001
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.exception(
            "Request crashed: %s %s [id=%s, durationMs=%s]",
            request.method,
            request.url.path,
            request_id,
            elapsed_ms,
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal AI service error", "requestId": request_id},
        )

    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.info(
        "Request completed: %s %s -> %s [id=%s, durationMs=%s]",
        request.method,
        request.url.path,
        response.status_code,
        request_id,
        elapsed_ms,
    )
    response.headers["x-request-id"] = request_id
    return response


@app.post("/predict")
async def predict(
    beforeImage: UploadFile = File(...),
    afterImage: UploadFile = File(...),
    x_internal_api_key: str | None = Header(default=None),
) -> dict[str, object]:
    if INTERNAL_API_KEY and x_internal_api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized internal request")

    before_bytes = await beforeImage.read()
    after_bytes = await afterImage.read()
    if not before_bytes or not after_bytes:
        raise HTTPException(status_code=400, detail="Both beforeImage and afterImage are required")

    try:
        model = load_model()
        mask = predict_change_mask(before_bytes, after_bytes)
        coordinates = mask_to_boxes(mask)
        logger.info(
            "Inference complete",
            extra={
                "anomalyDetected": len(coordinates) > 0,
                "boxesCount": len(coordinates),
                "modelVersion": getattr(model, "_model_version", "unknown"),
            },
        )
        return {
            "anomalyDetected": len(coordinates) > 0,
            "coordinates": coordinates,
            "modelName": "FCSiamDiff",
            "modelVersion": getattr(model, "_model_version", "unknown"),
        }
    except Exception as exc:  # noqa: BLE001
        logger.exception("Inference failed")
        raise HTTPException(status_code=500, detail=f"Inference failed: {exc}") from exc
