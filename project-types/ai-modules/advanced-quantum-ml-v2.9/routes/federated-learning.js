const express = require('express');
const router = express.Router();
const federatedLearning = require('../modules/federated-learning');
const logger = require('../modules/logger');

// Initialize federated learning
router.post('/initialize', async (req, res) => {
  try {
    const options = req.body || {};
    const result = federatedLearning.initialize(options);
    
    logger.info('Federated learning initialized via API', {
      options,
      success: result.success
    });

    res.json({
      success: true,
      message: 'Federated learning system initialized successfully',
      data: result
    });
  } catch (error) {
    logger.error('Federated learning initialization failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Initialization failed',
      message: error.message
    });
  }
});

// Register federated learning node
router.post('/nodes/register', async (req, res) => {
  try {
    const nodeInfo = req.body;

    if (!nodeInfo) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'nodeInfo is required'
      });
    }

    const result = federatedLearning.registerNode(nodeInfo);
    
    logger.info('Federated learning node registered via API', {
      nodeId: result.nodeId,
      name: result.node.name
    });

    res.json({
      success: true,
      message: 'Federated learning node registered successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to register federated learning node:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Node registration failed',
      message: error.message
    });
  }
});

// Unregister federated learning node
router.delete('/nodes/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;
    const result = federatedLearning.unregisterNode(nodeId);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'Node not found',
        message: result.error
      });
    }

    logger.info('Federated learning node unregistered via API', { nodeId });

    res.json({
      success: true,
      message: 'Federated learning node unregistered successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to unregister federated learning node:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Node unregistration failed',
      message: error.message
    });
  }
});

// Get federated learning node
router.get('/nodes/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;
    const node = federatedLearning.getNode(nodeId);

    if (!node) {
      return res.status(404).json({
        success: false,
        error: 'Node not found',
        message: `Federated learning node '${nodeId}' not found`
      });
    }

    res.json({
      success: true,
      message: 'Federated learning node retrieved successfully',
      data: { node }
    });
  } catch (error) {
    logger.error('Failed to get federated learning node:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get node',
      message: error.message
    });
  }
});

// Get all federated learning nodes
router.get('/nodes', async (req, res) => {
  try {
    const nodes = federatedLearning.getAllNodes();
    
    res.json({
      success: true,
      message: 'Federated learning nodes retrieved successfully',
      data: {
        nodes: nodes,
        totalNodes: nodes.length,
        activeNodes: nodes.filter(n => n.status === 'online').length
      }
    });
  } catch (error) {
    logger.error('Failed to get federated learning nodes:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get nodes',
      message: error.message
    });
  }
});

// Start federated learning round
router.post('/rounds/start', async (req, res) => {
  try {
    const roundConfig = req.body;

    if (!roundConfig) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'roundConfig is required'
      });
    }

    const result = await federatedLearning.startFederatedRound(roundConfig);
    
    logger.info('Federated learning round started via API', {
      roundId: result.roundId,
      participatingNodes: result.round.participatingNodes.length
    });

    res.json({
      success: true,
      message: 'Federated learning round started successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to start federated learning round:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Round start failed',
      message: error.message
    });
  }
});

// Get federated learning round
router.get('/rounds/:roundId', async (req, res) => {
  try {
    const { roundId } = req.params;
    const round = federatedLearning.getRound(roundId);

    if (!round) {
      return res.status(404).json({
        success: false,
        error: 'Round not found',
        message: `Federated learning round '${roundId}' not found`
      });
    }

    res.json({
      success: true,
      message: 'Federated learning round retrieved successfully',
      data: { round }
    });
  } catch (error) {
    logger.error('Failed to get federated learning round:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get round',
      message: error.message
    });
  }
});

// Get all federated learning rounds
router.get('/rounds', async (req, res) => {
  try {
    const rounds = federatedLearning.getAllRounds();
    
    res.json({
      success: true,
      message: 'Federated learning rounds retrieved successfully',
      data: {
        rounds: rounds,
        totalRounds: rounds.length,
        completedRounds: rounds.filter(r => r.status === 'completed').length,
        failedRounds: rounds.filter(r => r.status === 'failed').length
      }
    });
  } catch (error) {
    logger.error('Failed to get federated learning rounds:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get rounds',
      message: error.message
    });
  }
});

// Get federated learning metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = federatedLearning.getFederatedMetrics();
    
    res.json({
      success: true,
      message: 'Federated learning metrics retrieved successfully',
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get federated learning metrics:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
      message: error.message
    });
  }
});

// Get node participation statistics
router.get('/nodes/:nodeId/participation', async (req, res) => {
  try {
    const { nodeId } = req.params;
    const node = federatedLearning.getNode(nodeId);

    if (!node) {
      return res.status(404).json({
        success: false,
        error: 'Node not found',
        message: `Federated learning node '${nodeId}' not found`
      });
    }

    const participation = {
      nodeId: nodeId,
      participationRate: node.participationRate,
      status: node.status,
      lastSeen: node.lastSeen,
      dataSize: node.dataSize,
      privacyLevel: node.privacyLevel,
      capabilities: node.capabilities
    };

    res.json({
      success: true,
      message: 'Node participation statistics retrieved successfully',
      data: participation
    });
  } catch (error) {
    logger.error('Failed to get node participation statistics:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get participation statistics',
      message: error.message
    });
  }
});

