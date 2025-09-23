const express = require('express');
const router = express.Router();
const nftManager = require('../modules/nft-manager');
const blockchainManager = require('../modules/blockchain-manager');
const logger = require('../modules/logger');

// Create NFT collection
router.post('/collection', async (req, res) => {
  try {
    const { name, symbol, baseURI, maxSupply } = req.body;
    
    if (!name || !symbol) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Name and symbol are required'
      });
    }

    // Set provider from blockchain manager
    nftManager.setProvider(blockchainManager.ethersProvider, blockchainManager.signer);

    const result = await nftManager.createNFTCollection(name, symbol, baseURI, maxSupply);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to create NFT collection ${req.body.name}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to create NFT collection',
      message: error.message
    });
  }
});

// Mint NFT
router.post('/mint', async (req, res) => {
  try {
    const { collectionName, toAddress, tokenId, metadataURI } = req.body;
    
    if (!collectionName || !toAddress || tokenId === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Collection name, toAddress, and tokenId are required'
      });
    }

    // Set provider from blockchain manager
    nftManager.setProvider(blockchainManager.ethersProvider, blockchainManager.signer);

    const result = await nftManager.mintNFT(collectionName, toAddress, tokenId, metadataURI);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to mint NFT in collection ${req.body.collectionName}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to mint NFT',
      message: error.message
    });
  }
});

// Transfer NFT
router.post('/transfer', async (req, res) => {
  try {
    const { collectionName, tokenId, fromAddress, toAddress } = req.body;
    
    if (!collectionName || tokenId === undefined || !fromAddress || !toAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Collection name, tokenId, fromAddress, and toAddress are required'
      });
    }

    const result = await nftManager.transferNFT(collectionName, tokenId, fromAddress, toAddress);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to transfer NFT ${req.body.collectionName} #${req.body.tokenId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to transfer NFT',
      message: error.message
    });
  }
});

// Get NFT
router.get('/:collectionName/:tokenId', async (req, res) => {
  try {
    const { collectionName, tokenId } = req.params;
    
    if (!collectionName || !tokenId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Collection name and tokenId are required'
      });
    }

    const result = await nftManager.getNFT(collectionName, tokenId);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to get NFT ${req.params.collectionName} #${req.params.tokenId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get NFT',
      message: error.message
    });
  }
});

// Get NFTs by owner
router.get('/owner/:ownerAddress', async (req, res) => {
  try {
    const { ownerAddress } = req.params;
    
    if (!ownerAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'Owner address is required'
      });
    }

    const result = await nftManager.getNFTsByOwner(ownerAddress);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to get NFTs for owner ${req.params.ownerAddress}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get NFTs by owner',
      message: error.message
    });
  }
});

// Get collection info
router.get('/collection/:collectionName', async (req, res) => {
  try {
    const { collectionName } = req.params;
    
    if (!collectionName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'Collection name is required'
      });
    }

    const result = await nftManager.getCollectionInfo(collectionName);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to get collection info for ${req.params.collectionName}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get collection info',
      message: error.message
    });
  }
});

// Update NFT metadata
router.put('/:collectionName/:tokenId/metadata', async (req, res) => {
  try {
    const { collectionName, tokenId } = req.params;
    const { metadataURI } = req.body;
    
    if (!collectionName || !tokenId || !metadataURI) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Collection name, tokenId, and metadataURI are required'
      });
    }

    const result = await nftManager.updateMetadata(collectionName, tokenId, metadataURI);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to update metadata for NFT ${req.params.collectionName} #${req.params.tokenId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to update NFT metadata',
      message: error.message
    });
  }
});

// List collections
router.get('/collections', async (req, res) => {
  try {
    const result = await nftManager.listCollections();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Failed to list collections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list collections',
      message: error.message
    });
  }
});

module.exports = router;
