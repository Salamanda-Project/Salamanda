const transferSPLToken = require("./transferSPLToken.js");
const transferSOL = require("./transferSol.js");
const createWallet = require("./createWallet.js");

async function bundle() {
    try {
        const wallets = await createWallet.generateMultipleWallets(2);
        console.log(wallets);

        const numberDecimals = 9;
        for (let i = 0; i < wallets.length; i++) {
            console.log(`Wallet ${i + 1} - Sending SPL Tokens`);
            const transfer = transferSPLToken.transfer(
                wallets[i].publicKey,
                "Bp9VGwfHc9vpPpBf3fdGtDEfNtF4MYamHgWQDC7U3V9A",
                0.001 * Math.pow(10, numberDecimals)
            );
            console.log(transfer);
        }
    } catch (error) {
        console.error("Error in bundle:", error); // 👈 Improved error logging
    }
};

bundle()