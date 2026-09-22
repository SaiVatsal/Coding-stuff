import { Server as SocketServer } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  DownloadProgress,
} from '../../../shared/types.js';
import { config } from '../config.js';

type TypedServer = SocketServer<ClientToServerEvents, ServerToClientEvents>;

let io: TypedServer;

/**
 * Initialize the Socket.io server and attach to HTTP server.
 */
export function initSocketServer(httpServer: HttpServer): TypedServer {
  io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Get the Socket.io server instance.
 */
export function getIO(): TypedServer {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocketServer() first.');
  }
  return io;
}

// ─── Emit helpers ────────────────────────────────────────────────────────────

export function emitProgress(data: DownloadProgress): void {
  getIO().emit('download:progress', data);
}

export function emitComplete(data: DownloadProgress): void {
  getIO().emit('download:complete', data);
}

export function emitError(data: DownloadProgress): void {
  getIO().emit('download:error', data);
}

export function emitQueued(data: DownloadProgress): void {
  getIO().emit('download:queued', data);
}

export function emitCancelled(id: string): void {
  getIO().emit('download:cancelled', { id });
}
