const { ethers } = require('ethers');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class WalletManager {
  constructor() {
    this.wallets = new Map();
    this.provider = null;
    this.encryptionKey = process.env.WALLET_ENCRYPTION_KEY || 'default-key-change-in-production';
  }

  async initialize() {
    try {
      logger.info('Initializing Wallet Manager...');
      
      // Load existing wallets if any
      await this.loadWallets();
      
      logger.info('Wallet Manager initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Wallet Manager:', error);
      throw error;
    }
  }

  setProvider(provider) {
    this.provider = provider;
  }

  async createWallet(password = null) {
    try {
      const wallet = ethers.Wallet.createRandom();
      const walletData = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic.phrase,
        createdAt: new Date().toISOString(),
        encrypted: false
      };

      // Encrypt if password provided
      if (password) {
        walletData.privateKey = this.encrypt(walletData.privateKey, password);
        walletData.mnemonic = this.encrypt(walletData.mnemonic, password);
        walletData.encrypted = true;
      }

      this.wallets.set(wallet.address, walletData);
      await this.saveWallets();

      logger.info(`New wallet created: ${wallet.address}`);
      
      return {
        success: true,
        address: wallet.address,
        mnemonic: password ? 'Encrypted' : wallet.mnemonic.phrase,
        privateKey: password ? 'Encrypted' : wallet.privateKey,
        encrypted: !!password
      };
    } catch (error) {
      logger.error('Failed to create wallet:', error);
      throw error;
    }
  }

  async importWallet(privateKey, password = null) {
    try {
      const wallet = new ethers.Wallet(privateKey);
      const walletData = {
        address: wallet.address,
        privateKey: privateKey,
        mnemonic: null,
        createdAt: new Date().toISOString(),
        encrypted: false
      };

      // Encrypt if password provided
      if (password) {
        walletData.privateKey = this.encrypt(privateKey, password);
        walletData.encrypted = true;
      }

      this.wallets.set(wallet.address, walletData);
      await this.saveWallets();

      logger.info(`Wallet imported: ${wallet.address}`);
      
      return {
        success: true,
        address: wallet.address,
        privateKey: password ? 'Encrypted' : privateKey,
        encrypted: !!password
      };
    } catch (error) {
      logger.error('Failed to import wallet:', error);
      throw error;
    }
  }

  async importFromMnemonic(mnemonic, password = null) {
    try {
      const wallet = ethers.Wallet.fromMnemonic(mnemonic);
      const walletData = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: mnemonic,
        createdAt: new Date().toISOString(),
        encrypted: false
      };

      // Encrypt if password provided
      if (password) {
        walletData.privateKey = this.encrypt(walletData.privateKey, password);
        walletData.mnemonic = this.encrypt(mnemonic, password);
        walletData.encrypted = true;
      }

      this.wallets.set(wallet.address, walletData);
      await this.saveWallets();

      logger.info(`Wallet imported from mnemonic: ${wallet.address}`);
      
      return {
        success: true,
        address: wallet.address,
        mnemonic: password ? 'Encrypted' : mnemonic,
        privateKey: password ? 'Encrypted' : wallet.privateKey,
        encrypted: !!password
      };
    } catch (error) {
      logger.error('Failed to import wallet from mnemonic:', error);
      throw error;
    }
  }

  async getWallet(address, password = null) {
    try {
      const walletData = this.wallets.get(address);
      if (!walletData) {
        throw new Error(`Wallet not found: ${address}`);
      }

      let privateKey = walletData.privateKey;
      let mnemonic = walletData.mnemonic;

      // Decrypt if encrypted and password provided
      if (walletData.encrypted && password) {
        privateKey = this.decrypt(privateKey, password);
        mnemonic = mnemonic ? this.decrypt(mnemonic, password) : null;
      } else if (walletData.encrypted && !password) {
        privateKey = 'Encrypted';
        mnemonic = 'Encrypted';
      }

      return {
        success: true,
        address: walletData.address,
        privateKey: privateKey,
        mnemonic: mnemonic,
        encrypted: walletData.encrypted,
        createdAt: walletData.createdAt
      };
    } catch (error) {
      logger.error(`Failed to get wallet ${address}:`, error);
      throw error;
    }
  }

  async getWalletSigner(address, password = null) {
    try {
      const walletData = await this.getWallet(address, password);
      
      if (walletData.privateKey === 'Encrypted') {
        throw new Error('Wallet is encrypted. Please provide password.');
      }

      const wallet = new ethers.Wallet(walletData.privateKey);
      
      if (this.provider) {
        return wallet.connect(this.provider);
      }

      return wallet;
    } catch (error) {
      logger.error(`Failed to get wallet signer for ${address}:`, error);
      throw error;
    }
  }

  async getWalletBalance(address) {
    try {
      if (!this.provider) {
        throw new Error('Provider not set. Please initialize blockchain connection first.');
      }

      const balance = await this.provider.getBalance(address);
      const balanceInEth = ethers.utils.formatEther(balance);

      return {
        success: true,
        address: address,
        balance: balanceInEth,
        balanceWei: balance.toString()
      };
    } catch (error) {
      logger.error(`Failed to get balance for wallet ${address}:`, error);
      throw error;
    }
  }

  async sendTransaction(fromAddress, toAddress, amount, password = null, options = {}) {
    try {
      const signer = await this.getWalletSigner(fromAddress, password);
      
      const tx = {
        to: toAddress,
        value: ethers.utils.parseEther(amount.toString()),
        gasLimit: options.gasLimit || 21000,
        gasPrice: options.gasPrice || await this.provider.getGasPrice()
      };

      const result = await signer.sendTransaction(tx);
      await result.wait();

      logger.info(`Transaction sent from ${fromAddress} to ${toAddress}: ${result.hash}`);
      
      return {
        success: true,
        transactionHash: result.hash,
        from: fromAddress,
        to: toAddress,
        amount: amount,
        gasUsed: result.gasLimit.toString()
      };
    } catch (error) {
      logger.error(`Failed to send transaction from ${fromAddress}:`, error);
      throw error;
    }
  }

  async listWallets() {
    try {
      const walletList = Array.from(this.wallets.values()).map(wallet => ({
        address: wallet.address,
        encrypted: wallet.encrypted,
        createdAt: wallet.createdAt
      }));

      return {
        success: true,
        wallets: walletList,
        count: walletList.length
      };
    } catch (error) {
      logger.error('Failed to list wallets:', error);
      throw error;
    }
  }

  async deleteWallet(address, password = null) {
    try {
      const walletData = this.wallets.get(address);
      if (!walletData) {
        throw new Error(`Wallet not found: ${address}`);
      }

      // Verify password if wallet is encrypted
      if (walletData.encrypted && password) {
        try {
          this.decrypt(walletData.privateKey, password);
        } catch (error) {
          throw new Error('Invalid password');
        }
      }

      this.wallets.delete(address);
      await this.saveWallets();

      logger.info(`Wallet deleted: ${address}`);
      
      return {
        success: true,
        address: address,
        message: 'Wallet deleted successfully'
      };
    } catch (error) {
      logger.error(`Failed to delete wallet ${address}:`, error);
      throw error;
    }
  }

  encrypt(text, password) {
    const cipher = crypto.createCipher('aes-256-cbc', password);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decrypt(encryptedText, password) {
    const decipher = crypto.createDecipher('aes-256-cbc', password);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async loadWallets() {
    try {
      const walletsPath = path.join(__dirname, '..', 'data', 'wallets.json');
      
      if (fs.existsSync(walletsPath)) {
        const data = fs.readFileSync(walletsPath, 'utf8');
        const wallets = JSON.parse(data);
        
        for (const [address, walletData] of Object.entries(wallets)) {
          this.wallets.set(address, walletData);
        }
        
        logger.info(`Loaded ${this.wallets.size} wallets`);
      }
    } catch (error) {
      logger.error('Failed to load wallets:', error);
    }
  }

  async saveWallets() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const walletsPath = path.join(dataDir, 'wallets.json');
      const walletsObj = Object.fromEntries(this.wallets);
      fs.writeFileSync(walletsPath, JSON.stringify(walletsObj, null, 2));
      
      logger.info(`Saved ${this.wallets.size} wallets`);
    } catch (error) {
      logger.error('Failed to save wallets:', error);
    }
  }

  async cleanup() {
    try {
      await this.saveWallets();
      this.wallets.clear();
      logger.info('Wallet Manager cleaned up');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

module.exports = new WalletManager();
