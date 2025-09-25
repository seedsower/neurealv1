const hre = require("hardhat");

async function main() {
  console.log("Starting deployment of NeuralPrediction to Base Sepolia...");

  // Deployment parameters
  const NEURAL_TOKEN_ADDRESS = "0xadb6427078b2c9fCd2c4addf458471e69c923305";
  const INITIAL_PRICE = 28470000; // $0.2847 in 8 decimals

  // Check if we have a signer
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  console.log("Deploying from account:", deployer.address);

  // Check balance
  const balance = await deployer.getBalance();
  console.log("Account balance:", hre.ethers.utils.formatEther(balance), "ETH");

  console.log("\n📋 Deployment Parameters:");
  console.log("- Neural Token Address:", NEURAL_TOKEN_ADDRESS);
  console.log("- Initial Price:", INITIAL_PRICE, "($0.2847 with 8 decimals)");

  // Get the contract factory
  const NeuralPrediction = await hre.ethers.getContractFactory("NeuralPrediction");

  console.log("\nDeploying NeuralPrediction...");
  const neuralPrediction = await NeuralPrediction.deploy(NEURAL_TOKEN_ADDRESS, INITIAL_PRICE);

  // Wait for deployment
  await neuralPrediction.deployed();

  console.log("✅ NeuralPrediction deployed to:", neuralPrediction.address);
  console.log("Transaction hash:", neuralPrediction.deployTransaction.hash);

  console.log("\n🔗 View on BaseScan:");
  console.log(`https://sepolia.basescan.org/address/${neuralPrediction.address}`);

  console.log("\n💡 Next Steps:");
  console.log("1. Set the prediction contract address in NeuralToken:");
  console.log(`   neuralToken.setPredictionContract("${neuralPrediction.address}")`);
  console.log("2. Update price oracle if needed");
  console.log("3. Start making predictions!");

  return {
    neuralPrediction: neuralPrediction.address,
    neuralToken: NEURAL_TOKEN_ADDRESS,
    deployer: deployer.address,
    txHash: neuralPrediction.deployTransaction.hash,
    initialPrice: INITIAL_PRICE
  };
}

main()
  .then((result) => {
    console.log("\n🎉 NeuralPrediction deployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });