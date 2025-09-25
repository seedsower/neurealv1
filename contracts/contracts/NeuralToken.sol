// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NeuralToken
 * @dev ERC20 token for the Neureal prediction platform
 */
contract NeuralToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 100000000 * 10**18; // 100 million tokens
    address public predictionContract;
    
    event PredictionContractSet(address indexed newContract);
    event TokensBurned(address indexed burner, uint256 amount);
    
    constructor() ERC20("Neureal", "NEURAL") Ownable(msg.sender) {
        _mint(msg.sender, MAX_SUPPLY);
    }
    
    /**
     * @dev Sets the prediction contract address that can interact with tokens
     * @param _contract Address of the prediction contract
     */
    function setPredictionContract(address _contract) external onlyOwner {
        require(_contract != address(0), "Invalid contract address");
        predictionContract = _contract;
        emit PredictionContractSet(_contract);
    }
    
    /**
     * @dev Burns tokens from the caller's balance
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }
}