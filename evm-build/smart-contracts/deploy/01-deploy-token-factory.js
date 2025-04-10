const { network, ethers } = require("hardhat");
const { feeCollectorAddress, tokenCreationFeeConfig } = require("../helper-hardhat-config");

// Address: 0x6D0edbc313164C25c8fF58611805e221b5c4EAaf
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  // Fee settings with configurable fallback
  const creationFee = tokenCreationFeeConfig 
    ? ethers.parseEther(tokenCreationFeeConfig) 
    : ethers.parseEther("0.05"); // Default 0.05 ETH fee

  log("----------------------------------------------------");
  log("Deploying TokenFactory contract...");

  try {
    const tokenFactory = await deploy("TokenFactory", {
      from: deployer,
      args: [
        feeCollectorAddress || deployer, // Fee collector address with fallback
        creationFee,
      ],
      log: true,
      waitConfirmations: network.config.blockConfirmations || 1,
    });

    log("TokenFactory contract deployed at:", tokenFactory.address);
    log("TokenFactory is ready for creating tokens.");
  } catch (error) {
    log("Error deploying TokenFactory:", error);
    throw error;
  }

  log("----------------------------------------------------");
};

module.exports.tags = ["all", "core", "tokenfactory"];