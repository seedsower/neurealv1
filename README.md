# Neureal - Web3 Prediction Market

A decentralized prediction market dApp where users stake NEURAL tokens to predict if the token price will go UP or DOWN in 24-hour rounds.

## Features

- **Binary Predictions**: UP/DOWN predictions on NEURAL token price
- **24-Hour Rounds**: Automatic round resolution with Chainlink price feeds
- **Token Staking**: Minimum 100, maximum 100k NEURAL tokens per prediction
- **Winner Takes All**: Winners split the losing pool proportionally (minus 3% platform fee)
- **Real-Time Updates**: Live price charts and prediction statistics
- **Emergency Withdraw**: Available after 48 hours with 10% penalty
- **User Statistics**: Track total staked, winnings, and win streaks

## Architecture

```
├── contracts/          # Solidity smart contracts
├── backend/            # Node.js/Express/TypeScript API server
├── frontend/           # React web application
└── docs/              # Documentation
```

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   cd contracts && npm install
   cd ../backend && npm install
   cd ../frontend && npm install
   ```

2. **Deploy contracts**
   ```bash
   npm run deploy:contracts
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```

## Technology Stack

- **Smart Contracts**: Solidity, Hardhat, Chainlink
- **Backend**: Node.js, Express, TypeScript, Socket.io, Redis, MongoDB
- **Frontend**: React, TypeScript, ethers.js, Tailwind CSS
- **Blockchain**: Polygon Network

## Environment Setup

Copy `.env.example` files in each directory and configure:
- RPC endpoints
- Private keys
- Database connections
- API keys

## Testing

```bash
npm test
```

## Deployment

1. Configure production environment variables
2. Deploy smart contracts to mainnet
3. Build and deploy backend/frontend

## License

MIT