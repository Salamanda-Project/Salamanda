const { network, ethers } = require("hardhat");

// Uniswap V3 position manager addresses for different networks
// Address: 0x2890d11dedDd70fAff3D7f5D588B28Ef4f9a8dE8
const POSITION_MANAGER_ADDRESSES = {
  1: "0xC36442b4a4522E871399CD717aBBA8C4EDf3Bb49",     // Ethereum Mainnet
  11155111: "0x1238536071E1c677A632429e3655c799b22cDA52"  // Sepolia Testnet
};

const WETH_SEPOLIA = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH address on Sepolia

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  try {
    // Determine the Uniswap V3 Position Manager address
    const positionManagerAddress = POSITION_MANAGER_ADDRESSES[chainId] || 
      "0x1238536071E1c677A632429e3655c799b22cDA52"; // Fallback to Mainnet address

    log("----------------------------------------------------");
    log("Deploying LiquidityManager contract...");
    log(`Using Uniswap V3 Position Manager at: ${positionManagerAddress}`);

    const liquidityManager = await deploy("LiquidityManager", {
      from: deployer,
      args: [
        positionManagerAddress,  // Position Manager address
        WETH_SEPOLIA                 // Initial owner
      ],
      log: true,
      waitConfirmations: network.config.blockConfirmations || 1,
    });

    log("LiquidityManager contract deployed at:", liquidityManager.address);
    log("----------------------------------------------------");
    log("LiquidityManager is ready to manage Uniswap V3 liquidity.");
  } catch (error) {
    log("Deployment error:", error);
    throw error;
  }
};

module.exports.tags = ["all", "liquiditymanager"];