import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
    };
  }
}

interface PriceData {
  timestamp: number;
  price: number;
  volume24h?: number;
  change24h?: number;
}

function SimpleApp() {
  const [currentPrice, setCurrentPrice] = useState<number>(1.0);
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [stakeAmount, setStakeAmount] = useState<string>('100');

  useEffect(() => {
    const socketConnection = io('http://localhost:5001');

    socketConnection.on('connect', () => {
      setConnected(true);
      console.log('Connected to Neureal server!');
    });

    socketConnection.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from server');
    });

    socketConnection.on('initial_data', (data: any) => {
      setCurrentPrice(data.currentPrice);
      setPriceHistory(data.priceHistory);
      setLoading(false);
    });

    socketConnection.on('price_update', (data: any) => {
      setCurrentPrice(data.price);
      setPriceHistory(prev => [...prev.slice(-99), {
        timestamp: data.timestamp,
        price: data.price,
        volume24h: 0,
        change24h: 0
      }]);
    });

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const handleWalletConnect = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        if (accounts.length > 0) {
          setWalletConnected(true);
          setWalletAddress(accounts[0]);
          console.log('Wallet connected:', accounts[0]);
        }
      } else {
        alert('Please install MetaMask to connect your wallet!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const handlePrediction = async (direction: 'up' | 'down') => {
    if (!walletConnected) {
      alert('Please connect your wallet first!');
      return;
    }

    const amount = parseFloat(stakeAmount);
    if (amount < 100 || amount > 100000) {
      alert('Stake amount must be between 100 and 100,000 NEURAL tokens!');
      return;
    }

    alert(`${direction.toUpperCase()} prediction placed! Stake: ${amount} NEURAL`);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <div className="loading-dots">
          <div></div>
          <div></div>
          <div></div>
        </div>
        <h3 style={{ marginTop: '20px', color: 'white' }}>Loading Neureal...</h3>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>Connecting to the prediction market...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', color: 'white' }}>
      {/* Header */}
      <header className="header">
        <div className="container">
          <nav className="nav">
            <div className="logo">
              <div className="logo-icon">N</div>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Neureal</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: connected ? '#10b981' : '#ef4444'
                }} />
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {walletConnected ? (
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}>
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </div>
              ) : (
                <button className="btn-primary" onClick={handleWalletConnect}>
                  Connect Wallet
                </button>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="container" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
        {/* Price Section */}
        <section className="glassmorphism-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 className="text-3xl font-bold gradient-text">NEURAL Price</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>
                Real-time token price tracking
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                ${currentPrice.toFixed(4)}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Price Chart Placeholder */}
          <div style={{
            height: '300px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📈</div>
              <p>Price Chart</p>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
                {priceHistory.length} data points • Live updates every 5s
              </p>
            </div>
          </div>

          {/* Live Indicator */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.1)',
              padding: '8px 16px',
              borderRadius: '8px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#10b981',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }} />
              <span style={{ fontSize: '0.875rem' }}>Live Data</span>
            </div>
          </div>
        </section>

        {/* Prediction Interface */}
        <section className="glassmorphism-card">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold" style={{ marginBottom: '8px' }}>
              Price Prediction Round #1
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>
              Will NEURAL price go UP or DOWN in the next 24 hours?
            </p>
          </div>

          {/* Round Info */}
          <div className="grid-3 mb-6">
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⏰</div>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>Time Remaining</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>23:45:32</p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '4px' }}>
                ${currentPrice.toFixed(4)}
              </div>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>Starting Price</p>
              <p style={{ fontSize: '0.875rem', color: '#d946ef', marginTop: '4px' }}>
                Current: ${currentPrice.toFixed(4)}
              </p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>23,500 NEURAL</p>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>Total Pool</p>
              <p style={{ fontSize: '0.875rem', color: '#3b82f6', marginTop: '4px' }}>45 Predictors</p>
            </div>
          </div>

          {/* Pool Distribution */}
          <div className="mb-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
              <span>UP Pool: 64.0%</span>
              <span>DOWN Pool: 36.0%</span>
            </div>
            <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', background: '#374151' }}>
              <div style={{ width: '64%', background: '#10b981', transition: 'all 0.5s' }} />
              <div style={{ width: '36%', background: '#ef4444', transition: 'all 0.5s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '8px' }}>
              <span style={{ color: '#10b981' }}>15,040 NEURAL</span>
              <span style={{ color: '#ef4444' }}>8,460 NEURAL</span>
            </div>
          </div>

          {/* Stake Amount Input */}
          <div className="mb-6">
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>
              Stake Amount (NEURAL)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                min="100"
                max="100000"
                step="10"
                className="input"
                placeholder="Enter amount (100-100,000)"
                style={{ paddingRight: '80px' }}
              />
              <div style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.7)'
              }}>
                NEURAL
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
              <span>Min: 100 NEURAL</span>
              <span>Max: 100,000 NEURAL</span>
            </div>
          </div>

          {/* Prediction Buttons */}
          <div className="grid-2 mb-6">
            <button
              onClick={() => handlePrediction('up')}
              className="btn-up"
              disabled={!walletConnected}
              style={{ opacity: walletConnected ? 1 : 0.5 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>⬆️</span>
                <span style={{ fontSize: '1.125rem' }}>UP</span>
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                Potential Win: {Math.floor(parseFloat(stakeAmount || '100') * 1.45)} NEURAL
              </div>
            </button>

            <button
              onClick={() => handlePrediction('down')}
              className="btn-down"
              disabled={!walletConnected}
              style={{ opacity: walletConnected ? 1 : 0.5 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>⬇️</span>
                <span style={{ fontSize: '1.125rem' }}>DOWN</span>
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                Potential Win: {Math.floor(parseFloat(stakeAmount || '100') * 2.78)} NEURAL
              </div>
            </button>
          </div>

          {/* Wallet Warning */}
          {!walletConnected && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#fbbf24', fontSize: '0.875rem' }}>
                Connect your wallet to start making predictions!
              </p>
            </div>
          )}

          {/* Rules */}
          <div style={{ marginTop: '24px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
            <p style={{ marginBottom: '4px' }}>• Predictions are locked for 24 hours</p>
            <p style={{ marginBottom: '4px' }}>• Winners split the losing pool proportionally (97% after platform fee)</p>
            <p>• Emergency withdraw available after 48 hours (10% penalty)</p>
          </div>
        </section>

        {/* Portfolio and Leaderboard */}
        <div className="grid-2">
          <section className="glassmorphism-card">
            <h3 className="text-xl font-bold mb-4">Portfolio</h3>
            {walletConnected ? (
              <div>
                <div className="grid-2 mb-6">
                  <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>8,500</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>NEURAL Balance</div>
                  </div>
                  <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#10b981' }}>+3,200</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Total Winnings</div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: '32px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏆</div>
                  <p style={{ color: 'rgba(255,255,255,0.7)' }}>No predictions yet</p>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                    Make your first prediction to get started!
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: '#6b7280',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '2rem'
                }}>
                  📊
                </div>
                <p style={{ color: 'rgba(255,255,255,0.7)' }}>Connect your wallet to view your portfolio</p>
              </div>
            )}
          </section>

          <section className="glassmorphism-card">
            <h3 className="text-xl font-bold mb-4">Leaderboard</h3>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
                <button style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#d946ef',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  Winnings
                </button>
                <button style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.875rem'
                }}>
                  Streak
                </button>
                <button style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.875rem'
                }}>
                  Win Rate
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { rank: 1, address: '0x1234...7890', winnings: 15000, icon: '🥇' },
                { rank: 2, address: '0x2345...8901', winnings: 12000, icon: '🥈' },
                { rank: 3, address: '0x3456...9012', winnings: 9500, icon: '🥉' }
              ].map((entry) => (
                <div key={entry.rank} style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '1.25rem' }}>{entry.icon}</div>
                    <div>
                      <div style={{ fontWeight: '500' }}>{entry.address}</div>
                      <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                        50 predictions
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold' }}>{entry.winnings.toLocaleString()} NEURAL</div>
                    <div style={{ fontSize: '0.875rem', color: '#10b981' }}>Winnings</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default SimpleApp;