import { Router } from 'express';
import PriceService from '../services/priceService';
import Web3Service from '../services/web3Service';
import { ApiResponse } from '../types';

const router = Router();

// Price endpoints
router.get('/price/current', async (req, res) => {
  try {
    const priceService = PriceService.getInstance();
    const price = await priceService.getCurrentPrice();

    const response: ApiResponse<{ price: number; timestamp: number }> = {
      success: true,
      data: {
        price,
        timestamp: Date.now()
      }
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current price'
    });
  }
});

router.get('/price/history', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const priceService = PriceService.getInstance();
    const history = await priceService.getPriceHistory(hours);

    const response: ApiResponse<any> = {
      success: true,
      data: history
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price history'
    });
  }
});

// Round endpoints
router.get('/rounds/current', async (req, res) => {
  try {
    const web3Service = Web3Service.getInstance();
    const round = await web3Service.getCurrentRound();

    const response: ApiResponse<any> = {
      success: true,
      data: round
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current round'
    });
  }
});

// User endpoints
router.get('/user/:address/predictions', async (req, res) => {
  try {
    const { address } = req.params;
    const web3Service = Web3Service.getInstance();

    if (!web3Service.isValidAddress(address)) {
      res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      });
      return;
    }

    const predictions = await web3Service.getUserPredictions(address);

    const response: ApiResponse<any> = {
      success: true,
      data: predictions
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user predictions'
    });
  }
});

router.get('/user/:address/balance', async (req, res) => {
  try {
    const { address } = req.params;
    const web3Service = Web3Service.getInstance();

    if (!web3Service.isValidAddress(address)) {
      res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      });
      return;
    }

    const balance = await web3Service.getNeuralTokenBalance(address);

    const response: ApiResponse<{ balance: string }> = {
      success: true,
      data: { balance }
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user balance'
    });
  }
});

// Mock leaderboard endpoint
router.get('/leaderboard', async (req, res) => {
  try {
    const mockLeaderboard = [
      {
        walletAddress: '0x1234567890123456789012345678901234567890',
        totalWinnings: 15000,
        winStreak: 8,
        totalPredictions: 50,
        winRate: 64,
        rank: 1
      },
      {
        walletAddress: '0x2345678901234567890123456789012345678901',
        totalWinnings: 12000,
        winStreak: 5,
        totalPredictions: 45,
        winRate: 58,
        rank: 2
      },
      {
        walletAddress: '0x3456789012345678901234567890123456789012',
        totalWinnings: 9500,
        winStreak: 3,
        totalPredictions: 40,
        winRate: 55,
        rank: 3
      }
    ];

    const response: ApiResponse<any> = {
      success: true,
      data: mockLeaderboard
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

export default router;