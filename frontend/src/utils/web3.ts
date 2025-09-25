import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import { CONTRACTS, CHAIN_CONFIG, TARGET_CHAIN_ID, NEURAL_TOKEN_ABI, NEURAL_PREDICTION_ABI, BASE_SEPOLIA_CHAIN_ID, LOCALHOST_CHAIN_ID } from '../config/contracts';

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

    // Initialize contracts only if on correct network
    let neuralToken = null;
    let neuralPrediction = null;

    if (network.chainId === TARGET_CHAIN_ID) {
      neuralToken = new ethers.Contract(CONTRACTS.NEURAL_TOKEN, NEURAL_TOKEN_ABI, signer);
      neuralPrediction = new ethers.Contract(CONTRACTS.NEURAL_PREDICTION, NEURAL_PREDICTION_ABI, signer);
    } else {
      console.log(`Connected to chain ${network.chainId}, expected ${TARGET_CHAIN_ID}. Contracts not initialized.`);
      console.log(`Network mode: ${process.env.REACT_APP_NETWORK_MODE}`);
      console.log(`Base Sepolia ID: ${BASE_SEPOLIA_CHAIN_ID}, Localhost ID: ${LOCALHOST_CHAIN_ID}`);
    }

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

export async function switchToTargetNetwork(ethereum: any) {
  try {
    console.log(`Attempting to switch to ${CHAIN_CONFIG.chainName} (${CHAIN_CONFIG.chainId})`);
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN_CONFIG.chainId }],
    });
    console.log(`Successfully switched to ${CHAIN_CONFIG.chainName}`);
  } catch (switchError: any) {
    console.log('Switch error:', switchError);
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        console.log(`Adding ${CHAIN_CONFIG.chainName} to MetaMask...`);
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [CHAIN_CONFIG],
        });
        console.log(`Successfully added ${CHAIN_CONFIG.chainName}`);
      } catch (addError) {
        console.error('Add error:', addError);
        throw new Error(`Failed to add ${CHAIN_CONFIG.chainName} network to MetaMask`);
      }
    } else if (switchError.code === 4001) {
      throw new Error('User rejected network switch request');
    } else {
      throw new Error(`Failed to switch to ${CHAIN_CONFIG.chainName} network: ${switchError.message}`);
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