import { ethers } from 'ethers';
import { ContractAddresses } from '../types';
import logger from '../utils/logger';

class Web3Service {
  private static instance: Web3Service;
  public provider: ethers.JsonRpcProvider;
  public signer: ethers.Wallet | undefined;
  public contracts: ContractAddresses;

  private constructor() {
    const rpcUrl = process.env.RPC_URL || 'https://polygon-rpc.com/';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    if (process.env.PRIVATE_KEY) {
      this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    }

    this.contracts = {
      neuralToken: process.env.NEURAL_TOKEN_ADDRESS || '',
      predictionMarket: process.env.PREDICTION_CONTRACT_ADDRESS || '',
    };
  }

  static getInstance(): Web3Service {
    if (!Web3Service.instance) {
      Web3Service.instance = new Web3Service();
    }
    return Web3Service.instance;
  }

  async getLatestBlock(): Promise<number> {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      logger.error('Error getting latest block:', error);
      throw error;
    }
  }

  async getTransaction(txHash: string): Promise<ethers.TransactionResponse | null> {
    try {
      return await this.provider.getTransaction(txHash);
    } catch (error) {
      logger.error(`Error getting transaction ${txHash}:`, error);
      throw error;
    }
  }

  async getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      logger.error(`Error getting transaction receipt ${txHash}:`, error);
      throw error;
    }
  }

  formatTokenAmount(amount: string | number, decimals: number = 18): string {
    return ethers.formatUnits(amount.toString(), decimals);
  }

  parseTokenAmount(amount: string, decimals: number = 18): bigint {
    return ethers.parseUnits(amount, decimals);
  }

  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  async estimateGas(transaction: any): Promise<bigint> {
    try {
      return await this.provider.estimateGas(transaction);
    } catch (error) {
      logger.error('Error estimating gas:', error);
      throw error;
    }
  }

  async getGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice || BigInt(0);
    } catch (error) {
      logger.error('Error getting gas price:', error);
      throw error;
    }
  }

  // Mock contract interaction methods - will be replaced with actual contract ABIs
  async getNeuralTokenBalance(address: string): Promise<string> {
    try {
      // This would use the actual NEURAL token contract
      // For now, return mock data
      return '1000.0';
    } catch (error) {
      logger.error(`Error getting NEURAL balance for ${address}:`, error);
      throw error;
    }
  }

  async getCurrentRound(): Promise<any> {
    try {
      // This would use the actual prediction market contract
      // For now, return mock data
      return {
        roundId: 1,
        startTime: Math.floor(Date.now() / 1000),
        endTime: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        totalUpStake: '5000.0',
        totalDownStake: '3000.0',
      };
    } catch (error) {
      logger.error('Error getting current round:', error);
      throw error;
    }
  }

  async getUserPredictions(address: string, roundId?: number): Promise<any[]> {
    try {
      // This would use the actual prediction market contract
      // For now, return mock data
      return [];
    } catch (error) {
      logger.error(`Error getting predictions for ${address}:`, error);
      throw error;
    }
  }
}

export default Web3Service;