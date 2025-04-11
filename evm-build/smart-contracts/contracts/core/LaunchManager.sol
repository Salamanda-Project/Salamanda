// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TokenFactory.sol";
import "../extensions/LiquidityManager.sol";
import "../interfaces/IToken.sol";

contract LaunchManager {
    TokenFactory public tokenFactory;
    address payable public liquidityManagerAddress;
    
    uint256 public launchFee;
    address public feeCollector;

    mapping(address => bytes32) public launchCommits;
    
    struct LaunchParams {
        string name;
        string symbol;
        uint8 decimals;
        uint256 totalSupply;
        address[4] initialHolders;
        uint256[4] initialAmounts;
        bool enableAntiBot;
        uint256 maxTxAmount;
        uint256 maxWalletAmount;
        address pairWith;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 liquidityAmount;
        uint256 pairAmount;
        uint256 lockDuration;
    }
    
    event LaunchCompleted(address indexed tokenAddress, uint256 indexed liquidityTokenId);
    
    constructor(
        address _tokenFactory,
        address payable _liquidityManager,
        address _feeCollector,
        uint256 _launchFee
    ) {
        tokenFactory = TokenFactory(_tokenFactory);
        liquidityManagerAddress = _liquidityManager;
        feeCollector = _feeCollector;
        launchFee = _launchFee;
    }

    function commitLaunch(bytes32 hash) external {
        launchCommits[msg.sender] = hash;
    }
    
    function instantLaunch(LaunchParams calldata params, bytes32 salt) external payable {
        require(msg.value >= launchFee + params.pairAmount, "Insufficient ETH");

        require(
            launchCommits[msg.sender] == keccak256(abi.encode(params, salt)),
            "Invalid commit"
        );
        delete launchCommits[msg.sender];
    
        // Deduct fees first
        uint256 operationCost = launchFee + params.pairAmount;
        (bool sent, ) = feeCollector.call{value: launchFee}("");
        require(sent, "Fee transfer failed");
        
        // Create token with remaining ETH
        address tokenAddress = _createToken(params);
        
        // Create liquidity with designated amount
        uint256 liquidityTokenId = _createLiquidity(tokenAddress, params);
        
        // Refund any excess (now safe after all operations)
        if (address(this).balance > 0) {
            (bool refunded, ) = msg.sender.call{value: address(this).balance}("");
            require(refunded, "Refund failed");
        }

        emit LaunchCompleted(tokenAddress, liquidityTokenId);
    }

    function _createToken(LaunchParams calldata params) private returns (address) {
        return tokenFactory.createToken{value: msg.value}(
            params.name,
            params.symbol,
            params.decimals,
            params.totalSupply,
            params.initialHolders,
            params.initialAmounts,
            params.enableAntiBot,
            params.maxTxAmount,
            params.maxWalletAmount
        );
    }

    function _createLiquidity(address tokenAddress, LaunchParams calldata params) private returns (uint256) {
        LiquidityManager liquidityManager = LiquidityManager(liquidityManagerAddress);
        return liquidityManager.createLiquidityPool{value: params.pairAmount}(
            tokenAddress,
            params.pairWith,
            params.fee,
            params.tickLower,
            params.tickUpper,
            params.liquidityAmount,
            params.pairAmount,
            params.lockDuration
        );
    }
}