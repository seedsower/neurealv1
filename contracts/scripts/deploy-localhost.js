const hre = require("hardhat");

async function main() {
  console.log("Starting deployment to localhost...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying from account:", deployer.address);
  console.log("Account balance:", hre.ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  // Deploy NeuralToken first
  console.log("\n1. Deploying NeuralToken...");
  const NeuralToken = await hre.ethers.getContractFactory("NeuralToken");
  const neuralToken = await NeuralToken.deploy();
  await neuralToken.deployed();

  console.log("✅ NeuralToken deployed to:", neuralToken.address);

  // Deploy NeuralPrediction with the token address
  console.log("\n2. Deploying NeuralPrediction...");
  const INITIAL_PRICE = 28470000; // $0.2847 in 8 decimals

  const NeuralPrediction = await hre.ethers.getContractFactory("NeuralPrediction");
  const neuralPrediction = await NeuralPrediction.deploy(neuralToken.address, INITIAL_PRICE);
  await neuralPrediction.deployed();

  console.log("✅ NeuralPrediction deployed to:", neuralPrediction.address);

  // Link contracts
  console.log("\n3. Linking contracts...");
  const linkTx = await neuralToken.setPredictionContract(neuralPrediction.address);
  await linkTx.wait();
  console.log("✅ Contracts linked successfully");

  // Log contract details
  console.log("\n📋 Deployment Summary:");
  console.log("- NeuralToken:", neuralToken.address);
  console.log("- NeuralPrediction:", neuralPrediction.address);
  console.log("- Network: Localhost (Hardhat)");
  console.log("- Token Name:", await neuralToken.name());
  console.log("- Token Symbol:", await neuralToken.symbol());
  console.log("- Total Supply:", hre.ethers.utils.formatEther(await neuralToken.totalSupply()), "NEURAL");
  console.log("- Current Price:", (await neuralPrediction.currentPrice()).toString(), "($0.2847 with 8 decimals)");

  console.log("\n🎉 Localhost deployment completed successfully!");
  console.log("\nTo use in frontend development:");
  console.log("- NEURAL_TOKEN:", neuralToken.address);
  console.log("- NEURAL_PREDICTION:", neuralPrediction.address);
  console.log("- Add Hardhat network to MetaMask:");
  console.log("  - Network Name: Hardhat Localhost");
  console.log("  - RPC URL: http://127.0.0.1:8545");
  console.log("  - Chain ID: 1337");
  console.log("  - Currency Symbol: ETH");

  return {
    neuralToken: neuralToken.address,
    neuralPrediction: neuralPrediction.address,
    deployer: deployer.address
  };
}

main()
  .then((result) => {
    console.log("\nDeployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });