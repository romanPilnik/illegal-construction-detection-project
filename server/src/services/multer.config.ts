import type { Request } from 'express';
import multer from 'multer';
import type { FileFilterCallback } from 'multer';

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('UNSUPPORTED_IMAGE_TYPE'));
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
