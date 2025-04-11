const { ethers } = require('ethers');
const dotenv = require('dotenv');
const liquidityManagerAbi = require('../constants/liquidityManager');
dotenv.config();

// Add debugging info
console.log("Script started - initializing...");

// Validate environment variables
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

console.log("Connecting to provider at:", rpcUrl);
const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);
console.log("Wallet address:", wallet.address);

const liquidityManagerAddress = "0x8D08F90080a9232aFd4B91bdA2075cE6DD0daFf2";
console.log("Using liquidity manager at:", liquidityManagerAddress);

// Check ABI format
if (!liquidityManagerAbi.liquidityManagerAbi) {
    console.error("ERROR: liquidityManagerAbi does not have the expected format");
    console.log("Actual format:", JSON.stringify(liquidityManagerAbi).substring(0, 100) + "...");
    process.exit(1);
}

const liquidityManager = new ethers.Contract(liquidityManagerAddress, liquidityManagerAbi.liquidityManagerAbi, wallet);

async function createLiquidityPool() {
    console.log("Starting liquidity pool creation process...");
    
    const tokenA = "0x64a72e8a9A71289f9024Bef8b1211249192c79D4"; // Your ERC20 token
    const tokenB = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"; // WETH
    
    console.log("Token A:", tokenA);
    console.log("Token B:", tokenB);
    
    // MODIFIED: Significantly reduced token amounts for testing
    const params = {
        tokenA: tokenA,
        tokenB: tokenB,
        fee: 3000, // 0.3% fee tier
        tickLower: -887220, // Min tick
        tickUpper: 887220, // Max tick
        amountA: ethers.parseEther("1000"), // Reduced from 10,000 to 100 tokens
        amountB: ethers.parseEther("0.0005"), // Reduced from 0.02 to 0.001 ETH
        lockDuration: 60 * 60 * 24 * 90 // 90 days lock
    };
    
    try {
        // Check token A balance
        console.log("Checking Token A balance...");
        const tokenAContract = new ethers.Contract(
            tokenA, 
            ["function balanceOf(address owner) view returns (uint256)"],
            wallet
        );
        const balance = await tokenAContract.balanceOf(wallet.address);
        console.log("Token A balance:", ethers.formatEther(balance));
        if (balance < params.amountA) {
            console.error("ERROR: Not enough Token A balance");
            console.log(`Required: ${ethers.formatEther(params.amountA)}, Current: ${ethers.formatEther(balance)}`);
            return;
        }
        
        // Check ETH balance
        console.log("Checking ETH balance...");
        const ethBalance = await provider.getBalance(wallet.address);
        console.log("ETH balance:", ethers.formatEther(ethBalance));
        if (ethBalance < params.amountB) {
            console.error("ERROR: Not enough ETH balance");
            console.log(`Required: ${ethers.formatEther(params.amountB)}, Current: ${ethers.formatEther(ethBalance)}`);
            return;
        }
        
        // First check if we have the required token allowance
        console.log("Checking if we have enough token A allowance...");
        
        // Assume token A is an ERC20
        try {
            const allowance = await tokenAContract.allowance(wallet.address, liquidityManagerAddress);
            console.log("Current allowance for Token A:", ethers.formatEther(allowance));
            
            if (allowance < params.amountA) {
                console.error("ERROR: Not enough allowance for Token A");
                console.log("Please approve the liquidity manager contract to spend your tokens");
                console.log(`Required: ${ethers.formatEther(params.amountA)}, Current: ${ethers.formatEther(allowance)}`);
                return;
            }
        } catch (error) {
            console.warn("Could not check token allowance:", error.message);
            console.log("Make sure you've approved enough tokens for the liquidity manager");
        }
        
        console.log("Creating liquidity pool...");
        console.log("Sending transaction...");
        
        const tx = await liquidityManager.createLiquidityPool(
            params.tokenA,
            params.tokenB,
            params.fee,
            params.tickLower,
            params.tickUpper,
            params.amountA,
            params.amountB,
            params.lockDuration,
            // Only send value if one of the tokens is WETH
            { 
                value: 0,
                gasLimit: 30000000 // Add explicit gas limit for better error handling
            }
        );
        
        console.log("Transaction sent! Hash:", tx.hash);
        console.log("Waiting for transaction confirmation...");
        
        const receipt = await tx.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);
        console.log("Liquidity created!");
        
        // Find LiquidityCreated event
        const createdEvent = receipt.logs
            .map(log => {
                try {
                    return liquidityManager.interface.parseLog(log);
                } catch (e) {
                    return null;
                }
            })
            .filter(parsed => parsed && parsed.name === 'LiquidityCreated')[0];
            
        if (createdEvent) {
            console.log(`NFT Position ID: ${createdEvent.args.tokenId}`);
            console.log(`Token0: ${createdEvent.args.token0}`);
            console.log(`Token1: ${createdEvent.args.token1}`);
        } else {
            console.warn("Couldn't find LiquidityCreated event in logs");
        }
        
        // Find LiquidityLocked event
        const lockedEvent = receipt.logs
            .map(log => {
                try {
                    return liquidityManager.interface.parseLog(log);
                } catch (e) {
                    return null;
                }
            })
            .filter(parsed => parsed && parsed.name === 'LiquidityLocked')[0];
            
        if (lockedEvent) {
            const unlockTime = new Date(Number(lockedEvent.args.unlockTime) * 1000);
            console.log(`Liquidity locked until: ${unlockTime.toLocaleString()}`);
        } else {
            console.warn("Couldn't find LiquidityLocked event in logs");
        }
        
        console.log("SUCCESS: Liquidity pool created successfully!");
    } catch (error) {
        console.error("ERROR creating liquidity pool:", error.message);
        if (error.data) {
            console.error("Error data:", error.data);
        }
        if (error.transaction) {
            console.error("Transaction hash:", error.transaction.hash);
        }
        
        // Check for common errors
        if (error.message.includes("insufficient funds")) {
            console.error("You don't have enough ETH to create this pool");
            const balance = await provider.getBalance(wallet.address);
            console.log(`Your balance: ${ethers.formatEther(balance)} ETH`);
            console.log(`Required: ${ethers.formatEther(params.amountB)} ETH`);
        }
        
        if (error.message.includes("allowance")) {
            console.error("Token allowance issue - make sure you've approved the liquidity manager to spend your tokens");
        }
    }
}

