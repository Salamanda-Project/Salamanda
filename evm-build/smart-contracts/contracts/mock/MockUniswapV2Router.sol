// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockUniswapV2Router02 {
    address public factory;
    address public WETH;
    
    constructor(address _factory, address _WETH) {
        factory = _factory;
        WETH = _WETH;
    }
    
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity) {
        amountToken = amountTokenDesired;
        amountETH = msg.value;
        liquidity = amountToken * amountETH / 1e18;
        return (amountToken, amountETH, liquidity);
    }
    
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity) {
        amountA = amountADesired;
        amountB = amountBDesired;
        liquidity = amountA * amountB / 1e18;
        return (amountA, amountB, liquidity);
    }
}