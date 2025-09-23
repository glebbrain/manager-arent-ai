const Web3 = require('web3');
const { ethers } = require('ethers');
const logger = require('./logger');

class BlockchainManager {
  constructor() {
    this.web3 = null;
    this.ethersProvider = null;
    this.networks = {
      ethereum: {
        mainnet: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
        goerli: 'https://goerli.infura.io/v3/YOUR_PROJECT_ID',
        sepolia: 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID'
      },
      polygon: {
        mainnet: 'https://polygon-rpc.com',
        mumbai: 'https://rpc-mumbai.maticvigil.com'
      },
      bsc: {
        mainnet: 'https://bsc-dataseed.binance.org',
        testnet: 'https://data-seed-prebsc-1-s1.binance.org:8545'
      }
    };
    this.currentNetwork = 'ethereum';
    this.currentChain = 'mainnet';
  }

  async initialize() {
    try {
      logger.info('Initializing Blockchain Manager...');
      
      // Initialize Web3
      const rpcUrl = this.networks[this.currentNetwork][this.currentChain];
      this.web3 = new Web3(rpcUrl);
      
      // Initialize Ethers provider
      this.ethersProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
      
      // Test connection
      const blockNumber = await this.web3.eth.getBlockNumber();
      logger.info(`Connected to ${this.currentNetwork} ${this.currentChain}, block: ${blockNumber}`);
      
      return true;
    } catch (error) {
      logger.error('Failed to initialize Blockchain Manager:', error);
      throw error;
    }
  }

  async switchNetwork(network, chain) {
    try {
      if (!this.networks[network] || !this.networks[network][chain]) {
        throw new Error(`Unsupported network: ${network} ${chain}`);
      }

      const rpcUrl = this.networks[network][chain];
      this.web3 = new Web3(rpcUrl);
      this.ethersProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
      this.currentNetwork = network;
      this.currentChain = chain;

      const blockNumber = await this.web3.eth.getBlockNumber();
      logger.info(`Switched to ${network} ${chain}, block: ${blockNumber}`);
      
      return { network, chain, blockNumber };
    } catch (error) {
      logger.error('Failed to switch network:', error);
      throw error;
    }
  }

  async getBalance(address) {
    try {
      const balance = await this.web3.eth.getBalance(address);
      const balanceInEth = this.web3.utils.fromWei(balance, 'ether');
      return {
        address,
        balance: balanceInEth,
        balanceWei: balance,
        network: this.currentNetwork,
        chain: this.currentChain
      };
    } catch (error) {
      logger.error('Failed to get balance:', error);
      throw error;
    }
  }

  async getTransaction(txHash) {
    try {
      const tx = await this.web3.eth.getTransaction(txHash);
      const receipt = await this.web3.eth.getTransactionReceipt(txHash);
      
      return {
        transaction: tx,
        receipt: receipt,
        status: receipt ? (receipt.status ? 'success' : 'failed') : 'pending'
      };
    } catch (error) {
      logger.error('Failed to get transaction:', error);
      throw error;
    }
  }

  async sendTransaction(txData) {
    try {
      const { from, to, value, gas, gasPrice, data } = txData;
      
      const tx = {
        from,
        to,
        value: this.web3.utils.toWei(value.toString(), 'ether'),
        gas: gas || 21000,
        gasPrice: gasPrice || await this.web3.eth.getGasPrice(),
        data: data || '0x'
      };

      const result = await this.web3.eth.sendTransaction(tx);
      logger.info(`Transaction sent: ${result.transactionHash}`);
      
      return {
        success: true,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed
      };
    } catch (error) {
      logger.error('Failed to send transaction:', error);
      throw error;
    }
  }

  async getBlock(blockNumber) {
    try {
      const block = await this.web3.eth.getBlock(blockNumber, true);
      return block;
    } catch (error) {
      logger.error('Failed to get block:', error);
      throw error;
    }
  }

  async getLatestBlock() {
    try {
      const blockNumber = await this.web3.eth.getBlockNumber();
      return await this.getBlock(blockNumber);
    } catch (error) {
      logger.error('Failed to get latest block:', error);
      throw error;
    }
  }

  async estimateGas(txData) {
    try {
      const gasEstimate = await this.web3.eth.estimateGas(txData);
      return gasEstimate;
    } catch (error) {
      logger.error('Failed to estimate gas:', error);
      throw error;
    }
  }

  async getGasPrice() {
    try {
      const gasPrice = await this.web3.eth.getGasPrice();
      return {
        gasPrice: gasPrice,
        gasPriceGwei: this.web3.utils.fromWei(gasPrice, 'gwei')
      };
    } catch (error) {
      logger.error('Failed to get gas price:', error);
      throw error;
    }
  }

  async getNetworkInfo() {
    try {
      const blockNumber = await this.web3.eth.getBlockNumber();
      const gasPrice = await this.getGasPrice();
      
      return {
        network: this.currentNetwork,
        chain: this.currentChain,
        blockNumber,
        gasPrice: gasPrice.gasPriceGwei,
        isConnected: true
      };
    } catch (error) {
      logger.error('Failed to get network info:', error);
      return {
        network: this.currentNetwork,
        chain: this.currentChain,
        isConnected: false,
        error: error.message
      };
    }
  }

  async cleanup() {
    try {
      if (this.web3 && this.web3.currentProvider && this.web3.currentProvider.disconnect) {
        this.web3.currentProvider.disconnect();
      }
      logger.info('Blockchain Manager cleaned up');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

module.exports = new BlockchainManager();
