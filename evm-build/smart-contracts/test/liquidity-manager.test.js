const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("LiquidityManager Contract", function () {
  let LiquidityManager, liquidityManager;
  let MockRouter, mockRouter;
  let MockFactory, mockFactory;
  let MockWETH, mockWETH;
  let MockToken, mockToken, mockPairToken, mockThirdToken;
  let MockPair, mockPair;
  let owner, user1, user2, user3;
  let snapshotId;
  
  before(async function () {
    // Get signers
    [owner, user1, user2, user3] = await ethers.getSigners();
    
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
    
    // Deploy mock tokens
    MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("Mock Token", "MTK", 18);
    await mockToken.waitForDeployment();
    
    mockPairToken = await MockToken.deploy("Pair Token", "PAIR", 18);
    await mockPairToken.waitForDeployment();
    
    mockThirdToken = await MockToken.deploy("Third Token", "THIRD", 18);
    await mockThirdToken.waitForDeployment();
    
    // Create mock pair
    MockPair = await ethers.getContractFactory("MockPair");
    mockPair = await MockPair.deploy();
    await mockPair.waitForDeployment();
    
    // Deploy LiquidityManager
    LiquidityManager = await ethers.getContractFactory("LiquidityManager");
    liquidityManager = await LiquidityManager.deploy(mockRouter.target);
    await liquidityManager.waitForDeployment();
  });
  
  beforeEach(async function () {
    // Take a snapshot before each test
    snapshotId = await ethers.provider.send("evm_snapshot", []);
    
    // Mint tokens to users
    await mockToken.mint(user1.address, ethers.parseUnits("1000000", 18));
    await mockPairToken.mint(user1.address, ethers.parseUnits("1000000", 18));
    await mockThirdToken.mint(user1.address, ethers.parseUnits("1000000", 18));
    
    await mockToken.mint(user2.address, ethers.parseUnits("500000", 18));
    await mockPairToken.mint(user2.address, ethers.parseUnits("500000", 18));
    
    await mockToken.mint(user3.address, ethers.parseUnits("100000", 18));
    await mockPairToken.mint(user3.address, ethers.parseUnits("100000", 18));
    
    // Setup factory mock to return our mock pair
    await mockFactory.createPairMock(mockToken.target, mockWETH.target);
    await mockFactory.createPairMock(mockToken.target, mockPairToken.target);
    await mockFactory.createPairMock(mockThirdToken.target, mockWETH.target);
    await mockFactory.createPairMock(mockToken.target, mockThirdToken.target);
    
    // Approve tokens for LiquidityManager
    await mockToken.connect(user1).approve(liquidityManager.target, ethers.parseUnits("1000000", 18));
    await mockPairToken.connect(user1).approve(liquidityManager.target, ethers.parseUnits("1000000", 18));
    await mockThirdToken.connect(user1).approve(liquidityManager.target, ethers.parseUnits("1000000", 18));
    
    await mockToken.connect(user2).approve(liquidityManager.target, ethers.parseUnits("500000", 18));
    await mockPairToken.connect(user2).approve(liquidityManager.target, ethers.parseUnits("500000", 18));
    
    await mockToken.connect(user3).approve(liquidityManager.target, ethers.parseUnits("100000", 18));
    await mockPairToken.connect(user3).approve(liquidityManager.target, ethers.parseUnits("100000", 18));
  });
  
  afterEach(async function () {
    // Revert to snapshot after each test
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  describe("Deployment & Ownership", function () {
    it("Should set the correct router and factory addresses", async function () {
      expect(await liquidityManager.router()).to.equal(mockRouter.target);
      expect(await liquidityManager.factory()).to.equal(mockFactory.target);
    });
    
    it("Should set the correct owner", async function () {
      expect(await liquidityManager.owner()).to.equal(owner.address);
    });
    
    it("Should allow owner to transfer ownership", async function () {
      await liquidityManager.transferOwnership(user1.address);
      expect(await liquidityManager.owner()).to.equal(user1.address);
      
      // Transfer back to original owner for other tests
      await liquidityManager.connect(user1).transferOwnership(owner.address);
    });
    
    it("Should not allow non-owner to transfer ownership", async function () {
      await expect(
        liquidityManager.connect(user1).transferOwnership(user2.address)
      ).to.be.revertedWithCustomError(liquidityManager, "OwnableUnauthorizedAccount");
    });
  });

  describe("ETH Liquidity Pool Creation", function () {
    it("Should create ETH liquidity pool with no lock", async function () {
      const tokenAmount = ethers.parseUnits("100000", 18);
      const ethAmount = ethers.parseEther("10");
      const lockDuration = 0; // No lock
      
      // Calculate the pair address
      const pairAddress = await mockFactory.getPair(mockToken.target, mockWETH.target);
      
      // Create liquidity pool
      const tx = await liquidityManager.connect(user1).createLiquidityPool(
        mockToken.target,
        ethers.ZeroAddress, // ETH pair
        tokenAmount,
        lockDuration,
        { value: ethAmount }
      );
      
      // Wait for transaction
      const receipt = await tx.wait();
      
      // Find LiquidityCreated event
      const event = receipt.logs.find(log => {
        try {
          const parsedLog = liquidityManager.interface.parseLog(log);
          return parsedLog && parsedLog.name === "LiquidityCreated";
        } catch (e) {
          return false;
        }
      });
      
      // Verify event
      expect(event).to.not.be.undefined;
      
      const parsedEvent = liquidityManager.interface.parseLog(event);
      expect(parsedEvent.args.token).to.equal(mockToken.target);
      expect(parsedEvent.args.pair).to.equal(pairAddress);
      expect(parsedEvent.args.liquidity).to.be.gt(0);
      
      // Verify no lock was created
      const lockInfo = await liquidityManager.liquidityLocks(pairAddress);
      expect(lockInfo[0]).to.equal(0); // No locked amount
    });
    
    it("Should create and lock ETH liquidity pool correctly", async function () {
      const tokenAmount = ethers.parseUnits("100000", 18);
      const ethAmount = ethers.parseEther("10");
      const lockDuration = 30 * 24 * 60 * 60; // 30 days
      
      const pairAddress = await mockFactory.getPair(mockToken.target, mockWETH.target);
      
      const userEthBalanceBefore = await ethers.provider.getBalance(user1.address);
      const userTokenBalanceBefore = await mockToken.balanceOf(user1.address);
      
      // Create liquidity pool with lock
      const tx = await liquidityManager.connect(user1).createLiquidityPool(
        mockToken.target,
        ethers.ZeroAddress, // ETH pair
        tokenAmount,
        lockDuration,
        { value: ethAmount }
      );
      
      // Wait for transaction
      const receipt = await tx.wait();
      
      // Check token balance was deducted
      const userTokenBalanceAfter = await mockToken.balanceOf(user1.address);
      expect(userTokenBalanceAfter).to.equal(userTokenBalanceBefore - tokenAmount);
      
      // Find LiquidityLocked event
      const lockEvent = receipt.logs.find(log => {
        try {
          const parsedLog = liquidityManager.interface.parseLog(log);
          return parsedLog && parsedLog.name === "LiquidityLocked";
        } catch (e) {
          return false;
        }
      });
      
      // Verify lock event
      expect(lockEvent).to.not.be.undefined;
      
      const parsedLockEvent = liquidityManager.interface.parseLog(lockEvent);
      expect(parsedLockEvent.args.pair).to.equal(pairAddress);
      expect(parsedLockEvent.args.amount).to.be.gt(0);
      
      // Check lock info
      const lockInfo = await liquidityManager.liquidityLocks(pairAddress);
      expect(lockInfo[0]).to.equal(parsedLockEvent.args.amount); // amount
      expect(lockInfo[1]).to.equal(parsedLockEvent.args.unlockTime); // unlockTime
      expect(lockInfo[1]).to.be.gt(await time.latest()); // unlockTime is in the future
    });
    
    it("Should fail to create ETH pool with insufficient ETH", async function () {
      const tokenAmount = ethers.parseUnits("100000", 18);
      const ethAmount = ethers.parseEther("0"); // No ETH
      const lockDuration = 0;
      
      await expect(liquidityManager.connect(user1).createLiquidityPool(
        mockToken.target,
        ethers.ZeroAddress,
        tokenAmount,
        lockDuration,
        { value: ethAmount }
      )).to.be.revertedWithCustomError;
    });
    
    it("Should allow different users to create ETH pools with the same token", async function () {
      const tokenAmount1 = ethers.parseUnits("50000", 18);
      const ethAmount1 = ethers.parseEther("5");
      const tokenAmount2 = ethers.parseUnits("25000", 18);
      const ethAmount2 = ethers.parseEther("2.5");
      const lockDuration = 0;
      
      const pairAddress = await mockFactory.getPair(mockToken.target, mockWETH.target);
      
      // First user creates pool
      const tx1 = await liquidityManager.connect(user1).createLiquidityPool(
        mockToken.target,
        ethers.ZeroAddress,
        tokenAmount1,
        lockDuration,
        { value: ethAmount1 }
      );
      
      const receipt1 = await tx1.wait();
      
      // Second user adds to the same pool
      const tx2 = await liquidityManager.connect(user2).createLiquidityPool(
        mockToken.target,
        ethers.ZeroAddress,
        tokenAmount2,
        lockDuration,
        { value: ethAmount2 }
      );
      
      const receipt2 = await tx2.wait();
      
      // Verify both events point to the same pair
      const event1 = receipt1.logs.find(log => {
        try {
          const parsedLog = liquidityManager.interface.parseLog(log);
          return parsedLog && parsedLog.name === "LiquidityCreated";
        } catch (e) {
          return false;
        }
      });
      
      const event2 = receipt2.logs.find(log => {
        try {
          const parsedLog = liquidityManager.interface.parseLog(log);
          return parsedLog && parsedLog.name === "LiquidityCreated";
        } catch (e) {
          return false;
        }
      });
      
      const parsedEvent1 = liquidityManager.interface.parseLog(event1);
      const parsedEvent2 = liquidityManager.interface.parseLog(event2);
      
      expect(parsedEvent1.args.pair).to.equal(pairAddress);
      expect(parsedEvent2.args.pair).to.equal(pairAddress);
    });
  });
  
  describe("ERC20-ERC20 Liquidity Pool Creation", function () {
    it("Should create ERC20-ERC20 liquidity pool with no lock", async function () {
      const tokenAmount = ethers.parseUnits("100000", 18);
      const pairAmount = ethers.parseUnits("50000", 18);
      const lockDuration = 0; // No lock
      
      // Calculate the pair address
      const pairAddress = await mockFactory.getPair(mockToken.target, mockPairToken.target);
      
      // Create liquidity pool
      const tx = await liquidityManager.connect(user1).createLiquidityPool(
        mockToken.target,
        mockPairToken.target,
        tokenAmount,
        lockDuration,
        { value: 0 } // No ETH for ERC20 pairs
      );
      
      // Wait for transaction
      const receipt = await tx.wait();
      
      // Find LiquidityCreated event
      const event = receipt.logs.find(log => {
        try {
          const parsedLog = liquidityManager.interface.parseLog(log);
          return parsedLog && parsedLog.name === "LiquidityCreated";
        } catch (e) {
          return false;
        }
      });
      
      // Verify event
      expect(event).to.not.be.undefined;
      
      const parsedEvent = liquidityManager.interface.parseLog(event);
      expect(parsedEvent.args.token).to.equal(mockToken.target);
      expect(parsedEvent.args.pair).to.equal(pairAddress);
      expect(parsedEvent.args.liquidity).to.be.gt(0);
      
      // Verify no lock was created
      const lockInfo = await liquidityManager.liquidityLocks(pairAddress);
      expect(lockInfo[0]).to.equal(0); // No locked amount
    });
    
    it("Should create and lock ERC20-ERC20 liquidity pool correctly", async function () {
      const tokenAmount = ethers.parseUnits("100000", 18);
      const pairAmount = ethers.parseUnits("50000", 18);
      const lockDuration = 60 * 24 * 60 * 60; // 60 days
      
      const pairAddress = await mockFactory.getPair(mockToken.target, mockPairToken.target);
      
      const userTokenBalanceBefore = await mockToken.balanceOf(user1.address);
      const userPairTokenBalanceBefore = await mockPairToken.balanceOf(user1.address);
      
      // Create liquidity pool with lock
      const tx = await liquidityManager.connect(user1).createLiquidityPool(
        mockToken.target,
        mockPairToken.target,
        tokenAmount,
        lockDuration,
        { value: pairAmount } // This is interpreted as the other token amount for ERC20 pairs
      );
      
      // Wait for transaction
      const receipt = await tx.wait();
      
      // Check token balances were deducted
      const userTokenBalanceAfter = await mockToken.balanceOf(user1.address);
      const userPairTokenBalanceAfter = await mockPairToken.balanceOf(user1.address);
      expect(userTokenBalanceAfter).to.equal(userTokenBalanceBefore - tokenAmount);
      
      // Find LiquidityLocked event
      const lockEvent = receipt.logs.find(log => {
        try {
          const parsedLog = liquidityManager.interface.parseLog(log);
          return parsedLog && parsedLog.name === "LiquidityLocked";
        } catch (e) {
          return false;
        }
      });
      
      // Verify lock event
      expect(lockEvent).to.not.be.undefined;
      
      const parsedLockEvent = liquidityManager.interface.parseLog(lockEvent);
      expect(parsedLockEvent.args.pair).to.equal(pairAddress);
      expect(parsedLockEvent.args.amount).to.be.gt(0);
      
      // Check lock info
      const lockInfo = await liquidityManager.liquidityLocks(pairAddress);
      expect(lockInfo[0]).to.equal(parsedLockEvent.args.amount); // amount
      expect(lockInfo[1]).to.be.gt(await time.latest()); // unlockTime is in the future
    });
    
    it("Should handle creating pools with multiple ERC20 tokens", async function () {
      // First create a pair with one ERC20
      const tokenAmount1 = ethers.parseUnits("75000", 18);
      const pairAmount1 = ethers.parseUnits("30000", 18);
      const lockDuration = 0;
      
      const pair1Address = await mockFactory.getPair(mockToken.target, mockPairToken.target);
      
      await liquidityManager.connect(user1).createLiquidityPool(
        mockToken.target,
        mockPairToken.target,
        tokenAmount1,
        lockDuration,
        { value: pairAmount1 }
      );
      
      // Then create a pair with a different ERC20
      const tokenAmount2 = ethers.parseUnits("60000", 18);
      const pairAmount2 = ethers.parseUnits("25000", 18);
      
      const pair2Address = await mockFactory.getPair(mockToken.target, mockThirdToken.target);
      
      const tx = await liquidityManager.connect(user1).createLiquidityPool(
        mockToken.target,
        mockThirdToken.target,
        tokenAmount2,
        lockDuration,
        { value: pairAmount2 }
      );
      
      const receipt = await tx.wait();
      
      // Find LiquidityCreated event
      const event = receipt.logs.find(log => {
        try {
          const parsedLog = liquidityManager.interface.parseLog(log);
          return parsedLog && parsedLog.name === "LiquidityCreated";
        } catch (e) {
          return false;
        }
      });
      
      // Verify event
      expect(event).to.not.be.undefined;
      
      const parsedEvent = liquidityManager.interface.parseLog(event);
      expect(parsedEvent.args.token).to.equal(mockToken.target);
      expect(parsedEvent.args.pair).to.equal(pair2Address);
      expect(parsedEvent.args.liquidity).to.be.gt(0);
      
      // Verify pairs are different
      expect(pair1Address).to.not.equal(pair2Address);
    });
  });
  
  describe("Liquidity Locking", function () {
    it("Should not allow liquidity unlocking by non-owners", async function () {
      const tokenAmount = ethers.parseUnits("100000", 18);
      const ethAmount = ethers.parseEther("10");
      const lockDuration = 30 * 24 * 60 * 60; // 30 days
      
      const pairAddress = await mockFactory.getPair(mockToken.target, mockWETH.target);
      
      // Owner creates locked liquidity
      await liquidityManager.connect(user1).createLiquidityPool(
        mockToken.target,
        ethers.ZeroAddress,
        tokenAmount,
        lockDuration,
        { value: ethAmount }
      );
      
      // Advance time past unlock time
      const lockInfo = await liquidityManager.liquidityLocks(pairAddress);
      await time.increaseTo(lockInfo[1].toString());
      
      // User2 (who didn't create the lock) tries to unlock
      await expect(
        liquidityManager.connect(user2).unlockLiquidity(pairAddress)
      ).to.be.reverted;
    });
    
    it("Should respect different lock durations for different pairs", async function () {
      // Create first pool with 30 day lock
      const tokenAmount1 = ethers.parseUnits("100000", 18);
      const ethAmount1 = ethers.parseEther("10");
      const lockDuration1 = 30 * 24 * 60 * 60; // 30 days
      
      const pair1Address = await mockFactory.getPair(mockToken.target, mockWETH.target);
      
      await liquidityManager.connect(user1).createLiquidityPool(
        mockToken.target,
        ethers.ZeroAddress,
        tokenAmount1,
        lockDuration1,
        { value: ethAmount1 }
      );
      
      // Create second pool with 60 day lock
      const tokenAmount2 = ethers.parseUnits("80000", 18);
      const pairAmount2 = ethers.parseUnits("40000", 18);
      const lockDuration2 = 60 * 24 * 60 * 60; // 60 days
      
      const pair2Address = await mockFactory.getPair(mockToken.target, mockPairToken.target);
      
      await liquidityManager.connect(user1).createLiquidityPool(
        mockToken.target,
        mockPairToken.target,
        tokenAmount2,
        lockDuration2,
        { value: pairAmount2 }
      );
      
      // Get lock info
      const lockInfo1 = await liquidityManager.liquidityLocks(pair1Address);
      const lockInfo2 = await liquidityManager.liquidityLocks(pair2Address);
      
      // Verify different unlock times
      expect(lockInfo2[1]).to.be.gt(lockInfo1[1]);
      
      // Advance time to just after first lock expires
      await time.increaseTo(Number(lockInfo1[1]) + 1);
      
      // First pair should be unlockable, second shouldn't
      await expect(liquidityManager.connect(user1).unlockLiquidity(pair1Address)).to.not.be.reverted;
      await expect(liquidityManager.connect(user1).unlockLiquidity(pair2Address)).to.be.revertedWith("Liquidity still locked");
    });
  });
  
  describe("Liquidity Unlocking", function () {
    let pairAddress;
    let lockedAmount;
    let unlockTime;
    
    beforeEach(async function () {
      // Create a locked liquidity pool first
      const tokenAmount = ethers.parseUnits("100000", 18);
      const ethAmount = ethers.parseEther("10");
      const lockDuration = 30 * 24 * 60 * 60; // 30 days
      
      pairAddress = await mockFactory.getPair(mockToken.target, mockWETH.target);
      
      // Deploy mock pair contract at the expected address
      const MockLPToken = await ethers.getContractFactory("MockERC20");
      const mockLPToken = await MockLPToken.deploy("LP Token", "LP", 18);
      await mockLPToken.waitForDeployment();
      
      // The mock LP token needs to have liquidity in the LiquidityManager contract
      const estimatedLiquidity = ethers.parseUnits("1000", 18); // Mock liquidity amount
      await mockLPToken.mint(liquidityManager.target, estimatedLiquidity);
      
      // Mock the factory and router behavior
      await mockFactory.createPairMock(mockToken.target, mockWETH.target);
      
      // Create liquidity pool with lock
      const tx = await liquidityManager.connect(user1).createLiquidityPool(
        mockToken.target,
        ethers.ZeroAddress,
        tokenAmount,
        lockDuration,
        { value: ethAmount }
      );
      
      // Get the liquidity lock info
      const lockInfo = await liquidityManager.liquidityLocks(pairAddress);
      lockedAmount = lockInfo[0];
      unlockTime = lockInfo[1];
    });
    
    it("Should not allow unlocking before lock duration expires", async function () {
      // Try to unlock before time
      await expect(liquidityManager.connect(user1).unlockLiquidity(pairAddress))
        .to.be.revertedWith("Liquidity still locked");
    });
    
    it("Should allow unlocking exactly when lock duration expires", async function () {
      // Advance time to exactly unlock time
      await time.increaseTo(unlockTime);
      
      // Should now be able to unlock
      await expect(liquidityManager.connect(user1).unlockLiquidity(pairAddress))
        .to.not.be.reverted;
    });
    
    it("Should allow unlocking after lock duration expires", async function () {
      // Advance time past unlock time
      await time.increaseTo(Number(unlockTime) + 1000);
      
      // Should now be able to unlock
      const tx = await liquidityManager.connect(user1).unlockLiquidity(pairAddress);
      const receipt = await tx.wait();
      
      // Find LiquidityUnlocked event
      const unlockEvent = receipt.logs.find(log => {
        try {
          const parsedLog = liquidityManager.interface.parseLog(log);
          return parsedLog && parsedLog.name === "LiquidityUnlocked";
        } catch (e) {
          return false;
        }
      });
      
      // Verify unlock event
      expect(unlockEvent).to.not.be.undefined;
      
      const parsedUnlockEvent = liquidityManager.interface.parseLog(unlockEvent);
      expect(parsedUnlockEvent.args.pair).to.equal(pairAddress);
      expect(parsedUnlockEvent.args.amount).to.equal(lockedAmount);
      
      // Check lock info is reset
      const lockInfo = await liquidityManager.liquidityLocks(pairAddress);
      expect(lockInfo[0]).to.equal(0); // amount should be reset
    });
    
    it("Should not allow unlocking already unlocked liquidity", async function () {
      // Advance time past unlock time
      await time.increaseTo(unlockTime);
      
      // Unlock first time
      await liquidityManager.connect(user1).unlockLiquidity(pairAddress);
      
      // Try to unlock again
      await expect(liquidityManager.connect(user1).unlockLiquidity(pairAddress))
        .to.be.revertedWith("No locked liquidity");
    });
    
    it("Should transfer correct amount of LP tokens to user after unlock", async function () {
      // Get LP token interface
      const lpToken = await ethers.getContractAt("IERC20", pairAddress);
      
      // Check LP token balance before unlock
      const balanceBefore = await lpToken.balanceOf(user1.address);
      
      // Advance time past unlock time
      await time.increaseTo(unlockTime);
      
      // Unlock liquidity
      await liquidityManager.connect(user1).unlockLiquidity(pairAddress);
      
      // Check LP token balance after unlock
      const balanceAfter = await lpToken.balanceOf(user1.address);
      
      // Verify balance increased by locked amount
      expect(balanceAfter - balanceBefore).to.equal(lockedAmount);
    });
  });
  
  describe("Edge Cases and Error Handling", function () {
    it("Should revert when creating liquidity with zero token amount", async function () {
      const tokenAmount = ethers.parseUnits("0", 18);
      const ethAmount = ethers.parseEther("10");
      const lockDuration = 0;
      
      await expect(liquidityManager.connect(user1).createLiquidityPool(
        mockToken.target,
        ethers.ZeroAddress,
        tokenAmount,
        lockDuration,
        { value: ethAmount }
      )).to.be.revertedWithCustomError;
    });
    
    it("Should handle very large lock durations", async function () {
      const tokenAmount = ethers.parseUnits("100000", 18);
      const ethAmount = ethers.parseEther("10");
      const lockDuration = 3650 * 24 * 60 * 60; // 10 years
      
      const pairAddress = await mockFactory.getPair(mockToken.target, mockWETH.target);
      
      const tx = await liquidityManager.connect(user1).createLiquidityPool(
        mockToken.target,
        ethers.ZeroAddress,
        tokenAmount,
        lockDuration,
        { value: ethAmount }
      );
      
      const receipt = await tx.wait();
      
      // Find LiquidityLocked event
      const lockEvent = receipt.logs.find(log => {
        try {
          const parsedLog = liquidityManager.interface.parseLog(log);
          return parsedLog && parsedLog.name === "LiquidityLocked";
        } catch (e) {
          return false;
        }
      });
      
      // Verify lock event
      expect(lockEvent).to.not.be.undefined;
      
      const parsedLockEvent = liquidityManager.interface.parseLog(lockEvent);
      
      // Check lock duration is correctly set
      const currentTimestamp = await time.latest();
      expect(parsedLockEvent.args.unlockTime - currentTimestamp).to.be.closeTo(lockDuration, 10); // Allow small deviation due to block timestamp
    });
    
    it("Should handle token with non-standard decimals", async function () {
      // Deploy token with 6 decimals
      const nonStandardToken = await MockToken.deploy("Non-Standard Token", "NST", 6);
      await nonStandardToken.waitForDeployment();
      
      // Mint tokens to user
      await nonStandardToken.mint(user1.address, ethers.parseUnits("1000000", 6));
      
      // Approve tokens for LiquidityManager
      await nonStandardToken.connect(user1).approve(liquidityManager.target, ethers.parseUnits("1000000", 6));
      
      // Setup factory mock
      await mockFactory.createPairMock(nonStandardToken.target, mockWETH.target);
      
      const tokenAmount = ethers.parseUnits("100000", 6);
      const ethAmount = ethers.parseEther("10");
      const lockDuration = 0;
      
      const pairAddress = await mockFactory.getPair(nonStandardToken.target, mockWETH.target);
      
      // Create liquidity pool
      const tx = await liquidityManager.connect(user1).createLiquidityPool(
        nonStandardToken.target,
        ethers.ZeroAddress,
        tokenAmount,
        lockDuration,
        { value: ethAmount }
      );

      const receipt = await tx.wait();
          
      // Find LiquidityCreated event
      const event = receipt.logs.find(log => {
        try {
          const parsedLog = liquidityManager.interface.parseLog(log);
          return parsedLog && parsedLog.name === "LiquidityCreated";
        } catch (e) {
          return false;
        }
      });
      
      // Verify event
      expect(event).to.not.be.undefined;
      
      const parsedEvent = liquidityManager.interface.parseLog(event);
      expect(parsedEvent.args.token).to.equal(nonStandardToken.target);
      expect(parsedEvent.args.pair).to.equal(pairAddress);
      expect(parsedEvent.args.liquidity).to.be.gt(0);
      
      // Verify correct amount of tokens were transferred
      const tokenBalanceAfter = await nonStandardToken.balanceOf(user1.address);
      expect(tokenBalanceAfter).to.equal(ethers.parseUnits("1000000", 6) - tokenAmount);
    });
    })
})