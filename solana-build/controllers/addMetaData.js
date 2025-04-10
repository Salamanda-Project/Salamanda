const { PinataSDK } = require("pinata");
const dotenv = require("dotenv");
dotenv.config();

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: "jade-labour-cod-238.mypinata.cloud",
});

const gatewayURL = "https://jade-labour-cod-238.mypinata.cloud/ipfs";

module.exports.createFolderAndNestFiles = async (req, res) => {
    const file = req.file;
    const projectName = req.body.tokenName;
    const symbol = req.body.symbol;
    const decimals = req.body.decimals;

    if (!file || !projectName) {
        return res.status(400).json({ error: "File and projectName are required." });
    }

    console.log(file, projectName);


    try {
        // 1. Create a group (folder)
        const group = await pinata.groups.public.create({
            name: projectName,
        });

        const groupId = group.id;
        console.log(`Group created: ${groupId}`);

        // 2. Upload file to Pinata
        const uploadedFile = await pinata.upload.public.file(
            new File([file.buffer], file.originalname, { type: file.mimetype })
        );

        if (!uploadedFile?.id) {
            throw new Error("File upload failed. No file ID returned.");
        }

        console.log(uploadedFile)
        console.log(`File uploaded: ${uploadedFile.id}, cid : ${uploadedFile.cid}`);

        // 3. Add uploaded file to the group
        await pinata.groups.public.addFiles({
            groupId: groupId,
            files: [uploadedFile.id], // Use the file ID from upload response
        });

        console.log(`File added to group: ${groupId}`);

        //UPLOAD JSON FILE
        const uploadedJson = await uploadJsonToPinata(projectName, symbol, decimals, `https://${gatewayURL}/${uploadedFile.cid}`);

        console.log("adding json to group ....", groupId, "File ID:", uploadedJson.id);

        await pinata.groups.public.addFiles({
            groupId: groupId,
            files: [uploadedJson.id], // Use the file ID from upload response
        });

        console.log("added json to group ....");

        // ✅ Send response
        res.json({
            message: "File uploaded and added to group successfully!",
            name: projectName,
            symbol: "JBT",
            uri: `https://${gatewayURL}/${uploadedJson.cid}`,
        });



    } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ error: "Failed to upload file to Pinata." });
    }
};


//funciton to create json file 
async function uploadJsonToPinata(_name, _symbol, _decimals, _image) {
    let jsonData = {
        name: _name,
        symbol: _symbol,
        image: _image,
        decimals: _decimals
    }

    try {
        // Convert JSON data to a Blob (acts as a file in memory)
        const jsonString = JSON.stringify(jsonData, null, 2);
        const jsonFile = new Blob([jsonString], { type: "application/json" });

        // Upload the JSON file to Pinata
        const uploadedFile = await pinata.upload.public.file(
            new File([jsonFile], `${jsonData.name}.json`, { type: "application/json" })
        );

        if (!uploadedFile || !uploadedFile.id) {
            throw new Error("JSON file uploaded, but ID is missing in response.");
        }

        console.log(`JSON File Uploaded: ${uploadedFile.id}`);
        console.log(`CID: ${uploadedFile.cid}`);
        console.log(`Access URL: https://${pinata.pinataGateway}/ipfs/${uploadedFile.cid}`);

        return uploadedFile; // Return the CID for future use
    } catch (error) {
        console.error("Error uploading JSON file:", error);
        throw error;
    }
}