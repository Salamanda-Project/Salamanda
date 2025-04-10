const { Raydium, TxVersion, parseTokenAccountResp } = require('@raydium-io/raydium-sdk-v2');
const { Connection, Keypair, clusterApiUrl } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } = require('@solana/spl-token');
const bs58 = require('bs58').default;
const dotenv = require("dotenv");
dotenv.config()

// Load wallet from secret key (replace with your actual secret key)
//console.log(process.env.PRIVATE_KEY)
const owner = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY));
//console.log("Owner Public Key:", owner.publicKey.toString());

// Set up the Solana connection
const connection = new Connection(clusterApiUrl('devnet')); // Replace with actual RPC URL
// const connection = new Connection(clusterApiUrl('devnet')); // Uncomment for devnet

const txVersion = TxVersion.V0; // or TxVersion.LEGACY
const cluster = 'devnet'; // 'mainnet' or 'devnet'

let raydium;

/**
 * Initialize Raydium SDK
 */
const initSdk = async (params = { loadToken: false }) => {
    if (raydium) return raydium;

    if (connection.rpcEndpoint === clusterApiUrl('mainnet-beta')) {
        console.warn('Using a free RPC node might cause unexpected errors. Paid RPC recommended.');
    }

    console.log(`Connecting to RPC ${connection.rpcEndpoint} in ${cluster}`);

    raydium = await Raydium.load({
        owner,
        connection,
        cluster,
        disableFeatureCheck: true,
        disableLoadToken: !params.loadToken,
        blockhashCommitment: 'finalized',
        // urlConfigs: {
        //   BASE_HOST: '<API_HOST>', // API URL (not supported on devnet)
        // },
    });

    /**
     * Optional: Manually fetch and update token account data.
     * Once you call `raydium.account.updateTokenAccount()`, Raydium will stop automatic fetching.
     */

    /*
    raydium.account.updateTokenAccount(await fetchTokenAccountData());
    connection.onAccountChange(owner.publicKey, async () => {
      raydium.account.updateTokenAccount(await fetchTokenAccountData());
    });
    */

    return raydium;
};

/**
 * Fetch token account data
 */
const fetchTokenAccountData = async () => {
    const solAccountResp = await connection.getAccountInfo(owner.publicKey);
    const tokenAccountResp = await connection.getTokenAccountsByOwner(owner.publicKey, { programId: TOKEN_PROGRAM_ID });
    const token2022Req = await connection.getTokenAccountsByOwner(owner.publicKey, { programId: TOKEN_2022_PROGRAM_ID });

    return parseTokenAccountResp({
        owner: owner.publicKey,
        solAccountResp,
        tokenAccountResp: {
            context: tokenAccountResp.context,
            value: [...tokenAccountResp.value, ...token2022Req.value],
        },
    });
};

// gRPC Config (if needed)
const grpcUrl = '<YOUR_GRPC_URL>';
const grpcToken = '<YOUR_GRPC_TOKEN>';

module.exports = {
    owner,
    connection,
    txVersion,
    initSdk,
    fetchTokenAccountData,
    grpcUrl,
    grpcToken,
};
