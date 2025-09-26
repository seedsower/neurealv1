import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { formatTokenAmount, formatPrice, parseTokenAmount, waitForTransaction, formatAddress, switchToTargetNetwork } from '../utils/web3';
import { TARGET_CHAIN_ID, CHAIN_CONFIG, MAX_STAKE } from '../config/contracts';
import WalletModal from './WalletModal';

interface RoundData {
  startTime: number;
  endTime: number;
  startPrice: ethers.BigNumber;
  endPrice: ethers.BigNumber;
  totalUpStake: ethers.BigNumber;
  totalDownStake: ethers.BigNumber;
  resolved: boolean;
}

interface UserStats {
  totalStaked: ethers.BigNumber;
  totalWinnings: ethers.BigNumber;
  winStreak: ethers.BigNumber;
  activePredictions: ethers.BigNumber;
}

function PredictionApp() {
  const {
    account,
    chainId,
    neuralToken,
    neuralPrediction,
    isConnecting,
    connect,
  } = useWeb3();

  const [currentPrice, setCurrentPrice] = useState<ethers.BigNumber>(ethers.BigNumber.from(0));
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [tokenBalance, setTokenBalance] = useState<ethers.BigNumber>(ethers.BigNumber.from(0));
  const [tokenAllowance, setTokenAllowance] = useState<ethers.BigNumber>(ethers.BigNumber.from(0));
  const [stakeAmount, setStakeAmount] = useState<string>('100');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [txPending, setTxPending] = useState<boolean>(false);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);

  // Load contract data
  useEffect(() => {
    console.log('🌍 Environment Check:', {
      NODE_ENV: process.env.NODE_ENV,
      REACT_APP_NETWORK_MODE: process.env.REACT_APP_NETWORK_MODE,
      hostname: window.location.hostname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    if (!neuralToken || !neuralPrediction || !account) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        // Load basic data in parallel
        console.log('🔄 Loading contract data from Base Sepolia...', {
          neuralToken: neuralToken!.address,
          neuralPrediction: neuralPrediction!.address,
          account: account!,
          timestamp: new Date().toISOString()
        });

        const [
          priceData,
          roundId,
          balance,
          allowance,
        ] = await Promise.all([
          neuralPrediction!.currentPrice(),
          neuralPrediction!.currentRound(),
          neuralToken!.balanceOf(account!),
          neuralToken!.allowance(account!, neuralPrediction!.address),
        ]);

        console.log('📊 Contract data loaded:', {
          price: priceData.toString(),
          roundId: roundId.toString(),
          balance: balance.toString(),
          allowance: allowance.toString(),
          timestamp: new Date().toISOString()
        });

        setCurrentPrice(priceData);
        setCurrentRound(roundId.toNumber());
        setTokenBalance(balance);
        setTokenAllowance(allowance);

        // Load round data
        if (roundId.gt(0)) {
          const roundInfo = await neuralPrediction.getRoundStats(roundId);
          const roundDetails = await neuralPrediction.rounds(roundId);

          setRoundData({
            startTime: roundDetails.startTime.toNumber(),
            endTime: roundDetails.endTime.toNumber(),
            startPrice: roundDetails.startPrice,
            endPrice: roundDetails.endPrice,
            totalUpStake: roundInfo.upStake,
            totalDownStake: roundInfo.downStake,
            resolved: roundDetails.resolved,
          });
        }

        // Load user stats
        const stats = await neuralPrediction.getUserStats(account);
        setUserStats({
          totalStaked: stats.totalStaked,
          totalWinnings: stats.totalWinnings,
          winStreak: stats.winStreak,
          activePredictions: stats.activePredictions,
        });

        setError(null);
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load contract data');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Set up polling for price updates
    const interval = setInterval(loadData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [neuralToken, neuralPrediction, account]);

  const handleApprove = async () => {
    if (!neuralToken || !neuralPrediction) return;

    try {
      setTxPending(true);
      setError(null);

      const amount = parseTokenAmount(MAX_STAKE);
      const tx = await neuralToken.approve(neuralPrediction.address, amount);
      await waitForTransaction(tx);

      // Refresh allowance
      const newAllowance = await neuralToken!.allowance(account!, neuralPrediction!.address);
      setTokenAllowance(newAllowance);
    } catch (err: any) {
      console.error('Approval error:', err);
      setError(err.message || 'Failed to approve tokens');
    } finally {
      setTxPending(false);
    }
  };

  const handlePrediction = async (isUp: boolean) => {
    if (!neuralPrediction || !account) return;

    try {
      setTxPending(true);
      setError(null);

      const amount = parseTokenAmount(stakeAmount);

      // Check if we have enough allowance
      if (tokenAllowance.lt(amount)) {
        throw new Error('Please approve tokens first');
      }

      // Check if we have enough balance
      if (tokenBalance.lt(amount)) {
        throw new Error('Insufficient token balance');
      }

      console.log('🎯 Making prediction:', { amount: amount.toString(), isUp, timestamp: new Date().toISOString() });
      const tx = await neuralPrediction.makePrediction(amount, isUp);
      console.log('⏳ Transaction submitted:', tx.hash);
      await waitForTransaction(tx);
      console.log('✅ Transaction confirmed, refreshing data...');

      // Refresh data
      if (neuralToken && neuralPrediction && account) {
        const [newBalance, newStats] = await Promise.all([
          neuralToken!.balanceOf(account!),
          neuralPrediction!.getUserStats(account!),
        ]);

        setTokenBalance(newBalance);
        setUserStats({
          totalStaked: newStats.totalStaked,
          totalWinnings: newStats.totalWinnings,
          winStreak: newStats.winStreak,
          activePredictions: newStats.activePredictions,
        });

        console.log('🔄 Data refreshed after transaction:', {
          newBalance: newBalance.toString(),
          newStats: {
            totalStaked: newStats.totalStaked.toString(),
            activePredictions: newStats.activePredictions.toString()
          },
          timestamp: new Date().toISOString()
        });
      }

      // Refresh round data
      if (currentRound > 0) {
        const roundInfo = await neuralPrediction.getRoundStats(currentRound);
        setRoundData(prev => prev ? {
          ...prev,
          totalUpStake: roundInfo.upStake,
          totalDownStake: roundInfo.downStake,
        } : null);
      }
    } catch (err: any) {
      console.error('Prediction error:', err);
      setError(err.message || 'Failed to make prediction');
    } finally {
      setTxPending(false);
    }
  };

  const getRemainingTime = () => {
    if (!roundData) return 'Loading...';

    const now = Math.floor(Date.now() / 1000);
    const remaining = roundData.endTime - now;

    if (remaining <= 0) return 'Round Ended';

    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getPoolPercentages = () => {
    if (!roundData || roundData.totalUpStake.add(roundData.totalDownStake).eq(0)) {
      return { upPercent: 50, downPercent: 50 };
    }

    const total = roundData.totalUpStake.add(roundData.totalDownStake);
    const upPercent = Math.round(roundData.totalUpStake.mul(100).div(total).toNumber());
    const downPercent = 100 - upPercent;

    return { upPercent, downPercent };
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
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>Connecting to Base Sepolia...</p>
      </div>
    );
  }

  const isWrongNetwork = account && chainId !== TARGET_CHAIN_ID;
  const isConnected = account && chainId === TARGET_CHAIN_ID;

  const { upPercent, downPercent } = getPoolPercentages();

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
              {account ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: isConnected ? '#10b981' : '#ef4444'
                    }} />
                    <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                      {isConnected ? CHAIN_CONFIG.chainName : 'Wrong Network'}
                    </span>
                    {isWrongNetwork && (
                      <button
                        onClick={async () => {
                          try {
                            const ethereum = (window as any).ethereum;
                            if (ethereum) {
                              const switchSuccess = await switchToTargetNetwork(ethereum);
                              if (switchSuccess) {
                                setTimeout(() => connect(), 500);
                              }
                            }
                          } catch (err) {
                            console.error('Network switch failed:', err);
                          }
                        }}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          marginLeft: '8px'
                        }}
                      >
                        Switch to {CHAIN_CONFIG.chainName}
                      </button>
                    )}
                  </div>

                  <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}>
                    {formatAddress(account)}
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowWalletModal(true)}
                  className="btn-primary"
                  disabled={isConnecting}
                  style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                >
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="container" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <p style={{ color: '#f87171' }}>{error}</p>
          </div>
        )}

        {/* Price Section */}
        <section className="glassmorphism-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 className="text-3xl font-bold gradient-text">NEURAL Price</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>
                Live from {CHAIN_CONFIG.chainName}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                ${currentPrice.gt(0) ? formatPrice(currentPrice) : '0.0000'}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </section>

        {/* Wallet Info */}
        <section className="glassmorphism-card">
          <h3 style={{ marginBottom: '16px' }}>Your Wallet</h3>
          <div className="grid-3">
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
                {parseFloat(formatTokenAmount(tokenBalance)).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>NEURAL Balance</div>
            </div>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
                {userStats ? parseFloat(formatTokenAmount(userStats.totalWinnings)).toLocaleString() : '0'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Total Winnings</div>
            </div>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
                {userStats ? userStats.winStreak.toString() : '0'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Win Streak</div>
            </div>
          </div>
        </section>

        {/* Prediction Interface */}
        <section className="glassmorphism-card" style={{ opacity: isConnected ? 1 : 0.6 }}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold" style={{ marginBottom: '8px' }}>
              Prediction Round #{currentRound}
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
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{getRemainingTime()}</p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '4px' }}>
                ${roundData ? formatPrice(roundData.startPrice) : '0.0000'}
              </div>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>Starting Price</p>
              <p style={{ fontSize: '0.875rem', color: '#d946ef', marginTop: '4px' }}>
                Current: ${currentPrice.gt(0) ? formatPrice(currentPrice) : '0.0000'}
              </p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                {roundData ? parseFloat(formatTokenAmount(roundData.totalUpStake.add(roundData.totalDownStake))).toLocaleString() : '0'} NEURAL
              </p>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>Total Pool</p>
            </div>
          </div>

          {/* Pool Distribution */}
          <div className="mb-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
              <span>UP Pool: {upPercent}%</span>
              <span>DOWN Pool: {downPercent}%</span>
            </div>
            <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', background: '#374151' }}>
              <div style={{ width: `${upPercent}%`, background: '#10b981', transition: 'all 0.5s' }} />
              <div style={{ width: `${downPercent}%`, background: '#ef4444', transition: 'all 0.5s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '8px' }}>
              <span style={{ color: '#10b981' }}>
                {roundData ? parseFloat(formatTokenAmount(roundData.totalUpStake)).toLocaleString() : '0'} NEURAL
              </span>
              <span style={{ color: '#ef4444' }}>
                {roundData ? parseFloat(formatTokenAmount(roundData.totalDownStake)).toLocaleString() : '0'} NEURAL
              </span>
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
                min="1"
                max="1000"
                step="1"
                className="input"
                placeholder="Enter amount (1-1000)"
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
              <span>Min: 1 NEURAL</span>
              <span>Max: 1,000 NEURAL</span>
            </div>
          </div>

          {/* Approval Section */}
          {tokenAllowance.lt(parseTokenAmount(stakeAmount || '1')) && (
            <div className="mb-6">
              <button
                onClick={handleApprove}
                disabled={txPending}
                className="btn-primary"
                style={{ width: '100%', marginBottom: '16px' }}
              >
                {txPending ? 'Approving...' : 'Approve NEURAL Tokens'}
              </button>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                You need to approve tokens before making predictions
              </p>
            </div>
          )}

          {/* Prediction Buttons */}
          <div className="grid-2 mb-6">
            <button
              onClick={() => handlePrediction(true)}
              className="btn-up"
              disabled={!isConnected || txPending || tokenAllowance.lt(parseTokenAmount(stakeAmount || '1'))}
              style={{ opacity: (txPending || tokenAllowance.lt(parseTokenAmount(stakeAmount || '1'))) ? 0.5 : 1 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>⬆️</span>
                <span style={{ fontSize: '1.125rem' }}>UP</span>
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                Predict price will go up
              </div>
            </button>

            <button
              onClick={() => handlePrediction(false)}
              className="btn-down"
              disabled={!isConnected || txPending || tokenAllowance.lt(parseTokenAmount(stakeAmount || '1'))}
              style={{ opacity: (txPending || tokenAllowance.lt(parseTokenAmount(stakeAmount || '1'))) ? 0.5 : 1 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>⬇️</span>
                <span style={{ fontSize: '1.125rem' }}>DOWN</span>
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                Predict price will go down
              </div>
            </button>
          </div>

          {txPending && (
            <div style={{
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              <p style={{ color: '#60a5fa', fontSize: '0.875rem' }}>
                Transaction pending... Please wait for confirmation.
              </p>
            </div>
          )}

          {/* Rules */}
          <div style={{ marginTop: '24px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
            <p style={{ marginBottom: '4px' }}>• Predictions are locked for 24 hours</p>
            <p style={{ marginBottom: '4px' }}>• Winners split the losing pool proportionally (97% after platform fee)</p>
            <p>• Rewards can be claimed after round resolution</p>
          </div>
        </section>

        {!isConnected && (
          <section className="glassmorphism-card" style={{ textAlign: 'center', marginTop: '24px' }}>
            <h3 style={{ marginBottom: '16px', color: 'rgba(255,255,255,0.9)' }}>
              {!account ? '🚀 Connect Your Wallet' : '⚠️ Wrong Network'}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '20px' }}>
              {!account
                ? 'Connect your wallet to start making predictions and earning rewards'
                : `Please switch to ${CHAIN_CONFIG.chainName} network to continue`
              }
            </p>
            {!account && (
              <button
                onClick={() => setShowWalletModal(true)}
                className="btn-primary"
                disabled={isConnecting}
                style={{ fontSize: '1.1rem', padding: '12px 24px' }}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </section>
        )}
      </main>

      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={connect}
        isConnecting={isConnecting}
      />
    </div>
  );
}

export default PredictionApp;