// Get round performance analysis
router.get('/rounds/:roundId/performance', async (req, res) => {
  try {
    const { roundId } = req.params;
    const round = federatedLearning.getRound(roundId);

    if (!round) {
      return res.status(404).json({
        success: false,
        error: 'Round not found',
        message: `Federated learning round '${roundId}' not found`
      });
    }

    const performance = {
      roundId: roundId,
      status: round.status,
      startTime: round.startTime,
      endTime: round.endTime,
      duration: round.endTime ? round.endTime - round.startTime : null,
      participatingNodes: round.participatingNodes.length,
      modelUpdates: round.modelUpdates.size,
      metrics: round.roundMetrics,
      config: round.config
    };

    res.json({
      success: true,
      message: 'Round performance analysis retrieved successfully',
      data: performance
    });
  } catch (error) {
    logger.error('Failed to get round performance analysis:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get performance analysis',
      message: error.message
    });
  }
});

// Get privacy budget status
router.get('/privacy-budget', async (req, res) => {
  try {
    const metrics = federatedLearning.getFederatedMetrics();
    
    const privacyBudget = {
      currentBudget: metrics.privacyBudget,
      totalRounds: metrics.totalRounds,
      averagePrivacyCost: metrics.totalRounds > 0 ? 
        (1.0 - metrics.privacyBudget) / metrics.totalRounds : 0,
      remainingRounds: Math.floor(metrics.privacyBudget / 0.1), // Assuming 0.1 cost per round
      status: metrics.privacyBudget > 0.5 ? 'healthy' : 
              metrics.privacyBudget > 0.2 ? 'warning' : 'critical'
    };

    res.json({
      success: true,
      message: 'Privacy budget status retrieved successfully',
      data: privacyBudget
    });
  } catch (error) {
    logger.error('Failed to get privacy budget status:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get privacy budget',
      message: error.message
    });
  }
});

// Get aggregation strategies
router.get('/aggregation-strategies', async (req, res) => {
  try {
    const strategies = [
      {
        name: 'fedavg',
        description: 'Federated Averaging - Simple weighted average of model updates',
        parameters: ['learning_rate', 'epochs', 'batch_size']
      },
      {
        name: 'fedprox',
        description: 'Federated Proximal - Adds proximal term to prevent divergence',
        parameters: ['learning_rate', 'epochs', 'batch_size', 'mu']
      },
      {
        name: 'fednova',
        description: 'Federated Nova - Normalizes updates to handle data heterogeneity',
        parameters: ['learning_rate', 'epochs', 'batch_size', 'normalization']
      },
      {
        name: 'scaffold',
        description: 'SCAFFOLD - Uses control variates to reduce variance',
        parameters: ['learning_rate', 'epochs', 'batch_size', 'control_variates']
      }
    ];

    res.json({
      success: true,
      message: 'Aggregation strategies retrieved successfully',
      data: { strategies }
    });
  } catch (error) {
    logger.error('Failed to get aggregation strategies:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get strategies',
      message: error.message
    });
  }
});

// Get privacy techniques
router.get('/privacy-techniques', async (req, res) => {
  try {
    const techniques = [
      {
        name: 'differential_privacy',
        description: 'Differential Privacy - Adds calibrated noise to preserve privacy',
        parameters: ['epsilon', 'delta', 'noise_scale'],
        privacyCost: 'medium'
      },
      {
        name: 'secure_aggregation',
        description: 'Secure Aggregation - Uses cryptographic techniques for privacy',
        parameters: ['encryption_key', 'threshold'],
        privacyCost: 'low'
      },
      {
        name: 'homomorphic_encryption',
        description: 'Homomorphic Encryption - Enables computation on encrypted data',
        parameters: ['encryption_scheme', 'key_size'],
        privacyCost: 'high'
      }
    ];

    res.json({
      success: true,
      message: 'Privacy techniques retrieved successfully',
      data: { techniques }
    });
  } catch (error) {
    logger.error('Failed to get privacy techniques:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get techniques',
      message: error.message
    });
  }
});

// Health check for federated learning
router.get('/health', async (req, res) => {
  try {
    const metrics = federatedLearning.getFederatedMetrics();
    
    const health = {
      status: 'healthy',
      timestamp: Date.now(),
      totalNodes: metrics.totalNodes,
      activeNodes: metrics.activeNodes,
      totalRounds: metrics.totalRounds,
      completedRounds: metrics.completedRounds,
      successRate: metrics.successRate,
      averageAccuracy: metrics.averageAccuracy,
      privacyBudget: metrics.privacyBudget,
      uptime: process.uptime()
    };

    res.json({
      success: true,
      message: 'Federated learning health check passed',
      data: health
    });
  } catch (error) {
    logger.error('Federated learning health check failed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    });
  }
});

module.exports = router;
