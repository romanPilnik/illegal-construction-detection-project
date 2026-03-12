import path from 'path';
import { promises as fs } from 'fs';

export type BoundingBoxCoordinates = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type RawInferenceResponse = {
  anomalyDetected: boolean;
  coordinates?: Partial<BoundingBoxCoordinates> | null;
};

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || 'http://localhost:5002/predict';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY;

const resolveStoredPath = (filePath: string) =>
  path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

const toNumericCoordinate = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  return null;
};

const normalizeCoordinates = (
  coordinates: RawInferenceResponse['coordinates']
): BoundingBoxCoordinates | null => {
  if (!coordinates) {
    return null;
  }

  const x1 = toNumericCoordinate(coordinates.x1);
  const y1 = toNumericCoordinate(coordinates.y1);
  const x2 = toNumericCoordinate(coordinates.x2);
  const y2 = toNumericCoordinate(coordinates.y2);

  if (x1 === null || y1 === null || x2 === null || y2 === null) {
    return null;
  }

  return { x1, y1, x2, y2 };
};

export const requestAIInference = async (
  beforeImagePath: string,
  afterImagePath: string
) => {
  const [beforeImageBuffer, afterImageBuffer] = await Promise.all([
    fs.readFile(resolveStoredPath(beforeImagePath)),
    fs.readFile(resolveStoredPath(afterImagePath)),
  ]);

  const formData = new FormData();
  formData.append(
    'beforeImage',
    new Blob([beforeImageBuffer]),
    path.basename(beforeImagePath)
  );
  formData.append(
    'afterImage',
    new Blob([afterImageBuffer]),
    path.basename(afterImagePath)
  );

  const headers: Record<string, string> = {};
  if (AI_SERVICE_API_KEY) {
    headers['x-internal-api-key'] = AI_SERVICE_API_KEY;
  }

  const response = await fetch(AI_SERVICE_URL, {
    method: 'POST',
    body: formData,
    headers,
  });

  if (!response.ok) {
    throw new Error(`AI service failed with status ${response.status}`);
  }

  const payload = (await response.json()) as RawInferenceResponse;
  const coordinates = normalizeCoordinates(payload.coordinates);

  return {
    anomalyDetected: Boolean(payload.anomalyDetected),
    coordinates,
  };
};
