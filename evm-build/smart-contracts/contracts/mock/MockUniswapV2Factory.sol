// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockUniswapV2Factory {
    address public feeTo;
    address public feeToSetter;
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;
    
    event PairCreated(address indexed token0, address indexed token1, address pair, uint);
    
    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }
    
    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }
    
    function createPairMock(address tokenA, address tokenB) private returns (address pair) {
        pair = address(uint160(uint(keccak256(abi.encodePacked("pair", tokenA, tokenB)))));
        getPair[tokenA][tokenB] = pair;
        getPair[tokenB][tokenA] = pair; // populate mapping in both directions
        allPairs.push(pair);
        emit PairCreated(tokenA, tokenB, pair, allPairs.length);
    }
    
    function createPair(address tokenA, address tokenB) external returns (address pair) {
        return createPairMock(tokenA, tokenB);
    }
}