const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import modules
const logger = require('./modules/logger');
const blockchainManager = require('./modules/blockchain-manager');
const smartContractManager = require('./modules/smart-contract-manager');
const walletManager = require('./modules/wallet-manager');
const nftManager = require('./modules/nft-manager');
const defiManager = require('./modules/defi-manager');
const daoManager = require('./modules/dao-manager');
const ipfsManager = require('./modules/ipfs-manager');

// Import routes
const blockchainRoutes = require('./routes/blockchain');
const contractRoutes = require('./routes/contract');
const walletRoutes = require('./routes/wallet');
const nftRoutes = require('./routes/nft');
const defiRoutes = require('./routes/defi');
const daoRoutes = require('./routes/dao');
const ipfsRoutes = require('./routes/ipfs');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/contracts', express.static(path.join(__dirname, 'contracts')));

// Routes
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/contract', contractRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/defi', defiRoutes);
app.use('/api/dao', daoRoutes);
app.use('/api/ipfs', ipfsRoutes);
app.use('/api/health', healthRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'The requested resource was not found'
  });
});

// Initialize services
async function initializeServices() {
  try {
    logger.info('Initializing Blockchain & Web3 v4.0...');
    
    // Initialize Blockchain Manager
    await blockchainManager.initialize();
    logger.info('Blockchain Manager initialized');
    
    // Initialize Smart Contract Manager
    await smartContractManager.initialize();
    logger.info('Smart Contract Manager initialized');
    
    // Initialize Wallet Manager
    await walletManager.initialize();
    logger.info('Wallet Manager initialized');
    
    // Initialize NFT Manager
    await nftManager.initialize();
    logger.info('NFT Manager initialized');
    
    // Initialize DeFi Manager
    await defiManager.initialize();
    logger.info('DeFi Manager initialized');
    
    // Initialize DAO Manager
    await daoManager.initialize();
    logger.info('DAO Manager initialized');
    
    // Initialize IPFS Manager
    await ipfsManager.initialize();
    logger.info('IPFS Manager initialized');
    
    logger.info('All blockchain services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize blockchain services:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  await initializeServices();
  
  app.listen(PORT, () => {
    logger.info(`Blockchain & Web3 v4.0 server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`API Documentation: http://localhost:${PORT}/api/health`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await blockchainManager.cleanup();
  await smartContractManager.cleanup();
  await walletManager.cleanup();
  await nftManager.cleanup();
  await defiManager.cleanup();
  await daoManager.cleanup();
  await ipfsManager.cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await blockchainManager.cleanup();
  await smartContractManager.cleanup();
  await walletManager.cleanup();
  await nftManager.cleanup();
  await defiManager.cleanup();
  await daoManager.cleanup();
  await ipfsManager.cleanup();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  startServer().catch(error => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = app;
