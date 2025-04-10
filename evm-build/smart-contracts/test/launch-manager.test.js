const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("LaunchManager Contract", function () {
  let TokenFactory, tokenFactory;
  let TokenTemplate, tokenTemplate;
  let LiquidityManager, liquidityManager;
  let LaunchManager, launchManager;
  let MockRouter, mockRouter;
  let MockFactory, mockFactory;
  let MockWETH, mockWETH;
  let MockToken, mockToken;
  let owner, user1, user2, user3, feeCollector;
  let launchFee, tokenCreationFee;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, user3, feeCollector] = await ethers.getSigners();
    
    // Set fees
    launchFee = ethers.parseEther("0.5");
    tokenCreationFee = ethers.parseEther("0.1");
    
    // Deploy mock contracts for Uniswap
    MockWETH = await ethers.getContractFactory("MockWETH");
    mockWETH = await MockWETH.deploy();
    await mockWETH.waitForDeployment();
    
    MockFactory = await ethers.getContractFactory("MockUniswapV2Factory");
    mockFactory = await MockFactory.deploy(owner.address);
    await mockFactory.waitForDeployment();
    
    MockRouter = await ethers.getContractFactory("MockUniswapV2Router02");
    mockRouter = await MockRouter.deploy(mockFactory.target, mockWETH.target);
    await mockRouter.waitForDeployment();

    // Deploy a mock ERC20 token for testing
    MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("Mock Token", "MOCK", ethers.parseUnits("1000000", 18));
    await mockToken.waitForDeployment();
    
    // Deploy TokenFactory
    TokenFactory = await ethers.getContractFactory("TokenFactory");
    tokenFactory = await TokenFactory.deploy(feeCollector.address, tokenCreationFee);
    await tokenFactory.waitForDeployment();
    
    // Deploy LiquidityManager
    LiquidityManager = await ethers.getContractFactory("LiquidityManager");
    liquidityManager = await LiquidityManager.deploy(mockRouter.target);
    await liquidityManager.waitForDeployment();
    
    // Deploy LaunchManager
    LaunchManager = await ethers.getContractFactory("LaunchManager");
    launchManager = await LaunchManager.deploy(
      tokenFactory.target,
      liquidityManager.target,
      feeCollector.address,
      launchFee
    );
    await launchManager.waitForDeployment();
    
    // Set allowance for tokenFactory to create tokens without requiring fee
    // (since LaunchManager will pass 0 value)
    await tokenFactory.connect(owner).updateCreationFee(0);
  });

  describe("Deployment", function () {
    it("Should set the correct contract addresses and parameters", async function () {
      expect(await launchManager.tokenFactory()).to.equal(tokenFactory.target);
      expect(await launchManager.liquidityManager()).to.equal(liquidityManager.target);
      expect(await launchManager.feeCollector()).to.equal(feeCollector.address);
      expect(await launchManager.launchFee()).to.equal(launchFee);
    });

    it("Should allow owner to update the fee collector", async function () {
      await expect(launchManager.connect(owner).updateFeeCollector(user3.address))
        .to.emit(launchManager, "FeeCollectorUpdated")
        .withArgs(feeCollector.address, user3.address);
      
      expect(await launchManager.feeCollector()).to.equal(user3.address);
    });

    it("Should allow owner to update the launch fee", async function () {
      const newFee = ethers.parseEther("1.0");
      
      await expect(launchManager.connect(owner).updateLaunchFee(newFee))
        .to.emit(launchManager, "LaunchFeeUpdated")
        .withArgs(launchFee, newFee);
      
      expect(await launchManager.launchFee()).to.equal(newFee);
    });

    it("Should not allow non-owner to update fee collector", async function () {
      await expect(
        launchManager.connect(user1).updateFeeCollector(user3.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow non-owner to update launch fee", async function () {
      const newFee = ethers.parseEther("1.0");
      await expect(
        launchManager.connect(user1).updateLaunchFee(newFee)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Instant Launch", function () {
    let launchParams;
    const liquidityAmount = ethers.parseUnits("500000", 18);
    const pairAmount = ethers.parseEther("10");
    const lockDuration = 30 * 24 * 60 * 60; // 30 days
    
    beforeEach(async function () {
      // Set launch parameters
      launchParams = {
        name: "Launch Test Token",
        symbol: "LTT",
        decimals: 18,
        totalSupply: ethers.parseUnits("1000000", 18),
        initialHolders: [user1.address],
        initialAmounts: [ethers.parseUnits("500000", 18)],
        enableAntiBot: true,
        maxTxAmount: ethers.parseUnits("5000", 18),
        maxWalletAmount: ethers.parseUnits("10000", 18),
        pairWith: ethers.ZeroAddress, // ETH pair
        liquidityAmount: liquidityAmount,
        pairAmount: pairAmount,
        lockDuration: lockDuration
      };
      
      // Deploy a token template for testing
      TokenTemplate = await ethers.getContractFactory("TokenTemplate");
      tokenTemplate = await TokenTemplate.deploy(
        "Test Token",
        "TST",
        18,
        ethers.parseUnits("1000000", 18),
        [user1.address],
        [ethers.parseUnits("500000", 18)],
        true,
        ethers.parseUnits("5000", 18),
        ethers.parseUnits("10000", 18)
      );
      await tokenTemplate.waitForDeployment();
      
      // Set up mocks for successful liquidity creation
      await mockFactory.createPairMock(tokenTemplate.target, mockWETH.target);
    });
    
    it("Should revert if launch fee is insufficient", async function () {
      const insufficientFee = ethers.parseEther("0.3");
      
      await expect(launchManager.connect(user1).instantLaunch(
        launchParams,
        { value: insufficientFee }
      )).to.be.revertedWith("Insufficient launch fee");
    });

    it("Should revert if initialHolders and initialAmounts arrays have different lengths", async function () {
      const invalidParams = { ...launchParams };
      invalidParams.initialHolders = [user1.address, user2.address];
      invalidParams.initialAmounts = [ethers.parseUnits("500000", 18)];
      
      await expect(launchManager.connect(user1).instantLaunch(
        invalidParams,
        { value: launchFee + pairAmount }
      )).to.be.revertedWith("Arrays length mismatch");
    });

    it("Should revert if liquidityAmount exceeds total supply", async function () {
      const invalidParams = { ...launchParams };
      invalidParams.liquidityAmount = ethers.parseUnits("1500000", 18); // More than total supply
      
      await expect(launchManager.connect(user1).instantLaunch(
        invalidParams,
        { value: launchFee + pairAmount }
      )).to.be.revertedWith("Insufficient token balance");
    });

    it("Should revert if pairAmount is insufficient for ETH pair", async function () {
      const insufficientPairAmount = ethers.parseEther("0.1");
      
      await expect(launchManager.connect(user1).instantLaunch(
        launchParams,
        { value: launchFee + insufficientPairAmount }
      )).to.be.revertedWith("Insufficient ETH for liquidity");
    });

    it("Should handle token pairs correctly", async function () {
      // Create parameters for token pair instead of ETH
      const tokenPairParams = { ...launchParams };
      tokenPairParams.pairWith = mockToken.target;
      
      // Approve tokens for the liquidity manager
      await mockToken.connect(user1).approve(liquidityManager.target, pairAmount);
      
      // Mock token pair creation
      await mockFactory.createPairMock(tokenTemplate.target, mockToken.target);
      
      // Execute launch with token pair
      const tx = await launchManager.connect(user1).instantLaunch(
        tokenPairParams,
        { value: launchFee } // Only need launch fee, not pairAmount for token pairs
      );
      
      const receipt = await tx.wait();
      
      // Verify event was emitted
      const event = receipt.logs.find(log => {
        try {
          const parsedLog = launchManager.interface.parseLog(log);
          return parsedLog && parsedLog.name === "LaunchCompleted";
        } catch (e) {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
    });
    
    it("Should complete the entire launch process successfully with ETH pair", async function () {
      // Get initial balance of fee collector
      const initialFeeCollectorBalance = await ethers.provider.getBalance(feeCollector.address);
      
      // Perform instantLaunch
      const tx = await launchManager.connect(user1).instantLaunch(
        launchParams,
        { value: launchFee + pairAmount } // Add pair amount for liquidity
      );
      
      // Wait for transaction
      const receipt = await tx.wait();
      
      // Find LaunchCompleted event
      const event = receipt.logs.find(log => {
        try {
          const parsedLog = launchManager.interface.parseLog(log);
          return parsedLog && parsedLog.name === "LaunchCompleted";
        } catch (e) {
          return false;
        }
      });
      
      // Verify that the event was emitted
      expect(event).to.not.be.undefined;
      
      // Check that fee was transferred to fee collector
      const finalFeeCollectorBalance = await ethers.provider.getBalance(feeCollector.address);
      expect(finalFeeCollectorBalance - initialFeeCollectorBalance).to.equal(launchFee);
      
      // Get the launched token address from the event
      const parsedEvent = launchManager.interface.parseLog(event);
      const tokenAddress = parsedEvent.args.tokenAddress;
      const liquidityPair = parsedEvent.args.liquidityPair;
      
      // Verify that the token has trading enabled
      const launchedToken = await ethers.getContractAt("IToken", tokenAddress);
      expect(await launchedToken.tradingEnabled()).to.be.true;
      
      // Verify that the liquidity pair was created
      expect(liquidityPair).to.not.equal(ethers.ZeroAddress);
    });

    it("Should revert if fee transfer fails", async function () {
      // Deploy a malicious fee collector that rejects transfers
      const MaliciousFeeCollector = await ethers.getContractFactory("MaliciousFeeCollector");
      const maliciousFeeCollector = await MaliciousFeeCollector.deploy();
      await maliciousFeeCollector.waitForDeployment();
      
      // Update fee collector to malicious one
      await launchManager.connect(owner).updateFeeCollector(maliciousFeeCollector.target);
      
      // Attempt launch should fail
      await expect(launchManager.connect(user1).instantLaunch(
        launchParams,
        { value: launchFee + pairAmount }
      )).to.be.revertedWith("Fee transfer failed");
    });
  });

  describe("Integration with TokenFactory and LiquidityManager", function () {
    let launchParams;
    const liquidityAmount = ethers.parseUnits("500000", 18);
    const pairAmount = ethers.parseEther("10");
    const lockDuration = 30 * 24 * 60 * 60; // 30 days
    
    beforeEach(async function () {
      launchParams = {
        name: "Integration Test Token",
        symbol: "ITT",
        decimals: 18,
        totalSupply: ethers.parseUnits("1000000", 18),
        initialHolders: [user1.address, user2.address],
        initialAmounts: [
          ethers.parseUnits("300000", 18),
          ethers.parseUnits("200000", 18)
        ],
        enableAntiBot: true,
        maxTxAmount: ethers.parseUnits("5000", 18),
        maxWalletAmount: ethers.parseUnits("10000", 18),
        pairWith: ethers.ZeroAddress, // ETH pair
        liquidityAmount: liquidityAmount,
        pairAmount: pairAmount,
        lockDuration: lockDuration
      };
    });
    
    it("Should handle errors from TokenFactory correctly", async function () {
      // Create a failing TokenFactory mock
      const FailingTokenFactory = await ethers.getContractFactory("FailingTokenFactory");
      const failingTokenFactory = await FailingTokenFactory.deploy();
      await failingTokenFactory.waitForDeployment();
      
      // Create a new LaunchManager with the failing TokenFactory
      const newLaunchManager = await LaunchManager.deploy(
        failingTokenFactory.target,
        liquidityManager.target,
        feeCollector.address,
        launchFee
      );
      await newLaunchManager.waitForDeployment();
      
      // Attempt to launch should fail
      await expect(newLaunchManager.connect(user1).instantLaunch(
        launchParams,
        { value: launchFee + pairAmount }
      )).to.be.revertedWith("Token creation failed");
    });
    
    it("Should handle errors from LiquidityManager correctly", async function () {
      // Create a failing LiquidityManager mock
      const FailingLiquidityManager = await ethers.getContractFactory("FailingLiquidityManager");
      const failingLiquidityManager = await FailingLiquidityManager.deploy();
      await failingLiquidityManager.waitForDeployment();
      
      // Create a new LaunchManager with the failing LiquidityManager
      const newLaunchManager = await LaunchManager.deploy(
        tokenFactory.target,
        failingLiquidityManager.target,
        feeCollector.address,
        launchFee
      );
      await newLaunchManager.waitForDeployment();
      
      // Update TokenFactory to allow free token creation
      await tokenFactory.connect(owner).updateCreationFee(0);
      
      // Attempt to launch should fail
      await expect(newLaunchManager.connect(user1).instantLaunch(
        launchParams,
        { value: launchFee + pairAmount }
      )).to.be.revertedWith("Liquidity creation failed");
    });
    
    it("Should verify token distribution after launch", async function () {
      // Perform instantLaunch
      const tx = await launchManager.connect(user1).instantLaunch(
        launchParams,
        { value: launchFee + pairAmount }
      );
      
      const receipt = await tx.wait();
      
      // Find LaunchCompleted event to get token address
      const event = receipt.logs.find(log => {
        try {
          const parsedLog = launchManager.interface.parseLog(log);
          return parsedLog && parsedLog.name === "LaunchCompleted";
        } catch (e) {
          return false;
        }
      });
      
      const parsedEvent = launchManager.interface.parseLog(event);
      const tokenAddress = parsedEvent.args.tokenAddress;
      
      // Get the launched token
      const launchedToken = await ethers.getContractAt("IToken", tokenAddress);
      
      // Verify balances
      expect(await launchedToken.balanceOf(user1.address)).to.equal(
        launchParams.initialAmounts[0]
      );
      expect(await launchedToken.balanceOf(user2.address)).to.equal(
        launchParams.initialAmounts[1]
      );
      
      // Verify total supply
      expect(await launchedToken.totalSupply()).to.equal(launchParams.totalSupply);
    });
    
    it("Should verify anti-bot measures are activated", async function () {
      // Perform instantLaunch
      const tx = await launchManager.connect(user1).instantLaunch(
        launchParams,
        { value: launchFee + pairAmount }
      );
      
      const receipt = await tx.wait();
      
      // Find LaunchCompleted event to get token address
      const event = receipt.logs.find(log => {
        try {
          const parsedLog = launchManager.interface.parseLog(log);
          return parsedLog && parsedLog.name === "LaunchCompleted";
        } catch (e) {
          return false;
        }
      });
      
      const parsedEvent = launchManager.interface.parseLog(event);
      const tokenAddress = parsedEvent.args.tokenAddress;
      
      // Get the launched token
      const launchedToken = await ethers.getContractAt("IToken", tokenAddress);
      
      // Verify anti-bot measures
      expect(await launchedToken.maxTxAmount()).to.equal(launchParams.maxTxAmount);
      expect(await launchedToken.maxWalletAmount()).to.equal(launchParams.maxWalletAmount);
    });
  });

  describe("Liquidity Locking", function () {
    let launchParams;
    const liquidityAmount = ethers.parseUnits("500000", 18);
    const pairAmount = ethers.parseEther("10");
    const lockDuration = 30 * 24 * 60 * 60; // 30 days
    
    beforeEach(async function () {
      launchParams = {
        name: "Lock Test Token",
        symbol: "LTT",
        decimals: 18,
        totalSupply: ethers.parseUnits("1000000", 18),
        initialHolders: [user1.address],
        initialAmounts: [ethers.parseUnits("500000", 18)],
        enableAntiBot: true,
        maxTxAmount: ethers.parseUnits("5000", 18),
        maxWalletAmount: ethers.parseUnits("10000", 18),
        pairWith: ethers.ZeroAddress, // ETH pair
        liquidityAmount: liquidityAmount,
        pairAmount: pairAmount,
        lockDuration: lockDuration
      };
    });
    
    it("Should lock liquidity for the specified duration", async function () {
      // Perform instantLaunch
      const tx = await launchManager.connect(user1).instantLaunch(
        launchParams,
        { value: launchFee + pairAmount }
      );
      
      const receipt = await tx.wait();
      
      // Find LaunchCompleted event to get liquidity pair address
      const event = receipt.logs.find(log => {
        try {
          const parsedLog = launchManager.interface.parseLog(log);
          return parsedLog && parsedLog.name === "LaunchCompleted";
        } catch (e) {
          return false;
        }
      });
      
      const parsedEvent = launchManager.interface.parseLog(event);
      const liquidityPair = parsedEvent.args.liquidityPair;
      
      // Get lock info from LiquidityManager
      const lockInfo = await liquidityManager.getLockInfo(liquidityPair);
      
      // Verify lock duration
      expect(lockInfo.lockDuration).to.equal(lockDuration);
      
      // Verify lock is active
      expect(lockInfo.isLocked).to.be.true;
      
      // Try to withdraw before lock period (should fail)
      await expect(
        liquidityManager.connect(user1).withdrawLiquidity(liquidityPair)
      ).to.be.revertedWith("Liquidity is locked");
      
      // Advance time past lock period
      await time.increase(lockDuration + 1);
      
      // TODO: Implement withdrawal test - would require proper mocking of LP tokens
    });
    
    it("Should allow zero lock duration", async function () {
      const zeroLockParams = { ...launchParams, lockDuration: 0 };
      
      // Perform instantLaunch with zero lock duration
      const tx = await launchManager.connect(user1).instantLaunch(
        zeroLockParams,
        { value: launchFee + pairAmount }
      );
      
      const receipt = await tx.wait();
      
      // Find LaunchCompleted event to get liquidity pair address
      const event = receipt.logs.find(log => {
        try {
          const parsedLog = launchManager.interface.parseLog(log);
          return parsedLog && parsedLog.name === "LaunchCompleted";
        } catch (e) {
          return false;
        }
      });
      
      const parsedEvent = launchManager.interface.parseLog(event);
      const liquidityPair = parsedEvent.args.liquidityPair;
      
      // Get lock info from LiquidityManager
      const lockInfo = await liquidityManager.getLockInfo(liquidityPair);
      
      // Verify lock duration is zero
      expect(lockInfo.lockDuration).to.equal(0);
      
      // Verify lock is not active
      expect(lockInfo.isLocked).to.be.false;
      
      // TODO: Implement withdrawal test - would require proper mocking of LP tokens
    });
  });

  describe("Recovery Functions", function () {
    it("Should allow owner to recover stuck ETH", async function () {
      // Assumes there's a recoverEth function in the contract
      const recoveryAmount = ethers.parseEther("1.0");
      
      // Send ETH to contract
      await owner.sendTransaction({
        to: launchManager.target,
        value: recoveryAmount
      });
      
      // Verify contract balance
      expect(await ethers.provider.getBalance(launchManager.target)).to.equal(recoveryAmount);
      
      // Get initial balance of owner
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
      
      // Recover ETH
      const tx = await launchManager.connect(owner).recoverEth();
      const receipt = await tx.wait();
      
      // Calculate gas used
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      // Verify owner balance increased (minus gas costs)
      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
      expect(finalOwnerBalance).to.be.closeTo(
        initialOwnerBalance + recoveryAmount - gasUsed,
        ethers.parseEther("0.001") // Allow for small rounding errors
      );
      
      // Verify contract balance is zero
      expect(await ethers.provider.getBalance(launchManager.target)).to.equal(0);
    });
    
    it("Should allow owner to recover stuck tokens", async function () {
      // Assumes there's a recoverTokens function in the contract
      const recoveryAmount = ethers.parseUnits("100", 18);
      
      // Send tokens to contract
      await mockToken.transfer(launchManager.target, recoveryAmount);
      
      // Verify contract balance
      expect(await mockToken.balanceOf(launchManager.target)).to.equal(recoveryAmount);
      
      // Get initial balance of owner
      const initialOwnerBalance = await mockToken.balanceOf(owner.address);
      
      // Recover tokens
      await launchManager.connect(owner).recoverTokens(mockToken.target);
      
      // Verify owner balance increased
      const finalOwnerBalance = await mockToken.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance + recoveryAmount);
      
      // Verify contract balance is zero
      expect(await mockToken.balanceOf(launchManager.target)).to.equal(0);
    });
  });
});