async function unlockLiquidity(tokenId) {
    console.log(`Starting liquidity unlock process for position ${tokenId}...`);
    
    try {
        // Check if position exists and is locked
        try {
            console.log("Checking if position is locked...");
            const lockInfo = await liquidityManager.getLockInfo(tokenId);
            console.log("Lock info:", lockInfo);
            
            const now = Math.floor(Date.now() / 1000);
            if (lockInfo.unlockTime > now) {
                const remainingTime = lockInfo.unlockTime - now;
                console.error(`ERROR: Position is still locked for ${remainingTime} seconds (${remainingTime / 86400} days)`);
                console.log(`Unlock time: ${new Date(lockInfo.unlockTime * 1000).toLocaleString()}`);
                return;
            }
        } catch (error) {
            console.warn("Could not check lock info:", error.message);
        }
        
        console.log(`Unlocking liquidity for position ${tokenId}...`);
        console.log("Sending transaction...");
        
        const tx = await liquidityManager.unlockLiquidity(tokenId);
        console.log("Transaction sent! Hash:", tx.hash);
        console.log("Waiting for transaction confirmation...");
        
        const receipt = await tx.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);
        console.log("Liquidity unlocked and NFT returned!");
        
        // Find LiquidityUnlocked event
        const unlockedEvent = receipt.logs
            .map(log => {
                try {
                    return liquidityManager.interface.parseLog(log);
                } catch (e) {
                    return null;
                }
            })
            .filter(parsed => parsed && parsed.name === 'LiquidityUnlocked')[0];
            
        if (unlockedEvent) {
            console.log(`Position ${unlockedEvent.args.tokenId} successfully unlocked`);
        } else {
            console.warn("Couldn't find LiquidityUnlocked event in logs");
        }
    } catch (error) {
        console.error("ERROR unlocking liquidity:", error.message);
        if (error.data) {
            console.error("Error data:", error.data);
        }
    }
}

// Main execution
(async () => {
    try {
        console.log("Starting main script execution...");
        await createLiquidityPool();
        // await unlockLiquidity(123); // Replace with actual tokenId
        console.log("Script completed successfully!");
    } catch (error) {
        console.error("FATAL ERROR in main execution:", error);
    }
})();