# AI Service (FC-Siam-Diff via TorchGeo)

This service is a standalone Python/FastAPI microservice for AI inference.

It receives a pair of images (`beforeImage`, `afterImage`) and returns change-detection results as bounding boxes.

## What this service does

- Loads a pre-trained FC-Siam-Diff-style model using `torchgeo.models.FCSiamDiff`
- Accepts internal REST requests from the main Node.js backend
- Runs inference and post-processing (mask -> boxes)
- Returns JSON with:
  - `anomalyDetected`
  - `coordinates`
  - `modelName`
  - `modelVersion`

## Project structure

- `app/main.py` - FastAPI app and endpoints
- `app/inference.py` - model loading and inference logic
- `app/postprocess.py` - mask to bounding boxes conversion
- `models/fc_siam_diff.pth` or `models/levir_best.pth` - optional checkpoints (see below)
- `requirements.txt` - Python dependencies
- `Dockerfile` - container runtime

## Requirements

- Python 3.11+
- Optional custom checkpoints under `models/` (non-empty files only):
  - **`levir_best.pth`** is preferred if present (e.g. LeVIR-trained weights you place next to the service).
  - Otherwise **`fc_siam_diff.pth`** is used when present.
- Override path explicitly with **`AI_MODEL_CHECKPOINT`**: absolute path, or a name/path relative to `models/` (e.g. `levir_best.pth` or `my_weights.pth`).
- If no valid checkpoint is found, the service falls back to TorchGeo ImageNet encoder weights.

## Install and run locally

From `ai-service/`:

```bash
# PyTorch first (CPU wheels below; for NVIDIA GPU use https://download.pytorch.org/whl/cu124 etc.)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 5002
```

Docker builds install CPU-only PyTorch automatically (see `Dockerfile`).

Health check:

- `GET http://localhost:5002/health`

## API

### `POST /predict`

Multipart form-data fields:

- `beforeImage` (file, required)
- `afterImage` (file, required)

Optional internal auth header:

- `x-internal-api-key: <AI_SERVICE_API_KEY>`

If `AI_SERVICE_API_KEY` is set in environment, this header is required.

Example response:

```json
{
  "anomalyDetected": true,
  "coordinates": [
    { "x": 114, "y": 88, "width": 49, "height": 36, "confidence": 0.91 }
  ],
  "modelName": "FCSiamDiff",
  "modelVersion": "torchgeo"
}
```

## Docker

Build:

```bash
docker build -t ai-service .
```

Run:

```bash
docker run --rm -p 5002:5002 -e AI_SERVICE_API_KEY=change-me ai-service
```

## Model loading behavior

- Default behavior uses `AI_USE_IMAGENET_WEIGHTS=true`.
- **`AI_MODEL_CHECKPOINT`** takes priority when set.
- Otherwise the service picks the first existing non-empty file in order: `models/levir_best.pth`, then `models/fc_siam_diff.pth`.
- If no checkpoint applies, the service starts with a TorchGeo ImageNet-initialized encoder.
- Response includes `modelVersion` as either:
  - `custom-checkpoint`
  - `torchgeo-imagenet`

## Important notes

- Custom checkpoint and model configuration must be compatible.
- Current inference code loads custom checkpoints with `strict=False` to reduce hard failures while validating compatibility.
- For production, prefer validating checkpoint compatibility and tightening loading behavior.

## Integration with Node backend

Configure your server environment:

- `AI_SERVICE_URL=http://ai-service:5002/predict` (Docker network)
- `AI_SERVICE_API_KEY=<same-secret-as-ai-service>`

The Node backend should send `beforeImage` and `afterImage` via multipart request to `/predict`.
