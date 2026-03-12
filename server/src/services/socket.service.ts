import { Server as SocketIOServer, type Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Role } from '../generated/prisma/client.js';

let io: SocketIOServer;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';
const ANALYSIS_UPDATED_EVENT = 'analysis_updated';
const ADMIN_ROOM = 'role:admin';

type SocketUserPayload = {
  userId: string;
  role: Role;
};

export type AnalysisSocketPayload = {
  analysisId: string;
  status: 'Pending' | 'Completed' | 'Failed';
  anomalyDetected: boolean | null;
  coordinates:
    | { x1: number; y1: number; x2: number; y2: number }
    | Record<string, never>;
  resultImagePath?: string;
  error?: string;
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

const authenticateSocket = (socket: Socket, token: string) => {
  const decoded = jwt.verify(token, JWT_SECRET) as SocketUserPayload;
  if (!decoded.userId || !decoded.role) {
    throw new Error('Invalid token payload');
  }
  joinUserRooms(socket, decoded);
  return decoded;
};

export const initWebSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    const handshakeToken = getTokenFromSocket(socket);
    if (handshakeToken) {
      try {
        const user = authenticateSocket(socket, handshakeToken);
        console.log(`Socket authenticated for user ${user.userId}`);
      } catch {
        console.warn(`Invalid handshake token for socket ${socket.id}`);
      }
    }

    socket.on('join_room', (token: string) => {
      try {
        const user = authenticateSocket(socket, token);
        console.log(`User ${user.userId} joined authorized rooms`);
      } catch {
        socket.emit('socket_error', { message: 'Invalid socket token' });
      }
    });
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
