const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenFactory Contract", function () {
  let TokenFactory, tokenFactory;
  let owner, feeCollector, creator, user;
  let creationFee;

  beforeEach(async function () {
    // Get signers
    [owner, feeCollector, creator, user] = await ethers.getSigners();
    
    // Set creation fee to 0.1 ETH
    creationFee = ethers.parseEther("0.1");
    
    // Deploy TokenFactory contract
    const TokenFactoryFactory = await ethers.getContractFactory("TokenFactory");
    tokenFactory = await TokenFactoryFactory.deploy(feeCollector.address, creationFee);
    await tokenFactory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct fee collector and creation fee", async function () {
      expect(await tokenFactory.feeCollector()).to.equal(feeCollector.address);
      expect(await tokenFactory.creationFee()).to.equal(creationFee);
      expect(await tokenFactory.owner()).to.equal(owner.address);
    });
  });

  describe("Token Creation", function () {
    it("Should create a new token with the specified parameters", async function () {
      const tokenParams = {
        name: "Test Token",
        symbol: "TST",
        decimals: 18,
        totalSupply: ethers.parseUnits("1000000", 18),
        initialHolders: [creator.address],
        initialAmounts: [ethers.parseUnits("1000000", 18)],
        enableAntiBot: true,
        maxTxAmount: ethers.parseUnits("10000", 18),
        maxWalletAmount: ethers.parseUnits("20000", 18)
      };

      // Create token
      const tx = await tokenFactory.connect(creator).createToken(
        tokenParams.name,
        tokenParams.symbol,
        tokenParams.decimals,
        tokenParams.totalSupply,
        tokenParams.initialHolders,
        tokenParams.initialAmounts,
        tokenParams.enableAntiBot,
        tokenParams.maxTxAmount,
        tokenParams.maxWalletAmount,
        { value: creationFee }
      );

      // Wait for transaction
      const receipt = await tx.wait();
      
      // Get token address from emitted event
      const event = receipt.logs.find(log => {
        try {
          const parsedLog = tokenFactory.interface.parseLog(log);
          return parsedLog && parsedLog.name === "TokenCreated";
        } catch (e) {
          return false;
        }
      });
      
      const parsedEvent = tokenFactory.interface.parseLog(event);
      const tokenAddress = parsedEvent.args.tokenAddress;
      
      // Check if token was recorded correctly
      const creatorTokens = await tokenFactory.creatorTokens(creator.address, 0);
      expect(creatorTokens).to.equal(tokenAddress);
      
      // Check if token was added to allTokens array
      const allTokens = await tokenFactory.allTokens(0);
      expect(allTokens).to.equal(tokenAddress);
      
      // Check if fee was transferred
      const initialBalance = await ethers.provider.getBalance(feeCollector.address);
      expect(initialBalance).to.be.at.least(creationFee);
      
      // Connect to created token
      const TokenTemplate = await ethers.getContractFactory("TokenTemplate");
      const token = TokenTemplate.attach(tokenAddress);
      
      // Verify token parameters
      expect(await token.name()).to.equal(tokenParams.name);
      expect(await token.symbol()).to.equal(tokenParams.symbol);
      
      // Verify token ownership was transferred to creator
      expect(await token.owner()).to.equal(creator.address);
    });

    it("Should revert if insufficient fee is provided", async function () {
      const insufficientFee = ethers.parseEther("0.05");
      
      await expect(tokenFactory.connect(creator).createToken(
        "Test Token",
        "TST",
        18,
        ethers.parseUnits("1000000", 18),
        [creator.address],
        [ethers.parseUnits("1000000", 18)],
        true,
        ethers.parseUnits("10000", 18),
        ethers.parseUnits("20000", 18),
        { value: insufficientFee }
      )).to.be.revertedWith("Insufficient fee");
    });
    
    it("Should handle multiple token creations correctly", async function () {
      // Create first token
      await tokenFactory.connect(creator).createToken(
        "First Token",
        "FST",
        18,
        ethers.parseUnits("1000000", 18),
        [creator.address],
        [ethers.parseUnits("1000000", 18)],
        true,
        ethers.parseUnits("10000", 18),
        ethers.parseUnits("20000", 18),
        { value: creationFee }
      );
      
      // Create second token
      await tokenFactory.connect(creator).createToken(
        "Second Token",
        "SND",
        18,
        ethers.parseUnits("500000", 18),
        [creator.address],
        [ethers.parseUnits("500000", 18)],
        false,
        0,
        0,
        { value: creationFee }
      );
      
      // Check if both tokens were recorded correctly
      expect(await tokenFactory.connect(creator).creatorTokens(creator.address, 0)).to.not.equal(ethers.ZeroAddress);
      expect(await tokenFactory.connect(creator).creatorTokens(creator.address, 1)).to.not.equal(ethers.ZeroAddress);
      
      // Check all tokens array
      expect(await tokenFactory.allTokens(0)).to.not.equal(ethers.ZeroAddress);
      expect(await tokenFactory.allTokens(1)).to.not.equal(ethers.ZeroAddress);
    });
    
    it("Should revert if token parameters are invalid", async function () {
      // Test with mismatched initialHolders and initialAmounts arrays
      await expect(tokenFactory.connect(creator).createToken(
        "Test Token",
        "TST",
        18,
        ethers.parseUnits("1000000", 18),
        [creator.address, user.address], // Two addresses
        [ethers.parseUnits("1000000", 18)], // Only one amount
        true,
        ethers.parseUnits("10000", 18),
        ethers.parseUnits("20000", 18),
        { value: creationFee }
      )).to.be.revertedWith("Arrays length mismatch");
    });
  });
  
  describe("Fee Management", function () {
    it("Should allow owner to update fee collector", async function () {
      await tokenFactory.connect(owner).updateFeeCollector(user.address);
      expect(await tokenFactory.feeCollector()).to.equal(user.address);
      
      // Create token with new fee collector
      await tokenFactory.connect(creator).createToken(
        "Test Token",
        "TST",
        18,
        ethers.parseUnits("1000000", 18),
        [creator.address],
        [ethers.parseUnits("1000000", 18)],
        true,
        ethers.parseUnits("10000", 18),
        ethers.parseUnits("20000", 18),
        { value: creationFee }
      );
      
      // Check if fee was transferred to new collector
      const userBalance = await ethers.provider.getBalance(user.address);
      expect(userBalance).to.be.at.least(creationFee);
    });
    
    it("Should allow owner to update creation fee", async function () {
      const newFee = ethers.parseEther("0.2");
      await tokenFactory.connect(owner).updateCreationFee(newFee);
      expect(await tokenFactory.creationFee()).to.equal(newFee);
      
      // Should revert with old fee
      await expect(tokenFactory.connect(creator).createToken(
        "Test Token",
        "TST",
        18,
        ethers.parseUnits("1000000", 18),
        [creator.address],
        [ethers.parseUnits("1000000", 18)],
        true,
        ethers.parseUnits("10000", 18),
        ethers.parseUnits("20000", 18),
        { value: creationFee }
      )).to.be.revertedWith("Insufficient fee");
      
      // Should succeed with new fee
      await expect(tokenFactory.connect(creator).createToken(
        "Test Token",
        "TST",
        18,
        ethers.parseUnits("1000000", 18),
        [creator.address],
        [ethers.parseUnits("1000000", 18)],
        true,
        ethers.parseUnits("10000", 18),
        ethers.parseUnits("20000", 18),
        { value: newFee }
      )).to.not.be.reverted;
    });
    
    it("Should revert if non-owner tries to update fee parameters", async function () {
      await expect(tokenFactory.connect(creator).updateFeeCollector(user.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
        
      await expect(tokenFactory.connect(creator).updateCreationFee(ethers.parseEther("0.2")))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  // Add this function to the TokenFactory contract if not already present
  describe("Token Query", function () {
    beforeEach(async function () {
      // Create a few tokens for testing
      await tokenFactory.connect(creator).createToken(
        "First Token", "FST", 18, ethers.parseUnits("1000000", 18),
        [creator.address], [ethers.parseUnits("1000000", 18)],
        true, ethers.parseUnits("10000", 18), ethers.parseUnits("20000", 18),
        { value: creationFee }
      );
      
      await tokenFactory.connect(creator).createToken(
        "Second Token", "SND", 18, ethers.parseUnits("500000", 18),
        [creator.address], [ethers.parseUnits("500000", 18)],
        false, 0, 0,
        { value: creationFee }
      );
    });
    
    it("Should return correct token count for a creator", async function () {
      // Add getCreatorTokenCount method to TokenFactory if not present
      const tokenCount = await tokenFactory.getCreatorTokenCount(creator.address);
      expect(tokenCount).to.equal(2);
    });
    
    it("Should return total token count", async function () {
      // Add getTotalTokenCount method to TokenFactory if not present
      const totalCount = await tokenFactory.getTotalTokenCount();
      expect(totalCount).to.equal(2);
    });
  });
});