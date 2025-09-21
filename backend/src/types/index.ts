export interface User {
  _id: string;
  walletAddress: string;
  nonce: string;
  totalStaked: number;
  totalWinnings: number;
  winStreak: number;
  maxWinStreak: number;
  totalPredictions: number;
  correctPredictions: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Round {
  _id: string;
  roundId: number;
  startTime: Date;
  endTime: Date;
  startPrice: number;
  endPrice: number;
  status: 'active' | 'ended' | 'resolved';
  totalUpStake: number;
  totalDownStake: number;
  totalStakers: number;
  upStakers: number;
  downStakers: number;
  winningDirection?: 'up' | 'down';
  platformFee: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prediction {
  _id: string;
  userId: string;
  roundId: number;
  direction: 'up' | 'down';
  amount: number;
  amountUSD: number;
  txHash: string;
  blockNumber: number;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'claimable' | 'claimed' | 'lost';
  winningAmount?: number;
  claimTxHash?: string;
  emergencyWithdrawn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceData {
  timestamp: number;
  price: number;
  volume24h?: number;
  change24h?: number;
  marketCap?: number;
}

export interface LeaderboardEntry {
  walletAddress: string;
  totalWinnings: number;
  winStreak: number;
  totalPredictions: number;
  winRate: number;
  rank: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WebSocketMessage {
  type: 'price_update' | 'round_update' | 'prediction_update' | 'user_update';
  data: any;
}

export interface ContractAddresses {
  neuralToken: string;
  predictionMarket: string;
}