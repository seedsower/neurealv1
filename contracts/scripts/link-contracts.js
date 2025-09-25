const hre = require("hardhat");

async function main() {
  console.log("Linking NeuralToken and NeuralPrediction contracts...");

  const NEURAL_TOKEN_ADDRESS = "0xadb6427078b2c9fCd2c4addf458471e69c923305";
  const NEURAL_PREDICTION_ADDRESS = "0x003B8992Af914913562E5508f2d66Aa184D5958C";

  const [deployer] = await hre.ethers.getSigners();
  console.log("Executing from account:", deployer.address);

  // Get contract instances
  const neuralToken = await hre.ethers.getContractAt("NeuralToken", NEURAL_TOKEN_ADDRESS);

  console.log("Setting prediction contract address in NeuralToken...");

  // Set the prediction contract address
  const tx = await neuralToken.setPredictionContract(NEURAL_PREDICTION_ADDRESS);
  await tx.wait();

  console.log("✅ Transaction hash:", tx.hash);

  // Verify the setting
  const setPredictionContract = await neuralToken.predictionContract();
  console.log("✅ Prediction contract set to:", setPredictionContract);

  console.log("\n🎉 Contracts successfully linked!");
  console.log("- NeuralToken:", NEURAL_TOKEN_ADDRESS);
  console.log("- NeuralPrediction:", NEURAL_PREDICTION_ADDRESS);
}

main()
  .then(() => {
    console.log("Contract linking completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Contract linking failed:", error);
    process.exit(1);
  });