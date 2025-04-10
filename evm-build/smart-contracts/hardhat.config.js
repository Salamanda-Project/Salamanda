require('dotenv').config();
require("@nomicfoundation/hardhat-verify");
require("@nomicfoundation/hardhat-toolbox")
require("@nomicfoundation/hardhat-chai-matchers")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const API_KEY = "VYs_APvI61i76a4y_cWaDlETPQ0rXlHY"

const SEPOLIA_RPC_URL =
    process.env.SEPOLIA_RPC_URL || `https://eth-sepolia.g.alchemy.com/v2/VYs_APvI61i76a4y_cWaDlETPQ0rXlHY${API_KEY}`
const POLYGON_AMOY_RPC_URL =
    process.env.POLYGON_AMOY_RPC_URL || `https://polygon-amoy.g.alchemy.com/v2/${API_KEY}`
const PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY || "0x7869eed332b218bf98bc4c4fbf7b533fe9943acbdc3448b10e407503c1aadf1a"

// Your API key for Etherscan, obtain one at https://etherscan.io/
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "JTGE9INI98Y7Q7C34DT59J68SFUD2INFZT"
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "W589WTP4ZMSPQSXR8ZN4C141MCPXEUVDY1"
const REPORT_GAS = process.env.REPORT_GAS || false

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            // // If you want to do some forking, uncomment this
            // forking: {
            //   url: MAINNET_RPC_URL
            // }
            chainId: 31337,
        },
        localhost: {
            chainId: 31337,
        },
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            //   accounts: {
            //     mnemonic: MNEMONIC,
            //   },
            saveDeployments: true,
            chainId: 11155111,
            // Add this to manually set the nonce
      deploymentNonce: undefined,
      // Increase gas price settings
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 1.5,
        },
        polygon: {
            url: POLYGON_AMOY_RPC_URL,
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            saveDeployments: true,
            chainId: 137,
        },
    },
    etherscan: {
        // npx hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
        apiKey: {
            sepolia: ETHERSCAN_API_KEY,
            polygon: POLYGONSCAN_API_KEY,
        },
    },
    gasReporter: {
        enabled: REPORT_GAS,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.20",
                settings: {
                    optimizer: {
                      enabled: true,
                      runs: 200
                    },
                    viaIR: true
                  }
            },
        ],
    },
}
