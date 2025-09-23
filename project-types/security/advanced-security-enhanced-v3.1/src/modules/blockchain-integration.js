const EventEmitter = require('events');
const Web3 = require('web3');
const { ethers } = require('ethers');
const crypto = require('crypto');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Blockchain Integration - Blockchain-based security and verification
 * Version: 3.1.0
 * Features:
 * - Decentralized identity management
 * - Immutable audit logs and compliance
 * - Smart contracts for security policies
 * - Distributed consensus for verification
 * - Cryptographic proofs of integrity
 */
class BlockchainIntegration extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Blockchain Configuration
      enabled: config.enabled !== false,
      network: config.network || 'ethereum',
      rpcUrl: config.rpcUrl || 'http://localhost:8545',
      chainId: config.chainId || 1,
      
      // Smart Contract Configuration
      contractAddress: config.contractAddress || null,
      contractABI: config.contractABI || [],
      gasLimit: config.gasLimit || 500000,
      gasPrice: config.gasPrice || '20000000000', // 20 gwei
      
      // Identity Management
      identityContract: config.identityContract || null,
      identityABI: config.identityABI || [],
      
      // Security Configuration
      privateKey: config.privateKey || null,
      mnemonic: config.mnemonic || null,
      encryptionKey: config.encryptionKey || null,
      
      // Consensus Configuration
      consensusThreshold: config.consensusThreshold || 0.67, // 67%
      verificationNodes: config.verificationNodes || [],
      blockConfirmation: config.blockConfirmation || 12,
      
      // Performance Configuration
      maxConcurrentTransactions: config.maxConcurrentTransactions || 10,
      transactionTimeout: config.transactionTimeout || 300000, // 5 minutes
      retryAttempts: config.retryAttempts || 3,
      
      ...config
    };
    
    // Internal state
    this.web3 = null;
    this.provider = null;
    this.wallet = null;
    this.contracts = new Map();
    this.identities = new Map();
    this.auditLogs = new Map();
    this.verificationNodes = new Set();
    this.pendingTransactions = new Map();
    this.consensusData = new Map();
    
    this.metrics = {
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      averageGasUsed: 0,
      averageConfirmationTime: 0,
      activeIdentities: 0,
      auditLogsCount: 0,
      consensusRounds: 0,
      lastBlockNumber: 0
    };
    
    // Initialize blockchain integration
    this.initialize();
  }

  /**
   * Initialize blockchain integration
   */
  async initialize() {
    try {
      // Initialize Web3 provider
      await this.initializeWeb3();
      
      // Initialize wallet
      await this.initializeWallet();
      
      // Deploy or connect to contracts
      await this.initializeContracts();
      
      // Initialize identity management
      await this.initializeIdentityManagement();
      
      // Start monitoring
      this.startMonitoring();
      
      logger.info('Blockchain Integration initialized', {
        network: this.config.network,
        chainId: this.config.chainId,
        contractAddress: this.config.contractAddress
      });
      
      this.emit('initialized');
      
    } catch (error) {
      logger.error('Failed to initialize Blockchain Integration:', error);
      throw error;
    }
  }

  /**
   * Initialize Web3 provider
   */
  async initializeWeb3() {
    try {
      // Create Web3 instance
      this.web3 = new Web3(this.config.rpcUrl);
      
      // Test connection
      const isConnected = await this.web3.eth.net.isListening();
      if (!isConnected) {
        throw new Error('Failed to connect to blockchain network');
      }
      
      // Get network info
      const networkId = await this.web3.eth.net.getId();
      const blockNumber = await this.web3.eth.getBlockNumber();
      
      this.metrics.lastBlockNumber = blockNumber;
      
      logger.info('Web3 provider initialized', {
        networkId,
        blockNumber,
        rpcUrl: this.config.rpcUrl
      });
      
    } catch (error) {
      logger.error('Failed to initialize Web3 provider:', error);
      throw error;
    }
  }

  /**
   * Initialize wallet
   */
  async initializeWallet() {
    try {
      if (this.config.privateKey) {
        // Initialize with private key
        this.wallet = this.web3.eth.accounts.privateKeyToAccount(this.config.privateKey);
      } else if (this.config.mnemonic) {
        // Initialize with mnemonic
        const hdWallet = ethers.Wallet.fromMnemonic(this.config.mnemonic);
        this.wallet = this.web3.eth.accounts.privateKeyToAccount(hdWallet.privateKey);
      } else {
        // Create new wallet
        this.wallet = this.web3.eth.accounts.create();
        logger.warn('New wallet created - save private key securely', {
          address: this.wallet.address,
          privateKey: this.wallet.privateKey
        });
      }
      
      // Add wallet to Web3
      this.web3.eth.accounts.wallet.add(this.wallet);
      this.web3.eth.defaultAccount = this.wallet.address;
      
      logger.info('Wallet initialized', {
        address: this.wallet.address
      });
      
    } catch (error) {
      logger.error('Failed to initialize wallet:', error);
      throw error;
    }
  }

  /**
   * Initialize contracts
   */
  async initializeContracts() {
    try {
      // Initialize main security contract
      if (this.config.contractAddress && this.config.contractABI.length > 0) {
        const securityContract = new this.web3.eth.Contract(
          this.config.contractABI,
          this.config.contractAddress
        );
        
        this.contracts.set('security', securityContract);
        
        logger.info('Security contract connected', {
          address: this.config.contractAddress
        });
      }
      
      // Initialize identity contract
      if (this.config.identityContract && this.config.identityABI.length > 0) {
        const identityContract = new this.web3.eth.Contract(
          this.config.identityABI,
          this.config.identityContract
        );
        
        this.contracts.set('identity', identityContract);
        
        logger.info('Identity contract connected', {
          address: this.config.identityContract
        });
      }
      
    } catch (error) {
      logger.error('Failed to initialize contracts:', error);
      throw error;
    }
  }

  /**
   * Initialize identity management
   */
  async initializeIdentityManagement() {
    try {
      // Initialize identity management system
      this.identityManagement = {
        identities: this.identities,
        verificationNodes: this.verificationNodes,
        consensusThreshold: this.config.consensusThreshold
      };
      
      logger.info('Identity management initialized');
      
    } catch (error) {
      logger.error('Failed to initialize identity management:', error);
      throw error;
    }
  }

  /**
   * Create decentralized identity
   */
  async createIdentity(identityData) {
    try {
      const identityId = identityData.id || uuidv4();
      
      // Validate identity data
      this.validateIdentityData(identityData);
      
      // Create identity document
      const identityDoc = {
        id: identityId,
        publicKey: identityData.publicKey || this.generatePublicKey(),
        attributes: identityData.attributes || {},
        metadata: identityData.metadata || {},
        createdAt: Date.now(),
        status: 'pending',
        verificationLevel: 'basic',
        blockchainAddress: null,
        transactionHash: null
      };
      
      // Generate cryptographic proof
      const proof = this.generateIdentityProof(identityDoc);
      identityDoc.proof = proof;
      
      // Store identity locally
      this.identities.set(identityId, identityDoc);
      
      // Register on blockchain if contract available
      if (this.contracts.has('identity')) {
        await this.registerIdentityOnBlockchain(identityDoc);
      }
      
      // Update metrics
      this.metrics.activeIdentities++;
      
      logger.info('Identity created', {
        identityId,
        publicKey: identityDoc.publicKey,
        status: identityDoc.status
      });
      
      this.emit('identityCreated', { identityId, identity: identityDoc });
      
      return { identityId, identity: identityDoc };
      
    } catch (error) {
      logger.error('Failed to create identity:', { identityData, error: error.message });
      throw error;
    }
  }

  /**
   * Validate identity data
   */
  validateIdentityData(identityData) {
    const required = ['publicKey'];
    
    for (const field of required) {
      if (!identityData[field]) {
        throw new Error(`Required field missing: ${field}`);
      }
    }
  }

  /**
   * Generate public key
   */
  generatePublicKey() {
    const keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      }
    });
    
    return keyPair.publicKey;
  }

  /**
   * Generate identity proof
   */
  generateIdentityProof(identityDoc) {
    const data = JSON.stringify({
      id: identityDoc.id,
      publicKey: identityDoc.publicKey,
      attributes: identityDoc.attributes,
      timestamp: identityDoc.createdAt
    });
    
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    const signature = this.signData(hash);
    
    return {
      hash,
      signature,
      algorithm: 'sha256',
      timestamp: Date.now()
    };
  }

  /**
   * Sign data with wallet
   */
  signData(data) {
    try {
      const signature = this.wallet.sign(data);
      return signature.signature;
    } catch (error) {
      logger.error('Failed to sign data:', error);
      throw error;
    }
  }

  /**
   * Register identity on blockchain
   */
  async registerIdentityOnBlockchain(identityDoc) {
    try {
      const identityContract = this.contracts.get('identity');
      
      // Prepare transaction data
      const txData = identityContract.methods.registerIdentity(
        identityDoc.id,
        identityDoc.publicKey,
        identityDoc.proof.hash,
        identityDoc.proof.signature
      ).encodeABI();
      
      // Send transaction
      const txHash = await this.sendTransaction({
        to: this.config.identityContract,
        data: txData,
        gas: this.config.gasLimit
      });
      
      // Update identity with blockchain info
      identityDoc.blockchainAddress = this.config.identityContract;
      identityDoc.transactionHash = txHash;
      identityDoc.status = 'registered';
      
      logger.info('Identity registered on blockchain', {
        identityId: identityDoc.id,
        txHash
      });
      
    } catch (error) {
      logger.error('Failed to register identity on blockchain:', error);
      throw error;
    }
  }

  /**
   * Verify identity
   */
  async verifyIdentity(identityId, proof) {
    try {
      const identity = this.identities.get(identityId);
      if (!identity) {
        throw new Error('Identity not found');
      }
      
      // Verify proof
      const isValid = this.verifyProof(identity, proof);
      
      if (isValid) {
        identity.status = 'verified';
        identity.verificationLevel = 'enhanced';
        
        // Update on blockchain
        if (this.contracts.has('identity')) {
          await this.updateIdentityVerification(identityId, true);
        }
        
        logger.info('Identity verified', { identityId });
        
        this.emit('identityVerified', { identityId, identity });
      }
      
      return isValid;
      
    } catch (error) {
      logger.error('Identity verification failed:', { identityId, error: error.message });
      throw error;
    }
  }

  /**
   * Verify proof
   */
  verifyProof(identity, proof) {
    try {
      // Recreate hash
      const data = JSON.stringify({
        id: identity.id,
        publicKey: identity.publicKey,
        attributes: identity.attributes,
        timestamp: identity.createdAt
      });
      
      const hash = crypto.createHash('sha256').update(data).digest('hex');
      
      // Verify hash matches
      if (hash !== proof.hash) {
        return false;
      }
      
      // Verify signature
      const isValidSignature = this.verifySignature(proof.hash, proof.signature);
      
      return isValidSignature;
      
    } catch (error) {
      logger.error('Proof verification failed:', error);
      return false;
    }
  }

  /**
   * Verify signature
   */
  verifySignature(data, signature) {
    try {
      // Verify signature using wallet
      const recoveredAddress = this.web3.eth.accounts.recover(data, signature);
      return recoveredAddress.toLowerCase() === this.wallet.address.toLowerCase();
    } catch (error) {
      logger.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Create immutable audit log
   */
  async createAuditLog(logData) {
    try {
      const logId = uuidv4();
      
      // Create audit log entry
      const auditLog = {
        id: logId,
        timestamp: Date.now(),
        data: logData,
        hash: null,
        transactionHash: null,
        blockNumber: null,
        status: 'pending'
      };
      
      // Generate hash
      const dataString = JSON.stringify(auditLog);
      auditLog.hash = crypto.createHash('sha256').update(dataString).digest('hex');
      
      // Store locally
      this.auditLogs.set(logId, auditLog);
      
      // Store on blockchain if contract available
      if (this.contracts.has('security')) {
        await this.storeAuditLogOnBlockchain(auditLog);
      }
      
      // Update metrics
      this.metrics.auditLogsCount++;
      
      logger.info('Audit log created', {
        logId,
        hash: auditLog.hash
      });
      
      this.emit('auditLogCreated', { logId, auditLog });
      
      return { logId, auditLog };
      
    } catch (error) {
      logger.error('Failed to create audit log:', { logData, error: error.message });
      throw error;
    }
  }

  /**
   * Store audit log on blockchain
   */
  async storeAuditLogOnBlockchain(auditLog) {
    try {
      const securityContract = this.contracts.get('security');
      
      // Prepare transaction data
      const txData = securityContract.methods.storeAuditLog(
        auditLog.id,
        auditLog.hash,
        auditLog.timestamp,
        JSON.stringify(auditLog.data)
      ).encodeABI();
      
      // Send transaction
      const txHash = await this.sendTransaction({
        to: this.config.contractAddress,
        data: txData,
        gas: this.config.gasLimit
      });
      
      // Update audit log
      auditLog.transactionHash = txHash;
      auditLog.status = 'stored';
      
      logger.info('Audit log stored on blockchain', {
        logId: auditLog.id,
        txHash
      });
      
    } catch (error) {
      logger.error('Failed to store audit log on blockchain:', error);
      throw error;
    }
  }

  /**
   * Verify audit log integrity
   */
  async verifyAuditLogIntegrity(logId) {
    try {
      const auditLog = this.auditLogs.get(logId);
      if (!auditLog) {
        throw new Error('Audit log not found');
      }
      
      // Verify local hash
      const dataString = JSON.stringify({
        id: auditLog.id,
        timestamp: auditLog.timestamp,
        data: auditLog.data
      });
      
      const localHash = crypto.createHash('sha256').update(dataString).digest('hex');
      const isLocalValid = localHash === auditLog.hash;
      
      // Verify on blockchain if available
      let isBlockchainValid = true;
      if (this.contracts.has('security') && auditLog.transactionHash) {
        isBlockchainValid = await this.verifyAuditLogOnBlockchain(auditLog);
      }
      
      const isValid = isLocalValid && isBlockchainValid;
      
      logger.info('Audit log integrity verified', {
        logId,
        isLocalValid,
        isBlockchainValid,
        isValid
      });
      
      return isValid;
      
    } catch (error) {
      logger.error('Audit log integrity verification failed:', { logId, error: error.message });
      throw error;
    }
  }

  /**
   * Verify audit log on blockchain
   */
  async verifyAuditLogOnBlockchain(auditLog) {
    try {
      const securityContract = this.contracts.get('security');
      
      // Get stored data from blockchain
      const storedData = await securityContract.methods.getAuditLog(auditLog.id).call();
      
      // Compare hashes
      return storedData.hash === auditLog.hash;
      
    } catch (error) {
      logger.error('Blockchain verification failed:', error);
      return false;
    }
  }

  /**
   * Execute smart contract for security policy
   */
  async executeSecurityPolicy(policyId, action, parameters) {
    try {
      const securityContract = this.contracts.get('security');
      if (!securityContract) {
        throw new Error('Security contract not available');
      }
      
      // Prepare transaction data
      const txData = securityContract.methods.executePolicy(
        policyId,
        action,
        JSON.stringify(parameters)
      ).encodeABI();
      
      // Send transaction
      const txHash = await this.sendTransaction({
        to: this.config.contractAddress,
        data: txData,
        gas: this.config.gasLimit
      });
      
      logger.info('Security policy executed', {
        policyId,
        action,
        txHash
      });
      
      return { txHash, status: 'executed' };
      
    } catch (error) {
      logger.error('Security policy execution failed:', { policyId, action, error: error.message });
      throw error;
    }
  }

  /**
   * Perform distributed consensus
   */
  async performConsensus(data, operation) {
    try {
      const consensusId = uuidv4();
      
      // Create consensus data
      const consensusData = {
        id: consensusId,
        data,
        operation,
        timestamp: Date.now(),
        votes: new Map(),
        status: 'pending',
        result: null
      };
      
      // Store consensus data
      this.consensusData.set(consensusId, consensusData);
      
      // Send to verification nodes
      const promises = this.verificationNodes.map(node => 
        this.sendConsensusRequest(node, consensusData)
      );
      
      // Wait for responses
      const responses = await Promise.allSettled(promises);
      
      // Process responses
      let validVotes = 0;
      for (const response of responses) {
        if (response.status === 'fulfilled' && response.value.valid) {
          validVotes++;
          consensusData.votes.set(response.value.nodeId, response.value);
        }
      }
      
      // Check consensus threshold
      const consensusReached = validVotes >= (this.verificationNodes.size * this.config.consensusThreshold);
      
      if (consensusReached) {
        consensusData.status = 'approved';
        consensusData.result = this.processConsensusResult(consensusData);
        
        // Execute consensus result
        await this.executeConsensusResult(consensusData);
      } else {
        consensusData.status = 'rejected';
      }
      
      // Update metrics
      this.metrics.consensusRounds++;
      
      logger.info('Consensus completed', {
        consensusId,
        status: consensusData.status,
        validVotes,
        totalNodes: this.verificationNodes.size
      });
      
      this.emit('consensusCompleted', { consensusId, consensusData });
      
      return consensusData;
      
    } catch (error) {
      logger.error('Consensus failed:', { operation, error: error.message });
      throw error;
    }
  }

  /**
   * Send consensus request to node
   */
  async sendConsensusRequest(node, consensusData) {
    try {
      // Simulate sending consensus request
      // In production, this would send HTTP request or use WebSocket
      const response = {
        nodeId: node.id,
        consensusId: consensusData.id,
        valid: Math.random() > 0.2, // 80% success rate
        signature: this.signData(consensusData.id),
        timestamp: Date.now()
      };
      
      return response;
      
    } catch (error) {
      logger.error('Consensus request failed:', { nodeId: node.id, error: error.message });
      throw error;
    }
  }

  /**
   * Process consensus result
   */
  processConsensusResult(consensusData) {
    // Process consensus result based on operation
    switch (consensusData.operation) {
      case 'identity_verification':
        return { verified: true, timestamp: Date.now() };
      case 'audit_log_verification':
        return { verified: true, integrity: 'valid' };
      case 'security_policy_execution':
        return { executed: true, policyId: consensusData.data.policyId };
      default:
        return { result: 'consensus_reached' };
    }
  }

  /**
   * Execute consensus result
   */
  async executeConsensusResult(consensusData) {
    try {
      // Execute consensus result based on operation
      switch (consensusData.operation) {
        case 'identity_verification':
          await this.updateIdentityVerification(consensusData.data.identityId, true);
          break;
        case 'audit_log_verification':
          await this.updateAuditLogStatus(consensusData.data.logId, 'verified');
          break;
        case 'security_policy_execution':
          await this.executeSecurityPolicy(
            consensusData.data.policyId,
            consensusData.data.action,
            consensusData.data.parameters
          );
          break;
      }
      
    } catch (error) {
      logger.error('Consensus result execution failed:', error);
    }
  }

  /**
   * Send transaction
   */
  async sendTransaction(txData) {
    try {
      const startTime = Date.now();
      
      // Estimate gas
      const gasEstimate = await this.web3.eth.estimateGas(txData);
      const gasLimit = Math.min(gasEstimate * 1.2, this.config.gasLimit);
      
      // Get gas price
      const gasPrice = await this.web3.eth.getGasPrice();
      
      // Prepare transaction
      const transaction = {
        ...txData,
        gas: gasLimit,
        gasPrice: gasPrice
      };
      
      // Send transaction
      const txHash = await this.web3.eth.sendTransaction(transaction);
      
      // Wait for confirmation
      const receipt = await this.waitForConfirmation(txHash);
      
      // Update metrics
      const processingTime = Date.now() - startTime;
      this.updateTransactionMetrics(receipt, processingTime);
      
      logger.info('Transaction sent', {
        txHash,
        gasUsed: receipt.gasUsed,
        blockNumber: receipt.blockNumber,
        processingTime
      });
      
      return txHash;
      
    } catch (error) {
      logger.error('Transaction failed:', { txData, error: error.message });
      throw error;
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(txHash) {
    try {
      const receipt = await this.web3.eth.getTransactionReceipt(txHash);
      
      if (!receipt) {
        throw new Error('Transaction not found');
      }
      
      if (receipt.status === false) {
        throw new Error('Transaction failed');
      }
      
      return receipt;
      
    } catch (error) {
      logger.error('Transaction confirmation failed:', { txHash, error: error.message });
      throw error;
    }
  }

  /**
   * Update transaction metrics
   */
  updateTransactionMetrics(receipt, processingTime) {
    this.metrics.totalTransactions++;
    this.metrics.successfulTransactions++;
    
    // Update average gas used
    const totalGas = this.metrics.averageGasUsed * (this.metrics.totalTransactions - 1) + parseInt(receipt.gasUsed);
    this.metrics.averageGasUsed = totalGas / this.metrics.totalTransactions;
    
    // Update average confirmation time
    const totalTime = this.metrics.averageConfirmationTime * (this.metrics.totalTransactions - 1) + processingTime;
    this.metrics.averageConfirmationTime = totalTime / this.metrics.totalTransactions;
  }

  /**
   * Start monitoring
   */
  startMonitoring() {
    setInterval(() => {
      this.monitorBlockchain();
    }, 30000); // Monitor every 30 seconds
  }

  /**
   * Monitor blockchain
   */
  async monitorBlockchain() {
    try {
      // Get latest block number
      const blockNumber = await this.web3.eth.getBlockNumber();
      this.metrics.lastBlockNumber = blockNumber;
      
      // Check pending transactions
      await this.checkPendingTransactions();
      
    } catch (error) {
      logger.error('Blockchain monitoring failed:', error);
    }
  }

  /**
   * Check pending transactions
   */
  async checkPendingTransactions() {
    for (const [txHash, txData] of this.pendingTransactions) {
      try {
        const receipt = await this.web3.eth.getTransactionReceipt(txHash);
        
        if (receipt) {
          // Transaction confirmed
          this.pendingTransactions.delete(txHash);
          
          if (receipt.status === false) {
            this.metrics.failedTransactions++;
            logger.warn('Transaction failed', { txHash });
          }
        }
      } catch (error) {
        logger.error('Pending transaction check failed:', { txHash, error: error.message });
      }
    }
  }

  /**
   * Get identity information
   */
  getIdentityInfo(identityId) {
    const identity = this.identities.get(identityId);
    return identity || null;
  }

  /**
   * Get audit log information
   */
  getAuditLogInfo(logId) {
    const auditLog = this.auditLogs.get(logId);
    return auditLog || null;
  }

  /**
   * Get blockchain metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      networkId: this.web3 ? this.web3.eth.net.getId() : null,
      walletAddress: this.wallet ? this.wallet.address : null,
      contractCount: this.contracts.size,
      verificationNodeCount: this.verificationNodes.size
    };
  }

  /**
   * Dispose resources
   */
  async dispose() {
    try {
      // Clear data
      this.identities.clear();
      this.auditLogs.clear();
      this.verificationNodes.clear();
      this.pendingTransactions.clear();
      this.consensusData.clear();
      this.contracts.clear();
      
      // Disconnect Web3
      if (this.web3 && this.web3.currentProvider && this.web3.currentProvider.disconnect) {
        this.web3.currentProvider.disconnect();
      }
      
      logger.info('Blockchain Integration disposed');
      
    } catch (error) {
      logger.error('Failed to dispose Blockchain Integration:', error);
      throw error;
    }
  }
}

module.exports = BlockchainIntegration;
