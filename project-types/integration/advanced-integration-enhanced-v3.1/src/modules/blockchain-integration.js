const EventEmitter = require('events');
const { ethers } = require('ethers');
const logger = require('./logger');

/**
 * Blockchain Integration Module
 * Provides blockchain and smart contract integration capabilities
 */
class BlockchainIntegration extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: config.enabled || process.env.BLOCKCHAIN_ENABLED === 'true',
      network: config.network || process.env.BLOCKCHAIN_NETWORK || 'ethereum',
      rpcUrl: config.rpcUrl || process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545',
      privateKey: config.privateKey || process.env.BLOCKCHAIN_PRIVATE_KEY,
      contractAddress: config.contractAddress || process.env.BLOCKCHAIN_CONTRACT_ADDRESS,
      gasLimit: config.gasLimit || 21000,
      gasPrice: config.gasPrice || '20000000000', // 20 gwei
      ...config
    };

    this.provider = null;
    this.wallet = null;
    this.contracts = new Map();
    this.transactions = new Map();
    this.accounts = new Map();
    this.isRunning = false;
  }

  /**
   * Initialize blockchain integration
   */
  async start() {
    if (!this.config.enabled) {
      logger.info('Blockchain Integration is disabled');
      return;
    }

    try {
      await this.initializeProvider();
      await this.initializeWallet();
      await this.initializeNetwork();
      
      this.isRunning = true;
      logger.info('Blockchain Integration started successfully');
      this.emit('started');
    } catch (error) {
      logger.error('Failed to start Blockchain Integration:', error);
      throw error;
    }
  }

  /**
   * Stop blockchain integration
   */
  async stop() {
    try {
      if (this.provider) {
        await this.provider.destroy();
      }

      this.contracts.clear();
      this.transactions.clear();
      this.accounts.clear();
      
      this.isRunning = false;
      logger.info('Blockchain Integration stopped');
      this.emit('stopped');
    } catch (error) {
      logger.error('Error stopping Blockchain Integration:', error);
      throw error;
    }
  }

  /**
   * Initialize blockchain provider
   */
  async initializeProvider() {
    switch (this.config.network) {
      case 'ethereum':
        this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
        break;
      case 'polygon':
        this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
        break;
      case 'binance':
        this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
        break;
      default:
        throw new Error(`Unsupported blockchain network: ${this.config.network}`);
    }

    // Test connection
    const network = await this.provider.getNetwork();
    logger.info(`Connected to ${this.config.network} network: ${network.name} (${network.chainId})`);
  }

  /**
   * Initialize wallet
   */
  async initializeWallet() {
    if (!this.config.privateKey) {
      logger.warn('No private key provided, creating new wallet');
      this.wallet = ethers.Wallet.createRandom();
    } else {
      this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
    }

    const address = await this.wallet.getAddress();
    const balance = await this.provider.getBalance(address);
    
    logger.info(`Wallet initialized: ${address}`);
    logger.info(`Wallet balance: ${ethers.formatEther(balance)} ETH`);
  }

  /**
   * Initialize network-specific settings
   */
  async initializeNetwork() {
    const network = await this.provider.getNetwork();
    
    // Set gas price based on network
    if (network.chainId === 1n) { // Mainnet
      this.config.gasPrice = '20000000000'; // 20 gwei
    } else if (network.chainId === 137n) { // Polygon
      this.config.gasPrice = '30000000000'; // 30 gwei
    } else { // Testnet
      this.config.gasPrice = '1000000000'; // 1 gwei
    }
  }

  /**
   * Deploy smart contract
   */
  async deployContract(contractConfig) {
    const contract = {
      id: contractConfig.id || this.generateContractId(),
      name: contractConfig.name,
      source: contractConfig.source,
      abi: contractConfig.abi,
      bytecode: contractConfig.bytecode,
      constructorArgs: contractConfig.constructorArgs || [],
      status: 'deploying',
      createdAt: new Date()
    };

    try {
      const factory = new ethers.ContractFactory(contract.abi, contract.bytecode, this.wallet);
      const contractInstance = await factory.deploy(...contract.constructorArgs, {
        gasLimit: this.config.gasLimit,
        gasPrice: this.config.gasPrice
      });

      await contractInstance.waitForDeployment();
      contract.address = await contractInstance.getAddress();
      contract.status = 'deployed';
      contract.deployedAt = new Date();

      this.contracts.set(contract.id, contract);
      logger.info(`Contract deployed: ${contract.name} at ${contract.address}`);
      this.emit('contractDeployed', contract);

      return contract;
    } catch (error) {
      contract.status = 'failed';
      contract.error = error.message;
      logger.error(`Failed to deploy contract ${contract.name}:`, error);
      throw error;
    }
  }

  /**
   * Get contract by ID
   */
  getContract(contractId) {
    return this.contracts.get(contractId) || null;
  }

  /**
   * Get contract by address
   */
  getContractByAddress(address) {
    return Array.from(this.contracts.values())
      .find(contract => contract.address === address);
  }

  /**
   * Get all contracts
   */
  getAllContracts() {
    return Array.from(this.contracts.values());
  }

  /**
   * Execute contract method
   */
  async executeMethod(contractId, methodName, args = [], options = {}) {
    const contract = this.contracts.get(contractId);
    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`);
    }

    if (!contract.address) {
      throw new Error(`Contract not deployed: ${contractId}`);
    }

    try {
      const contractInstance = new ethers.Contract(contract.address, contract.abi, this.wallet);
      
      const txOptions = {
        gasLimit: options.gasLimit || this.config.gasLimit,
        gasPrice: options.gasPrice || this.config.gasPrice,
        value: options.value || 0
      };

      let result;
      if (options.readOnly) {
        // Read-only call
        result = await contractInstance[methodName](...args);
      } else {
        // Write transaction
        const tx = await contractInstance[methodName](...args, txOptions);
        result = await tx.wait();
        
        // Store transaction
        const transaction = {
          id: this.generateTransactionId(),
          contractId,
          methodName,
          args,
          txHash: tx.hash,
          blockNumber: result.blockNumber,
          gasUsed: result.gasUsed.toString(),
          status: 'confirmed',
          createdAt: new Date()
        };
        
        this.transactions.set(transaction.id, transaction);
        this.emit('transactionConfirmed', transaction);
      }

      logger.info(`Method executed: ${contract.name}.${methodName}`);
      return result;
    } catch (error) {
      logger.error(`Failed to execute method ${methodName}:`, error);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  getTransaction(transactionId) {
    return this.transactions.get(transactionId) || null;
  }

  /**
   * Get all transactions
   */
  getAllTransactions() {
    return Array.from(this.transactions.values());
  }

  /**
   * Get transactions for contract
   */
  getContractTransactions(contractId) {
    return Array.from(this.transactions.values())
      .filter(tx => tx.contractId === contractId);
  }

  /**
   * Get wallet balance
   */
  async getBalance(address = null) {
    const targetAddress = address || await this.wallet.getAddress();
    const balance = await this.provider.getBalance(targetAddress);
    return ethers.formatEther(balance);
  }

  /**
   * Send transaction
   */
  async sendTransaction(to, value, data = null) {
    try {
      const tx = {
        to,
        value: ethers.parseEther(value.toString()),
        gasLimit: this.config.gasLimit,
        gasPrice: this.config.gasPrice
      };

      if (data) {
        tx.data = data;
      }

      const response = await this.wallet.sendTransaction(tx);
      const receipt = await response.wait();

      const transaction = {
        id: this.generateTransactionId(),
        to,
        value: value.toString(),
        txHash: response.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: 'confirmed',
        createdAt: new Date()
      };

      this.transactions.set(transaction.id, transaction);
      logger.info(`Transaction sent: ${response.hash}`);
      this.emit('transactionSent', transaction);

      return transaction;
    } catch (error) {
      logger.error('Failed to send transaction:', error);
      throw error;
    }
  }

  /**
   * Get network status
   */
  async getNetworkStatus() {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = await this.provider.getGasPrice();
      
      return {
        network: network.name,
        chainId: network.chainId.toString(),
        blockNumber,
        gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
        isConnected: true
      };
    } catch (error) {
      return {
        network: 'unknown',
        chainId: '0',
        blockNumber: 0,
        gasPrice: '0',
        isConnected: false,
        error: error.message
      };
    }
  }

  /**
   * Get wallet information
   */
  async getWalletInfo() {
    const address = await this.wallet.getAddress();
    const balance = await this.getBalance();
    const nonce = await this.provider.getTransactionCount(address);
    
    return {
      address,
      balance,
      nonce,
      network: this.config.network
    };
  }

  /**
   * Create new account
   */
  async createAccount() {
    const wallet = ethers.Wallet.createRandom();
    const address = await wallet.getAddress();
    
    const account = {
      id: this.generateAccountId(),
      address,
      privateKey: wallet.privateKey,
      createdAt: new Date()
    };

    this.accounts.set(account.id, account);
    logger.info(`Account created: ${address}`);
    this.emit('accountCreated', account);

    return account;
  }

  /**
   * Get account by ID
   */
  getAccount(accountId) {
    return this.accounts.get(accountId) || null;
  }

  /**
   * Get all accounts
   */
  getAllAccounts() {
    return Array.from(this.accounts.values());
  }

  /**
   * Get integration status
   */
  getStatus() {
    return {
      running: this.isRunning,
      network: this.config.network,
      contracts: this.contracts.size,
      transactions: this.transactions.size,
      accounts: this.accounts.size,
      uptime: process.uptime()
    };
  }

  /**
   * Get blockchain statistics
   */
  async getStatistics() {
    const contracts = Array.from(this.contracts.values());
    const transactions = Array.from(this.transactions.values());
    const accounts = Array.from(this.accounts.values());
    const networkStatus = await this.getNetworkStatus();

    return {
      network: networkStatus,
      contracts: {
        total: contracts.length,
        deployed: contracts.filter(c => c.status === 'deployed').length,
        failed: contracts.filter(c => c.status === 'failed').length
      },
      transactions: {
        total: transactions.length,
        confirmed: transactions.filter(tx => tx.status === 'confirmed').length,
        pending: transactions.filter(tx => tx.status === 'pending').length
      },
      accounts: {
        total: accounts.length
      }
    };
  }

  /**
   * Generate unique contract ID
   */
  generateContractId() {
    return `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique transaction ID
   */
  generateTransactionId() {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique account ID
   */
  generateAccountId() {
    return `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Listen to contract events
   */
  async listenToContractEvents(contractId, eventName, callback) {
    const contract = this.contracts.get(contractId);
    if (!contract || !contract.address) {
      throw new Error(`Contract not found or not deployed: ${contractId}`);
    }

    const contractInstance = new ethers.Contract(contract.address, contract.abi, this.provider);
    
    contractInstance.on(eventName, (...args) => {
      const event = {
        contractId,
        eventName,
        args,
        timestamp: new Date()
      };
      
      logger.info(`Contract event received: ${contract.name}.${eventName}`);
      this.emit('contractEvent', event);
      callback(event);
    });
  }

  /**
   * Stop listening to contract events
   */
  async stopListeningToContractEvents(contractId, eventName) {
    const contract = this.contracts.get(contractId);
    if (!contract || !contract.address) {
      return;
    }

    const contractInstance = new ethers.Contract(contract.address, contract.abi, this.provider);
    contractInstance.removeAllListeners(eventName);
    
    logger.info(`Stopped listening to events: ${contract.name}.${eventName}`);
  }
}

module.exports = BlockchainIntegration;
