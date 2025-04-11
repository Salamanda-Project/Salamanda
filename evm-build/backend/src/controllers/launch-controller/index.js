const TokenLaunchService = require('../../services/launch-service/index');
const { ValidationError } = require('../../utils/errors');

class TokenLaunchController {
  /**
   * Create a new token launch
   * @route POST /api/token-launches
   */
  async createTokenLaunch(req, res) {
    try {
      const launchData = req.body;
      
      // You might want to add authentication middleware to set the creator
      // For now, we'll assume creator comes from the request body
      const newTokenLaunch = await TokenLaunchService.createTokenLaunch(launchData);
      
      res.status(201).json({
        message: 'Token launch created successfully',
        tokenLaunch: newTokenLaunch
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          message: 'Validation Error',
          error: error.message
        });
      }
      
      console.error('Token launch creation error:', error);
      res.status(500).json({
        message: 'Failed to create token launch',
        error: error.message
      });
    }
  }

  /**
   * Get token launch by ID
   * @route GET /api/token-launches/:id
   */
  async getTokenLaunchById(req, res) {
    try {
      const { id } = req.params;
      const tokenLaunch = await TokenLaunchService.getTokenLaunchById(id);
      
      res.status(200).json(tokenLaunch);
    } catch (error) {
      res.status(404).json({
        message: 'Token launch not found',
        error: error.message
      });
    }
  }

  /**
   * Get token launches by creator
   * @route GET /api/token-launches/creator/:creator
   */
  async getTokenLaunchesByCreator(req, res) {
    try {
      const { creator } = req.params;
      const tokenLaunches = await TokenLaunchService.getTokenLaunchesByCreator(creator);
      
      res.status(200).json(tokenLaunches);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to retrieve token launches',
        error: error.message
      });
    }
  }

  /**
   * Update token launch status
   * @route PATCH /api/token-launches/:id/status
   */
  async updateTokenLaunchStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const updatedTokenLaunch = await TokenLaunchService.updateTokenLaunchStatus(id, status);
      
      res.status(200).json({
        message: 'Token launch status updated successfully',
        tokenLaunch: updatedTokenLaunch
      });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to update token launch status',
        error: error.message
      });
    }
  }

  /**
   * Delete a token launch
   * @route DELETE /api/token-launches/:id
   */
  async deleteTokenLaunch(req, res) {
    try {
      const { id } = req.params;
      await TokenLaunchService.deleteTokenLaunch(id);
      
      res.status(200).json({
        message: 'Token launch deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to delete token launch',
        error: error.message
      });
    }
  }

  /**
   * Get token launches by status
   * @route GET /api/token-launches/status/:status
   */
  async getTokenLaunchesByStatus(req, res) {
    try {
      const { status } = req.params;
      const tokenLaunches = await TokenLaunchService.getTokenLaunchesByStatus(status);
      
      res.status(200).json(tokenLaunches);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to retrieve token launches by status',
        error: error.message
      });
    }
  }

  /**
   * Get total number of token launches
   * @route GET /api/token-launches/count
   */
  async getTotalTokenLaunchCount(req, res) {
    try {
      const totalCount = await TokenLaunchService.getTotalTokenLaunchCount();
      
      res.status(200).json({
        totalTokenLaunches: totalCount
      });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to retrieve token launch count',
        error: error.message
      });
    }
  }
}

module.exports = new TokenLaunchController();