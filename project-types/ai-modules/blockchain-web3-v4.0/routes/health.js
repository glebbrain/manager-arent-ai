const express = require('express');
const router = express.Router();
const blockchainManager = require('../modules/blockchain-manager');
const smartContractManager = require('../modules/smart-contract-manager');
const walletManager = require('../modules/wallet-manager');
const nftManager = require('../modules/nft-manager');
const defiManager = require('../modules/defi-manager');
const daoManager = require('../modules/dao-manager');
const ipfsManager = require('../modules/ipfs-manager');
const logger = require('../modules/logger');

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check all services
    const services = await Promise.allSettled([
      checkBlockchainService(),
      checkSmartContractService(),
      checkWalletService(),
      checkNFTService(),
      checkDeFiService(),
      checkDAOService(),
      checkIPFSService()
    ]);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: '4.0.0',
      services: {}
    };

    // Process service results
    const serviceNames = [
      'blockchain',
      'smart-contract',
      'wallet',
      'nft',
      'defi',
      'dao',
      'ipfs'
    ];

    let allHealthy = true;

    services.forEach((result, index) => {
      const serviceName = serviceNames[index];
      
      if (result.status === 'fulfilled') {
        healthStatus.services[serviceName] = {
          status: 'healthy',
          ...result.value
        };
      } else {
        healthStatus.services[serviceName] = {
          status: 'unhealthy',
          error: result.reason.message
        };
        allHealthy = false;
      }
    });

    if (!allHealthy) {
      healthStatus.status = 'degraded';
    }

    const statusCode = allHealthy ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error.message
    });
  }
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const detailedStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '4.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {}
    };

    // Check blockchain service
    try {
      const networkInfo = await blockchainManager.getNetworkInfo();
      detailedStatus.services.blockchain = {
        status: 'healthy',
        network: networkInfo.network,
        chain: networkInfo.chain,
        connected: networkInfo.isConnected,
        blockNumber: networkInfo.blockNumber
      };
    } catch (error) {
      detailedStatus.services.blockchain = {
        status: 'unhealthy',
        error: error.message
      };
    }

    // Check wallet service
    try {
      const wallets = await walletManager.listWallets();
      detailedStatus.services.wallet = {
        status: 'healthy',
        walletCount: wallets.count
      };
    } catch (error) {
      detailedStatus.services.wallet = {
        status: 'unhealthy',
        error: error.message
      };
    }

    // Check NFT service
    try {
      const collections = await nftManager.listCollections();
      detailedStatus.services.nft = {
        status: 'healthy',
        collectionCount: collections.count
      };
    } catch (error) {
      detailedStatus.services.nft = {
        status: 'unhealthy',
        error: error.message
      };
    }

    // Check DeFi service
    try {
      const pools = await defiManager.listPools();
      detailedStatus.services.defi = {
        status: 'healthy',
        poolCount: pools.count
      };
    } catch (error) {
      detailedStatus.services.defi = {
        status: 'unhealthy',
        error: error.message
      };
    }

    // Check DAO service
    try {
      const daos = await daoManager.listDAOs();
      detailedStatus.services.dao = {
        status: 'healthy',
        daoCount: daos.count
      };
    } catch (error) {
      detailedStatus.services.dao = {
        status: 'unhealthy',
        error: error.message
      };
    }

    // Check IPFS service
    try {
      const stats = await ipfsManager.getFileStats();
      detailedStatus.services.ipfs = {
        status: 'healthy',
        totalFiles: stats.totalFiles,
        totalSize: stats.totalSize,
        pinnedFiles: stats.pinnedFiles
      };
    } catch (error) {
      detailedStatus.services.ipfs = {
        status: 'unhealthy',
        error: error.message
      };
    }

    res.json(detailedStatus);
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed',
      message: error.message
    });
  }
});

// Service-specific health checks
router.get('/blockchain', async (req, res) => {
  try {
    const result = await checkBlockchainService();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'blockchain',
      ...result
    });
  } catch (error) {
    logger.error('Blockchain health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'blockchain',
      error: error.message
    });
  }
});

router.get('/wallet', async (req, res) => {
  try {
    const result = await checkWalletService();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'wallet',
      ...result
    });
  } catch (error) {
    logger.error('Wallet health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'wallet',
      error: error.message
    });
  }
});

// Helper functions
async function checkBlockchainService() {
  const networkInfo = await blockchainManager.getNetworkInfo();
  return {
    network: networkInfo.network,
    chain: networkInfo.chain,
    connected: networkInfo.isConnected,
    blockNumber: networkInfo.blockNumber
  };
}

async function checkSmartContractService() {
  // Smart contract service doesn't have specific health check
  return {
    initialized: true
  };
}

async function checkWalletService() {
  const wallets = await walletManager.listWallets();
  return {
    walletCount: wallets.count
  };
}

async function checkNFTService() {
  const collections = await nftManager.listCollections();
  return {
    collectionCount: collections.count
  };
}

async function checkDeFiService() {
  const pools = await defiManager.listPools();
  return {
    poolCount: pools.count
  };
}

async function checkDAOService() {
  const daos = await daoManager.listDAOs();
  return {
    daoCount: daos.count
  };
}

async function checkIPFSService() {
  const stats = await ipfsManager.getFileStats();
  return {
    totalFiles: stats.totalFiles,
    totalSize: stats.totalSize,
    pinnedFiles: stats.pinnedFiles
  };
}

module.exports = router;
