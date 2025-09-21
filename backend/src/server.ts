import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import Database from './utils/database';
import WebSocketService from './services/websocketService';
import PriceService from './services/priceService';
import Web3Service from './services/web3Service';
import logger from './utils/logger';
import apiRoutes from './routes/api';

// Load environment variables
dotenv.config();

class Server {
  private app: express.Application;
  private server: http.Server;
  private port: number;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.port = parseInt(process.env.PORT || '5000');

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeServices();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined', {
        stream: { write: (message: string) => logger.info(message.trim()) }
      }));
    }
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
      });
    });

    // API routes
    this.app.use('/api', apiRoutes);

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });

    // Error handler
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize database connections
      const database = Database.getInstance();
      await database.connectMongoDB();
      await database.connectRedis();

      // Initialize Web3 service
      const web3Service = Web3Service.getInstance();
      logger.info('✅ Web3 service initialized');

      // Initialize price service
      const priceService = PriceService.getInstance();
      logger.info('✅ Price service initialized');

      // Initialize WebSocket service
      const wsService = WebSocketService.getInstance();
      wsService.initialize(this.server);

      logger.info('✅ All services initialized successfully');

    } catch (error) {
      logger.error('❌ Error initializing services:', error);
      process.exit(1);
    }
  }

  public async start(): Promise<void> {
    this.server.listen(this.port, () => {
      logger.info(`🚀 Server running on port ${this.port}`);
      logger.info(`📡 WebSocket server ready`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', this.shutdown.bind(this));
    process.on('SIGINT', this.shutdown.bind(this));
  }

  private async shutdown(): Promise<void> {
    logger.info('🛑 Shutting down server...');

    // Close server
    this.server.close(() => {
      logger.info('🔌 HTTP server closed');
    });

    // Shutdown services
    const wsService = WebSocketService.getInstance();
    wsService.shutdown();

    const database = Database.getInstance();
    await database.disconnect();

    process.exit(0);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new Server();
  server.start().catch((error) => {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  });
}

export default Server;