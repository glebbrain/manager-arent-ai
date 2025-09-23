const express = require('express');
const router = express.Router();
const blockchainManager = require('../modules/blockchain-manager');
const logger = require('../modules/logger');

// Get network information
router.get('/network', async (req, res) => {
  try {
    const networkInfo = await blockchainManager.getNetworkInfo();
    res.json(networkInfo);
  } catch (error) {
    logger.error('Failed to get network info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get network information',
      message: error.message
    });
  }
});

// Switch network
router.post('/network/switch', async (req, res) => {
  try {
    const { network, chain } = req.body;
    
    if (!network || !chain) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Network and chain are required'
      });
    }

    const result = await blockchainManager.switchNetwork(network, chain);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Failed to switch network:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to switch network',
      message: error.message
    });
  }
});

// Get balance
router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'Address is required'
      });
    }

    const balance = await blockchainManager.getBalance(address);
    res.json({
      success: true,
      ...balance
    });
  } catch (error) {
    logger.error(`Failed to get balance for ${req.params.address}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get balance',
      message: error.message
    });
  }
});

// Get transaction
router.get('/transaction/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    
    if (!txHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'Transaction hash is required'
      });
    }

    const transaction = await blockchainManager.getTransaction(txHash);
    res.json({
      success: true,
      ...transaction
    });
  } catch (error) {
    logger.error(`Failed to get transaction ${req.params.txHash}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transaction',
      message: error.message
    });
  }
});

// Send transaction
router.post('/transaction/send', async (req, res) => {
  try {
    const { from, to, value, gas, gasPrice, data } = req.body;
    
    if (!from || !to || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'From, to, and value are required'
      });
    }

    const txData = { from, to, value, gas, gasPrice, data };
    const result = await blockchainManager.sendTransaction(txData);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Failed to send transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send transaction',
      message: error.message
    });
  }
});

// Get block
router.get('/block/:blockNumber', async (req, res) => {
  try {
    const { blockNumber } = req.params;
    const block = await blockchainManager.getBlock(parseInt(blockNumber));
    res.json({
      success: true,
      block
    });
  } catch (error) {
    logger.error(`Failed to get block ${req.params.blockNumber}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get block',
      message: error.message
    });
  }
});

// Get latest block
router.get('/block/latest', async (req, res) => {
  try {
    const block = await blockchainManager.getLatestBlock();
    res.json({
      success: true,
      block
    });
  } catch (error) {
    logger.error('Failed to get latest block:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get latest block',
      message: error.message
    });
  }
});

// Estimate gas
router.post('/gas/estimate', async (req, res) => {
  try {
    const txData = req.body;
    const gasEstimate = await blockchainManager.estimateGas(txData);
    res.json({
      success: true,
      gasEstimate: gasEstimate.toString()
    });
  } catch (error) {
    logger.error('Failed to estimate gas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to estimate gas',
      message: error.message
    });
  }
});

// Get gas price
router.get('/gas/price', async (req, res) => {
  try {
    const gasPrice = await blockchainManager.getGasPrice();
    res.json({
      success: true,
      ...gasPrice
    });
  } catch (error) {
    logger.error('Failed to get gas price:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get gas price',
      message: error.message
    });
  }
});

module.exports = router;
