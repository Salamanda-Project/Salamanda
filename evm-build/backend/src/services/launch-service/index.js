const { TokenLaunchModel } = require('../../models/launch-model');
const { ValidationError } = require('../utils/errors');

class TokenLaunchService {
  /**
   * Create a new token launch
   * @param {Object} launchData - Data for token launch creation
   * @returns {Promise<Object>} Created token launch
   */
  async createTokenLaunch(launchData) {
    try {
      // Validate required fields
      if (!launchData.creator) {
        throw new ValidationError('Creator is required');
      }
      if (!launchData.tokenCreation) {
        throw new ValidationError('Token creation details are required');
      }
      if (!launchData.liquidityPoolCreation) {
        throw new ValidationError('Liquidity pool creation details are required');
      }
      if (!launchData.launchFee) {
        throw new ValidationError('Launch fee is required');
      }

      // Additional business logic validation could be added here
      // For example, checking creator's eligibility, fee validation, etc.

      return await TokenLaunchModel.create(launchData);
    } catch (error) {
      // Log the error for internal tracking
      console.error('Error creating token launch:', error);
      
      // Rethrow or transform error for consistent error handling
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error('Failed to create token launch');
    }
  }

  /**
   * Get token launch by ID
   * @param {string} id - Token launch ID
   * @returns {Promise<Object>} Token launch details
   */
  async getTokenLaunchById(id) {
    const launch = await TokenLaunchModel.findById(id);
    if (!launch) {
      throw new Error('Token launch not found');
    }
    return launch;
  }

  /**
   * Get token launches by creator
   * @param {string} creator - Creator's identifier
   * @returns {Promise<Array>} List of token launches
   */
  async getTokenLaunchesByCreator(creator) {
    return await TokenLaunchModel.findByCreator(creator);
  }

  /**
   * Update token launch status
   * @param {string} id - Token launch ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated token launch
   */
  async updateTokenLaunchStatus(id, status) {
    try {
      const updatedLaunch = await TokenLaunchModel.updateStatus(id, status);
      
      if (!updatedLaunch) {
        throw new Error('Token launch not found');
      }

      return updatedLaunch;
    } catch (error) {
      console.error('Error updating token launch status:', error);
      throw new Error('Failed to update token launch status');
    }
  }

  /**
   * Delete a token launch
   * @param {string} id - Token launch ID
   */
  async deleteTokenLaunch(id) {
    try {
      await TokenLaunchModel.deleteById(id);
    } catch (error) {
      console.error('Error deleting token launch:', error);
      throw new Error('Failed to delete token launch');
    }
  }

  /**
   * Get token launches by status
   * @param {string} status - Token launch status
   * @returns {Promise<Array>} List of token launches
   */
  async getTokenLaunchesByStatus(status) {
    return await TokenLaunchModel.findByStatus(status);
  }

  /**
   * Get total number of token launches
   * @returns {Promise<number>} Total number of launches
   */
  async getTotalTokenLaunchCount() {
    return await TokenLaunchModel.getTotalLaunchCount();
  }
}

module.exports = new TokenLaunchService();