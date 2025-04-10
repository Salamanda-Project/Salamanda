const { Router } = require("express");
const multer = require("multer");
const { createFolderAndNestFiles } = require("../controllers/addMetaData.js");
const { createPool } = require("../controllers/createCPMM.js")
const upload = multer({ storage: multer.memoryStorage() });

const app = Router();

const { creatTokenWithMetadata } = require("../controllers/controllers.js");

//endpoint to create token
app.post("/createTokenWithMetadata", creatTokenWithMetadata);

//endpoint to update metadata:
app.post("/addMetadata", upload.single("file"), createFolderAndNestFiles);

//createPool
app.post("/createPool", createPool)

module.exports = app;