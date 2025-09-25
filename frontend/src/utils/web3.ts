import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import { CONTRACTS, CHAIN_CONFIG, BASE_SEPOLIA_CHAIN_ID, NEURAL_TOKEN_ABI, NEURAL_PREDICTION_ABI } from '../config/contracts';

export interface Web3Context {
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  account: string | null;
  chainId: number | null;
  neuralToken: ethers.Contract | null;
  neuralPrediction: ethers.Contract | null;
}

export async function connectWallet(): Promise<Web3Context> {
  const ethereum = await detectEthereumProvider();

  if (!ethereum) {
    throw new Error('MetaMask not found. Please install MetaMask to continue.');
  }

  try {
    // Request account access
    const accounts = await (ethereum as any).request({ method: 'eth_requestAccounts' });

    if (accounts.length === 0) {
      throw new Error('No accounts found. Please unlock MetaMask.');
    }

    const provider = new ethers.providers.Web3Provider(ethereum as any);
    const signer = provider.getSigner();
    const account = accounts[0];
    const network = await provider.getNetwork();

    // Check if we're on Base Sepolia
    if (network.chainId !== BASE_SEPOLIA_CHAIN_ID) {
      await switchToBaseSepolia(ethereum);
      // Refresh network info after switching
      const newNetwork = await provider.getNetwork();
      if (newNetwork.chainId !== BASE_SEPOLIA_CHAIN_ID) {
        throw new Error('Please switch to Base Sepolia network');
      }
    }

    // Initialize contracts
    const neuralToken = new ethers.Contract(CONTRACTS.NEURAL_TOKEN, NEURAL_TOKEN_ABI, signer);
    const neuralPrediction = new ethers.Contract(CONTRACTS.NEURAL_PREDICTION, NEURAL_PREDICTION_ABI, signer);

    return {
      provider,
      signer,
      account,
      chainId: network.chainId,
      neuralToken,
      neuralPrediction,
    };
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected the connection request.');
    }
    throw error;
  }
}

export async function switchToBaseSepolia(ethereum: any) {
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN_CONFIG.chainId }],
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [CHAIN_CONFIG],
        });
      } catch (addError) {
        throw new Error('Failed to add Base Sepolia network to MetaMask');
      }
    } else {
      throw new Error('Failed to switch to Base Sepolia network');
    }
  }
}

export function formatTokenAmount(amount: ethers.BigNumber, decimals: number = 18): string {
  return ethers.utils.formatUnits(amount, decimals);
}

export function parseTokenAmount(amount: string, decimals: number = 18): ethers.BigNumber {
  return ethers.utils.parseUnits(amount, decimals);
}

export function formatPrice(price: ethers.BigNumber): string {
  // Price is stored with 8 decimals (e.g., 28470000 = $0.2847)
  return ethers.utils.formatUnits(price, 8);
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export async function waitForTransaction(tx: ethers.ContractTransaction): Promise<ethers.ContractReceipt> {
  console.log('Transaction submitted:', tx.hash);
  const receipt = await tx.wait();
  console.log('Transaction confirmed:', receipt.transactionHash);
  return receipt;
}