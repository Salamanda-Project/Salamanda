const { percentAmount, generateSigner, signerIdentity, createSignerFromKeypair, keypairIdentity } = require('@metaplex-foundation/umi');
const { TokenStandard, createAndMint, mplTokenMetadata } = require('@metaplex-foundation/mpl-token-metadata');
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const bs58 = require("bs58").default;
const BN = require('bn.js')
const dotenv = require("dotenv");
dotenv.config();
const generateWallet = require("./bundler/createWallet.js");

//import metadata logic
const { createFolderAndNestFiles } = require("../controllers/addMetaData.js");

// ✅ Initialize UMI
const umi = createUmi("https://api.devnet.solana.com");
console.log("UMI initialized:", umi);

// Load wallet keypair
const userWallet = umi.eddsa.createKeypairFromSecretKey(bs58.decode(process.env.PRIVATE_KEY));
const userWalletSigner = createSignerFromKeypair(umi, userWallet);
umi.use(keypairIdentity(userWallet));

module.exports.creatTokenWithMetadata = async function (req, res) {
    const { name, symbol, uri, amount, decimals, revokeMintAuthority, revokeFreezeAuthority } = req.body;
    // Convert amount safely (if sent as a string expression)
    const parsedAmount = typeof amount === "string" ? eval(amount) : amount;
    const metadata = {
        name: name, //replaace with _name
        symbol: symbol, //replace with 
        amount: parsedAmount, //replace with amount
        uri: uri,
    };

    const mint = generateSigner(umi);
    umi.use(signerIdentity(userWalletSigner));
    umi.use(mplTokenMetadata());

    createAndMint(umi, {
        mint,
        authority: umi.identity,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
        sellerFeeBasisPoints: percentAmount(0),
        decimals: decimals,
        amount: BigInt(parsedAmount),
        tokenOwner: userWallet.publicKey,
        tokenStandard: TokenStandard.Fungible,
    }).sendAndConfirm(umi)
        .then(async () => {
            console.log(`Successfully minted ${metadata.amount} tokens (, ${mint.publicKey}, )`);

            // 🔐 Conditionally revoke authorities
            if (revokeMintAuthority) {
                await setAuthority(umi, {
                    mint: mint.publicKey,
                    authority: umi.identity,
                    newAuthority: null,
                    authorityType: AuthorityType.MintTokens,
                }).sendAndConfirm(umi);
                console.log("Mint authority revoked.");
            }

            if (revokeFreezeAuthority) {
                await setAuthority(umi, {
                    mint: mint.publicKey,
                    authority: umi.identity,
                    newAuthority: null,
                    authorityType: AuthorityType.FreezeAccount,
                }).sendAndConfirm(umi);
                console.log("Freeze authority revoked.");
            }

            res.json({
                message: "Token minted successfully",
                mintedToken: mint.publicKey,
                freezeAuthority: revokeFreezeAuthority,
                mintAuthority: revokeMintAuthority,
            });
        })
        .catch((err) => {
            console.error("Error minting tokens:", err);
        });
}