const { ethers } = require('ethers');
const dotenv = require('dotenv');
const tokenAbi = require('../constants/tokenTemplateAbi').tokenAbi
dotenv.config();

async function estimateTransactionGas() {
    console.log("Estimating gas for liquidity pool creation...");

    // Configuration
    const config = {
        rpcUrl: process.env.SEPOLIA_RPC_URL,
        privateKey: process.env.OWNER_PRIVATE_KEY,
        liquidityManagerAddress: "0x8D08F90080a9232aFd4B91bdA2075cE6DD0daFf2",
        tokens: {
            A: "0x822639F1319b370Af2c1375198762e89C902a517",
            B: "0x385714D746DDD70D51429D7e3F7401e611ea95F9"
        }
    };

    // Validate environment variables
    if (!config.rpcUrl) throw new Error("Missing SEPOLIA_RPC_URL in .env");
    if (!config.privateKey) throw new Error("Missing OWNER_PRIVATE_KEY in .env");

    // Provider and wallet setup
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(config.privateKey, provider);

    // Load ABI
    let liquidityManagerAbi;
    try {
        liquidityManagerAbi = require('../constants/liquidityManager').liquidityManagerAbi;
    } catch (e) {
        throw new Error("Failed to load LiquidityManager ABI: " + e.message);
    }

    if (!liquidityManagerAbi) throw new Error("LiquidityManager ABI not loaded");

    const liquidityManager = new ethers.Contract(
        config.liquidityManagerAddress,
        liquidityManagerAbi,
        wallet
    );

    // Transaction parameters
    const params = {
        tokenA: config.tokens.A,
        tokenB: config.tokens.B,
        fee: 3000,
        tickLower: -600,
        tickUpper: 600,
        amountA: ethers.parseEther("10"),
        amountB: ethers.parseEther("10"),
        lockDuration: 60 * 60 * 24 * 7 // 7 days
    };

    const tokenAContract = new ethers.Contract(params.tokenA, tokenAbi, wallet);
const tokenBContract = new ethers.Contract(params.tokenB, tokenAbi, wallet);

const balanceA = await tokenAContract.balanceOf(wallet.address);
const balanceB = await tokenBContract.balanceOf(wallet.address);

console.log(`Balance A: ${ethers.formatEther(balanceA)}`);
console.log(`Balance B: ${ethers.formatEther(balanceB)}`);

if (balanceA < params.amountA || balanceB < params.amountB) {
    throw new Error("Insufficient balance for liquidity pool creation");
}

    const allowanceA = await tokenAContract.allowance(wallet.address, liquidityManager.target);
const allowanceB = await tokenBContract.allowance(wallet.address, liquidityManager.target);

console.log(`Allowance A: ${ethers.formatEther(allowanceA)}`);
console.log(`Allowance B: ${ethers.formatEther(allowanceB)}`);

if (allowanceA < params.amountA) {
    console.log("Approving token A...");
    const tx = await tokenAContract.approve(liquidityManager.target, ethers.MaxUint256);
    await tx.wait();
    console.log("Token A approved");
}

if (allowanceB < params.amountB) {
    console.log("Approving token B...");
    const tx = await tokenBContract.approve(liquidityManager.target, ethers.MaxUint256);
    await tx.wait();
    console.log("Token B approved");
}


    try {
        const estimate = await liquidityManager.createLiquidityPool.estimateGas(
            params.tokenA,
            params.tokenB,
            params.fee,
            params.tickLower,
            params.tickUpper,
            params.amountA,
            params.amountB,
            params.lockDuration
        );
        
        console.log(`Estimated gas: ${estimate.toString()}`);
        console.log(`Buffered estimate: ${(estimate * 2n).toString()}`);

    } catch (error) {
        console.error("Gas estimation failed:", error.message);
    }
}

estimateTransactionGas().catch(console.error);
