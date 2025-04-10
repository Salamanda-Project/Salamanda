const { network, ethers } = require("hardhat");
const { initialHolder1, initialHolder2, initialHolder3, initialHolder4 } = require("../helper-hardhat-config");

// Address: 0x0422E8419Fa33a975c5923Ab90fd5269d6A734dA
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  log("----------------------------------------------------");
  log("Deploying TokenTemplate contract...");

  try {
    // Configurable token parameters
    const tokenConfig = {
      name: "Template Token 2",
      symbol: "TMPL2",
      decimals: 18,
      totalSupply: ethers.parseEther("1000000"), // 1 million tokens
      initialOwner: deployer,
      initialHolders: [initialHolder1, initialHolder2, initialHolder3, initialHolder4], // Define initial token holders if any
      initialAmounts: [
        ethers.parseEther("100"),
        ethers.parseEther("200"),
        ethers.parseEther("500"),
        ethers.parseEther("1000")        
      ], // Define corresponding token amounts
      enableAntiBot: true,
      maxTxAmount: ethers.parseEther("10000"), // 1% of total supply
      maxWalletAmount: ethers.parseEther("20000"), // 2% of total supply
    };

    // Validate initial holders and amounts
    if (tokenConfig.initialHolders.length !== tokenConfig.initialAmounts.length) {
      throw new Error("Initial holders and amounts must match");
    }

    const tokenTemplate = await deploy("TokenTemplate", {
      from: deployer,
      args: [
        tokenConfig.name,
        tokenConfig.symbol,
        tokenConfig.decimals,
        tokenConfig.totalSupply,
        tokenConfig.initialOwner,
        tokenConfig.initialHolders,
        tokenConfig.initialAmounts,
        tokenConfig.enableAntiBot,
        tokenConfig.maxTxAmount,
        tokenConfig.maxWalletAmount,
      ],
      gasLimit: 6000000, // Increase gas limit
      log: true,
      waitConfirmations: network.config.blockConfirmations || 1,
    });

    log("TokenTemplate contract deployed at:", tokenTemplate.address);
  } catch (error) {
    log("Error deploying TokenTemplate:", error);
    throw error;
  }

  log("----------------------------------------------------");
  log("Note: This is a reference implementation. In production, tokens will be created via the TokenFactory.");
};

module.exports.tags = ["all" ,"template-2", "tokentemplate-2"];