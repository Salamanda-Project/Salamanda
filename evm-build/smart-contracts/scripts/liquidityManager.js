const { ethers } = require('ethers');
const dotenv = require('dotenv');
const liquidityManagerAbi = require('../constants/liquidityManager');
const tokenAbi = require('../constants/tokenTemplateAbi');
dotenv.config();

console.log("Script started - initializing...");

// ======================
// Configuration Checks
// ======================
const rpcUrl = process.env.SEPOLIA_RPC_URL;
if (!rpcUrl) {
    console.error("ERROR: SEPOLIA_RPC_URL is not defined in .env file");
    process.exit(1);
}

const privateKey = process.env.OWNER_PRIVATE_KEY;
if (!privateKey) {
    console.error("ERROR: OWNER_PRIVATE_KEY is not defined in .env file");
    process.exit(1);
}

// ======================
// Provider Setup
// ======================
console.log("Connecting to provider at:", rpcUrl);
const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);
console.log("Wallet address:", wallet.address);

const liquidityManagerAddress = "0x9a1A1e6d1e9462a3f92b43f3e707B440978d7a80"; // Replace with your deployed contract address
const TOKEN_A = "0x822639F1319b370Af2c1375198762e89C902a517";
const TOKEN_B = "0x385714D746DDD70D51429D7e3F7401e611ea95F9";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH address on Sepolia
console.log("Using liquidity manager at:", liquidityManagerAddress);

// ======================
// Contract Initialization
// ======================
if (!liquidityManagerAbi.liquidityManagerAbi) {
    console.error("ERROR: liquidityManagerAbi does not have the expected format");
    process.exit(1);
}

const liquidityManager = new ethers.Contract(
    liquidityManagerAddress,
    liquidityManagerAbi.liquidityManagerAbi,
    wallet
);

// ======================
// Main Function
// ======================
async function createLiquidityPosition() {
    try {
      // Connect to tokens
      const tokenA = new ethers.Contract(TOKEN_A, tokenAbi.tokenAbi, wallet);
      const tokenB = new ethers.Contract(TOKEN_B, tokenAbi.tokenAbi, wallet);
      
      // Get token details
      const decimalsA = await tokenA.decimals();
      const decimalsB = await tokenB.decimals();
      console.log(`Token A (${TOKEN_A}) decimals: ${decimalsA}`);
      console.log(`Token B (${TOKEN_B}) decimals: ${decimalsB}`);
      
      // Check token balances
      const balanceA = await tokenA.balanceOf(wallet.address);
      const balanceB = await tokenB.balanceOf(wallet.address);
      console.log(`Token A balance: ${ethers.formatUnits(balanceA, decimalsA)}`);
      console.log(`Token B balance: ${ethers.formatUnits(balanceB, decimalsB)}`);
      
      // Define amounts
      const amountA = ethers.parseUnits('10', decimalsA);
      const amountB = ethers.parseUnits('10', decimalsB);
      
      // Check if we have enough balance
      if (balanceA < amountA) {
        console.error(`Not enough Token A. Have: ${ethers.formatUnits(balanceA, decimalsA)}, Need: ${ethers.formatUnits(amountA, decimalsA)}`);
        return;
      }
      
      if (balanceB < amountB) {
        console.error(`Not enough Token B. Have: ${ethers.formatUnits(balanceB, decimalsB)}, Need: ${ethers.formatUnits(amountB, decimalsB)}`);
        return;
      }
      
      // Define parameters
      const fee = 3000; // 0.3%
      const tickSpacing = 60; // For 0.3% fee tier
      const tickLower = -60 * 100; // Example: 100 ticks below current price
      const tickUpper = 60 * 100;  // Example: 100 ticks above current price
      const lockDuration = 0; // No locking
      
      // IMPORTANT: Approve tokens for the position manager (via LiquidityManager contract)
      // Get the position manager address from the liquidity manager
      const positionManagerAddress = await liquidityManager.positionManager();
      console.log(`Position Manager address: ${positionManagerAddress}`);
      
      console.log('Approving Token A...');
      const approvalTxA = await tokenA.approve(positionManagerAddress, amountA);
      await approvalTxA.wait();
      console.log(`Token A approved: ${approvalTxA.hash}`);
      
      console.log('Approving Token B...');
      const approvalTxB = await tokenB.approve(positionManagerAddress, amountB);
      await approvalTxB.wait();
      console.log(`Token B approved: ${approvalTxB.hash}`);
      
      // Double check approvals
      const allowanceA = await tokenA.allowance(wallet.address, positionManagerAddress);
      const allowanceB = await tokenB.allowance(wallet.address, positionManagerAddress);
      console.log(`Token A allowance: ${ethers.formatUnits(allowanceA, decimalsA)}`);
      console.log(`Token B allowance: ${ethers.formatUnits(allowanceB, decimalsB)}`);
      
      console.log('Creating liquidity position...');
      
      // Call the contract function
      const tx = await liquidityManager.createLiquidityPool(
        TOKEN_A,
        TOKEN_B,
        fee,
        tickLower,
        tickUpper,
        amountA,
        amountB,
        lockDuration
      );
      
      console.log(`Transaction submitted: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log('Transaction confirmed!');
      
      // Parse events to find the tokenId
      const events = receipt.logs
        .map(log => {
          try {
            return liquidityManager.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .filter(event => event !== null && event.name === 'LiquidityCreated');
      
      if (events.length > 0) {
        const tokenId = events[0].args.tokenId;
        console.log(`✅ Success! Position created with ID: ${tokenId.toString()}`);
      } else {
        console.log('Position created but couldn\'t find position ID in logs');
      }
      
    } catch (error) {
      console.error('Error creating liquidity position:', error);
      
      // Provide more detailed error information
      if (error.reason) {
        console.error('Error reason:', error.reason);
      }
      
      if (error.data) {
        console.error('Error data:', error.data);
      }
      
      if (error.transaction) {
        console.error('Failed transaction details:', {
          to: error.transaction.to,
          from: error.transaction.from,
          data: error.transaction.data.substring(0, 66) + '...' // Show just the function selector
        });
      }
    }
}

// ======================
// Script Execution
// ======================
(async () => {
    try {
        console.log("\nStarting script execution...");
        await createLiquidityPosition();
        console.log("\nScript completed successfully!");
    } catch (error) {
        console.error("\nFATAL ERROR in script execution:");
        console.error(error);
        process.exit(1);
    }
})();