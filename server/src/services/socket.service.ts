import { Server as SocketIOServer, type Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Role, type AnalysisStatus } from '../generated/prisma/client.js';
import config from '../config.js';
import { prisma } from '../lib/prisma.js';
import type { AuthenticatedUser } from '../types/auth.js';

let io: SocketIOServer;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';
const ANALYSIS_UPDATED_EVENT = 'analysis_updated';
const ADMIN_ROOM = 'role:admin';

type SocketUserPayload = AuthenticatedUser;

export type AnalysisSocketPayload = {
  analysisId: string;
  status: AnalysisStatus;
};

const getUserRoom = (userId: string) => `user:${userId}`;

const getTokenFromSocket = (socket: Socket) => {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.length > 0) {
    return authToken;
  }

  const authorization = socket.handshake.headers.authorization;
  if (!authorization) {
    return null;
  }
  const [scheme, token] = authorization.split(' ');
  if (scheme?.toLowerCase() === 'bearer' && token) {
    return token;
  }

  return null;
};

const joinUserRooms = (socket: Socket, payload: SocketUserPayload) => {
  socket.join(getUserRoom(payload.userId));
  if (payload.role === Role.Admin) {
    socket.join(ADMIN_ROOM);
  }
};

const authenticateSocket = async (socket: Socket, token: string) => {
  const decoded = jwt.verify(token, JWT_SECRET) as SocketUserPayload;
  if (!decoded.userId || !decoded.role) {
    throw new Error('Invalid token payload');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { is_active: true, role: true },
  });
  if (!user?.is_active || user.role !== decoded.role) {
    throw new Error('User is inactive or token role is stale');
  }

  socket.data.user = decoded;
  return decoded;
};

export const initWebSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: config.allowedOrigins,
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    const token = getTokenFromSocket(socket);
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }

    try {
      await authenticateSocket(socket, token);
      next();
    } catch {
      next(new Error('Invalid or inactive session'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);
    const user = socket.data.user as SocketUserPayload;
    joinUserRooms(socket, user);
    console.log(`Socket authenticated for user ${user.userId}`);
    socket.on(`disconnect`, () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};

export const emitAnalysisUpdated = (
  inspectorId: string,
  payload: AnalysisSocketPayload
) => {
  const socketServer = getIO();
  socketServer
    .to(getUserRoom(inspectorId))
    .emit(ANALYSIS_UPDATED_EVENT, payload);
  socketServer.to(ADMIN_ROOM).emit(ANALYSIS_UPDATED_EVENT, payload);
};

export const disconnectUserSockets = (userId: string) => {
  if (!io) return;
  io.in(getUserRoom(userId)).disconnectSockets(true);
};
