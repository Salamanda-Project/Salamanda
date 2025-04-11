const { ethers } = require('ethers');
const dotenv = require('dotenv');
const launchManagerAbi = require('../constants/launchManagerAbi');
const { initialHolder1, initialHolder2, initialHolder3, initialHolder4 } = require('../helper-hardhat-config')
dotenv.config();

console.log("Script started - initializing...");

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

const launchManagerAddress = "0x066781A75374f6Fbfe77bAD3E30B144F1132E68A";
console.log("Using launch manager at:", launchManagerAddress);

if (!launchManagerAbi.launchManagerAbi) {
    console.error("ERROR: launchManagerAbi does not have the expected format");
    process.exit(1);
}

const launchManager = new ethers.Contract(launchManagerAddress, launchManagerAbi.launchManagerAbi, wallet);

async function launchTokenWithLiquidity() {
    console.log("Starting token launch with liquidity process...");

    // Get current launch fee from contract
    const launchFee = await launchManager.launchFee();
    console.log("Current launch fee:", ethers.formatEther(launchFee));

    const launchParams = {
        name: "LaunchedToken",
        symbol: "LTK",
        decimals: 18,
        totalSupply: ethers.parseEther("1000000"), // 1M tokens
        initialHolders: [
            initialHolder1,
            initialHolder2,
            initialHolder3,
            initialHolder4
        ],
        initialAmounts: [
            ethers.parseEther("200000"), // 200K to creator
            0,
            0,
            0
        ],
        enableAntiBot: true,
        maxTxAmount: ethers.parseEther("5000"), // 5K max tx
        maxWalletAmount: ethers.parseEther("25000"), // 25K max wallet
        pairWith: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
        fee: 3000, // 0.3% fee tier
        tickLower: -887272, // Min possible tick
        tickUpper: 887272, // Max possible tick
        liquidityAmount: ethers.parseEther("500000"), // 500K tokens
        pairAmount: ethers.parseEther("10"), // 10 ETH
        lockDuration: 60 * 60 * 24 * 30 // 30 days
    };

    const salt = ethers.keccak256(ethers.toUtf8Bytes("my-unique-salt"));
    console.log("Using salt:", salt);

    // Calculate total ETH needed (launch fee + pair ETH amount)
    const totalValue = launchFee + launchParams.pairAmount;
    console.log("Total ETH required:", ethers.formatEther(totalValue));

    try {
        // First commit the launch
        console.log("Committing launch...");
        const commitHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
            [
                "tuple(string,string,uint8,uint256,address[4],uint256[4],bool,uint256,uint256,address,uint24,int24,int24,uint256,uint256,uint256)",
                "bytes32"
            ],
            [launchParams, salt]
        ));
        
        const commitTx = await launchManager.commitLaunch(commitHash);
        await commitTx.wait();
        console.log("Launch committed!");

        // Then execute the launch
        console.log("Executing launch with liquidity...");
        const tx = await launchManager.instantLaunch(launchParams, salt, {
            value: totalValue,
            gasLimit: 3000000
        });

        console.log("Transaction sent! Hash:", tx.hash);
        console.log("Waiting for transaction confirmation...");
        const receipt = await tx.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);
        console.log("Token launched with liquidity!");

        // Find LaunchCompleted event
        const launchEvent = receipt.logs
            .map(log => {
                try {
                    return launchManager.interface.parseLog(log);
                } catch (e) {
                    return null;
                }
            })
            .filter(parsed => parsed && parsed.name === 'LaunchCompleted')[0];

        if (launchEvent) {
            console.log(`Token deployed at: ${launchEvent.args.tokenAddress}`);
            console.log(`Liquidity NFT ID: ${launchEvent.args.liquidityTokenId}`);
        } else {
            console.warn("Couldn't find LaunchCompleted event in logs");
        }

    } catch (error) {
        console.error("ERROR during token launch:", error.message);
        if (error.receipt) {
            console.error("Transaction failed in block:", error.receipt.blockNumber);
        }
    }
}

// Execute script
(async () => {
    try {
        console.log("Starting script execution...");
        await launchTokenWithLiquidity();
        console.log("Script completed successfully!");
    } catch (error) {
        console.error("FATAL ERROR in script execution:", error);
    }
})();