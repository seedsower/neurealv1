import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { WebSocketMessage } from '../types';
import logger from '../utils/logger';
import PriceService from './priceService';

class WebSocketService {
  private static instance: WebSocketService;
  private io: SocketIOServer | null = null;
  private priceUpdateInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  initialize(server: HttpServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    this.startPriceUpdates();

    logger.info('✅ WebSocket server initialized');
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      logger.info(`🔌 Client connected: ${socket.id}`);

      // Send initial data
      this.sendInitialData(socket);

      // Handle client events
      socket.on('subscribe_round', (roundId: number) => {
        socket.join(`round_${roundId}`);
        logger.debug(`Client ${socket.id} subscribed to round ${roundId}`);
      });

      socket.on('unsubscribe_round', (roundId: number) => {
        socket.leave(`round_${roundId}`);
        logger.debug(`Client ${socket.id} unsubscribed from round ${roundId}`);
      });

      socket.on('subscribe_user', (walletAddress: string) => {
        socket.join(`user_${walletAddress.toLowerCase()}`);
        logger.debug(`Client ${socket.id} subscribed to user ${walletAddress}`);
      });

      socket.on('disconnect', () => {
        logger.info(`🔌 Client disconnected: ${socket.id}`);
      });

      socket.on('error', (error) => {
        logger.error(`WebSocket error from ${socket.id}:`, error);
      });
    });
  }

  private async sendInitialData(socket: any): Promise<void> {
    try {
      const priceService = PriceService.getInstance();
      const currentPrice = await priceService.getCurrentPrice();
      const priceHistory = await priceService.getPriceHistory(24);

      socket.emit('initial_data', {
        currentPrice,
        priceHistory,
        timestamp: Date.now()
      });
    } catch (error) {
      logger.error('Error sending initial data:', error);
    }
  }

  private startPriceUpdates(): void {
    // Update price every 5 seconds
    this.priceUpdateInterval = setInterval(async () => {
      try {
        const priceService = PriceService.getInstance();
        const currentPrice = await priceService.getCurrentPrice();

        this.broadcast('price_update', {
          price: currentPrice,
          timestamp: Date.now()
        });
      } catch (error) {
        logger.error('Error in price update interval:', error);
      }
    }, 5000);
  }

  broadcast(type: WebSocketMessage['type'], data: any): void {
    if (!this.io) return;

    const message: WebSocketMessage = { type, data };
    this.io.emit(type, data);

    logger.debug(`📡 Broadcasted ${type} to all clients`);
  }

  broadcastToRoom(room: string, type: WebSocketMessage['type'], data: any): void {
    if (!this.io) return;

    const message: WebSocketMessage = { type, data };
    this.io.to(room).emit(type, data);

    logger.debug(`📡 Broadcasted ${type} to room ${room}`);
  }

  broadcastToUser(walletAddress: string, type: WebSocketMessage['type'], data: any): void {
    const room = `user_${walletAddress.toLowerCase()}`;
    this.broadcastToRoom(room, type, data);
  }

  broadcastToRound(roundId: number, type: WebSocketMessage['type'], data: any): void {
    const room = `round_${roundId}`;
    this.broadcastToRoom(room, type, data);
  }

  getConnectedClients(): number {
    return this.io ? this.io.engine.clientsCount : 0;
  }

  shutdown(): void {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
    }

    if (this.io) {
      this.io.close();
      this.io = null;
    }

    logger.info('🔌 WebSocket service shut down');
  }
}

export default WebSocketService;