const express = require('express');
const multer = require('multer');
const router = express.Router();
const ipfsManager = require('../modules/ipfs-manager');
const logger = require('../modules/logger');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Add file
router.post('/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Missing file',
        message: 'File is required'
      });
    }

    // Save uploaded file temporarily
    const tempPath = `/tmp/${req.file.originalname}`;
    require('fs').writeFileSync(tempPath, req.file.buffer);

    const result = await ipfsManager.addFile(tempPath, req.body);
    
    // Clean up temp file
    require('fs').unlinkSync(tempPath);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Failed to add file to IPFS:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add file',
      message: error.message
    });
  }
});

// Add content
router.post('/content', async (req, res) => {
  try {
    const { content, fileName, metadata } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'Content is required'
      });
    }

    const result = await ipfsManager.addContent(content, fileName, { metadata });
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Failed to add content to IPFS:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add content',
      message: error.message
    });
  }
});

// Get file
router.get('/file/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    
    if (!hash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'Hash is required'
      });
    }

    const result = await ipfsManager.getFile(hash);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to get file ${req.params.hash}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file',
      message: error.message
    });
  }
});

// Pin file
router.post('/file/:hash/pin', async (req, res) => {
  try {
    const { hash } = req.params;
    
    if (!hash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'Hash is required'
      });
    }

    const result = await ipfsManager.pinFile(hash);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to pin file ${req.params.hash}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to pin file',
      message: error.message
    });
  }
});

// Unpin file
router.delete('/file/:hash/pin', async (req, res) => {
  try {
    const { hash } = req.params;
    
    if (!hash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'Hash is required'
      });
    }

    const result = await ipfsManager.unpinFile(hash);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to unpin file ${req.params.hash}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to unpin file',
      message: error.message
    });
  }
});

// List files
router.get('/files', async (req, res) => {
  try {
    const result = await ipfsManager.listFiles();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Failed to list files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list files',
      message: error.message
    });
  }
});

// List pinned files
router.get('/pinned', async (req, res) => {
  try {
    const result = await ipfsManager.listPinnedFiles();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Failed to list pinned files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list pinned files',
      message: error.message
    });
  }
});

// Search files
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'Query parameter q is required'
      });
    }

    const result = await ipfsManager.searchFiles(q);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error(`Failed to search files with query "${req.query.q}":`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to search files',
      message: error.message
    });
  }
});

// Get file stats
router.get('/stats', async (req, res) => {
  try {
    const result = await ipfsManager.getFileStats();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Failed to get file stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file stats',
      message: error.message
    });
  }
});

// Get IPFS URL for hash
router.get('/url/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    
    if (!hash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'Hash is required'
      });
    }

    const ipfsUrl = ipfsManager.getIPFSUrl(hash);
    const allGateways = ipfsManager.getAllGateways(hash);
    
    res.json({
      success: true,
      hash,
      ipfsUrl,
      allGateways
    });
  } catch (error) {
    logger.error(`Failed to get IPFS URL for hash ${req.params.hash}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get IPFS URL',
      message: error.message
    });
  }
});

module.exports = router;
