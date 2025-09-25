const hre = require("hardhat");

async function main() {
  console.log("Starting deployment of flattened NeuralToken to Base Sepolia...");

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

  // Since we're using the same contract name, Hardhat will compile it from the original source
  // The flattened version is just for verification purposes
  const NeuralToken = await hre.ethers.getContractFactory("NeuralToken");

  console.log("Deploying flattened NeuralToken...");
  const neuralToken = await NeuralToken.deploy();

  // Wait for deployment
  await neuralToken.deployed();

  console.log("✅ Flattened NeuralToken deployed to:", neuralToken.address);
  console.log("Transaction hash:", neuralToken.deployTransaction.hash);

  // Log contract details
  console.log("\n📋 Contract Details:");
  console.log("- Name:", await neuralToken.name());
  console.log("- Symbol:", await neuralToken.symbol());
  console.log("- Total Supply:", hre.ethers.utils.formatEther(await neuralToken.totalSupply()), "NEURAL");
  console.log("- Owner:", await neuralToken.owner());
  console.log("- Max Supply:", hre.ethers.utils.formatEther(await neuralToken.MAX_SUPPLY()), "NEURAL");

  console.log("\n🔗 View on BaseScan:");
  console.log(`https://sepolia.basescan.org/address/${neuralToken.address}`);

  console.log("\n📝 For verification, use the flattened source code from:");
  console.log("flattened-NeuralToken.sol");

  return {
    address: neuralToken.address,
    deployer: deployer.address,
    txHash: neuralToken.deployTransaction.hash
  };
}

main()
  .then((result) => {
    console.log("\n🎉 Flattened contract deployment successful!");
    console.log("Contract Address:", result.address);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });