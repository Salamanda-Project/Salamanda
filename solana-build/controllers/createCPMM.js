const {
    CREATE_CPMM_POOL_PROGRAM,
    CREATE_CPMM_POOL_FEE_ACC,
    DEVNET_PROGRAM_ID,
    getCpmmPdaAmmConfigId,
} = require('@raydium-io/raydium-sdk-v2');
const BN = require('bn.js');
const { initSdk, txVersion } = require('./config.js');

module.exports.createPool = async (req, res) => {
    const { baseMint, quoteMint, baseAmount, quoteAmount } = req.body
    try {
        const raydium = await initSdk({ loadToken: true });

        // check token list here: https://api-v3.raydium.io/mint/list
        // RAY
        const mintA = await raydium.token.getTokenInfo(baseMint);
        // USDC (actually using SOL in this case)
        const mintB = await raydium.token.getTokenInfo(quoteMint);

        const feeConfigs = await raydium.api.getCpmmConfigs();

        if (raydium.cluster === 'devnet') {
            feeConfigs.forEach((config) => {
                config.id = getCpmmPdaAmmConfigId(DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM, config.index).publicKey.toBase58();
            });
        }
        console.log('Mint A:', mintA);
        console.log('Mint B:', mintB);
        console.log('Fee Configs:', feeConfigs);
        console.log('Selected Fee Config:', feeConfigs[0]);
        console.log('Program ID:', DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM);
        console.log('Fee Account:', DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_FEE_ACC);
        const { execute, extInfo } = await raydium.cpmm.createPool({
            programId: DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_PROGRAM,
            poolFeeAccount: DEVNET_PROGRAM_ID.CREATE_CPMM_POOL_FEE_ACC,
            mintA,
            mintB,
            mintAAmount: new BN(baseAmount).mul(new BN(10).pow(new BN(9))),
            mintBAmount: new BN(quoteAmount).mul(new BN(10).pow(new BN(9))),
            startTime: new BN(0),
            feeConfig: feeConfigs[0],
            associatedOnly: false,
            ownerInfo: {
                useSOLBalance: true,
            },
            txVersion,
        });

        const { txId } = await execute({ sendAndConfirm: true });

        console.log('Pool created successfully', {
            txId,
            poolKeys: Object.keys(extInfo.address).reduce(
                (acc, cur) => ({
                    ...acc,
                    [cur]: extInfo.address[cur].toString(),
                }),
                {}
            ),
        });

        res.json({
            txId,
            poolKeys: Object.keys(extInfo.address).reduce(
                (acc, cur) => ({
                    ...acc,
                    [cur]: extInfo.address[cur].toString(),
                }),
                {}
            ),
        })

    } catch (error) {
        console.error('Failed to create pool:', error);

        // Check for specific error types if needed
        if (error instanceof Error) {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
            });
        }

        // Exit with error code
        process.exit(1);
    } finally {
        // Any cleanup code can go here
        console.log('Pool creation process completed');
    }
};

/** uncomment code below to execute */
