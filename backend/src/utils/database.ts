import mongoose from 'mongoose';
import { createClient } from 'redis';
import logger from './logger';

class Database {
  private static instance: Database;
  public redisClient: any;

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async connectMongoDB(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/neureal';

      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      logger.info('✅ MongoDB connected successfully');

      mongoose.connection.on('error', (error) => {
        logger.error('❌ MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('⚠️ MongoDB disconnected');
      });

    } catch (error) {
      logger.error('❌ MongoDB connection failed:', error);
      process.exit(1);
    }
  }

  async connectRedis(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.redisClient = createClient({ url: redisUrl });

      this.redisClient.on('error', (error: Error) => {
        logger.error('❌ Redis connection error:', error);
      });

      this.redisClient.on('connect', () => {
        logger.info('✅ Redis connected successfully');
      });

      this.redisClient.on('disconnect', () => {
        logger.warn('⚠️ Redis disconnected');
      });

      await this.redisClient.connect();

    } catch (error) {
      logger.error('❌ Redis connection failed:', error);
      // Don't exit process for Redis failure, app can work without cache
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      if (this.redisClient) {
        await this.redisClient.quit();
      }
      logger.info('🔌 Database connections closed');
    } catch (error) {
      logger.error('❌ Error closing database connections:', error);
    }
  }
}

export default Database;