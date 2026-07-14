import type { Request, Response, NextFunction } from 'express';
import { Role } from '../generated/prisma/client.js';

export const requireAdmin = <Params, ResBody, ReqBody, ReqQuery>(
  req: Request<Params, ResBody, ReqBody, ReqQuery>,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== Role.Admin) {
    res.status(403).json({
      message: 'Forbidden: administrator access required.',
    });
    return;
  }
  next();
};
