// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../extensions/AntiBot.sol";
import "../utils/SecurityUtils.sol";

contract TokenTemplate is ERC20, Ownable {
    using AntiBot for AntiBot.AntiBotConfig;
    using SecurityUtils for SecurityUtils.SecuritySettings;

    bool public tradingEnabled;
    uint256 public launchTime;
    uint256 public launchBlock;
    
    // Flag to track initial distribution status
    bool private _initialDistributionComplete;
    
    AntiBot.AntiBotConfig private _antiBotConfig;
    SecurityUtils.SecuritySettings private _securitySettings;
    
    mapping(address => bool) public isExcludedFromLimits;

    event TradingEnabled(uint256 timestamp);
    event AntiBotConfigUpdated(bool enabled, uint256 maxTxAmount, uint256 maxWalletAmount);
    event SecuritySettingsUpdated(bool paused);
    event ContractStatusChanged(address indexed contractAddr, bool trusted, bool blocked);
    event InitialDistributionComplete();
    
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 totalSupply,
        address _initialOwner,
        address[4] memory initialHolders,
        uint256[4] memory initialAmounts,
        bool enableAntiBot,
        uint256 maxTxAmount,
        uint256 maxWalletAmount
    ) ERC20(name, symbol) Ownable(_initialOwner) {
        require(initialHolders.length == initialAmounts.length, "Arrays length mismatch");
        
        _securitySettings.initialize();  // Initialize with minimal defaults
        
        // Mint tokens to the contract creator (TokenFactory)
        _mint(msg.sender, totalSupply * (10 ** decimals));
        
        // Perform initial distributions without trading check
        _initialDistributionComplete = false;
        for (uint i = 0; i < initialHolders.length; i++) {
            if (initialHolders[i] != address(0) && initialAmounts[i] > 0) {
                _transfer(msg.sender, initialHolders[i], initialAmounts[i]);
            }
        }
        _initialDistributionComplete = true;
        emit InitialDistributionComplete();
        
        // Setup anti-bot config (disabled by default)
        _antiBotConfig.initialize(
            maxTxAmount > 0 ? maxTxAmount : totalSupply * 10 / 100,
            maxWalletAmount > 0 ? maxWalletAmount : totalSupply * 20 / 100
        );
        
        // Exclude owner from limits
        isExcludedFromLimits[owner()] = true;
    }
    
    function enableTrading() external onlyOwner {
        require(!tradingEnabled, "Trading already enabled");
        tradingEnabled = true;
        launchTime = block.timestamp;
        launchBlock = block.number;
        emit TradingEnabled(launchTime);
    }
    
    function setAntiBotEnabled(bool enabled) external onlyOwner {
        _antiBotConfig.enabled = enabled;
        emit AntiBotConfigUpdated(enabled, _antiBotConfig.maxTxAmount, _antiBotConfig.maxWalletAmount);
    }
    
    function setMaxTxAmount(uint256 amount) external onlyOwner {
        _antiBotConfig.maxTxAmount = amount;
        emit AntiBotConfigUpdated(_antiBotConfig.enabled, amount, _antiBotConfig.maxWalletAmount);
    }
    
    function setMaxWalletAmount(uint256 amount) external onlyOwner {
        _antiBotConfig.maxWalletAmount = amount;
        emit AntiBotConfigUpdated(_antiBotConfig.enabled, _antiBotConfig.maxTxAmount, amount);
    }
    
    function excludeFromLimits(address account, bool excluded) external onlyOwner {
        isExcludedFromLimits[account] = excluded;
    }
    
    function updatePauseStatus(bool paused) external onlyOwner {
        _securitySettings.setPaused(paused);
        emit SecuritySettingsUpdated(paused);
    }

    function setContractStatus(
        address contractAddr,
        bool trusted,
        bool blocked
    ) external onlyOwner {
        _securitySettings.setContractStatus(contractAddr, trusted, blocked);
        emit ContractStatusChanged(contractAddr, trusted, blocked);
    }

    function _update(address from, address to, uint256 amount) internal override {
        // Skip all checks for:
        // 1. Owner operations
        // 2. Excluded addresses
        // 3. Initial distribution process
        if (from == owner() || 
            to == owner() || 
            isExcludedFromLimits[from] || 
            isExcludedFromLimits[to] ||
            !_initialDistributionComplete) {
            super._update(from, to, amount);
            return;
        }

        // Simple security check
        require(!_securitySettings.paused, "Transfers paused");
        
        // Only check trading if not excluded
        require(tradingEnabled, "Trading not enabled");

        // Apply anti-bot measures only if enabled
        if (_antiBotConfig.enabled) {
            _antiBotConfig.applyAntiBotLimits(
                address(this),
                from,
                to,
                amount,
                balanceOf(to),
                launchTime,
                launchBlock
            );
        }
        
        // Call the parent function to proceed with the transfer
        super._update(from, to, amount);
    }
    
    // Add helper function to exclude liquidity manager from all restrictions
    function whitelistLiquidityManager(address manager) external onlyOwner {
        isExcludedFromLimits[manager] = true;
        _securitySettings.setContractStatus(manager, true, false);
        emit ContractStatusChanged(manager, true, false);
    }
}