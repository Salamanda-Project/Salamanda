const { createUmi } = require("@metaplex-foundation/umi-bundle-defaults");
const { createMetadataAccountV3, updateMetadataAccountV2 } = require("@metaplex-foundation/mpl-token-metadata");
const { createSignerFromKeypair, generateSigner, none, publicKey, keypairIdentity } = require("@metaplex-foundation/umi");
const bs58 = require("bs58").default;
const dotenv = require("dotenv");
dotenv.config()

module.exports.updateMetadata = async () => {
    const umi = createUmi("https://api.devnet.solana.com");

    // ✅ Load wallet
    const secretKeyBase58 = process.env.PRIVATE_KEY; // Replace with your actual key
    const secretKey = bs58.decode(secretKeyBase58);
    console.log(secretKey);
    const myKeypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
    const signer = createSignerFromKeypair(umi, myKeypair);

    // Register a new keypair as the identity and payer.
    umi.use(keypairIdentity(myKeypair));

    // ✅ Define token mint address
    const mintAddress = publicKey("5AaxNWVAS3pvzMd96iJ5AV2SQ1TtvzqNvqVZJB2AqKwS"); // Replace with your token mint

    // ✅ Create Metadata
    const metadataTx = updateMetadataAccountV2(umi, {
        mint: mintAddress,
        updateAuthority: signer,
        data: {
            name: "MetaDatum",
            uri: "https://jade-labour-cod-238.mypinata.cloud/ipfs/bafkreid7dzkmrat7oaccbrfvshxdfv3xb52zkvngqp2vxkwykd7jsfbypu",
            symbol: "MTDM",
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: null,
            uses: null,
        },
    });

    await metadataTx.sendAndConfirm(umi);


    console.log("✅ Metadata added successfully!");
}

//addMetadata().catch(console.error);