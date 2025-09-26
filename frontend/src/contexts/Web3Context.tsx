import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { connectWallet, Web3Context as Web3ContextType } from '../utils/web3';

interface Web3ProviderProps {
  children: ReactNode;
}

interface Web3State extends Web3ContextType {
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const Web3Context = createContext<Web3State | null>(null);

export function Web3Provider({ children }: Web3ProviderProps) {
  const [state, setState] = useState<Web3ContextType>({
    provider: null,
    signer: null,
    account: null,
    chainId: null,
    neuralToken: null,
    neuralPrediction: null,
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (isConnecting) return; // Prevent multiple simultaneous connection attempts

    setIsConnecting(true);
    setError(null);

    try {
      const web3Context = await connectWallet();
      setState(web3Context);

      // Clear any previous errors on successful connection
      if (web3Context.account) {
        setError(null);
      }
    } catch (err: any) {
      // Handle different types of errors more gracefully
      if (err.message?.includes('MetaMask not found')) {
        setError('No Web3 wallet detected. Please install MetaMask, Coinbase Wallet, or another Web3 wallet.');
      } else if (err.message?.includes('rejected')) {
        setError('Connection rejected by user. Please approve the connection request in your wallet.');
      } else if (err.message?.includes('No accounts found')) {
        setError('No accounts found. Please unlock your wallet and try again.');
      } else {
        setError(`Connection failed: ${err.message || 'Unknown error'}`);
      }
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  const disconnect = useCallback(() => {
    setState({
      provider: null,
      signer: null,
      account: null,
      chainId: null,
      neuralToken: null,
      neuralPrediction: null,
    });
    setError(null);
  }, []);

  // Auto-connect if already connected
  useEffect(() => {
    const tryAutoConnect = async () => {
      try {
        const ethereum = (window as any).ethereum;
        if (ethereum && !state.account && !isConnecting) {
          const accounts = await ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            connect();
          }
        }
      } catch (err) {
        console.log('Auto-connect failed:', err);
      }
    };

    // Only try auto-connect once on mount
    if (!state.account && !isConnecting) {
      tryAutoConnect();
    }
  }, [state.account, isConnecting, connect]);

  // Listen for account changes
  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else if (accounts[0] !== state.account) {
          connect();
        }
      };

      const handleChainChanged = () => {
        // Reconnect when chain changes instead of reloading
        connect();
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [state.account, connect, disconnect]);

  const value: Web3State = {
    ...state,
    isConnecting,
    error,
    connect,
    disconnect,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}