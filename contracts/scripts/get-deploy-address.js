const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("=".repeat(50));
  console.log("PRE-DEPLOYMENT INFO");
  console.log("=".repeat(50));
  console.log("Deployer address:", deployer.address);
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", hre.network.config.chainId);

  // Get current balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Current balance:", hre.ethers.utils.formatEther(balance), "ETH");

  // Get next nonce
  const nonce = await deployer.provider.getTransactionCount(deployer.address);
  console.log("Next nonce:", nonce);

  // Calculate the deployment address
  const deploymentAddress = hre.ethers.utils.getContractAddress({
    from: deployer.address,
    nonce: nonce
  });

  console.log("=".repeat(50));
  console.log("PREDICTED DEPLOYMENT ADDRESS:", deploymentAddress);
  console.log("=".repeat(50));
  console.log("Please fund this address before proceeding with deployment.");
  console.log("Recommended funding amount: At least 0.01 ETH for deployment gas");

  return {
    deployerAddress: deployer.address,
    deploymentAddress: deploymentAddress,
    currentBalance: hre.ethers.utils.formatEther(balance),
    nonce: nonce
  };
}

main()
  .then((result) => {
    console.log("\nRun the following command to deploy after funding:");
    console.log(`npx hardhat run scripts/deploy.js --network ${hre.network.name}`);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });