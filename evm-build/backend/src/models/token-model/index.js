const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { TokenLaunchStatus } = require('../../utils/constants');

/**
 * Token Creation Schema
 * @type {mongoose.Schema}
 */
const TokenCreationSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true },
    creator: { type: String, required: true },
    tokenAddress: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    decimals: { type: Number, required: true },
    totalSupply: { type: Number, required: true },
    initialHolders: [{
      address: { type: String, required: true },
      amount: { type: Number, required: true }
    }],
    antiBotEnabled: { type: Boolean, default: true },
    maxTxAmount: { type: Number },
    maxWalletAmount: { type: Number },
    createdAt: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: Object.values(TokenLaunchStatus),
      default: TokenLaunchStatus.PENDING 
    },
    transactionHash: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed }
  });

const TokenCreation = mongoose.model('TokenCreation', TokenCreationSchema);


/**
 * Token Creation Model Methods
 * @type {Object}
 */
const TokenCreationModel = {
    /**
     * Create a new token creation record
     * @param {Object} tokenData - Token creation data
     * @returns {Promise<Object>} Created token creation
     */
    create: async (tokenData) => {
      const tokenCreation = new TokenCreation({
        ...tokenData,
        id: uuidv4(),
        createdAt: new Date()
      });
      return await tokenCreation.save();
    },
  
    /**
     * Find token creation by ID
     * @param {string} id - Token creation ID
     * @returns {Promise<Object|null>} Token creation or null
     */
    findById: async (id) => {
      return await TokenCreation.findById(id);
    },
  
    /**
     * Find token creations by creator
     * @param {string} creator - Creator address
     * @returns {Promise<Array>} Array of token creations
     */
    findByCreator: async (creator) => {
      return await TokenCreation.find({ creator });
    },
  
    /**
     * Find token creation by token address
     * @param {string} tokenAddress - Token address
     * @returns {Promise<Object|null>} Token creation or null
     */
    findByTokenAddress: async (tokenAddress) => {
      return await TokenCreation.findOne({ tokenAddress });
    },
  
    /**
     * Update token creation status
     * @param {string} id - Token creation ID
     * @param {TokenLaunchStatus} status - New status
     * @returns {Promise<Object|null>} Updated token creation or null
     */
    updateStatus: async (id, status) => {
      return await TokenCreation.findByIdAndUpdate(
        id, 
        { status }, 
        { new: true }
      );
    },
  
    /**
     * Update token creation transaction hash
     * @param {string} id - Token creation ID
     * @param {string} transactionHash - Transaction hash
     * @returns {Promise<Object|null>} Updated token creation or null
     */
    updateTransactionHash: async (id, transactionHash) => {
      return await TokenCreation.findByIdAndUpdate(
        id, 
        { 
          transactionHash, 
          status: TokenLaunchStatus.CREATED 
        }, 
        { new: true }
      );
    },
  
    /**
     * Delete a token creation record
     * @param {string} id - Token creation ID
     * @returns {Promise<void>}
     */
    deleteById: async (id) => {
      await TokenCreation.findByIdAndDelete(id);
    },
  
    /**
     * Find tokens by multiple criteria
     * @param {Object} criteria - Search criteria
     * @returns {Promise<Array>} Array of matching token creations
     */
    findByCriteria: async (criteria) => {
      return await TokenCreation.find(criteria);
    }
  };

  
module.exports = {
    TokenCreation,
    TokenCreationModel,
    TokenCreationSchema
}