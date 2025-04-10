const TokenCreationService = require('../../services/token-service/index');
const { successResponse, errorResponse } = require('../../utils/errors');

class TokenCreationController {
  /**
   * Create a new token
   * @route POST /api/tokens
   */
  async createToken(req, res) {
    try {
      const tokenData = req.body;
      
      // Use authenticated user's address as creator if not provided
      tokenData.creator = tokenData.creator || req.user.address;

      const createdToken = await TokenCreationService.createToken(tokenData);
      return successResponse(res, createdToken, 201);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  /**
   * Get token by ID
   * @route GET /api/tokens/:id
   */
  async getTokenById(req, res) {
    try {
      const { id } = req.params;
      const token = await TokenCreationService.getTokenById(id);
      return successResponse(res, token);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  /**
   * Get tokens by creator
   * @route GET /api/tokens/creator/:creatorAddress
   */
  async getTokensByCreator(req, res) {
    try {
      const { creatorAddress } = req.params;
      const tokens = await TokenCreationService.getTokensByCreator(creatorAddress);
      return successResponse(res, tokens);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  /**
   * Update token status
   * @route PATCH /api/tokens/:id/status
   */
  async updateTokenStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedToken = await TokenCreationService.updateTokenStatus(id, status);
      return successResponse(res, updatedToken);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  /**
   * Update token transaction hash
   * @route PATCH /api/tokens/:id/transaction
   */
  async updateTokenTransactionHash(req, res) {
    try {
      const { id } = req.params;
      const { transactionHash } = req.body;
      const updatedToken = await TokenCreationService.updateTokenTransactionHash(id, transactionHash);
      return successResponse(res, updatedToken);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  /**
   * Delete a token
   * @route DELETE /api/tokens/:id
   */
  async deleteToken(req, res) {
    try {
      const { id } = req.params;
      await TokenCreationService.deleteToken(id);
      return successResponse(res, { message: 'Token deleted successfully' });
    } catch (error) {
      return errorResponse(res, error);
    }
  }
}

module.exports = new TokenCreationController();