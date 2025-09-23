const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class SmartContractManager {
  constructor() {
    this.contracts = new Map();
    this.provider = null;
    this.signer = null;
  }

  async initialize() {
    try {
      logger.info('Initializing Smart Contract Manager...');
      
      // Initialize provider (will be set by blockchain manager)
      this.provider = null;
      this.signer = null;
      
      logger.info('Smart Contract Manager initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Smart Contract Manager:', error);
      throw error;
    }
  }

  setProvider(provider, signer = null) {
    this.provider = provider;
    this.signer = signer;
  }

  async deployContract(contractName, constructorArgs = [], options = {}) {
    try {
      if (!this.provider) {
        throw new Error('Provider not set. Please initialize blockchain connection first.');
      }

      const contractPath = path.join(__dirname, '..', 'contracts', `${contractName}.sol`);
      if (!fs.existsSync(contractPath)) {
        throw new Error(`Contract file not found: ${contractPath}`);
      }

      const contractSource = fs.readFileSync(contractPath, 'utf8');
      const factory = new ethers.ContractFactory(
        contractSource,
        this.signer || this.provider
      );

      const contract = await factory.deploy(...constructorArgs, options);
      await contract.deployed();

      this.contracts.set(contractName, {
        address: contract.address,
        contract: contract,
        abi: contract.interface,
        deployedAt: new Date().toISOString()
      });

      logger.info(`Contract ${contractName} deployed at: ${contract.address}`);
      
      return {
        success: true,
        contractName,
        address: contract.address,
        transactionHash: contract.deployTransaction.hash,
        abi: contract.interface
      };
    } catch (error) {
      logger.error(`Failed to deploy contract ${contractName}:`, error);
      throw error;
    }
  }

  async loadContract(contractName, address, abi) {
    try {
      if (!this.provider) {
        throw new Error('Provider not set. Please initialize blockchain connection first.');
      }

      const contract = new ethers.Contract(address, abi, this.signer || this.provider);
      
      this.contracts.set(contractName, {
        address: address,
        contract: contract,
        abi: abi,
        loadedAt: new Date().toISOString()
      });

      logger.info(`Contract ${contractName} loaded at: ${address}`);
      
      return {
        success: true,
        contractName,
        address: address,
        abi: abi
      };
    } catch (error) {
      logger.error(`Failed to load contract ${contractName}:`, error);
      throw error;
    }
  }

  async callContractMethod(contractName, methodName, args = [], options = {}) {
    try {
      const contractData = this.contracts.get(contractName);
      if (!contractData) {
        throw new Error(`Contract ${contractName} not found. Please deploy or load it first.`);
      }

      const contract = contractData.contract;
      const method = contract[methodName];
      
      if (!method) {
        throw new Error(`Method ${methodName} not found in contract ${contractName}`);
      }

      let result;
      if (options.value) {
        // For payable functions
        result = await method(...args, { value: ethers.utils.parseEther(options.value.toString()) });
      } else {
        result = await method(...args);
      }

      logger.info(`Called ${methodName} on ${contractName}:`, result);
      
      return {
        success: true,
        contractName,
        methodName,
        result: result.toString ? result.toString() : result,
        transactionHash: result.hash || null
      };
    } catch (error) {
      logger.error(`Failed to call method ${methodName} on ${contractName}:`, error);
      throw error;
    }
  }

  async getContractState(contractName) {
    try {
      const contractData = this.contracts.get(contractName);
      if (!contractData) {
        throw new Error(`Contract ${contractName} not found.`);
      }

      return {
        contractName,
        address: contractData.address,
        abi: contractData.abi,
        deployedAt: contractData.deployedAt,
        loadedAt: contractData.loadedAt,
        isDeployed: !!contractData.deployedAt,
        isLoaded: !!contractData.loadedAt
      };
    } catch (error) {
      logger.error(`Failed to get contract state for ${contractName}:`, error);
      throw error;
    }
  }

  async getContractEvents(contractName, eventName, fromBlock = 0, toBlock = 'latest') {
    try {
      const contractData = this.contracts.get(contractName);
      if (!contractData) {
        throw new Error(`Contract ${contractName} not found.`);
      }

      const contract = contractData.contract;
      const filter = contract.filters[eventName]();
      const events = await contract.queryFilter(filter, fromBlock, toBlock);

      return {
        success: true,
        contractName,
        eventName,
        events: events.map(event => ({
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          args: event.args,
          data: event.data
        }))
      };
    } catch (error) {
      logger.error(`Failed to get events for ${contractName}:`, error);
      throw error;
    }
  }

  async estimateGas(contractName, methodName, args = [], options = {}) {
    try {
      const contractData = this.contracts.get(contractName);
      if (!contractData) {
        throw new Error(`Contract ${contractName} not found.`);
      }

      const contract = contractData.contract;
      const method = contract[methodName];
      
      if (!method) {
        throw new Error(`Method ${methodName} not found in contract ${contractName}`);
      }

      let gasEstimate;
      if (options.value) {
        gasEstimate = await method.estimateGas(...args, { value: ethers.utils.parseEther(options.value.toString()) });
      } else {
        gasEstimate = await method.estimateGas(...args);
      }

      return {
        success: true,
        contractName,
        methodName,
        gasEstimate: gasEstimate.toString()
      };
    } catch (error) {
      logger.error(`Failed to estimate gas for ${methodName} on ${contractName}:`, error);
      throw error;
    }
  }

  async getContractBalance(contractName) {
    try {
      const contractData = this.contracts.get(contractName);
      if (!contractData) {
        throw new Error(`Contract ${contractName} not found.`);
      }

      const balance = await this.provider.getBalance(contractData.address);
      const balanceInEth = ethers.utils.formatEther(balance);

      return {
        success: true,
        contractName,
        address: contractData.address,
        balance: balanceInEth,
        balanceWei: balance.toString()
      };
    } catch (error) {
      logger.error(`Failed to get balance for contract ${contractName}:`, error);
      throw error;
    }
  }

  async cleanup() {
    try {
      this.contracts.clear();
      this.provider = null;
      this.signer = null;
      logger.info('Smart Contract Manager cleaned up');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

module.exports = new SmartContractManager();
