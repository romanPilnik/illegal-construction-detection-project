import type { Role } from '../generated/prisma/client.js';

export type AuthenticatedUser = {
  userId: string;
  role: Role;
};
