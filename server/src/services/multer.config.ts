import type { Request } from 'express';
import multer from 'multer';
import type { FileFilterCallback } from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (_req: Request, _file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (_req: Request, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);

    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed!') as unknown as null, false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
