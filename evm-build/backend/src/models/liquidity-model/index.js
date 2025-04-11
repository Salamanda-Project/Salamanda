const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { TokenLaunchStatus } = require('../../utils/constants')

/**
 * Liquidity Pool Creation Schema
 * @type {mongoose.Schema}
 */
const LiquidityPoolCreationSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true },
    tokenAddress: { type: String, required: true },
    pairToken: { type: String, required: true },
    tokenAmount: { type: Number, required: true },
    pairAmount: { type: Number, required: true },
    liquidityPoolAddress: { type: String, required: true, unique: true },
    lockDuration: { type: Number },
    lockedLiquidityAmount: { type: Number },
    unlockTime: { type: Date },
    createdAt: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: Object.values(TokenLaunchStatus),
      default: TokenLaunchStatus.PENDING 
    },
    transactionHash: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed }
  });

const LiquidityPoolCreation = mongoose.model('LiquidityPoolCreation', LiquidityPoolCreationSchema);

/**
 * Liquidity Pool Creation Model Methods
 * @type {Object}
 */
const LiquidityPoolCreationModel = {
    /**
     * Create a new liquidity pool creation record
     * @param {Object} poolData - Liquidity pool creation data
     * @returns {Promise<Object>} Created liquidity pool creation
     */
    create: async (poolData) => {
      const liquidityPoolCreation = new LiquidityPoolCreation({
        ...poolData,
        id: uuidv4(),
        createdAt: new Date()
      });
      return await liquidityPoolCreation.save();
    },
  
    /**
     * Find liquidity pool creation by ID
     * @param {string} id - Liquidity pool creation ID
     * @returns {Promise<Object|null>} Liquidity pool creation or null
     */
    findById: async (id) => {
      return await LiquidityPoolCreation.findById(id);
    },
  
    /**
     * Find liquidity pool creations by token address
     * @param {string} tokenAddress - Token address
     * @returns {Promise<Array>} Array of liquidity pool creations
     */
    findByTokenAddress: async (tokenAddress) => {
      return await LiquidityPoolCreation.find({ tokenAddress });
    },
  
    /**
     * Find liquidity pool creation by pool address
     * @param {string} liquidityPoolAddress - Liquidity pool address
     * @returns {Promise<Object|null>} Liquidity pool creation or null
     */
    findByPoolAddress: async (liquidityPoolAddress) => {
      return await LiquidityPoolCreation.findOne({ liquidityPoolAddress });
    },
  
    /**
     * Update liquidity pool creation status
     * @param {string} id - Liquidity pool creation ID
     * @param {TokenLaunchStatus} status - New status
     * @returns {Promise<Object|null>} Updated liquidity pool creation or null
     */
    updateStatus: async (id, status) => {
      return await LiquidityPoolCreation.findByIdAndUpdate(
        id, 
        { status }, 
        { new: true }
      );
    },
  
    /**
     * Update liquidity pool lock details
     * @param {string} id - Liquidity pool creation ID
     * @param {number} lockDuration - Lock duration
     * @param {number} lockedLiquidityAmount - Locked liquidity amount
     * @param {Date} unlockTime - Unlock time
     * @returns {Promise<Object|null>} Updated liquidity pool creation or null
     */
    updateLockDetails: async (
      id, 
      lockDuration, 
      lockedLiquidityAmount,
      unlockTime
    ) => {
      return await LiquidityPoolCreation.findByIdAndUpdate(
        id, 
        { 
          lockDuration, 
          lockedLiquidityAmount, 
          unlockTime,
          status: TokenLaunchStatus.LIQUIDITY_ADDED
        }, 
        { new: true }
      );
    },
  
    /**
     * Update liquidity pool transaction hash
     * @param {string} id - Liquidity pool creation ID
     * @param {string} transactionHash - Transaction hash
     * @returns {Promise<Object|null>} Updated liquidity pool creation or null
     */
    updateTransactionHash: async (id, transactionHash) => {
      return await LiquidityPoolCreation.findByIdAndUpdate(
        id, 
        { transactionHash }, 
        { new: true }
      );
    },
  
    /**
     * Delete a liquidity pool creation record
     * @param {string} id - Liquidity pool creation ID
     * @returns {Promise<void>}
     */
    deleteById: async (id) => {
      await LiquidityPoolCreation.findByIdAndDelete(id);
    },
  
    /**
     * Find liquidity pools by multiple criteria
     * @param {Object} criteria - Search criteria
     * @returns {Promise<Array>} Array of matching liquidity pool creations
     */
    findByCriteria: async (criteria) => {
      return await LiquidityPoolCreation.find(criteria);
    }
  };
  
  module.exports = {
    LiquidityPoolCreation,
    LiquidityPoolCreationModel,
    LiquidityPoolCreationSchema
  }