import { Server as SocketServer } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import { queue } from '../services/queue.js';

export function setupSocket(httpServer: HttpServer, corsOrigin: string | string[]) {
  const io = new SocketServer(httpServer, {
    cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
  });

  queue.on('progress', (p) => io.emit('progress', p));
  queue.on('added', (p) => io.emit('added', p));
  queue.on('removed', (id) => io.emit('removed', id));

  io.on('connection', (socket) => {
    socket.emit('snapshot', queue.list());
    socket.on('disconnect', () => {});
  });

  return io;
}
