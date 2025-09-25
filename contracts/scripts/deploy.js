const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // Get the contract factory
  const NeuralToken = await hre.ethers.getContractFactory("NeuralToken");

  // Get deployment parameters
  const signers = await hre.ethers.getSigners();
  console.log("Available signers:", signers.length);

  if (signers.length === 0) {
    throw new Error("No signers available. Please check your PRIVATE_KEY environment variable.");
  }

  const deployer = signers[0];
  console.log("Deploying from account:", deployer.address);
  console.log("Account balance:", hre.ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  // Deploy the contract
  console.log("Deploying NeuralToken...");
  const neuralToken = await NeuralToken.deploy();

  // Wait for deployment
  await neuralToken.deployed();

  const deployedAddress = neuralToken.address;
  console.log("NeuralToken deployed to:", deployedAddress);

  // Log deployment details
  console.log("Contract deployed with:");
  console.log("- Name:", await neuralToken.name());
  console.log("- Symbol:", await neuralToken.symbol());
  console.log("- Total Supply:", hre.ethers.utils.formatEther(await neuralToken.totalSupply()), "NEURAL");
  console.log("- Deployer Balance:", hre.ethers.utils.formatEther(await neuralToken.balanceOf(deployer.address)), "NEURAL");

  return {
    neuralToken: deployedAddress,
    deployer: deployer.address
  };
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((result) => {
    console.log("Deployment completed successfully!");
    console.log("Results:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });