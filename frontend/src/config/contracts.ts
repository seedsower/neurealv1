export const BASE_SEPOLIA_CHAIN_ID = 84532;

export const CONTRACTS = {
  NEURAL_TOKEN: "0xadb6427078b2c9fCd2c4addf458471e69c923305",
  NEURAL_PREDICTION: "0x003B8992Af914913562E5508f2d66Aa184D5958C"
};

export const CHAIN_CONFIG = {
  chainId: `0x${BASE_SEPOLIA_CHAIN_ID.toString(16)}`,
  chainName: "Base Sepolia",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://sepolia.base.org"],
  blockExplorerUrls: ["https://sepolia.basescan.org"],
};

export const NEURAL_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function owner() view returns (address)",
  "function predictionContract() view returns (address)",
  "function setPredictionContract(address) returns (bool)",
  "function burn(uint256 amount)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

export const NEURAL_PREDICTION_ABI = [
  "function neuralToken() view returns (address)",
  "function currentPrice() view returns (uint256)",
  "function currentRound() view returns (uint256)",
  "function priceOracle() view returns (address)",
  "function makePrediction(uint256 amount, bool isUp)",
  "function claimRewards(uint256 predictionId)",
  "function resolveRound(uint256 roundId)",
  "function updatePrice(uint256 newPrice)",
  "function getCurrentPrice() view returns (uint256)",
  "function getPredictionResult(uint256 predictionId) view returns (bool isWinning, bool isResolved, uint256 entryPrice, uint256 currentOrEndPrice)",
  "function getUserActivePredictions(address user) view returns (uint256[])",
  "function getRoundStats(uint256 roundId) view returns (uint256 totalStaked, uint256 upStake, uint256 downStake, uint256 participants, bool isResolved, uint256 startPrice, uint256 endPrice)",
  "function getUserStats(address user) view returns (uint256 totalStaked, uint256 totalWinnings, uint256 winStreak, uint256 activePredictions)",
  "function predictions(uint256) view returns (address predictor, uint256 amount, uint256 timestamp, uint256 lockedUntil, bool isUpPrediction, uint256 entryPrice, bool claimed, uint256 predictionId, uint256 roundId)",
  "function rounds(uint256) view returns (uint256 startTime, uint256 endTime, uint256 startPrice, uint256 endPrice, uint256 totalUpStake, uint256 totalDownStake, bool resolved)",
  "event PredictionMade(address indexed user, uint256 indexed round, uint256 amount, bool isUp, uint256 predictionId, uint256 entryPrice)",
  "event RoundResolved(uint256 indexed round, uint256 startPrice, uint256 endPrice, bool priceWentUp)",
  "event RewardsClaimed(address indexed user, uint256 indexed predictionId, uint256 amount, bool won)"
];

export const MIN_STAKE = "1000000000000000000"; // 1 NEURAL
export const MAX_STAKE = "1000000000000000000000"; // 1000 NEURAL