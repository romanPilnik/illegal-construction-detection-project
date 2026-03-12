import path from 'path';
import { promises as fs } from 'fs';
import { Jimp, rgbaToInt } from 'jimp';
import type { BoundingBoxCoordinates } from './ai-inference.service.js';

type JimpImage = Awaited<ReturnType<typeof Jimp.read>>;

type AnnotatedImageResult = {
  filePath: string;
  fileSizeBytes: number;
  mimeType: string;
  width: number;
  height: number;
};

const BORDER_THICKNESS = 4;

const resolveStoredPath = (filePath: string) =>
  path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

const toStoredPath = (absolutePath: string) =>
  path.relative(process.cwd(), absolutePath);

const getMimeTypeByExtension = (filePath: string) => {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.png') return 'image/png';
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.bmp') return 'image/bmp';
  if (extension === '.tiff' || extension === '.tif') return 'image/tiff';
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

const getResultPath = (afterImagePath: string) => {
  const afterImageFileName = path.basename(afterImagePath);
  const extension = path.extname(afterImageFileName);
  const fileNameWithoutExt = path.basename(afterImageFileName, extension);
  const resultFileName = `${fileNameWithoutExt}-result-${Date.now()}${extension || '.png'}`;
  const resultsDir = path.resolve(process.cwd(), 'uploads', 'results');
  const absoluteResultPath = path.join(resultsDir, resultFileName);

  return { resultsDir, absoluteResultPath };
};

export const createAnnotatedResultImage = async (
  afterImagePath: string,
  coordinates: BoundingBoxCoordinates | null
): Promise<AnnotatedImageResult> => {
  const absoluteAfterPath = resolveStoredPath(afterImagePath);
  const { resultsDir, absoluteResultPath } = getResultPath(afterImagePath);
  await fs.mkdir(resultsDir, { recursive: true });

  if (!coordinates) {
    await fs.copyFile(absoluteAfterPath, absoluteResultPath);
    const fileStats = await fs.stat(absoluteResultPath);
    const originalImage = await Jimp.read(absoluteAfterPath);

    return {
      filePath: toStoredPath(absoluteResultPath),
      fileSizeBytes: fileStats.size,
      mimeType: getMimeTypeByExtension(absoluteResultPath),
      width: originalImage.bitmap.width,
      height: originalImage.bitmap.height,
    };
  }

  const image = await Jimp.read(absoluteAfterPath);
  const borderColor = rgbaToInt(255, 0, 0, 255);
  drawRectangle(image, coordinates, borderColor);
  await image.write(absoluteResultPath as `${string}.${string}`);

  const fileStats = await fs.stat(absoluteResultPath);
  return {
    filePath: toStoredPath(absoluteResultPath),
    fileSizeBytes: fileStats.size,
    mimeType: getMimeTypeByExtension(absoluteResultPath),
    width: image.bitmap.width,
    height: image.bitmap.height,
  };
};
