import { Jimp, rgbaToInt } from 'jimp';
import type { BoundingBoxCoordinates } from './ai-inference.service.js';

type JimpImage = Awaited<ReturnType<typeof Jimp.read>>;

type AnnotatedImageResult = {
  buffer: Buffer;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  width: number;
  height: number;
};

const BORDER_THICKNESS = 4;

const getMimeTypeByExtension = (fileName: string) => {
  const extension = fileName.toLowerCase().split('.').pop();
  if (extension === 'png') return 'image/png';
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'bmp') return 'image/bmp';
  if (extension === 'tiff' || extension === 'tif') return 'image/tiff';
  return 'image/png';
};

const ensureResultFileName = (sourceFileName: string) => {
  const extension = sourceFileName.includes('.')
    ? `.${sourceFileName.split('.').pop()?.toLowerCase()}`
    : '.png';
  const baseName = sourceFileName.replace(/\.[^/.]+$/, '') || 'analysis-image';
  return `${baseName}-result-${Date.now()}${extension}`;
};

const getJimpOutputFormat = (mimeType: string) => {
  if (mimeType === 'image/jpeg') return 'image/jpeg';
  if (mimeType === 'image/bmp') return 'image/bmp';
  if (mimeType === 'image/tiff') return 'image/tiff';
  return 'image/png';
};

const sortCoordinates = (coordinates: BoundingBoxCoordinates) => ({
  x1: Math.min(coordinates.x1, coordinates.x2),
  y1: Math.min(coordinates.y1, coordinates.y2),
  x2: Math.max(coordinates.x1, coordinates.x2),
  y2: Math.max(coordinates.y1, coordinates.y2),
});

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

const drawRectangle = (
  image: JimpImage,
  coordinates: BoundingBoxCoordinates,
  color: number
) => {
  const ordered = sortCoordinates(coordinates);
  const width = image.bitmap.width;
  const height = image.bitmap.height;

  const x1 = clamp(Math.round(ordered.x1), 0, width - 1);
  const y1 = clamp(Math.round(ordered.y1), 0, height - 1);
  const x2 = clamp(Math.round(ordered.x2), 0, width - 1);
  const y2 = clamp(Math.round(ordered.y2), 0, height - 1);

  for (let offset = 0; offset < BORDER_THICKNESS; offset += 1) {
    const topY = clamp(y1 + offset, 0, height - 1);
    const bottomY = clamp(y2 - offset, 0, height - 1);
    for (let x = x1; x <= x2; x += 1) {
      image.setPixelColor(color, x, topY);
      image.setPixelColor(color, x, bottomY);
    }

    const leftX = clamp(x1 + offset, 0, width - 1);
    const rightX = clamp(x2 - offset, 0, width - 1);
    for (let y = y1; y <= y2; y += 1) {
      image.setPixelColor(color, leftX, y);
      image.setPixelColor(color, rightX, y);
    }
  }
};

export const createAnnotatedResultImage = async (
  afterImageBuffer: Buffer,
  afterImageFileName: string,
  coordinates: BoundingBoxCoordinates | null
): Promise<AnnotatedImageResult> => {
  const image = await Jimp.read(afterImageBuffer);
  const resultFileName = ensureResultFileName(afterImageFileName);
  const mimeType = getMimeTypeByExtension(resultFileName);

  if (!coordinates) {
    return {
      buffer: afterImageBuffer,
      fileName: resultFileName,
      fileSizeBytes: afterImageBuffer.length,
      mimeType,
      width: image.bitmap.width,
      height: image.bitmap.height,
    };
  }

  const borderColor = rgbaToInt(255, 0, 0, 255);
  drawRectangle(image, coordinates, borderColor);
  const outputMime = getJimpOutputFormat(mimeType);
  const outputBuffer = await image.getBuffer(outputMime);
  return {
    buffer: outputBuffer,
    fileName: resultFileName,
    fileSizeBytes: outputBuffer.length,
    mimeType,
    width: image.bitmap.width,
    height: image.bitmap.height,
  };
};
