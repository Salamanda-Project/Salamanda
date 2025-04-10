const { PublicKey } = require('@solana/web3.js')
const { Raydium, TxVersion, OPEN_BOOK_PROGRAM } = require('@raydium-io/raydium-sdk-v2')
const { initSdk, txVersion } = require('./config.js')

// Replace these with your own SPL tokens!
const BASE_TOKEN = new PublicKey('B792Z87do8Ydj5irw2EY2RbFzghygHJhHkpKVM1JkUVW') // Example: USDC
const QUOTE_TOKEN = new PublicKey('So11111111111111111111111111111111111111112') // Example: WSOL

const createMarket = async () => {
    try {
        const raydium = await initSdk()

        const { execute, extInfo, transactions } = await raydium.marketV2.create({
            baseInfo: {
                mint: BASE_TOKEN,
                decimals: 9, // Adjust according to your token
            },
            quoteInfo: {
                mint: QUOTE_TOKEN,
                decimals: 9, // Adjust according to your token
            },
            lotSize: 1,
            tickSize: 0.01,
            dexProgramId: OPEN_BOOK_PROGRAM,

            txVersion,
        })

        console.log(
            `✅ Created market with ${transactions.length} transactions. Market Info: `,
            Object.keys(extInfo.address).reduce(
                (acc, cur) => ({
                    ...acc,
                    [cur]: extInfo.address[cur].toBase58(),
                }),
                {}
            )
        )

        const txIds = await execute({ sequentially: true })
        console.log('✅ Transaction IDs:', txIds)
    } catch (error) {
        console.error('❌ Error Creating Market:', error)
    }
}

// Run the function
// 5Ty6Gmm38LfX9j9cpNjFX7jpRtY5uPHXJPWq6YV4noKV
createMarket()
