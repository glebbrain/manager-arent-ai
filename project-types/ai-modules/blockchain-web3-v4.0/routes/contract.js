const express = require('express');
const router = express.Router();
const smartContractManager = require('../modules/smart-contract-manager');
const blockchainManager = require('../modules/blockchain-manager');
const logger = require('../modules/logger');

// Deploy contract
router.post('/deploy', async (req, res) => {
  try {
    const { contractName, constructorArgs, options } = req.body;
    
    if (!contractName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'Contract name is required'
      });
    }

    // Set provider from blockchain manager
    smartContractManager.setProvider(blockchainManager.ethersProvider, blockchainManager.signer);

    const result = await smartContractManager.deployContract(contractName, constructorArgs || [], options || {});
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to deploy contract ${req.body.contractName}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to deploy contract',
      message: error.message
    });
  }
});

// Load contract
router.post('/load', async (req, res) => {
  try {
    const { contractName, address, abi } = req.body;
    
    if (!contractName || !address || !abi) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Contract name, address, and ABI are required'
      });
    }

    // Set provider from blockchain manager
    smartContractManager.setProvider(blockchainManager.ethersProvider, blockchainManager.signer);

    const result = await smartContractManager.loadContract(contractName, address, abi);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to load contract ${req.body.contractName}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to load contract',
      message: error.message
    });
  }
});

// Call contract method
router.post('/call', async (req, res) => {
  try {
    const { contractName, methodName, args, options } = req.body;
    
    if (!contractName || !methodName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Contract name and method name are required'
      });
    }

    // Set provider from blockchain manager
    smartContractManager.setProvider(blockchainManager.ethersProvider, blockchainManager.signer);

    const result = await smartContractManager.callContractMethod(contractName, methodName, args || [], options || {});
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to call method ${req.body.methodName} on contract ${req.body.contractName}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to call contract method',
      message: error.message
    });
  }
});

// Get contract state
router.get('/state/:contractName', async (req, res) => {
  try {
    const { contractName } = req.params;
    
    if (!contractName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'Contract name is required'
      });
    }

    const result = await smartContractManager.getContractState(contractName);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to get contract state for ${req.params.contractName}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contract state',
      message: error.message
    });
  }
});

// Get contract events
router.get('/events/:contractName/:eventName', async (req, res) => {
  try {
    const { contractName, eventName } = req.params;
    const { fromBlock = 0, toBlock = 'latest' } = req.query;
    
    if (!contractName || !eventName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Contract name and event name are required'
      });
    }

    const result = await smartContractManager.getContractEvents(contractName, eventName, fromBlock, toBlock);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to get events for contract ${req.params.contractName}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contract events',
      message: error.message
    });
  }
});

// Estimate gas for contract method
router.post('/gas/estimate', async (req, res) => {
  try {
    const { contractName, methodName, args, options } = req.body;
    
    if (!contractName || !methodName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Contract name and method name are required'
      });
    }

    const result = await smartContractManager.estimateGas(contractName, methodName, args || [], options || {});
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to estimate gas for method ${req.body.methodName} on contract ${req.body.contractName}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to estimate gas',
      message: error.message
    });
  }
});

// Get contract balance
router.get('/balance/:contractName', async (req, res) => {
  try {
    const { contractName } = req.params;
    
    if (!contractName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'Contract name is required'
      });
    }

    const result = await smartContractManager.getContractBalance(contractName);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to get balance for contract ${req.params.contractName}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contract balance',
      message: error.message
    });
  }
});

module.exports = router;
