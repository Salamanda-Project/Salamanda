// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

interface IWETH {
    function deposit() external payable;
    function withdraw(uint) external;
    function transfer(address to, uint value) external returns (bool);
}

interface IUniswapV3Factory {
    function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address);
}

interface INonfungiblePositionManager {
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }
    
    function factory() external view returns (address);
    function createAndInitializePoolIfNecessary(
        address token0,
        address token1,
        uint24 fee,
        uint160 sqrtPriceX96
    ) external payable returns (address pool);
    
    function mint(MintParams calldata params)
        external
        payable
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        );
        
    function transferFrom(address from, address to, uint256 tokenId) external;
}

contract LiquidityManager is Ownable {
    // State variables
    INonfungiblePositionManager public immutable positionManager;
    IWETH public immutable weth;
    
    struct LockInfo {
        uint256 tokenId;
        uint256 unlockTime;
    }
    
    // Memory structs for temporary variables
    struct PoolCreationVars {
        address token0;
        address token1;
        uint256 amount0Desired;
        uint256 amount1Desired;
        address pool;
        uint256 tokenId;
        bool isToken0Weth;
        bool isToken1Weth;
    }
    
    // Memory struct for pool initialization variables
    struct PoolInitVars {
        uint8 token0Decimals;
        uint8 token1Decimals;
        uint160 sqrtPriceX96;
    }
    
    mapping(uint256 => LockInfo) public liquidityLocks;
    mapping(uint256 => address) public lockerOf;
    
    event LiquidityCreated(address token0, address token1, uint256 tokenId, uint256 multiplier);
    event LiquidityLocked(uint256 tokenId, uint256 unlockTime);
    
    constructor(address _positionManager, address _weth) Ownable(msg.sender) {
        positionManager = INonfungiblePositionManager(_positionManager);
        weth = IWETH(_weth);
    }
    
    // Main function broken into smaller functions to avoid stack too deep
    function createLiquidityPool(
        address tokenA,
        address tokenB,
        uint24 fee,
        int24 tickLower,
        int24 tickUpper,
        uint256 amountA,
        uint256 amountB,
        uint256 lockDuration
    ) external payable returns (uint256 tokenId) {
        // Create memory struct for temporary variables
        PoolCreationVars memory vars = PoolCreationVars({
            token0: address(0),
            token1: address(0),
            amount0Desired: 0,
            amount1Desired: 0,
            pool: address(0),
            tokenId: 0,
            isToken0Weth: false,
            isToken1Weth: false
        });
        
        // Step 1: Sort tokens and handle ETH conversion
        _prepareTokensAndAmounts(vars, tokenA, tokenB, amountA, amountB);
        
        // Step 2: Initialize pool if needed
        _initializePoolIfNeeded(vars, fee);
        
        // Step 3: Transfer tokens to this contract and approve for position manager
        _transferAndApproveTokens(vars);
        
        // Step 4: Create the position
        vars.tokenId = _mintPosition(vars, fee, tickLower, tickUpper);
        
        // Step 5: Handle locking if needed
        _handleLocking(vars.tokenId, lockDuration);
        
        return vars.tokenId;
    }
    
    // Helper function 1: Sort tokens and prepare amounts - using memory
    function _prepareTokensAndAmounts(
        PoolCreationVars memory vars,
        address tokenA, 
        address tokenB, 
        uint256 amountA, 
        uint256 amountB
    ) private {
        // Handle ETH conversion if needed
        if (msg.value > 0) {
            require(tokenA == address(weth) || tokenB == address(weth), "ETH only for WETH pairs");
            weth.deposit{value: msg.value}();
            
            // Adjust amounts if we received more ETH than needed
            if (tokenA == address(weth) && msg.value > amountA) {
                amountA = msg.value;
            }
            if (tokenB == address(weth) && msg.value > amountB) {
                amountB = msg.value;
            }
        }
        
        // Determine token order and store in memory struct
        if (tokenA < tokenB) {
            vars.token0 = tokenA;
            vars.token1 = tokenB;
            vars.isToken0Weth = (tokenA == address(weth));
            vars.isToken1Weth = (tokenB == address(weth));
        } else {
            vars.token0 = tokenB;
            vars.token1 = tokenA;
            vars.isToken0Weth = (tokenB == address(weth));
            vars.isToken1Weth = (tokenA == address(weth));
        }
        
        // Set amounts based on token order
        if (vars.token0 == tokenA) {
            vars.amount0Desired = amountA;
            vars.amount1Desired = amountB;
        } else {
            vars.amount0Desired = amountB;
            vars.amount1Desired = amountA;
        }
    }
    
    // Helper function 2: Initialize pool if needed - using memory
    function _initializePoolIfNeeded(PoolCreationVars memory vars, uint24 fee) private {
        vars.pool = IUniswapV3Factory(positionManager.factory()).getPool(
            vars.token0, 
            vars.token1, 
            fee
        );
        
        if (vars.pool == address(0)) {
            // Create memory struct for pool initialization variables
            PoolInitVars memory initVars = PoolInitVars({
                token0Decimals: 0,
                token1Decimals: 0,
                sqrtPriceX96: 0
            });
            
            // Get token decimals
            initVars.token0Decimals = IERC20Metadata(vars.token0).decimals();
            initVars.token1Decimals = IERC20Metadata(vars.token1).decimals();
            
            // Calculate sqrtPriceX96 based on token decimals
            _calculateSqrtPrice(initVars);
            
            // Create and initialize the pool
            positionManager.createAndInitializePoolIfNecessary(
                vars.token0,
                vars.token1,
                fee,
                initVars.sqrtPriceX96
            );
        }
    }
    
    // UPDATED: Transfer tokens to this contract first, then approve Position Manager
    function _transferAndApproveTokens(PoolCreationVars memory vars) private {
        // For token0: If not WETH or if no ETH was sent, transfer from user
        if (!vars.isToken0Weth || msg.value == 0) {
            // Transfer token0 from sender to this contract
            require(
                IERC20(vars.token0).transfer(address(this), vars.amount0Desired),
                "Transfer of token0 failed"
            );
        }
        
        // For token1: If not WETH or if no ETH was sent, transfer from user
        if (!vars.isToken1Weth || msg.value == 0) {
            // Transfer token1 from sender to this contract
            require(
                IERC20(vars.token1).transfer(address(this), vars.amount1Desired),
                "Transfer of token1 failed"
            );
        }
        
        // Now that tokens are in this contract, approve the position manager
        IERC20(vars.token0).approve(address(positionManager), vars.amount0Desired);
        IERC20(vars.token1).approve(address(positionManager), vars.amount1Desired);
    }
    
    // Helper function to calculate sqrt price - reduces stack usage
    function _calculateSqrtPrice(PoolInitVars memory initVars) private pure {
        if (initVars.token0Decimals == initVars.token1Decimals) {
            // 1:1 ratio (Q64.96 format)
            initVars.sqrtPriceX96 = 79228162514264337593543950336; // 2^96
        } else if (initVars.token0Decimals > initVars.token1Decimals) {
            // Adjust for decimal difference
            uint8 decimalDiff = initVars.token0Decimals - initVars.token1Decimals;
            initVars.sqrtPriceX96 = uint160(79228162514264337593543950336 * 10**(decimalDiff / 2));
        } else {
            // Adjust for decimal difference
            uint8 decimalDiff = initVars.token1Decimals - initVars.token0Decimals;
            initVars.sqrtPriceX96 = uint160(79228162514264337593543950336 / 10**(decimalDiff / 2));
        }
    }
    
    // Helper function 3: Mint the position - using memory
    function _mintPosition(
        PoolCreationVars memory vars,
        uint24 fee,
        int24 tickLower,
        int24 tickUpper
    ) private returns (uint256 tokenId) {
        // Prepare mint params
        INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
            token0: vars.token0,
            token1: vars.token1,
            fee: fee,
            tickLower: tickLower,
            tickUpper: tickUpper,
            amount0Desired: vars.amount0Desired,
            amount1Desired: vars.amount1Desired,
            amount0Min: 0,  // Could set minimum amounts based on slippage tolerance
            amount1Min: 0,  // Could set minimum amounts based on slippage tolerance
            recipient: address(this),
            deadline: block.timestamp + 300
        });
        
        // Mint NFT representing liquidity position
        (tokenId, , , ) = positionManager.mint(params);
        
        emit LiquidityCreated(vars.token0, vars.token1, tokenId, 1);
        
        return tokenId;
    }
    
    // Helper function 4: Handle locking
    function _handleLocking(uint256 tokenId, uint256 lockDuration) private {
        // Lock liquidity if duration is specified
        if (lockDuration > 0) {
            liquidityLocks[tokenId] = LockInfo({
                tokenId: tokenId,
                unlockTime: block.timestamp + lockDuration
            });
            lockerOf[tokenId] = msg.sender;
            
            emit LiquidityLocked(tokenId, block.timestamp + lockDuration);
        } else {
            // Transfer NFT back to sender
            positionManager.transferFrom(address(this), msg.sender, tokenId);
        }
    }

    // Function to unlock liquidity after the lock duration
    function unlockLiquidity(uint256 tokenId) external {
        LockInfo storage lockInfo = liquidityLocks[tokenId];
        require(lockInfo.unlockTime > 0, "Liquidity not locked");
        require(block.timestamp >= lockInfo.unlockTime, "Liquidity still locked");
        require(lockerOf[tokenId] == msg.sender, "Not the locker");
        
        // Transfer NFT back to sender
        positionManager.transferFrom(address(this), msg.sender, tokenId);
        
        // Clear lock info
        delete liquidityLocks[tokenId];
        delete lockerOf[tokenId];
    }
    
    // Handle received ETH
    receive() external payable {}
}