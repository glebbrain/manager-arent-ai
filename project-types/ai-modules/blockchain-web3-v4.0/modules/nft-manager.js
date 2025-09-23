const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class NFTManager {
  constructor() {
    this.nfts = new Map();
    this.provider = null;
    this.signer = null;
  }

  async initialize() {
    try {
      logger.info('Initializing NFT Manager...');
      
      // Load existing NFTs if any
      await this.loadNFTs();
      
      logger.info('NFT Manager initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize NFT Manager:', error);
      throw error;
    }
  }

  setProvider(provider, signer = null) {
    this.provider = provider;
    this.signer = signer;
  }

  async createNFTCollection(name, symbol, baseURI = '', maxSupply = null) {
    try {
      if (!this.provider) {
        throw new Error('Provider not set. Please initialize blockchain connection first.');
      }

      // ERC-721 Contract ABI (simplified)
      const erc721ABI = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function totalSupply() view returns (uint256)",
        "function tokenURI(uint256 tokenId) view returns (string)",
        "function mint(address to, uint256 tokenId) external",
        "function safeTransferFrom(address from, address to, uint256 tokenId) external",
        "function ownerOf(uint256 tokenId) view returns (address)",
        "function balanceOf(address owner) view returns (uint256)"
      ];

      // Deploy NFT contract (simplified - in real implementation, you'd use a factory)
      const contractData = {
        name,
        symbol,
        baseURI,
        maxSupply,
        contractAddress: null,
        abi: erc721ABI,
        createdAt: new Date().toISOString()
      };

      this.nfts.set(name, contractData);
      await this.saveNFTs();

      logger.info(`NFT Collection created: ${name}`);
      
      return {
        success: true,
        collectionName: name,
        symbol: symbol,
        baseURI: baseURI,
        maxSupply: maxSupply,
        message: 'NFT Collection created successfully'
      };
    } catch (error) {
      logger.error(`Failed to create NFT collection ${name}:`, error);
      throw error;
    }
  }

  async mintNFT(collectionName, toAddress, tokenId, metadataURI = '') {
    try {
      const collection = this.nfts.get(collectionName);
      if (!collection) {
        throw new Error(`NFT Collection not found: ${collectionName}`);
      }

      if (!collection.contractAddress) {
        throw new Error(`NFT Collection not deployed: ${collectionName}`);
      }

      // Create NFT data
      const nftData = {
        collectionName,
        tokenId,
        owner: toAddress,
        metadataURI: metadataURI || `${collection.baseURI}${tokenId}`,
        mintedAt: new Date().toISOString(),
        contractAddress: collection.contractAddress
      };

      // Store NFT data
      const nftKey = `${collectionName}-${tokenId}`;
      this.nfts.set(nftKey, nftData);
      await this.saveNFTs();

      logger.info(`NFT minted: ${collectionName} #${tokenId} to ${toAddress}`);
      
      return {
        success: true,
        collectionName,
        tokenId,
        owner: toAddress,
        metadataURI: nftData.metadataURI,
        contractAddress: collection.contractAddress
      };
    } catch (error) {
      logger.error(`Failed to mint NFT ${collectionName} #${tokenId}:`, error);
      throw error;
    }
  }

  async transferNFT(collectionName, tokenId, fromAddress, toAddress) {
    try {
      const nftKey = `${collectionName}-${tokenId}`;
      const nftData = this.nfts.get(nftKey);
      
      if (!nftData) {
        throw new Error(`NFT not found: ${collectionName} #${tokenId}`);
      }

      if (nftData.owner !== fromAddress) {
        throw new Error(`NFT not owned by ${fromAddress}`);
      }

      // Update owner
      nftData.owner = toAddress;
      nftData.transferredAt = new Date().toISOString();
      
      this.nfts.set(nftKey, nftData);
      await this.saveNFTs();

      logger.info(`NFT transferred: ${collectionName} #${tokenId} from ${fromAddress} to ${toAddress}`);
      
      return {
        success: true,
        collectionName,
        tokenId,
        from: fromAddress,
        to: toAddress,
        transferredAt: nftData.transferredAt
      };
    } catch (error) {
      logger.error(`Failed to transfer NFT ${collectionName} #${tokenId}:`, error);
      throw error;
    }
  }

  async getNFT(collectionName, tokenId) {
    try {
      const nftKey = `${collectionName}-${tokenId}`;
      const nftData = this.nfts.get(nftKey);
      
      if (!nftData) {
        throw new Error(`NFT not found: ${collectionName} #${tokenId}`);
      }

      return {
        success: true,
        collectionName: nftData.collectionName,
        tokenId: nftData.tokenId,
        owner: nftData.owner,
        metadataURI: nftData.metadataURI,
        contractAddress: nftData.contractAddress,
        mintedAt: nftData.mintedAt,
        transferredAt: nftData.transferredAt
      };
    } catch (error) {
      logger.error(`Failed to get NFT ${collectionName} #${tokenId}:`, error);
      throw error;
    }
  }

  async getNFTsByOwner(ownerAddress) {
    try {
      const ownerNFTs = [];
      
      for (const [key, nftData] of this.nfts.entries()) {
        if (nftData.owner === ownerAddress && nftData.tokenId !== undefined) {
          ownerNFTs.push({
            collectionName: nftData.collectionName,
            tokenId: nftData.tokenId,
            metadataURI: nftData.metadataURI,
            contractAddress: nftData.contractAddress,
            mintedAt: nftData.mintedAt
          });
        }
      }

      return {
        success: true,
        owner: ownerAddress,
        nfts: ownerNFTs,
        count: ownerNFTs.length
      };
    } catch (error) {
      logger.error(`Failed to get NFTs for owner ${ownerAddress}:`, error);
      throw error;
    }
  }

  async getCollectionInfo(collectionName) {
    try {
      const collection = this.nfts.get(collectionName);
      if (!collection) {
        throw new Error(`NFT Collection not found: ${collectionName}`);
      }

      // Count minted NFTs in this collection
      let mintedCount = 0;
      for (const [key, nftData] of this.nfts.entries()) {
        if (nftData.collectionName === collectionName && nftData.tokenId !== undefined) {
          mintedCount++;
        }
      }

      return {
        success: true,
        collectionName: collection.name,
        symbol: collection.symbol,
        baseURI: collection.baseURI,
        maxSupply: collection.maxSupply,
        mintedCount: mintedCount,
        contractAddress: collection.contractAddress,
        createdAt: collection.createdAt
      };
    } catch (error) {
      logger.error(`Failed to get collection info for ${collectionName}:`, error);
      throw error;
    }
  }

  async updateMetadata(collectionName, tokenId, newMetadataURI) {
    try {
      const nftKey = `${collectionName}-${tokenId}`;
      const nftData = this.nfts.get(nftKey);
      
      if (!nftData) {
        throw new Error(`NFT not found: ${collectionName} #${tokenId}`);
      }

      nftData.metadataURI = newMetadataURI;
      nftData.updatedAt = new Date().toISOString();
      
      this.nfts.set(nftKey, nftData);
      await this.saveNFTs();

      logger.info(`NFT metadata updated: ${collectionName} #${tokenId}`);
      
      return {
        success: true,
        collectionName,
        tokenId,
        metadataURI: newMetadataURI,
        updatedAt: nftData.updatedAt
      };
    } catch (error) {
      logger.error(`Failed to update metadata for ${collectionName} #${tokenId}:`, error);
      throw error;
    }
  }

  async listCollections() {
    try {
      const collections = [];
      
      for (const [key, data] of this.nfts.entries()) {
        if (data.symbol && !data.tokenId) { // Collection data
          collections.push({
            name: data.name,
            symbol: data.symbol,
            baseURI: data.baseURI,
            maxSupply: data.maxSupply,
            contractAddress: data.contractAddress,
            createdAt: data.createdAt
          });
        }
      }

      return {
        success: true,
        collections: collections,
        count: collections.length
      };
    } catch (error) {
      logger.error('Failed to list collections:', error);
      throw error;
    }
  }

  async loadNFTs() {
    try {
      const nftsPath = path.join(__dirname, '..', 'data', 'nfts.json');
      
      if (fs.existsSync(nftsPath)) {
        const data = fs.readFileSync(nftsPath, 'utf8');
        const nfts = JSON.parse(data);
        
        for (const [key, nftData] of Object.entries(nfts)) {
          this.nfts.set(key, nftData);
        }
        
        logger.info(`Loaded ${this.nfts.size} NFT records`);
      }
    } catch (error) {
      logger.error('Failed to load NFTs:', error);
    }
  }

  async saveNFTs() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const nftsPath = path.join(dataDir, 'nfts.json');
      const nftsObj = Object.fromEntries(this.nfts);
      fs.writeFileSync(nftsPath, JSON.stringify(nftsObj, null, 2));
      
      logger.info(`Saved ${this.nfts.size} NFT records`);
    } catch (error) {
      logger.error('Failed to save NFTs:', error);
    }
  }

  async cleanup() {
    try {
      await this.saveNFTs();
      this.nfts.clear();
      logger.info('NFT Manager cleaned up');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

module.exports = new NFTManager();
