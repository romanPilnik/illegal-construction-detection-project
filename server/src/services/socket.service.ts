import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer;

export const initWebSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);
    socket.on(`join_room`, (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their personal room`);
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
