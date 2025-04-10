const { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } = require("@solana/web3.js");
const { NATIVE_MINT, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, createSyncNativeInstruction, getAccount } = require('@solana/spl-token');

const bs58 = require('bs58').default;

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

const secretKey = "5n9XSDzFKxK3KZxzsWWaudb9g3PMoPKEPgTRuG5EQjaAVrJztE3Xtdue6KCvK48pHafUHBenH28EoApwZP1NnG67";

const secretKeyUint8Array = bs58.decode(secretKey);
const wallet = Keypair.fromSecretKey(secretKeyUint8Array);
const lamportsToWrap = 10_000_000_000; // 10 SOL (adjust as needed)

async function wrapSol() {

    try {
        const balance = await connection.getBalance(wallet.publicKey);
        console.log(`Current balance: ${balance / LAMPORTS_PER_SOL} SOL`);

        if (balance < lamportsToWrap) {
            throw new Error("Insufficient SOL balance to wrap.");
        }

        //await connection.confirmTransaction(airdropSignature);

        const associatedTokenAccount = await getAssociatedTokenAddress(
            NATIVE_MINT,
            wallet.publicKey
        )

        // Create token account to hold your wrapped SOL
        const checkforATA = await getAccount(connection, associatedTokenAccount);

        if (!checkforATA) {
            const ataTransaction = new Transaction()
                .add(
                    createAssociatedTokenAccountInstruction(
                        wallet.publicKey,
                        associatedTokenAccount,
                        wallet.publicKey,
                        NATIVE_MINT
                    )
                );

            await sendAndConfirmTransaction(connection, ataTransaction, [wallet]);
        }

        // Transfer SOL to associated token account and use SyncNative to update wrapped SOL balance
        const solTransferTransaction = new Transaction()
            .add(
                SystemProgram.transfer({
                    fromPubkey: wallet.publicKey,
                    toPubkey: associatedTokenAccount,
                    lamports: lamportsToWrap
                }),
                createSyncNativeInstruction(
                    associatedTokenAccount
                ));

        await sendAndConfirmTransaction(connection, solTransferTransaction, [wallet]);
        const accountInfo = await getAccount(connection, associatedTokenAccount);
        console.log(`Native: ${accountInfo.isNative}, Lamports: ${accountInfo.amount}`);
    } catch (error) {
        console.error('Error wrapping SOL:', error);
    }
}

wrapSol();
