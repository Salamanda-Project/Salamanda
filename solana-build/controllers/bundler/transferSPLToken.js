const { getOrCreateAssociatedTokenAccount, createTransferInstruction } = require("@solana/spl-token");
const { Connection, Keypair, ParsedAccountData, PublicKey, sendAndConfirmTransaction, Transaction, clusterApiUrl } = require("@solana/web3.js");
const dotenv = require("dotenv");
const bs58 = require("bs58").default;
dotenv.config();
//setup solana connection
const connection = new Connection(clusterApiUrl('devnet'));

//import wallet
const FROM_KEYPAIR = Keypair.fromSecretKey(bs58.decode("5n9XSDzFKxK3KZxzsWWaudb9g3PMoPKEPgTRuG5EQjaAVrJztE3Xtdue6KCvK48pHafUHBenH28EoApwZP1NnG67"));
console.log(`My public key is: ${FROM_KEYPAIR.publicKey.toString()}.`);


async function getNumberDecimals(MINT_ADDRESS) {
    const info = await connection.getParsedAccountInfo(new PublicKey(MINT_ADDRESS));
    const result = info.value.data.parsed.info.decimals;
    return result;
}

async function sendTokens(DESTINATION_WALLET, MINT_ADDRESS, TRANSFER_AMOUNT) {

    console.log(`Sending ${TRANSFER_AMOUNT} ${(MINT_ADDRESS)} from ${(FROM_KEYPAIR.publicKey.toString())} to ${(DESTINATION_WALLET)}.`)

    //Step 1
    try {
        // get or create Associate Token Accout for sender
        console.log(`1 - Getting Source Token Account`);
        let sourceAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            FROM_KEYPAIR,
            new PublicKey(MINT_ADDRESS),
            FROM_KEYPAIR.publicKey
        );
        console.log(`    Source Account: ${sourceAccount.address.toString()}`);

        //get or create associate Token Account for destination wallet
        console.log(`2 - Getting Destination Token Account`);
        let destinationAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            FROM_KEYPAIR,
            new PublicKey(MINT_ADDRESS),
            new PublicKey(DESTINATION_WALLET)
        );
        console.log(`    Destination Account: ${destinationAccount.address.toString()}`);

        //get decimals for token
        const numberDecimals = await getNumberDecimals(MINT_ADDRESS);
        console.log(`    Number of Decimals: ${numberDecimals}`);

        //Send transaction
        console.log(`3 - Creating and Sending Transaction`);
        const tx = new Transaction();
        tx.add(createTransferInstruction(
            sourceAccount.address,
            destinationAccount.address,
            FROM_KEYPAIR.publicKey,
            TRANSFER_AMOUNT * Math.pow(10, numberDecimals)
        ))

        const latestBlockHash = await connection.getLatestBlockhash('confirmed');
        tx.recentBlockhash = await latestBlockHash.blockhash;
        const signature = await sendAndConfirmTransaction(connection, tx, [FROM_KEYPAIR]);
        console.log(
            '\x1b[32m', //Green Text
            `   Transaction Success!🎉`,
            `\n    https://explorer.solana.com/tx/${signature}?cluster=devnet`
        );
        return signature;

    } catch (error) {
        console.log(error);
    }
}

/*sendTokens(
    "CTQhYRrjV1tyT6mtyRDPrXxAUCTM4oENdFMF9u5Du3Nw",
    "So11111111111111111111111111111111111111112",
    1
)*/

module.exports.transfer = async (DESTINATION_WALLET, MINT_ADDRESS, TRANSFER_AMOUNT) => {
    try {
        let transferStatus = await sendTokens(DESTINATION_WALLET, MINT_ADDRESS, TRANSFER_AMOUNT);
        return transferStatus
    } catch (error) {
        console.log(error)
    }
}