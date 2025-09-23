const express = require('express');
const router = express.Router();
const defiManager = require('../modules/defi-manager');
const blockchainManager = require('../modules/blockchain-manager');
const logger = require('../modules/logger');

// Create liquidity pool
router.post('/pool', async (req, res) => {
  try {
    const { tokenA, tokenB, fee, tickSpacing } = req.body;
    
    if (!tokenA || !tokenB) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'TokenA and TokenB are required'
      });
    }

    // Set provider from blockchain manager
    defiManager.setProvider(blockchainManager.ethersProvider, blockchainManager.signer);

    const result = await defiManager.createLiquidityPool(tokenA, tokenB, fee, tickSpacing);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to create liquidity pool:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to create liquidity pool',
      message: error.message
    });
  }
});

// Add liquidity
router.post('/pool/:poolId/liquidity', async (req, res) => {
  try {
    const { poolId } = req.params;
    const { amountA, amountB, userAddress } = req.body;
    
    if (!poolId || amountA === undefined || amountB === undefined || !userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'PoolId, amountA, amountB, and userAddress are required'
      });
    }

    const result = await defiManager.addLiquidity(poolId, amountA, amountB, userAddress);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to add liquidity to pool ${req.params.poolId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to add liquidity',
      message: error.message
    });
  }
});

// Remove liquidity
router.post('/position/:positionId/remove', async (req, res) => {
  try {
    const { positionId } = req.params;
    const { userAddress } = req.body;
    
    if (!positionId || !userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'PositionId and userAddress are required'
      });
    }

    const result = await defiManager.removeLiquidity(positionId, userAddress);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to remove liquidity from position ${req.params.positionId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove liquidity',
      message: error.message
    });
  }
});

// Swap tokens
router.post('/swap', async (req, res) => {
  try {
    const { tokenIn, tokenOut, amountIn, userAddress, poolId } = req.body;
    
    if (!tokenIn || !tokenOut || amountIn === undefined || !userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'TokenIn, tokenOut, amountIn, and userAddress are required'
      });
    }

    const result = await defiManager.swapTokens(tokenIn, tokenOut, amountIn, userAddress, poolId);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to swap tokens:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to swap tokens',
      message: error.message
    });
  }
});

// Get user positions
router.get('/positions/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;
    
    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'User address is required'
      });
    }

    const result = await defiManager.getUserPositions(userAddress);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to get positions for user ${req.params.userAddress}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user positions',
      message: error.message
    });
  }
});

// Get pool info
router.get('/pool/:poolId', async (req, res) => {
  try {
    const { poolId } = req.params;
    
    if (!poolId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'Pool ID is required'
      });
    }

    const result = await defiManager.getPoolInfo(poolId);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to get pool info for ${req.params.poolId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pool info',
      message: error.message
    });
  }
});

// List pools
router.get('/pools', async (req, res) => {
  try {
    const result = await defiManager.listPools();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Failed to list pools:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list pools',
      message: error.message
    });
  }
});

// Create yield farm
router.post('/farm', async (req, res) => {
  try {
    const { tokenAddress, rewardToken, rewardRate, duration } = req.body;
    
    if (!tokenAddress || !rewardToken || !rewardRate || !duration) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'TokenAddress, rewardToken, rewardRate, and duration are required'
      });
    }

    const result = await defiManager.createYieldFarm(tokenAddress, rewardToken, rewardRate, duration);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to create yield farm:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to create yield farm',
      message: error.message
    });
  }
});

// Stake tokens
router.post('/farm/:farmId/stake', async (req, res) => {
  try {
    const { farmId } = req.params;
    const { amount, userAddress } = req.body;
    
    if (!farmId || amount === undefined || !userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'FarmId, amount, and userAddress are required'
      });
    }

    const result = await defiManager.stakeTokens(farmId, amount, userAddress);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to stake tokens in farm ${req.params.farmId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to stake tokens',
      message: error.message
    });
  }
});

module.exports = router;
