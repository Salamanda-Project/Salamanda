const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { TokenCreationSchema } = require('../token-model/index')
const { LiquidityPoolCreationSchema } = require('../liquidity-model/index')
const { TokenLaunchStatus } = require('../../utils/constants')

/**
 * Token Launch Schema
 * @type {mongoose.Schema}
 */
const TokenLaunchSchema = new mongoose.Schema({
    id: { type: String, default: uuidv4, unique: true },
    creator: { type: String, required: true },
    tokenCreation: { 
      type: TokenCreationSchema, 
      required: true 
    },
    liquidityPoolCreation: { 
      type: LiquidityPoolCreationSchema, 
      required: true 
    },
    launchFee: { type: Number, required: true },
    totalRaised: { type: Number },
    launchDate: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: Object.values(TokenLaunchStatus),
      default: TokenLaunchStatus.PENDING 
    },
    metadata: { type: mongoose.Schema.Types.Mixed }
  });

const TokenLaunch = mongoose.model('TokenLaunch', TokenLaunchSchema);

const TokenLaunchModel = {
    // Create a new token launch
    create: async function(launchData) {
      const launch = new TokenLaunch({
        ...launchData,
        launchDate: new Date()
      });
      
      return await launch.save();
    },
  
    // Find launch by ID
    findById: async function(id) {
      return await TokenLaunch.findById(id);
    },
  
    // Find launches by creator
    findByCreator: async function(creator) {
      return await TokenLaunch.find({ creator });
    },
  
    // Update launch status
    updateStatus: async function(id, status) {
      return await TokenLaunch.findByIdAndUpdate(
        id, 
        { status }, 
        { new: true }
      );
    },
  
    // Delete a launch (use with caution)
    deleteById: async function(id) {
      await TokenLaunch.findByIdAndDelete(id);
    },
  
    // Optional: Find launches by status
    findByStatus: async function(status) {
      return await TokenLaunch.find({ status });
    },
  
    // Optional: Get total number of launches
    getTotalLaunchCount: async function() {
      return await TokenLaunch.countDocuments();
    }
  };
  
  module.exports = { TokenLaunch, TokenLaunchModel, TokenLaunchSchema };