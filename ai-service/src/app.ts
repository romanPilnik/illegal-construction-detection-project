import express from 'express';
import multer from 'multer';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const INTERNAL_API_KEY = process.env.AI_SERVICE_API_KEY;

type BoundingBox = { x1: number; y1: number; x2: number; y2: number };
type PredictResponse = {
  anomalyDetected: boolean;
  coordinates: Partial<BoundingBox>;
};

const ensureInternalAuth = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!INTERNAL_API_KEY) {
    next();
    return;
  }

  if (req.headers['x-internal-api-key'] !== INTERNAL_API_KEY) {
    res.status(401).json({ error: 'Unauthorized internal request' });
    return;
  }

  next();
};

const runModelInference = async (
  _beforeImage: Buffer,
  _afterImage: Buffer
): Promise<PredictResponse> => {
  // TODO: Replace with real model call. For now we return "no anomaly" with empty coords.
  return { anomalyDetected: false, coordinates: {} };
};

app.post(
  '/predict',
  ensureInternalAuth,
  upload.fields([
    { name: 'beforeImage', maxCount: 1 },
    { name: 'afterImage', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const files = req.files as { [field: string]: Express.Multer.File[] };
      const beforeImage = files?.beforeImage?.[0];
      const afterImage = files?.afterImage?.[0];

      if (!beforeImage || !afterImage) {
        res.status(400).json({ error: 'Both beforeImage and afterImage are required' });
        return;
      }

      const result = await runModelInference(beforeImage.buffer, afterImage.buffer);
      res.status(200).json(result);
    } catch (error) {
      console.error('AI service inference failed:', error);
      res.status(500).json({ error: 'Inference failed' });
    }
  }
);

export default app;
