import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  const connect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const web3Context = await connectWallet();
      setState(web3Context);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setState({
      provider: null,
      signer: null,
      account: null,
      chainId: null,
      neuralToken: null,
      neuralPrediction: null,
    });
    setError(null);
  };

  // Auto-connect if already connected
  useEffect(() => {
    const tryAutoConnect = async () => {
      try {
        const ethereum = (window as any).ethereum;
        if (ethereum && !state.account) {
          const accounts = await ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connect();
          }
        }
      } catch (err) {
        console.log('Auto-connect failed:', err);
      }
    };

    tryAutoConnect();
  }, [state.account]);

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
  }, [state.account]);

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