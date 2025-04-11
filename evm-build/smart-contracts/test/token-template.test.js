const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TokenTemplate Contract", function () {
  let TokenTemplate, tokenTemplate;
  let owner, user1, user2, user3, liquidityPool;
  let totalSupply, initialAmount;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, user3, liquidityPool] = await ethers.getSigners();
    
    // Set token parameters
    totalSupply = ethers.parseUnits("1000000", 18);
    initialAmount = ethers.parseUnits("10000", 18);
    
    // Deploy TokenTemplate contract directly
    const TokenTemplateFactory = await ethers.getContractFactory("TokenTemplate");
    tokenTemplate = await TokenTemplateFactory.deploy(
      "Test Token",       // name
      "TST",              // symbol
      18,                 // decimals
      totalSupply,        // totalSupply
      [user1.address],    // initialHolders
      [initialAmount],    // initialAmounts
      true,               // enableAntiBot
      ethers.parseUnits("5000", 18),  // maxTxAmount
      ethers.parseUnits("10000", 18)  // maxWalletAmount
    );
    await tokenTemplate.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct token parameters", async function () {
      expect(await tokenTemplate.name()).to.equal("Test Token");
      expect(await tokenTemplate.symbol()).to.equal("TST");
      expect(await tokenTemplate.decimals()).to.equal(18);
      expect(await tokenTemplate.totalSupply()).to.equal(totalSupply);
      expect(await tokenTemplate.balanceOf(user1.address)).to.equal(initialAmount);
      expect(await tokenTemplate.balanceOf(owner.address)).to.equal(totalSupply.sub(initialAmount));
    });
    
    it("Should set anti-bot configuration correctly", async function () {
      expect(await tokenTemplate.isExcludedFromLimits(owner.address)).to.equal(true);
      expect(await tokenTemplate.tradingEnabled()).to.equal(false);
    });
  });

  describe("Trading Control", function () {
    it("Should enable trading when called by owner", async function () {
      expect(await tokenTemplate.tradingEnabled()).to.equal(false);
      
      // Enable trading
      await tokenTemplate.connect(owner).enableTrading();
      
      expect(await tokenTemplate.tradingEnabled()).to.equal(true);
      expect(await tokenTemplate.launchTime()).to.be.approximately(
        await time.latest(),
        5 // Allow small time difference
      );
    });
    
    it("Should revert when non-owner tries to enable trading", async function () {
      await expect(tokenTemplate.connect(user1).enableTrading())
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("Should revert when trying to enable trading twice", async function () {
      await tokenTemplate.connect(owner).enableTrading();
      await expect(tokenTemplate.connect(owner).enableTrading())
        .to.be.revertedWith("Trading already enabled");
    });
    
    it("Should only allow owner to transfer before trading is enabled", async function () {
      const transferAmount = ethers.parseUnits("1000", 18);
      
      // Owner should be able to transfer
      await expect(tokenTemplate.connect(owner).transfer(user2.address, transferAmount))
        .to.not.be.reverted;
      
      // User should not be able to transfer
      await expect(tokenTemplate.connect(user1).transfer(user2.address, initialAmount.div(2)))
        .to.be.revertedWith("Trading not enabled");
      
      // Enable trading
      await tokenTemplate.connect(owner).enableTrading();
      
      // Now user should be able to transfer
      await expect(tokenTemplate.connect(user1).transfer(user2.address, initialAmount.div(2)))
        .to.not.be.reverted;
    });
  });

  describe("Anti-Bot Protection", function () {
    beforeEach(async function () {
      // Enable trading for testing anti-bot features
      await tokenTemplate.connect(owner).enableTrading();
      
      // Exclude liquidity pool from limits for testing purposes
      await tokenTemplate.connect(owner).excludeFromLimits(liquidityPool.address, true);
      
      // Transfer tokens to liquidity pool
      await tokenTemplate.connect(owner).transfer(liquidityPool.address, ethers.parseUnits("100000", 18));
    });
    
    it("Should enforce maximum transaction amount", async function () {
      const maxTxAmount = ethers.parseUnits("5000", 18);
      const belowMaxAmount = ethers.parseUnits("4000", 18);
      const aboveMaxAmount = ethers.parseUnits("6000", 18);
      
      // Transaction below max amount should work
      await expect(tokenTemplate.connect(liquidityPool).transfer(user2.address, belowMaxAmount))
        .to.not.be.reverted;
      
      // Transaction above max amount should fail
      await expect(tokenTemplate.connect(liquidityPool).transfer(user3.address, aboveMaxAmount))
        .to.be.revertedWith("Transaction exceeds max limit");
    });
    
    it("Should enforce maximum wallet amount", async function () {
      const maxWalletAmount = ethers.parseUnits("10000", 18);
      const firstTransfer = ethers.parseUnits("8000", 18);
      const secondTransfer = ethers.parseUnits("3000", 18);
      
      // First transfer (below max wallet) should succeed
      await tokenTemplate.connect(liquidityPool).transfer(user2.address, firstTransfer);
      
      // Second transfer (would exceed max wallet) should fail
      await expect(tokenTemplate.connect(liquidityPool).transfer(user2.address, secondTransfer))
        .to.be.revertedWith("Wallet amount exceeds limit");
    });
    
    it("Should allow owner to adjust transaction limits", async function () {
      const newMaxTx = ethers.parseUnits("8000", 18);
      const testAmount = ethers.parseUnits("7000", 18);
      
      // Transaction above current limit should fail
      await expect(tokenTemplate.connect(liquidityPool).transfer(user2.address, testAmount))
        .to.be.revertedWith("Transaction exceeds max limit");
      
      // Update max transaction amount
      await tokenTemplate.connect(owner).setMaxTxAmount(newMaxTx);
      
      // Now the transaction should succeed
      await expect(tokenTemplate.connect(liquidityPool).transfer(user2.address, testAmount))
        .to.not.be.reverted;
    });
    
    it("Should allow owner to exclude addresses from limits", async function () {
      const largeAmount = ethers.parseUnits("20000", 18);
      
      // Transaction above limits should fail for normal user
      await expect(tokenTemplate.connect(liquidityPool).transfer(user2.address, largeAmount))
        .to.be.revertedWith("Transaction exceeds max limit");
      
      // Exclude user2 from limits
      await tokenTemplate.connect(owner).excludeFromLimits(user2.address, true);
      
      // Now transfer to excluded user should work
      await expect(tokenTemplate.connect(liquidityPool).transfer(user2.address, largeAmount))
        .to.not.be.reverted;
      
      // Transfer from excluded user should also work
      await expect(tokenTemplate.connect(user2).transfer(user3.address, largeAmount))
        .to.not.be.reverted;
    });
    
    it("Should allow owner to disable anti-bot protection", async function () {
      const largeAmount = ethers.parseUnits("20000", 18);
      
      // First verify protection is active
      await expect(tokenTemplate.connect(liquidityPool).transfer(user2.address, largeAmount))
        .to.be.revertedWith("Transaction exceeds max limit");
      
      // Disable anti-bot protection
      await tokenTemplate.connect(owner).setAntiBotEnabled(false);
      
      // Now the transfer should work
      await expect(tokenTemplate.connect(liquidityPool).transfer(user2.address, largeAmount))
        .to.not.be.reverted;
    });
    
    it("Should apply cooldown period during launch phase", async function () {
      const amount = ethers.parseUnits("1000", 18);
      
      // First transfer should succeed
      await tokenTemplate.connect(liquidityPool).transfer(user2.address, amount);
      
      // Second immediate transfer should fail due to cooldown
      await expect(tokenTemplate.connect(liquidityPool).transfer(user2.address, amount))
        .to.be.revertedWith("Must wait for cooldown period");
      
      // Advance time past cooldown period
      await time.increase(35); // 35 seconds (cooldown is 30 seconds)
      
      // Now the transfer should succeed
      await expect(tokenTemplate.connect(liquidityPool).transfer(user2.address, amount))
        .to.not.be.reverted;
    });
    
    it("Should have dynamic transaction limits based on time since launch", async function () {
      // Test transaction right after launch
      const amount = ethers.parseUnits("1500", 18); // 30% of maxTxAmount
      
      // Should succeed as it's below the initial reduced limit
      await expect(tokenTemplate.connect(liquidityPool).transfer(user2.address, amount))
        .to.not.be.reverted;
      
      // Test larger amount that should fail initially
      const largerAmount = ethers.parseUnits("2000", 18); // 40% of maxTxAmount
      
      await expect(tokenTemplate.connect(liquidityPool).transfer(user3.address, largerAmount))
        .to.be.revertedWith("Transaction exceeds max limit");
      
      // Advance time to 2 hours after launch
      await time.increase(7200); // 2 hours in seconds
      
      // Now the larger transfer should succeed
      await expect(tokenTemplate.connect(liquidityPool).transfer(user3.address, largerAmount))
        .to.not.be.reverted;
    });
  });

  describe("Ownership and Permissions", function () {
    it("Should allow ownership transfer", async function () {
      await tokenTemplate.connect(owner).transferOwnership(user1.address);
      expect(await tokenTemplate.owner()).to.equal(user1.address);
      
      // Original owner should no longer have permissions
      await expect(tokenTemplate.connect(owner).enableTrading())
        .to.be.revertedWith("Ownable: caller is not the owner");
      
      // New owner should have permissions
      await expect(tokenTemplate.connect(user1).enableTrading())
        .to.not.be.reverted;
    });
    
    it("Should handle standard ERC20 functionality", async function () {
      // Test allowances
      const approvalAmount = ethers.parseUnits("5000", 18);
      await tokenTemplate.connect(user1).approve(user2.address, approvalAmount);
      expect(await tokenTemplate.allowance(user1.address, user2.address)).to.equal(approvalAmount);
      
      // Test transferFrom
      await tokenTemplate.connect(owner).enableTrading();
      await tokenTemplate.connect(user2).transferFrom(user1.address, user3.address, approvalAmount);
      
      expect(await tokenTemplate.balanceOf(user3.address)).to.equal(approvalAmount);
      expect(await tokenTemplate.balanceOf(user1.address)).to.equal(initialAmount.sub(approvalAmount));
      expect(await tokenTemplate.allowance(user1.address, user2.address)).to.equal(0);
    });
  });
});