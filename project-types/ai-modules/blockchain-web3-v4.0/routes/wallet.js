const express = require('express');
const router = express.Router();
const walletManager = require('../modules/wallet-manager');
const blockchainManager = require('../modules/blockchain-manager');
const logger = require('../modules/logger');

// Create wallet
router.post('/create', async (req, res) => {
  try {
    const { password } = req.body;
    
    const result = await walletManager.createWallet(password);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Failed to create wallet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create wallet',
      message: error.message
    });
  }
});

// Import wallet from private key
router.post('/import/private-key', async (req, res) => {
  try {
    const { privateKey, password } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'Private key is required'
      });
    }

    const result = await walletManager.importWallet(privateKey, password);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Failed to import wallet from private key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import wallet',
      message: error.message
    });
  }
});

// Import wallet from mnemonic
router.post('/import/mnemonic', async (req, res) => {
  try {
    const { mnemonic, password } = req.body;
    
    if (!mnemonic) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'Mnemonic is required'
      });
    }

    const result = await walletManager.importFromMnemonic(mnemonic, password);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Failed to import wallet from mnemonic:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import wallet',
      message: error.message
    });
  }
});

// Get wallet
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { password } = req.query;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'Address is required'
      });
    }

    const result = await walletManager.getWallet(address, password);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to get wallet ${req.params.address}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet',
      message: error.message
    });
  }
});

// Get wallet balance
router.get('/:address/balance', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'Address is required'
      });
    }

    // Set provider from blockchain manager
    walletManager.setProvider(blockchainManager.ethersProvider);

    const result = await walletManager.getWalletBalance(address);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to get balance for wallet ${req.params.address}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet balance',
      message: error.message
    });
  }
});

// Send transaction
router.post('/:address/send', async (req, res) => {
  try {
    const { address } = req.params;
    const { toAddress, amount, password, options } = req.body;
    
    if (!address || !toAddress || amount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Address, toAddress, and amount are required'
      });
    }

    // Set provider from blockchain manager
    walletManager.setProvider(blockchainManager.ethersProvider);

    const result = await walletManager.sendTransaction(address, toAddress, amount, password, options);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to send transaction from wallet ${req.params.address}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to send transaction',
      message: error.message
    });
  }
});

// List wallets
router.get('/', async (req, res) => {
  try {
    const result = await walletManager.listWallets();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Failed to list wallets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list wallets',
      message: error.message
    });
  }
});

// Delete wallet
router.delete('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { password } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'Address is required'
      });
    }

    const result = await walletManager.deleteWallet(address, password);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to delete wallet ${req.params.address}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete wallet',
      message: error.message
    });
  }
});

module.exports = router;
