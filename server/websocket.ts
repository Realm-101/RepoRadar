import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Repository, Analysis, User } from './db';

export class WebSocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? [process.env.FRONTEND_URL || 'https://your-domain.replit.app']
          : ["http://localhost:3000", "http://localhost:5173", "http://localhost:5000"],
        credentials: true
      }
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Authentication
      socket.on('authenticate', (userId: string) => {
        if (userId) {
          this.userSockets.set(userId, socket.id);
          socket.join(`user:${userId}`);
          console.log(`User ${userId} authenticated with socket ${socket.id}`);
          
          // Send initial connection confirmation
          socket.emit('authenticated', { userId, socketId: socket.id });
        }
      });

      // Repository tracking
      socket.on('track_repository', (repositoryId: string) => {
        socket.join(`repository:${repositoryId}`);
        console.log(`Socket ${socket.id} tracking repository ${repositoryId}`);
      });

      socket.on('untrack_repository', (repositoryId: string) => {
        socket.leave(`repository:${repositoryId}`);
        console.log(`Socket ${socket.id} stopped tracking repository ${repositoryId}`);
      });

      // Analysis tracking
      socket.on('track_analysis', (analysisId: string) => {
        socket.join(`analysis:${analysisId}`);
        console.log(`Socket ${socket.id} tracking analysis ${analysisId}`);
      });

      // Heartbeat for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Disconnect handling
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        // Remove user mapping
        for (const [userId, socketId] of this.userSockets.entries()) {
          if (socketId === socket.id) {
            this.userSockets.delete(userId);
            break;
          }
        }
      });
    });
  }

  // Notification methods
  notifyUser(userId: string, event: string, data: unknown) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  notifyRepositoryWatchers(repositoryId: string, event: string, data: unknown) {
    this.io.to(`repository:${repositoryId}`).emit(event, data);
  }

  notifyAnalysisWatchers(analysisId: string, event: string, data: unknown) {
    this.io.to(`analysis:${analysisId}`).emit(event, data);
  }

  broadcastToAll(event: string, data: unknown) {
    this.io.emit(event, data);
  }

  // Analysis progress updates
  notifyAnalysisProgress(analysisId: string, progress: {
    stage: string;
    percentage: number;
    message: string;
  }) {
    this.notifyAnalysisWatchers(analysisId, 'analysis_progress', {
      analysisId,
      ...progress,
      timestamp: new Date().toISOString()
    });
  }

  // Repository updates
  notifyRepositoryUpdate(repositoryId: string, update: {
    type: 'stars' | 'forks' | 'commits' | 'issues';
    oldValue: number;
    newValue: number;
  }) {
    this.notifyRepositoryWatchers(repositoryId, 'repository_update', {
      repositoryId,
      ...update,
      timestamp: new Date().toISOString()
    });
  }

  // System notifications
  notifySystemAlert(severity: 'info' | 'warning' | 'error', message: string, data?: unknown) {
    this.broadcastToAll('system_alert', {
      severity,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // User activity notifications
  notifyNewAnalysis(userId: string, analysis: { id: string; repositoryName: string; overallScore: number }) {
    this.notifyUser(userId, 'new_analysis', {
      type: 'analysis_completed',
      analysis,
      timestamp: new Date().toISOString()
    });
  }

  notifyCollaborationUpdate(userIds: string[], update: {
    type: 'shared' | 'unshared' | 'comment' | 'review';
    data: unknown;
  }) {
    userIds.forEach(userId => {
      this.notifyUser(userId, 'collaboration_update', {
        ...update,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Get connection status
  getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}