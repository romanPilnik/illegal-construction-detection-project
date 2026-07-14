import path from 'path';

export type BoundingBoxCoordinates = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type RawInferenceResponse = {
  anomalyDetected: boolean;
  coordinates?:
    | Partial<BoundingBoxCoordinates>
    | Array<{
        x?: number;
        y?: number;
        width?: number;
        height?: number;
      }>
    | null;
};

const parseInferenceResponse = (value: unknown): RawInferenceResponse => {
  if (!value || typeof value !== 'object') {
    throw new Error('AI service returned an invalid response');
  }

  const payload = value as Record<string, unknown>;
  if (typeof payload.anomalyDetected !== 'boolean') {
    throw new Error('AI service returned an invalid anomaly result');
  }

  return payload as RawInferenceResponse;
};

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || 'http://localhost:5002/predict';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY;

/** Default wait for AI forward pass + transfer; override with AI_SERVICE_TIMEOUT_MS. */
const DEFAULT_AI_SERVICE_TIMEOUT_MS = 180_000;
const MAX_AI_SERVICE_TIMEOUT_MS = 3_600_000;

const getAiServiceTimeoutMs = (): number | null => {
  const raw = process.env.AI_SERVICE_TIMEOUT_MS?.trim();
  if (raw === undefined || raw === '') {
    return DEFAULT_AI_SERVICE_TIMEOUT_MS;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return DEFAULT_AI_SERVICE_TIMEOUT_MS;
  }
  if (n === 0) {
    return null;
  }
  return Math.min(n, MAX_AI_SERVICE_TIMEOUT_MS);
};

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

  if (Array.isArray(coordinates)) {
    const first = coordinates[0];
    if (!first) {
      return null;
    }

    const x = toNumericCoordinate(first.x);
    const y = toNumericCoordinate(first.y);
    const width = toNumericCoordinate(first.width);
    const height = toNumericCoordinate(first.height);

    if (x === null || y === null || width === null || height === null) {
      return null;
    }

    return {
      x1: x,
      y1: y,
      x2: x + width,
      y2: y + height,
    };
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
  beforeImageBuffer: Buffer,
  afterImageBuffer: Buffer,
  beforeImageName: string,
  afterImageName: string
) => {
  const formData = new FormData();
  formData.append(
    'beforeImage',
    new Blob([new Uint8Array(beforeImageBuffer)]),
    path.basename(beforeImageName)
  );
  formData.append(
    'afterImage',
    new Blob([new Uint8Array(afterImageBuffer)]),
    path.basename(afterImageName)
  );

  const headers: Record<string, string> = {};
  if (AI_SERVICE_API_KEY) {
    headers['x-internal-api-key'] = AI_SERVICE_API_KEY;
  }

  const timeoutMs = getAiServiceTimeoutMs();
  const fetchInit: RequestInit = {
    method: 'POST',
    body: formData,
    headers,
  };

  let response: Response;
  if (timeoutMs === null) {
    response = await fetch(AI_SERVICE_URL, fetchInit);
  } else {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      response = await fetch(AI_SERVICE_URL, {
        ...fetchInit,
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          `AI service request timed out after ${timeoutMs}ms (configure AI_SERVICE_TIMEOUT_MS)`
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (!response.ok) {
    throw new Error(`AI service failed with status ${response.status}`);
  }

  let rawPayload: unknown;
  try {
    rawPayload = await response.json();
  } catch {
    throw new Error('AI service returned invalid JSON');
  }

  const payload = parseInferenceResponse(rawPayload);
  const coordinates = normalizeCoordinates(payload.coordinates);

  if (
    payload.coordinates !== undefined &&
    payload.coordinates !== null &&
    !(Array.isArray(payload.coordinates) && payload.coordinates.length === 0) &&
    coordinates === null
  ) {
    throw new Error('AI service returned invalid coordinates');
  }

  return {
    anomalyDetected: payload.anomalyDetected,
    coordinates,
  };
};
