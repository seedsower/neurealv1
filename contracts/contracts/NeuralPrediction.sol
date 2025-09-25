// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title NeuralPrediction
 * @dev Prediction market contract for NEURAL token price predictions
 */
contract NeuralPrediction is Ownable, ReentrancyGuard {
    
    struct Prediction {
        address predictor;
        uint256 amount;
        uint256 timestamp;
        uint256 lockedUntil;
        bool isUpPrediction;
        uint256 entryPrice; // Price at the exact moment of prediction
        bool claimed;
        uint256 predictionId;
        uint256 roundId;
    }
    
    struct Round {
        uint256 startTime;
        uint256 endTime;
        uint256 startPrice;
        uint256 endPrice;
        uint256 totalUpStake;
        uint256 totalDownStake;
        bool resolved;
        mapping(address => uint256[]) userPredictions;
        mapping(uint256 => uint256) predictionPrices; // Track each prediction's entry price
    }
    
    // State variables
    IERC20 public immutable neuralToken;
    address public priceOracle;
    uint256 public currentPrice; // Price in 8 decimals (e.g., 28470000 = $0.2847)
    
    uint256 public constant LOCK_DURATION = 24 hours;
    uint256 public constant ROUND_DURATION = 24 hours;
    uint256 public constant MIN_STAKE = 1 * 10**18; // 1 NEURAL minimum
    uint256 public constant MAX_STAKE = 1000 * 10**18; // 1000 NEURAL maximum
    uint256 public constant FEE_PERCENTAGE = 300; // 3% platform fee
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant PRICE_DECIMALS = 8; // Price precision
    
    uint256 public currentRound;
    uint256 public totalFeesCollected;
    uint256 public nextPredictionId;
    
    mapping(uint256 => Round) public rounds;
    mapping(uint256 => Prediction) public predictions;
    mapping(address => uint256[]) public userPredictionIds;
    mapping(address => uint256) public userTotalStaked;
    mapping(address => uint256) public userWinnings;
    mapping(address => uint256) public userWinStreak;
    
    // Events
    event PredictionMade(
        address indexed user,
        uint256 indexed round,
        uint256 amount,
        bool isUp,
        uint256 predictionId,
        uint256 entryPrice
    );
    
    event RoundResolved(
        uint256 indexed round,
        uint256 startPrice,
        uint256 endPrice,
        bool priceWentUp
    );
    
    event RewardsClaimed(
        address indexed user,
        uint256 indexed predictionId,
        uint256 amount,
        bool won
    );
    
    event FeesWithdrawn(address indexed owner, uint256 amount);
    event PriceUpdated(uint256 newPrice, address indexed updater);
    event OracleUpdated(address indexed newOracle);
    
    /**
     * @dev Constructor to initialize the prediction contract
     * @param _neuralToken Address of the NEURAL token contract
     * @param _initialPrice Initial price in 8 decimals (e.g., 28470000 = $0.2847)
     */
    constructor(address _neuralToken, uint256 _initialPrice) Ownable(msg.sender) {
        require(_neuralToken != address(0), "Invalid token address");
        require(_initialPrice > 0, "Invalid initial price");
        
        neuralToken = IERC20(_neuralToken);
        currentPrice = _initialPrice;
        priceOracle = msg.sender; // Initially, owner can update price
        _startNewRound();
    }
    
    // ============ CORE FUNCTIONS ============
    
    /**
     * @dev Makes a prediction for the current round
     * @param _amount Amount of NEURAL tokens to stake
     * @param _isUp True for UP prediction, false for DOWN
     */
    function makePrediction(uint256 _amount, bool _isUp) external nonReentrant {
        require(_amount >= MIN_STAKE, "Below minimum stake");
        require(_amount <= MAX_STAKE, "Above maximum stake");
        require(
            block.timestamp < rounds[currentRound].endTime - 1 hours,
            "Predictions closed for this round"
        );
        
        // Transfer tokens from user
        require(
            neuralToken.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );
        
        // Get current price at the exact moment of prediction
        uint256 predictionEntryPrice = getCurrentPrice();
        
        // Create prediction with its own entry price
        uint256 predId = nextPredictionId++;
        predictions[predId] = Prediction({
            predictor: msg.sender,
            amount: _amount,
            timestamp: block.timestamp,
            lockedUntil: block.timestamp + LOCK_DURATION,
            isUpPrediction: _isUp,
            entryPrice: predictionEntryPrice,
            claimed: false,
            predictionId: predId,
            roundId: currentRound
        });
        
        // Store the prediction price for this specific prediction
        rounds[currentRound].predictionPrices[predId] = predictionEntryPrice;
        
        // Update round data
        if (_isUp) {
            rounds[currentRound].totalUpStake += _amount;
        } else {
            rounds[currentRound].totalDownStake += _amount;
        }
        
        rounds[currentRound].userPredictions[msg.sender].push(predId);
        userPredictionIds[msg.sender].push(predId);
        userTotalStaked[msg.sender] += _amount;
        
        emit PredictionMade(msg.sender, currentRound, _amount, _isUp, predId, predictionEntryPrice);
    }
    
    /**
     * @dev Resolves a round and determines winners
     * @param _roundId ID of the round to resolve
     */
    function resolveRound(uint256 _roundId) external {
        Round storage round = rounds[_roundId];
        require(block.timestamp >= round.endTime, "Round not ended");
        require(!round.resolved, "Already resolved");
        
        uint256 endPrice = getCurrentPrice();
        round.endPrice = endPrice;
        round.resolved = true;
        
        bool overallPriceWentUp = endPrice > round.startPrice;
        
        emit RoundResolved(_roundId, round.startPrice, endPrice, overallPriceWentUp);
        
        // Start new round if this was current
        if (_roundId == currentRound) {
            _startNewRound();
        }
    }
    
    /**
     * @dev Claims rewards for a winning prediction
     * @param _predictionId ID of the prediction to claim
     */
    function claimRewards(uint256 _predictionId) external nonReentrant {
        Prediction storage pred = predictions[_predictionId];
        require(pred.predictor == msg.sender, "Not your prediction");
        require(!pred.claimed, "Already claimed");
        require(block.timestamp >= pred.lockedUntil, "Still locked");
        
        uint256 roundId = pred.roundId;
        Round storage round = rounds[roundId];
        require(round.resolved, "Round not resolved");
        
        // Evaluate prediction based on the individual entry price
        bool priceWentUpForThisPrediction = round.endPrice > pred.entryPrice;
        bool wonPrediction = (priceWentUpForThisPrediction && pred.isUpPrediction) || 
                            (!priceWentUpForThisPrediction && !pred.isUpPrediction);
        
        uint256 reward = 0;
        
        if (wonPrediction) {
            // Calculate winning and losing pools
            (uint256 winningPool, uint256 losingPool) = _calculatePools(roundId, round.endPrice);
            
            if (losingPool > 0 && winningPool > 0) {
                // Calculate user's share of winnings
                uint256 userShare = (pred.amount * 1e18) / winningPool;
                uint256 wonAmount = (losingPool * userShare) / 1e18;
                
                // Apply platform fee
                uint256 fee = (wonAmount * FEE_PERCENTAGE) / FEE_DENOMINATOR;
                totalFeesCollected += fee;
                
                reward = pred.amount + wonAmount - fee;
                userWinStreak[msg.sender]++;
            } else {
                // No losers, return stake
                reward = pred.amount;
            }
            
            userWinnings[msg.sender] += (reward > pred.amount) ? (reward - pred.amount) : 0;
        } else {
            // Lost prediction
            userWinStreak[msg.sender] = 0;
        }
        
        pred.claimed = true;
        
        if (reward > 0) {
            require(neuralToken.transfer(msg.sender, reward), "Transfer failed");
            emit RewardsClaimed(msg.sender, _predictionId, reward, wonPrediction);
        } else {
            emit RewardsClaimed(msg.sender, _predictionId, 0, false);
        }
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Gets the current price
     */
    function getCurrentPrice() public view returns (uint256) {
        return currentPrice;
    }
    
    /**
     * @dev Updates the price (called by oracle or owner)
     * @param _newPrice New price in 8 decimals
     */
    function updatePrice(uint256 _newPrice) external {
        require(msg.sender == priceOracle || msg.sender == owner(), "Not authorized");
        require(_newPrice > 0, "Invalid price");
        
        currentPrice = _newPrice;
        emit PriceUpdated(_newPrice, msg.sender);
    }
    
    /**
     * @dev Checks if a prediction is winning
     */
    function getPredictionResult(uint256 _predictionId) public view returns (
        bool isWinning,
        bool isResolved,
        uint256 entryPrice,
        uint256 currentOrEndPrice
    ) {
        Prediction memory pred = predictions[_predictionId];
        Round storage round = rounds[pred.roundId];
        
        uint256 comparePrice = round.resolved ? round.endPrice : getCurrentPrice();
        bool priceWentUp = comparePrice > pred.entryPrice;
        bool winning = (priceWentUp && pred.isUpPrediction) || (!priceWentUp && !pred.isUpPrediction);
        
        return (winning, round.resolved, pred.entryPrice, comparePrice);
    }
    
    /**
     * @dev Gets all active predictions for a user
     */
    function getUserActivePredictions(address _user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256 count = 0;
        uint256[] memory userPreds = userPredictionIds[_user];
        
        for (uint256 i = 0; i < userPreds.length; i++) {
            if (!predictions[userPreds[i]].claimed) {
                count++;
            }
        }
        
        uint256[] memory active = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < userPreds.length; i++) {
            if (!predictions[userPreds[i]].claimed) {
                active[index++] = userPreds[i];
            }
        }
        
        return active;
    }
    
    /**
     * @dev Gets statistics for a specific round
     */
    function getRoundStats(uint256 _roundId) 
        external 
        view 
        returns (
            uint256 totalStaked,
            uint256 upStake,
            uint256 downStake,
            uint256 participants,
            bool isResolved,
            uint256 startPrice,
            uint256 endPrice
        ) 
    {
        Round storage round = rounds[_roundId];
        return (
            round.totalUpStake + round.totalDownStake,
            round.totalUpStake,
            round.totalDownStake,
            _countRoundParticipants(_roundId),
            round.resolved,
            round.startPrice,
            round.resolved ? round.endPrice : 0
        );
    }
    
    /**
     * @dev Gets user statistics
     */
    function getUserStats(address _user) 
        external 
        view 
        returns (
            uint256 totalStaked,
            uint256 totalWinnings,
            uint256 winStreak,
            uint256 activePredictions
        ) 
    {
        uint256 activeCount = 0;
        uint256[] memory userPreds = userPredictionIds[_user];
        
        for (uint256 i = 0; i < userPreds.length; i++) {
            if (!predictions[userPreds[i]].claimed) {
                activeCount++;
            }
        }
        
        return (
            userTotalStaked[_user],
            userWinnings[_user],
            userWinStreak[_user],
            activeCount
        );
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    function _startNewRound() private {
        currentRound++;
        rounds[currentRound].startTime = block.timestamp;
        rounds[currentRound].endTime = block.timestamp + ROUND_DURATION;
        rounds[currentRound].startPrice = getCurrentPrice();
    }
    
    function _calculatePools(uint256 _roundId, uint256 _endPrice) 
        private 
        view 
        returns (uint256 winningPool, uint256 losingPool) 
    {
        Round storage round = rounds[_roundId];
        bool overallUp = _endPrice > round.startPrice;
        
        if (overallUp) {
            winningPool = round.totalUpStake;
            losingPool = round.totalDownStake;
        } else {
            winningPool = round.totalDownStake;
            losingPool = round.totalUpStake;
        }
        
        return (winningPool, losingPool);
    }
    
    function _countRoundParticipants(uint256 _roundId) 
        private 
        view 
        returns (uint256 count) 
    {
        // Placeholder - implement proper participant tracking in production
        return 0;
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Withdraws collected platform fees
     */
    function withdrawFees() external onlyOwner {
        uint256 amount = totalFeesCollected;
        require(amount > 0, "No fees to withdraw");
        totalFeesCollected = 0;
        
        require(neuralToken.transfer(owner(), amount), "Transfer failed");
        emit FeesWithdrawn(owner(), amount);
    }
    
    /**
     * @dev Updates the oracle address that can update prices
     */
    function updateOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "Invalid oracle address");
        priceOracle = _newOracle;
        emit OracleUpdated(_newOracle);
    }
    
    /**
     * @dev Batch price update for gas efficiency
     * @param _prices Array of prices for multiple updates
     */
    function batchUpdatePrice(uint256[] calldata _prices) external {
        require(msg.sender == priceOracle || msg.sender == owner(), "Not authorized");
        require(_prices.length > 0, "Empty price array");
        
        for (uint256 i = 0; i < _prices.length; i++) {
            require(_prices[i] > 0, "Invalid price");
            currentPrice = _prices[i];
            emit PriceUpdated(_prices[i], msg.sender);
        }
    }
}