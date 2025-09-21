import { PriceData } from '../types';
import Database from '../utils/database';
import logger from '../utils/logger';

class PriceService {
  private static instance: PriceService;
  private priceHistory: PriceData[] = [];
  private currentPrice: number = 0;

  private constructor() {}

  static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService();
    }
    return PriceService.instance;
  }

  async getCurrentPrice(): Promise<number> {
    try {
      const db = Database.getInstance();

      // Try to get from Redis cache first
      if (db.redisClient) {
        const cachedPrice = await db.redisClient.get('neural:current_price');
        if (cachedPrice) {
          this.currentPrice = parseFloat(cachedPrice);
          return this.currentPrice;
        }
      }

      // Fetch from external API (mock implementation)
      const price = await this.fetchPriceFromAPI();
      this.currentPrice = price;

      // Cache for 10 seconds
      if (db.redisClient) {
        await db.redisClient.setEx('neural:current_price', 10, price.toString());
      }

      return price;
    } catch (error) {
      logger.error('Error getting current price:', error);
      return this.currentPrice || 1.0; // Fallback price
    }
  }

  async getPriceHistory(hours: number = 24): Promise<PriceData[]> {
    try {
      const db = Database.getInstance();
      const cacheKey = `neural:price_history_${hours}h`;

      // Try Redis cache first
      if (db.redisClient) {
        const cached = await db.redisClient.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // Generate mock price history
      const history = this.generateMockPriceHistory(hours);

      // Cache for 5 minutes
      if (db.redisClient) {
        await db.redisClient.setEx(cacheKey, 300, JSON.stringify(history));
      }

      return history;
    } catch (error) {
      logger.error('Error getting price history:', error);
      return this.priceHistory;
    }
  }

  private async fetchPriceFromAPI(): Promise<number> {
    try {
      // Mock API call - in production, this would call CoinGecko, CoinMarketCap, etc.
      // For now, generate a realistic price that fluctuates
      const basePrice = 1.0;
      const volatility = 0.1; // 10% volatility
      const randomFactor = (Math.random() - 0.5) * volatility;
      const price = basePrice * (1 + randomFactor);

      logger.debug(`Fetched NEURAL price: $${price.toFixed(4)}`);
      return parseFloat(price.toFixed(4));
    } catch (error) {
      logger.error('Error fetching price from API:', error);
      throw error;
    }
  }

  private generateMockPriceHistory(hours: number): PriceData[] {
    const history: PriceData[] = [];
    const now = Date.now();
    const intervalMs = (hours * 60 * 60 * 1000) / 100; // 100 data points

    let currentPrice = 1.0;

    for (let i = 99; i >= 0; i--) {
      const timestamp = now - (i * intervalMs);

      // Random walk for realistic price movement
      const change = (Math.random() - 0.5) * 0.02; // 2% max change per interval
      currentPrice = Math.max(0.1, currentPrice * (1 + change));

      history.push({
        timestamp,
        price: parseFloat(currentPrice.toFixed(4)),
        volume24h: Math.random() * 1000000,
        change24h: (Math.random() - 0.5) * 20, // -10% to +10%
      });
    }

    return history;
  }

  async updatePriceHistory(): Promise<void> {
    try {
      const currentPrice = await this.getCurrentPrice();
      const newDataPoint: PriceData = {
        timestamp: Date.now(),
        price: currentPrice,
        volume24h: Math.random() * 1000000,
        change24h: this.calculateChange24h(currentPrice),
      };

      this.priceHistory.push(newDataPoint);

      // Keep only last 24 hours of data (assuming updates every minute)
      if (this.priceHistory.length > 1440) {
        this.priceHistory = this.priceHistory.slice(-1440);
      }

      logger.debug(`Updated price history: ${currentPrice}`);
    } catch (error) {
      logger.error('Error updating price history:', error);
    }
  }

  private calculateChange24h(currentPrice: number): number {
    if (this.priceHistory.length === 0) return 0;

    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const priceAgo = this.priceHistory.find(p => p.timestamp >= dayAgo);

    if (!priceAgo) return 0;

    return ((currentPrice - priceAgo.price) / priceAgo.price) * 100;
  }

  async convertToUSD(neuralAmount: number): Promise<number> {
    const price = await this.getCurrentPrice();
    return neuralAmount * price;
  }

  async convertFromUSD(usdAmount: number): Promise<number> {
    const price = await this.getCurrentPrice();
    return price > 0 ? usdAmount / price : 0;
  }
}

export default PriceService;