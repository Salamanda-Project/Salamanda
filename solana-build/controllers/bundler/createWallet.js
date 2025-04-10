const { Keypair } = require("@solana/web3.js");
const bs58 = require('bs58').default;


function generateWallet() {
    // Generate a new Keypair
    const keypair = Keypair.generate();
    //console.log(`Generated new KeyPair. Wallet PublicKey: `, keypair.publicKey.toString());

    //Convert Private key to Base58
    const privateKey = bs58.encode(keypair.secretKey);
    //console.log(`Wallet PrivateKey:`, privateKey);
    let newWallet = { publicKey: keypair.publicKey.toString(), privateKey };
    //console.log(`Wallet:`, newWallet);

    return newWallet;
}


//genrate x amount of wallets
module.exports.generateMultipleWallets = (nums) => {
    let wallets = [];
    for (let i = 0; i < nums; i++) {
        wallets.push(generateWallet());
    }
    //console.log(wallets)
    return wallets;
}

//generateMultipleWallets