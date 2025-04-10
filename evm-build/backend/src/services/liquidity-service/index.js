const { LiquidityPoolCreationModel } = require('../../models/liquidity-model/index');
const { ValidationError } = require('../../utils/errors');

class LiquidityPoolCreationService {
  /**
   * Create a new liquidity pool creation record
   * @param {Object} poolData - Liquidity pool creation data
   * @returns {Promise<Object>} Created liquidity pool creation
   */
  async createLiquidityPoolCreation(poolData) {
    try {
      // Validate required fields
      if (!poolData.tokenAddress) {
        throw new ValidationError('Token address is required');
      }
      if (!poolData.pairToken) {
        throw new ValidationError('Pair token is required');
      }
      if (!poolData.tokenAmount) {
        throw new ValidationError('Token amount is required');
      }
      if (!poolData.pairAmount) {
        throw new ValidationError('Pair amount is required');
      }
      if (!poolData.liquidityPoolAddress) {
        throw new ValidationError('Liquidity pool address is required');
      }

      // Additional business logic validation could be added here
      // For example, checking token amounts, validating addresses, etc.

      return await LiquidityPoolCreationModel.create(poolData);
    } catch (error) {
      // Log the error for internal tracking
      console.error('Error creating liquidity pool creation:', error);
      
      // Rethrow or transform error for consistent error handling
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error('Failed to create liquidity pool creation');
    }
  }

  /**
   * Get liquidity pool creation by ID
   * @param {string} id - Liquidity pool creation ID
   * @returns {Promise<Object>} Liquidity pool creation details
   */
  async getLiquidityPoolCreationById(id) {
    const poolCreation = await LiquidityPoolCreationModel.findById(id);
    if (!poolCreation) {
      throw new Error('Liquidity pool creation not found');
    }
    return poolCreation;
  }

  /**
   * Get liquidity pool creations by token address
   * @param {string} tokenAddress - Token address
   * @returns {Promise<Array>} List of liquidity pool creations
   */
  async getLiquidityPoolCreationsByTokenAddress(tokenAddress) {
    return await LiquidityPoolCreationModel.findByTokenAddress(tokenAddress);
  }

  /**
   * Get liquidity pool creation by pool address
   * @param {string} liquidityPoolAddress - Liquidity pool address
   * @returns {Promise<Object>} Liquidity pool creation details
   */
  async getLiquidityPoolCreationByPoolAddress(liquidityPoolAddress) {
    const poolCreation = await LiquidityPoolCreationModel.findByPoolAddress(liquidityPoolAddress);
    if (!poolCreation) {
      throw new Error('Liquidity pool creation not found');
    }
    return poolCreation;
  }

  /**
   * Update liquidity pool creation status
   * @param {string} id - Liquidity pool creation ID
   * @param {TokenLaunchStatus} status - New status
   * @returns {Promise<Object>} Updated liquidity pool creation
   */
  async updateLiquidityPoolCreationStatus(id, status) {
    try {
      const updatedPoolCreation = await LiquidityPoolCreationModel.updateStatus(id, status);
      
      if (!updatedPoolCreation) {
        throw new Error('Liquidity pool creation not found');
      }

      return updatedPoolCreation;
    } catch (error) {
      console.error('Error updating liquidity pool creation status:', error);
      throw new Error('Failed to update liquidity pool creation status');
    }
  }

  /**
   * Update liquidity pool lock details
   * @param {string} id - Liquidity pool creation ID
   * @param {number} lockDuration - Lock duration
   * @param {number} lockedLiquidityAmount - Locked liquidity amount
   * @param {Date} unlockTime - Unlock time
   * @returns {Promise<Object>} Updated liquidity pool creation
   */
  async updateLiquidityPoolLockDetails(id, lockDuration, lockedLiquidityAmount, unlockTime) {
    try {
      const updatedPoolCreation = await LiquidityPoolCreationModel.updateLockDetails(
        id, 
        lockDuration, 
        lockedLiquidityAmount, 
        unlockTime
      );
      
      if (!updatedPoolCreation) {
        throw new Error('Liquidity pool creation not found');
      }

      return updatedPoolCreation;
    } catch (error) {
      console.error('Error updating liquidity pool lock details:', error);
      throw new Error('Failed to update liquidity pool lock details');
    }
  }

  /**
   * Update liquidity pool transaction hash
   * @param {string} id - Liquidity pool creation ID
   * @param {string} transactionHash - Transaction hash
   * @returns {Promise<Object>} Updated liquidity pool creation
   */
  async updateLiquidityPoolTransactionHash(id, transactionHash) {
    try {
      const updatedPoolCreation = await LiquidityPoolCreationModel.updateTransactionHash(id, transactionHash);
      
      if (!updatedPoolCreation) {
        throw new Error('Liquidity pool creation not found');
      }

      return updatedPoolCreation;
    } catch (error) {
      console.error('Error updating liquidity pool transaction hash:', error);
      throw new Error('Failed to update liquidity pool transaction hash');
    }
  }

  /**
   * Delete a liquidity pool creation record
   * @param {string} id - Liquidity pool creation ID
   */
  async deleteLiquidityPoolCreation(id) {
    try {
      await LiquidityPoolCreationModel.deleteById(id);
    } catch (error) {
      console.error('Error deleting liquidity pool creation:', error);
      throw new Error('Failed to delete liquidity pool creation');
    }
  }

  /**
   * Find liquidity pools by multiple criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Array>} Array of matching liquidity pool creations
   */
  async findLiquidityPoolCreationsByCriteria(criteria) {
    return await LiquidityPoolCreationModel.findByCriteria(criteria);
  }
}

module.exports = new LiquidityPoolCreationService();