import { afterEach, describe, expect, it, jest } from '@jest/globals';

const readMock = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const rgbaToIntMock = jest.fn(() => 0xff0000ff);

jest.unstable_mockModule('jimp', () => ({
  Jimp: { read: readMock },
  rgbaToInt: rgbaToIntMock,
}));

const { createAnnotatedResultImage } = await import(
  '../services/image-annotator.service.js'
);

describe('createAnnotatedResultImage', () => {
  afterEach(() => {
    readMock.mockReset();
    rgbaToIntMock.mockClear();
    jest.restoreAllMocks();
  });

  it('returns the original image when no box is provided', async () => {
    const source = Buffer.from('source');
    readMock.mockResolvedValue({ bitmap: { width: 40, height: 20 } });
    jest.spyOn(Date, 'now').mockReturnValue(100);

    const result = await createAnnotatedResultImage(source, 'after.JPG', null);

    expect(result).toEqual({
      buffer: source,
      fileName: 'after-result-100.jpg',
      fileSizeBytes: source.length,
      mimeType: 'image/jpeg',
      width: 40,
      height: 20,
    });
  });

  it('sorts and clamps coordinates before drawing a red border', async () => {
    const setPixelColor = jest.fn();
    const output = Buffer.from('annotated');
    const getBuffer = jest.fn<(...args: unknown[]) => Promise<Buffer>>();
    getBuffer.mockResolvedValue(output);
    readMock.mockResolvedValue({
      bitmap: { width: 5, height: 4 },
      setPixelColor,
      getBuffer,
    });
    jest.spyOn(Date, 'now').mockReturnValue(200);

    const result = await createAnnotatedResultImage(
      Buffer.from('source'),
      'after.png',
      { x1: 10, y1: 8, x2: -2, y2: -3 }
    );

    expect(rgbaToIntMock).toHaveBeenCalledWith(255, 0, 0, 255);
    expect(setPixelColor).toHaveBeenCalled();
    for (const [, x, y] of setPixelColor.mock.calls) {
      expect(x).toEqual(expect.any(Number));
      expect(y).toEqual(expect.any(Number));
      expect(x as number).toBeGreaterThanOrEqual(0);
      expect(x as number).toBeLessThan(5);
      expect(y as number).toBeGreaterThanOrEqual(0);
      expect(y as number).toBeLessThan(4);
    }
    expect(getBuffer).toHaveBeenCalledWith('image/png');
    expect(result.buffer).toBe(output);
    expect(result.fileName).toBe('after-result-200.png');
  });
});
