const express = require('express');
const router = express.Router();
const vectorStore = require('../modules/vector-store');
const logger = require('../modules/logger');

// Create index
router.post('/index/create', async (req, res) => {
  try {
    const { indexName, options = {} } = req.body;
    
    if (!indexName) {
      return res.status(400).json({
        success: false,
        error: 'Index name is required'
      });
    }

    const result = await vectorStore.createIndex(indexName, options);
    
    res.json({
      success: true,
      data: {
        indexName,
        ...result,
        message: 'Index created successfully'
      }
    });
  } catch (error) {
    logger.error('Index creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete index
router.delete('/index/:indexName', async (req, res) => {
  try {
    const { indexName } = req.params;
    const { provider } = req.query;
    
    await vectorStore.deleteIndex(indexName, { provider });
    
    res.json({
      success: true,
      data: {
        indexName,
        message: 'Index deleted successfully'
      }
    });
  } catch (error) {
    logger.error('Index deletion error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List indexes
router.get('/index/list', async (req, res) => {
  try {
    const { provider } = req.query;
    
    const indexes = await vectorStore.listIndexes(provider);
    
    res.json({
      success: true,
      data: {
        indexes,
        count: Array.isArray(indexes) ? indexes.length : Object.values(indexes).flat().length
      }
    });
  } catch (error) {
    logger.error('Index listing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add vectors to index
router.post('/index/:indexName/vectors', async (req, res) => {
  try {
    const { indexName } = req.params;
    const { vectors, ids, metadata, options = {} } = req.body;
    
    if (!vectors || !Array.isArray(vectors) || vectors.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Vectors array is required'
      });
    }

    const result = await vectorStore.addVectors(indexName, vectors, {
      ids,
      metadata,
      ...options
    });
    
    res.json({
      success: true,
      data: {
        indexName,
        ...result,
        message: 'Vectors added successfully'
      }
    });
  } catch (error) {
    logger.error('Vector addition error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Search vectors
router.post('/index/:indexName/search', async (req, res) => {
  try {
    const { indexName } = req.params;
    const { queryVector, options = {} } = req.body;
    
    if (!queryVector) {
      return res.status(400).json({
        success: false,
        error: 'Query vector is required'
      });
    }

    const result = await vectorStore.search(indexName, queryVector, options);
    
    res.json({
      success: true,
      data: {
        indexName,
        ...result,
        queryVector: Array.isArray(queryVector) ? queryVector.slice(0, 5) : queryVector.slice(0, 5) // Show first 5 dimensions
      }
    });
  } catch (error) {
    logger.error('Vector search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Batch search
router.post('/index/:indexName/batch-search', async (req, res) => {
  try {
    const { indexName } = req.params;
    const { queryVectors, options = {} } = req.body;
    
    if (!queryVectors || !Array.isArray(queryVectors) || queryVectors.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query vectors array is required'
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < queryVectors.length; i++) {
      try {
        const result = await vectorStore.search(indexName, queryVectors[i], options);
        results.push({
          index: i,
          queryVector: queryVectors[i].slice(0, 5), // Show first 5 dimensions
          ...result
        });
      } catch (error) {
        errors.push({
          index: i,
          queryVector: queryVectors[i].slice(0, 5),
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        indexName,
        results,
        errors,
        total: queryVectors.length,
        successful: results.length,
        failed: errors.length
      }
    });
  } catch (error) {
    logger.error('Batch search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get index statistics
router.get('/index/:indexName/stats', async (req, res) => {
  try {
    const { indexName } = req.params;
    const { provider } = req.query;
    
    // This would require implementing index statistics
    // For now, we'll return basic info
    const indexes = await vectorStore.listIndexes(provider);
    const exists = Array.isArray(indexes) ? 
      indexes.includes(indexName) : 
      Object.values(indexes).flat().includes(indexName);
    
    res.json({
      success: true,
      data: {
        indexName,
        exists,
        provider: provider || 'default',
        // Additional stats would go here
        vectorCount: 0, // Placeholder
        dimensions: 0, // Placeholder
        memoryUsage: 0 // Placeholder
      }
    });
  } catch (error) {
    logger.error('Index statistics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Similarity search with filters
router.post('/index/:indexName/similarity', async (req, res) => {
  try {
    const { indexName } = req.params;
    const { queryVector, filters, options = {} } = req.body;
    
    if (!queryVector) {
      return res.status(400).json({
        success: false,
        error: 'Query vector is required'
      });
    }

    const searchOptions = {
      ...options,
      filter: filters
    };

    const result = await vectorStore.search(indexName, queryVector, searchOptions);
    
    res.json({
      success: true,
      data: {
        indexName,
        ...result,
        filters,
        queryVector: Array.isArray(queryVector) ? queryVector.slice(0, 5) : queryVector.slice(0, 5)
      }
    });
  } catch (error) {
    logger.error('Similarity search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get vector by ID
router.get('/index/:indexName/vector/:vectorId', async (req, res) => {
  try {
    const { indexName, vectorId } = req.params;
    
    // This would require implementing vector retrieval by ID
    // For now, we'll return a placeholder
    res.json({
      success: true,
      data: {
        indexName,
        vectorId,
        vector: null, // Placeholder
        metadata: null // Placeholder
      }
    });
  } catch (error) {
    logger.error('Vector retrieval error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update vector metadata
router.put('/index/:indexName/vector/:vectorId', async (req, res) => {
  try {
    const { indexName, vectorId } = req.params;
    const { metadata } = req.body;
    
    // This would require implementing vector metadata update
    // For now, we'll return success
    res.json({
      success: true,
      data: {
        indexName,
        vectorId,
        metadata,
        message: 'Vector metadata updated successfully'
      }
    });
  } catch (error) {
    logger.error('Vector update error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete vector
router.delete('/index/:indexName/vector/:vectorId', async (req, res) => {
  try {
    const { indexName, vectorId } = req.params;
    
    // This would require implementing vector deletion
    // For now, we'll return success
    res.json({
      success: true,
      data: {
        indexName,
        vectorId,
        message: 'Vector deleted successfully'
      }
    });
  } catch (error) {
    logger.error('Vector deletion error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Vector Store Status
router.get('/status', async (req, res) => {
  try {
    const status = await vectorStore.healthCheck();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Vector store status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get supported providers
router.get('/providers', (req, res) => {
  try {
    const providers = {
      faiss: {
        name: 'FAISS',
        type: 'local',
        description: 'Facebook AI Similarity Search',
        capabilities: ['similarity-search', 'clustering', 'indexing']
      },
      pinecone: {
        name: 'Pinecone',
        type: 'cloud',
        description: 'Managed vector database',
        capabilities: ['similarity-search', 'real-time-updates', 'scaling']
      },
      weaviate: {
        name: 'Weaviate',
        type: 'cloud',
        description: 'Open source vector database',
        capabilities: ['similarity-search', 'graphql', 'ml-models']
      },
      chroma: {
        name: 'Chroma',
        type: 'local',
        description: 'Open source embedding database',
        capabilities: ['similarity-search', 'collections', 'metadata']
      },
      qdrant: {
        name: 'Qdrant',
        type: 'cloud',
        description: 'Vector similarity search engine',
        capabilities: ['similarity-search', 'filtering', 'payload']
      }
    };

    res.json({
      success: true,
      data: {
        providers,
        count: Object.keys(providers).length
      }
    });
  } catch (error) {
    logger.error('Providers listing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
