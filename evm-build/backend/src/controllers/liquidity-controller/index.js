const LiquidityPoolCreationService = require('../services/liquidityPoolCreationService');
const { ValidationError } = require('../../utils/errors');

class LiquidityPoolCreationController {
  /**
   * Create a new liquidity pool creation record
   * @route POST /api/liquidity-pools
   */
  async createLiquidityPoolCreation(req, res) {
    try {
      const poolData = req.body;
      
      const newLiquidityPoolCreation = await LiquidityPoolCreationService.createLiquidityPoolCreation(poolData);
      
      res.status(201).json({
        message: 'Liquidity pool creation record created successfully',
        liquidityPoolCreation: newLiquidityPoolCreation
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          message: 'Validation Error',
          error: error.message
        });
      }
      
      console.error('Liquidity pool creation error:', error);
      res.status(500).json({
        message: 'Failed to create liquidity pool creation record',
        error: error.message
      });
    }
  }

  /**
   * Get liquidity pool creation by ID
   * @route GET /api/liquidity-pools/:id
   */
  async getLiquidityPoolCreationById(req, res) {
    try {
      const { id } = req.params;
      const liquidityPoolCreation = await LiquidityPoolCreationService.getLiquidityPoolCreationById(id);
      
      res.status(200).json(liquidityPoolCreation);
    } catch (error) {
      res.status(404).json({
        message: 'Liquidity pool creation not found',
        error: error.message
      });
    }
  }

  /**
   * Get liquidity pool creations by token address
   * @route GET /api/liquidity-pools/token/:tokenAddress
   */
  async getLiquidityPoolCreationsByTokenAddress(req, res) {
    try {
      const { tokenAddress } = req.params;
      const liquidityPoolCreations = await LiquidityPoolCreationService.getLiquidityPoolCreationsByTokenAddress(tokenAddress);
      
      res.status(200).json(liquidityPoolCreations);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to retrieve liquidity pool creations',
        error: error.message
      });
    }
  }

  /**
   * Get liquidity pool creation by pool address
   * @route GET /api/liquidity-pools/pool/:liquidityPoolAddress
   */
  async getLiquidityPoolCreationByPoolAddress(req, res) {
    try {
      const { liquidityPoolAddress } = req.params;
      const liquidityPoolCreation = await LiquidityPoolCreationService.getLiquidityPoolCreationByPoolAddress(liquidityPoolAddress);
      
      res.status(200).json(liquidityPoolCreation);
    } catch (error) {
      res.status(404).json({
        message: 'Liquidity pool creation not found',
        error: error.message
      });
    }
  }

  /**
   * Update liquidity pool creation status
   * @route PATCH /api/liquidity-pools/:id/status
   */
  async updateLiquidityPoolCreationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const updatedLiquidityPoolCreation = await LiquidityPoolCreationService.updateLiquidityPoolCreationStatus(id, status);
      
      res.status(200).json({
        message: 'Liquidity pool creation status updated successfully',
        liquidityPoolCreation: updatedLiquidityPoolCreation
      });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to update liquidity pool creation status',
        error: error.message
      });
    }
  }

  /**
   * Update liquidity pool lock details
   * @route PATCH /api/liquidity-pools/:id/lock
   */
  async updateLiquidityPoolLockDetails(req, res) {
    try {
      const { id } = req.params;
      const { lockDuration, lockedLiquidityAmount, unlockTime } = req.body;
      
      const updatedLiquidityPoolCreation = await LiquidityPoolCreationService.updateLiquidityPoolLockDetails(
        id, 
        lockDuration, 
        lockedLiquidityAmount, 
        unlockTime
      );
      
      res.status(200).json({
        message: 'Liquidity pool lock details updated successfully',
        liquidityPoolCreation: updatedLiquidityPoolCreation
      });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to update liquidity pool lock details',
        error: error.message
      });
    }
  }

  /**
   * Update liquidity pool transaction hash
   * @route PATCH /api/liquidity-pools/:id/transaction
   */
  async updateLiquidityPoolTransactionHash(req, res) {
    try {
      const { id } = req.params;
      const { transactionHash } = req.body;
      
      const updatedLiquidityPoolCreation = await LiquidityPoolCreationService.updateLiquidityPoolTransactionHash(id, transactionHash);
      
      res.status(200).json({
        message: 'Liquidity pool transaction hash updated successfully',
        liquidityPoolCreation: updatedLiquidityPoolCreation
      });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to update liquidity pool transaction hash',
        error: error.message
      });
    }
  }

  /**
   * Delete a liquidity pool creation record
   * @route DELETE /api/liquidity-pools/:id
   */
  async deleteLiquidityPoolCreation(req, res) {
    try {
      const { id } = req.params;
      await LiquidityPoolCreationService.deleteLiquidityPoolCreation(id);
      
      res.status(200).json({
        message: 'Liquidity pool creation deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        message: 'Failed to delete liquidity pool creation',
        error: error.message
      });
    }
  }

  /**
   * Find liquidity pools by multiple criteria
   * @route GET /api/liquidity-pools/search
   */
  async findLiquidityPoolCreationsByCriteria(req, res) {
    try {
      const criteria = req.query;
      const liquidityPoolCreations = await LiquidityPoolCreationService.findLiquidityPoolCreationsByCriteria(criteria);
      
      res.status(200).json(liquidityPoolCreations);
    } catch (error) {
      res.status(500).json({
        message: 'Failed to search liquidity pool creations',
        error: error.message
      });
    }
  }
}

module.exports = new LiquidityPoolCreationController();