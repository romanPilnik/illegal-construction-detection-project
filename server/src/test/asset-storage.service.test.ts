import { afterEach, describe, expect, it, jest } from '@jest/globals';

const mkdirMock = jest.fn<(...args: unknown[]) => Promise<void>>();
const writeFileMock = jest.fn<(...args: unknown[]) => Promise<void>>();

jest.unstable_mockModule('fs', () => ({
  promises: {
    mkdir: mkdirMock,
    writeFile: writeFileMock,
  },
}));

delete process.env.AWS_REGION;
delete process.env.S3_UPLOADS_BUCKET;
delete process.env.S3_PUBLIC_BASE_URL;

const { uploadImageAsset } = await import('../services/asset-storage.service.js');

describe('uploadImageAsset local storage', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mkdirMock.mockReset();
    writeFileMock.mockReset();
  });

  it('creates a normalized image path and writes the supplied bytes', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(123);
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const buffer = Buffer.from('image');

    const result = await uploadImageAsset({
      buffer,
      mimeType: 'image/png',
      originalName: 'PHOTO.PNG',
      category: 'before',
    });

    expect(result).toEqual({
      filePath: 'uploads/before/before-123-500000000.png',
      fileSizeBytes: 5,
      mimeType: 'image/png',
    });
    expect(mkdirMock).toHaveBeenCalledWith(
      expect.stringContaining('uploads/before'),
      { recursive: true }
    );
    expect(writeFileMock).toHaveBeenCalledWith(
      expect.stringContaining('before-123-500000000.png'),
      buffer
    );
  });

  it('uses a MIME-derived extension when the source has none', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(10);
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const result = await uploadImageAsset({
      buffer: Buffer.from('x'),
      mimeType: 'image/jpeg',
      originalName: 'camera-upload',
      category: 'after',
    });

    expect(result.filePath).toBe('uploads/after/after-10-0.jpg');
  });

  it('propagates disk failures to the caller', async () => {
    mkdirMock.mockRejectedValueOnce(new Error('disk unavailable'));

    await expect(
      uploadImageAsset({
        buffer: Buffer.from('x'),
        mimeType: 'image/webp',
        originalName: 'image',
        category: 'result',
      })
    ).rejects.toThrow('disk unavailable');
  });
});
