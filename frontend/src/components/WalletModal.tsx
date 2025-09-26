import React, { useState } from 'react';
import { TARGET_CHAIN_ID, CHAIN_CONFIG } from '../config/contracts';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
  isConnecting: boolean;
}

export default function WalletModal({ isOpen, onClose, onConnect, isConnecting }: WalletModalProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  if (!isOpen) return null;

  const wallets = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect using MetaMask browser extension',
      available: typeof window !== 'undefined' && (window as any).ethereum?.isMetaMask
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '🔵',
      description: 'Connect using Coinbase Wallet',
      available: typeof window !== 'undefined' && (window as any).ethereum?.isCoinbaseWallet
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '📱',
      description: 'Scan QR code with your mobile wallet',
      available: true
    },
    {
      id: 'phantom',
      name: 'Phantom',
      icon: '👻',
      description: 'Connect using Phantom wallet',
      available: typeof window !== 'undefined' && (window as any).phantom?.solana
    }
  ];

  const handleWalletSelect = async (walletId: string) => {
    setSelectedWallet(walletId);

    if (walletId === 'metamask') {
      const ethereum = (window as any).ethereum;
      if (!ethereum?.isMetaMask) {
        window.open('https://metamask.io/', '_blank');
        return;
      }

      try {
        // Check and switch network if needed
        const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(chainIdHex, 16);

        if (currentChainId !== TARGET_CHAIN_ID) {
          await switchNetwork(ethereum);
        }

        onConnect();
        onClose();
      } catch (err) {
        console.error('MetaMask connection failed:', err);
      }
    } else if (walletId === 'coinbase') {
      const ethereum = (window as any).ethereum;
      if (!ethereum?.isCoinbaseWallet) {
        window.open('https://www.coinbase.com/wallet', '_blank');
        return;
      }

      try {
        onConnect();
        onClose();
      } catch (err) {
        console.error('Coinbase Wallet connection failed:', err);
      }
    } else if (walletId === 'walletconnect') {
      // WalletConnect integration would go here
      alert('WalletConnect coming soon! Please use MetaMask for now.');
    } else if (walletId === 'phantom') {
      // Phantom is primarily for Solana, but some versions support Ethereum
      alert('Phantom wallet support coming soon! Please use MetaMask for now.');
    }

    setSelectedWallet(null);
  };

  const switchNetwork = async (ethereum: any) => {
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CHAIN_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [CHAIN_CONFIG],
        });
      } else {
        throw switchError;
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1a1a2e',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '32px',
          maxWidth: '420px',
          width: '100%',
          color: 'white',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Connect Wallet</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '24px', fontSize: '0.9rem' }}>
          Choose your preferred wallet to connect to {CHAIN_CONFIG.chainName}
        </p>

        <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleWalletSelect(wallet.id)}
              disabled={isConnecting || selectedWallet === wallet.id}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                color: 'white',
                cursor: isConnecting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                opacity: (!wallet.available && wallet.id !== 'walletconnect') ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!isConnecting && (wallet.available || wallet.id === 'walletconnect')) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isConnecting) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{wallet.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                  {wallet.name}
                  {!wallet.available && wallet.id !== 'walletconnect' && (
                    <span style={{ fontSize: '0.75rem', color: 'orange', marginLeft: '8px' }}>
                      Not Detected
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  {wallet.description}
                </div>
              </div>
              {selectedWallet === wallet.id && isConnecting && (
                <div style={{ fontSize: '1rem' }}>⏳</div>
              )}
            </button>
          ))}
        </div>

        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '0.8rem',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          <strong>New to Ethereum?</strong> Learn more about wallets{' '}
          <a
            href="https://ethereum.org/en/wallets/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#60a5fa', textDecoration: 'none' }}
          >
            here
          </a>
        </div>
      </div>
    </div>
  );
}