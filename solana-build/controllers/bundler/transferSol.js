const web3 = require('@solana/web3.js');
const bs58 = require('bs58').default;
const dotenv = require("dotenv");
dotenv.config()

// we are making a connection to solana devnet
const connection = new web3.Connection(
    web3.clusterApiUrl('devnet'),
    'confirmed',
);

//import wallet
module.exports.transferSol = async () => {
    const keyPair = web3.Keypair.fromSecretKey(bs58.decode("5n9XSDzFKxK3KZxzsWWaudb9g3PMoPKEPgTRuG5EQjaAVrJztE3Xtdue6KCvK48pHafUHBenH28EoApwZP1NnG67"));

    let transaction = new web3.Transaction().add(
        web3.SystemProgram.transfer({
            fromPubkey: keyPair.publicKey,
            toPubkey: "CTQhYRrjV1tyT6mtyRDPrXxAUCTM4oENdFMF9u5Du3Nw",
            lamports: 1e9, // number of SOL to send
        }),
    );

    try {
        //get wallet balance before transaction
        let balanace = await connection.getBalance(keyPair.publicKey);
        console.log('Balance: ', balanace);

        //send transaction 
        let signature = await web3.sendAndConfirmTransaction(
            connection,
            transaction,
            [keyPair],
        );
        console.log('Transaction signature', signature);

    } catch (error) {
        console.log(error);
    }
}

//transferSol()