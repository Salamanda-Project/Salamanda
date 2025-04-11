const { TokenCreationModel } = require('../../models/token-model/index');
const { ValidationError } = require('../../utils/errors');

class TokenCreationService {
  /**
   * Create a new token creation
   * @param {Object} tokenData - Data for token creation
   * @returns {Promise<Object>} Created token
   */
  async createToken(tokenData) {
    // Validate required fields
    this.validateTokenData(tokenData);

    try {
      // Ensure token address is unique
      const existingToken = await TokenCreationModel.findByTokenAddress(tokenData.tokenAddress);
      if (existingToken) {
        throw new ValidationError('Token address already exists');
      }

      // Create token
      const createdToken = await TokenCreationModel.create(tokenData);
      return createdToken;
    } catch (error) {
      throw this.handleServiceError(error);
    }
  }

  /**
   * Get token creation by ID
   * @param {string} id - Token creation ID
   * @returns {Promise<Object>} Token creation
   */
  async getTokenById(id) {
    try {
      const token = await TokenCreationModel.findById(id);
      if (!token) {
        throw new ValidationError('Token not found');
      }
      return token;
    } catch (error) {
      throw this.handleServiceError(error);
    }
  }

  /**
   * Get tokens created by a specific creator
   * @param {string} creator - Creator address
   * @returns {Promise<Array>} List of tokens
   */
  async getTokensByCreator(creator) {
    try {
      return await TokenCreationModel.findByCreator(creator);
    } catch (error) {
      throw this.handleServiceError(error);
    }
  }

  /**
   * Update token creation status
   * @param {string} id - Token creation ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated token
   */
  async updateTokenStatus(id, status) {
    try {
      const updatedToken = await TokenCreationModel.updateStatus(id, status);
      if (!updatedToken) {
        throw new ValidationError('Token not found');
      }
      return updatedToken;
    } catch (error) {
      throw this.handleServiceError(error);
    }
  }

  /**
   * Update token transaction hash
   * @param {string} id - Token creation ID
   * @param {string} transactionHash - Transaction hash
   * @returns {Promise<Object>} Updated token
   */
  async updateTokenTransactionHash(id, transactionHash) {
    try {
      const updatedToken = await TokenCreationModel.updateTransactionHash(id, transactionHash);
      if (!updatedToken) {
        throw new ValidationError('Token not found');
      }
      return updatedToken;
    } catch (error) {
      throw this.handleServiceError(error);
    }
  }

  /**
   * Delete a token creation
   * @param {string} id - Token creation ID
   */
  async deleteToken(id) {
    try {
      await TokenCreationModel.deleteById(id);
    } catch (error) {
      throw this.handleServiceError(error);
    }
  }

  /**
   * Validate token creation data
   * @param {Object} tokenData - Data to validate
   * @throws {ValidationError} If data is invalid
   */
  validateTokenData(tokenData) {
    const requiredFields = [
      'creator', 
      'tokenAddress', 
      'name', 
      'symbol', 
      'decimals', 
      'totalSupply', 
      'initialHolders'
    ];

    // Check for missing required fields
    for (const field of requiredFields) {
      if (!tokenData[field]) {
        throw new ValidationError(`Missing required field: ${field}`);
      }
    }

    // Additional validations
    if (tokenData.decimals < 0 || tokenData.decimals > 18) {
      throw new ValidationError('Decimals must be between 0 and 18');
    }

    if (tokenData.totalSupply <= 0) {
      throw new ValidationError('Total supply must be greater than 0');
    }

    if (!Array.isArray(tokenData.initialHolders) || tokenData.initialHolders.length === 0) {
      throw new ValidationError('Initial holders must be a non-empty array');
    }
  }

  /**
   * Handle service errors
   * @param {Error} error - Original error
   * @returns {Error} Processed error
   */
  handleServiceError(error) {
    if (error instanceof ValidationError) {
      return error;
    }
    console.error('Token Creation Service Error:', error);
    return new Error('An unexpected error occurred in Token Creation Service');
  }
}

module.exports = new TokenCreationService();