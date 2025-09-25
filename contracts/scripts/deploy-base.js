const hre = require("hardhat");

async function main() {
  console.log("Starting deployment to Base Sepolia...");

  // Check if we have a signer
  const signers = await hre.ethers.getSigners();

  if (signers.length === 0) {
    console.error("No signers found. Please ensure your hardhat.config.js has the correct private key setup.");
    process.exit(1);
  }

  const deployer = signers[0];
  console.log("Deploying from account:", deployer.address);

  // Check balance
  const balance = await deployer.getBalance();
  console.log("Account balance:", hre.ethers.utils.formatEther(balance), "ETH");

  if (balance.isZero()) {
    console.error("Account has no ETH. Please fund your account with Base Sepolia ETH.");
    process.exit(1);
  }

  // Get the contract factory
  const NeuralToken = await hre.ethers.getContractFactory("NeuralToken");

  // Deploy the contract
  console.log("Deploying NeuralToken...");
  const neuralToken = await NeuralToken.deploy();

  // Wait for deployment
  await neuralToken.deployed();

  console.log("✅ NeuralToken deployed to:", neuralToken.address);
  console.log("Transaction hash:", neuralToken.deployTransaction.hash);

  // Log contract details
  console.log("\n📋 Contract Details:");
  console.log("- Name:", await neuralToken.name());
  console.log("- Symbol:", await neuralToken.symbol());
  console.log("- Total Supply:", hre.ethers.utils.formatEther(await neuralToken.totalSupply()), "NEURAL");
  console.log("- Owner:", await neuralToken.owner());

  console.log("\n🔗 View on BaseScan:");
  console.log(`https://sepolia.basescan.org/address/${neuralToken.address}`);

  return {
    address: neuralToken.address,
    deployer: deployer.address,
    txHash: neuralToken.deployTransaction.hash
  };
}

main()
  .then((result) => {
    console.log("\n🎉 Deployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });