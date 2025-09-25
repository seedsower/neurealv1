const hre = require("hardhat");

async function main() {
  console.log("=".repeat(50));
  console.log("BASE SEPOLIA DEPLOYMENT INFO");
  console.log("=".repeat(50));
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", hre.network.config.chainId);
  console.log("RPC URL:", hre.network.config.url);

  console.log("\nTo get your deployment address:");
  console.log("1. Set your PRIVATE_KEY environment variable");
  console.log("2. Run this script again with your private key configured");
  console.log("\nAlternatively, you can calculate it manually:");
  console.log("- Get your wallet address");
  console.log("- Check your current nonce on Base Sepolia");
  console.log("- Use ethers.utils.getContractAddress({ from: your_address, nonce: your_nonce })");

  console.log("\n" + "=".repeat(50));
  console.log("MANUAL STEPS:");
  console.log("=".repeat(50));
  console.log("1. Fund your deployer address with Base Sepolia ETH");
  console.log("2. Set PRIVATE_KEY environment variable");
  console.log("3. Run: npx hardhat run scripts/deploy.js --network baseSepolia");

  return {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    rpcUrl: hre.network.config.url
  };
}

main()
  .then((result) => {
    console.log("\nNetwork configuration verified successfully!");
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });