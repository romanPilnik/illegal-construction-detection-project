import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import path from 'path';
import { promises as fs } from 'fs';

type UploadAssetInput = {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  category: 'before' | 'after' | 'result';
};

type UploadedAsset = {
  filePath: string;
  fileSizeBytes: number;
  mimeType: string;
};

const AWS_REGION = process.env.AWS_REGION;
const S3_UPLOADS_BUCKET = process.env.S3_UPLOADS_BUCKET;
const S3_PUBLIC_BASE_URL = process.env.S3_PUBLIC_BASE_URL;

const s3Client =
  AWS_REGION && S3_UPLOADS_BUCKET ? new S3Client({ region: AWS_REGION }) : null;

const getExtension = (name: string, mimeType: string) => {
  const ext = path.extname(name);
  if (ext) return ext.toLowerCase();
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'image/webp') return '.webp';
  return '.bin';
};

const buildObjectKey = (input: UploadAssetInput) => {
  const ext = getExtension(input.originalName, input.mimeType);
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `uploads/${input.category}/${input.category}-${unique}${ext}`;
};

const buildS3PublicUrl = (key: string) => {
  if (S3_PUBLIC_BASE_URL) {
    return `${S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
  }
  return `https://${S3_UPLOADS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
};

const saveToLocalDisk = async (input: UploadAssetInput): Promise<UploadedAsset> => {
  const key = buildObjectKey(input);
  const absolutePath = path.resolve(process.cwd(), key);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, input.buffer);
  return {
    filePath: key.replace(/\\/g, '/'),
    fileSizeBytes: input.buffer.length,
    mimeType: input.mimeType,
  };
};

export const uploadImageAsset = async (
  input: UploadAssetInput
): Promise<UploadedAsset> => {
  if (!s3Client || !S3_UPLOADS_BUCKET || !AWS_REGION) {
    return saveToLocalDisk(input);
  }

  const key = buildObjectKey(input);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_UPLOADS_BUCKET,
      Key: key,
      Body: input.buffer,
      ContentType: input.mimeType,
    })
  );

  return {
    filePath: buildS3PublicUrl(key),
    fileSizeBytes: input.buffer.length,
    mimeType: input.mimeType,
  };
};
