import React, { useState } from 'react';
import { TARGET_CHAIN_ID, CHAIN_CONFIG } from '../config/contracts';

interface WalletConnectorProps {
  onConnect: () => void;
  isConnecting: boolean;
  error: string | null;
}

export default function WalletConnector({ onConnect, isConnecting, error }: WalletConnectorProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

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
      icon: '🟦',
      description: 'Connect using Coinbase Wallet',
      available: typeof window !== 'undefined' && (window as any).ethereum?.isCoinbaseWallet
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '🔗',
      description: 'Scan QR code with your mobile wallet',
      available: true
    },
    {
      id: 'injected',
      name: 'Browser Wallet',
      icon: '🌐',
      description: 'Connect using any injected wallet',
      available: typeof window !== 'undefined' && (window as any).ethereum
    }
  ];

  const availableWallets = wallets.filter(wallet => wallet.available);

  const handleWalletSelect = async (walletId: string) => {
    setSelectedWallet(walletId);

    if (walletId === 'metamask' || walletId === 'injected') {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        alert('No wallet found! Please install MetaMask or another Web3 wallet.');
        return;
      }

      // Check network first
      try {
        const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(chainIdHex, 16);

        if (currentChainId !== TARGET_CHAIN_ID) {
          const shouldSwitch = window.confirm(
            `Wrong Network Detected!\n\n` +
            `You're currently on chain ${currentChainId}\n` +
            `This app requires ${CHAIN_CONFIG.chainName} (chain ${TARGET_CHAIN_ID})\n\n` +
            `Would you like to switch networks now?`
          );

          if (shouldSwitch) {
            await switchNetwork(ethereum);
          } else {
            alert('Please manually switch to Base Sepolia network in your wallet settings.');
            return;
          }
        }

        onConnect();
      } catch (err) {
        console.error('Failed to check network:', err);
        onConnect(); // Still try to connect
      }
    } else {
      alert(`${walletId} support coming soon! Please use MetaMask for now.`);
    }
  };

  const switchNetwork = async (ethereum: any) => {
    try {
      console.log(`🔄 Switching to ${CHAIN_CONFIG.chainName}...`);

      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CHAIN_CONFIG.chainId }],
      });

      console.log(`✅ Switched to ${CHAIN_CONFIG.chainName}`);
    } catch (switchError: any) {
      console.log('Switch error:', switchError);

      if (switchError.code === 4902) {
        try {
          console.log(`➕ Adding ${CHAIN_CONFIG.chainName} to wallet...`);

          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [CHAIN_CONFIG],
          });

          console.log(`✅ Added ${CHAIN_CONFIG.chainName}`);
        } catch (addError) {
          console.error('Failed to add network:', addError);
          throw new Error(`Failed to add ${CHAIN_CONFIG.chainName} network`);
        }
      } else if (switchError.code === 4001) {
        throw new Error('Network switch rejected by user');
      } else {
        throw new Error(`Failed to switch network: ${switchError.message}`);
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🚀 Neureal</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '30px' }}>
          Connect your wallet to start predicting NEURAL price movements
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            color: '#ff6b6b'
          }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '20px', color: 'rgba(255,255,255,0.9)' }}>
            Choose your wallet:
          </h3>

          {availableWallets.length === 0 && (
            <div style={{
              background: 'rgba(255, 193, 7, 0.2)',
              border: '1px solid rgba(255, 193, 7, 0.4)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <p>⚠️ No Web3 wallets detected!</p>
              <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>
                Please install <a href="https://metamask.io" target="_blank" rel="noopener noreferrer"
                   style={{ color: '#fff', textDecoration: 'underline' }}>MetaMask</a> or another Web3 wallet.
              </p>
            </div>
          )}

          <div style={{ display: 'grid', gap: '12px' }}>
            {availableWallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleWalletSelect(wallet.id)}
                disabled={isConnecting}
                style={{
                  background: selectedWallet === wallet.id
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                  color: 'white',
                  cursor: isConnecting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  opacity: isConnecting ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isConnecting) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isConnecting) {
                    e.currentTarget.style.background = selectedWallet === wallet.id
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(255, 255, 255, 0.1)';
                  }
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{wallet.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {wallet.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                    {wallet.description}
                  </div>
                </div>
                {selectedWallet === wallet.id && isConnecting && (
                  <div style={{ fontSize: '1rem' }}>⏳</div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '20px'
        }}>
          <h4 style={{ marginBottom: '12px', color: 'rgba(255,255,255,0.9)' }}>
            📡 Network Requirements
          </h4>
          <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
            <p>• Network: <strong>{CHAIN_CONFIG.chainName}</strong></p>
            <p>• Chain ID: <strong>{TARGET_CHAIN_ID}</strong></p>
            <p>• RPC URL: <strong>{CHAIN_CONFIG.rpcUrls[0]}</strong></p>
          </div>
          <div style={{
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.6)',
            marginTop: '12px',
            fontStyle: 'italic'
          }}>
            Don't worry - we'll help you switch networks if needed! 🔄
          </div>
        </div>
      </div>
    </div>
  );
}