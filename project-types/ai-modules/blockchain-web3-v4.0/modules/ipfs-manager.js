const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('./logger');

class IPFSManager {
  constructor() {
    this.files = new Map();
    this.pins = new Map();
    this.gateways = [
      'https://ipfs.io/ipfs/',
      'https://gateway.pinata.cloud/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://dweb.link/ipfs/'
    ];
  }

  async initialize() {
    try {
      logger.info('Initializing IPFS Manager...');
      
      // Load existing files if any
      await this.loadIPFSData();
      
      logger.info('IPFS Manager initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize IPFS Manager:', error);
      throw error;
    }
  }

  async addFile(filePath, options = {}) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileBuffer = fs.readFileSync(filePath);
      const fileHash = this.calculateHash(fileBuffer);
      const fileName = path.basename(filePath);
      const fileSize = fileBuffer.length;

      const fileData = {
        hash: fileHash,
        fileName: fileName,
        originalPath: filePath,
        size: fileSize,
        type: this.getFileType(fileName),
        addedAt: new Date().toISOString(),
        pinned: false,
        metadata: options.metadata || {}
      };

      this.files.set(fileHash, fileData);
      await this.saveIPFSData();

      logger.info(`File added to IPFS: ${fileName} (${fileHash})`);
      
      return {
        success: true,
        hash: fileHash,
        fileName: fileName,
        size: fileSize,
        type: fileData.type,
        ipfsUrl: this.getIPFSUrl(fileHash),
        addedAt: fileData.addedAt
      };
    } catch (error) {
      logger.error(`Failed to add file ${filePath}:`, error);
      throw error;
    }
  }

  async addContent(content, fileName = 'content.txt', options = {}) {
    try {
      const contentBuffer = Buffer.from(content, 'utf8');
      const contentHash = this.calculateHash(contentBuffer);
      const fileSize = contentBuffer.length;

      const fileData = {
        hash: contentHash,
        fileName: fileName,
        content: content,
        size: fileSize,
        type: this.getFileType(fileName),
        addedAt: new Date().toISOString(),
        pinned: false,
        metadata: options.metadata || {}
      };

      this.files.set(contentHash, fileData);
      await this.saveIPFSData();

      logger.info(`Content added to IPFS: ${fileName} (${contentHash})`);
      
      return {
        success: true,
        hash: contentHash,
        fileName: fileName,
        size: fileSize,
        type: fileData.type,
        ipfsUrl: this.getIPFSUrl(contentHash),
        addedAt: fileData.addedAt
      };
    } catch (error) {
      logger.error(`Failed to add content:`, error);
      throw error;
    }
  }

  async getFile(hash) {
    try {
      const fileData = this.files.get(hash);
      if (!fileData) {
        throw new Error(`File not found: ${hash}`);
      }

      return {
        success: true,
        hash: fileData.hash,
        fileName: fileData.fileName,
        size: fileData.size,
        type: fileData.type,
        content: fileData.content,
        originalPath: fileData.originalPath,
        ipfsUrl: this.getIPFSUrl(hash),
        addedAt: fileData.addedAt,
        pinned: fileData.pinned,
        metadata: fileData.metadata
      };
    } catch (error) {
      logger.error(`Failed to get file ${hash}:`, error);
      throw error;
    }
  }

  async pinFile(hash) {
    try {
      const fileData = this.files.get(hash);
      if (!fileData) {
        throw new Error(`File not found: ${hash}`);
      }

      if (fileData.pinned) {
        return {
          success: true,
          hash: hash,
          message: 'File already pinned'
        };
      }

      fileData.pinned = true;
      fileData.pinnedAt = new Date().toISOString();
      this.files.set(hash, fileData);

      const pinData = {
        hash: hash,
        fileName: fileData.fileName,
        pinnedAt: fileData.pinnedAt,
        status: 'pinned'
      };
      this.pins.set(hash, pinData);
      
      await this.saveIPFSData();

      logger.info(`File pinned: ${fileData.fileName} (${hash})`);
      
      return {
        success: true,
        hash: hash,
        fileName: fileData.fileName,
        pinnedAt: fileData.pinnedAt
      };
    } catch (error) {
      logger.error(`Failed to pin file ${hash}:`, error);
      throw error;
    }
  }

  async unpinFile(hash) {
    try {
      const fileData = this.files.get(hash);
      if (!fileData) {
        throw new Error(`File not found: ${hash}`);
      }

      if (!fileData.pinned) {
        return {
          success: true,
          hash: hash,
          message: 'File not pinned'
        };
      }

      fileData.pinned = false;
      fileData.unpinnedAt = new Date().toISOString();
      this.files.set(hash, fileData);

      this.pins.delete(hash);
      await this.saveIPFSData();

      logger.info(`File unpinned: ${fileData.fileName} (${hash})`);
      
      return {
        success: true,
        hash: hash,
        fileName: fileData.fileName,
        unpinnedAt: fileData.unpinnedAt
      };
    } catch (error) {
      logger.error(`Failed to unpin file ${hash}:`, error);
      throw error;
    }
  }

  async listFiles() {
    try {
      const filesList = [];
      
      for (const [hash, fileData] of this.files.entries()) {
        filesList.push({
          hash: fileData.hash,
          fileName: fileData.fileName,
          size: fileData.size,
          type: fileData.type,
          ipfsUrl: this.getIPFSUrl(hash),
          addedAt: fileData.addedAt,
          pinned: fileData.pinned
        });
      }

      return {
        success: true,
        files: filesList,
        count: filesList.length
      };
    } catch (error) {
      logger.error('Failed to list files:', error);
      throw error;
    }
  }

  async listPinnedFiles() {
    try {
      const pinnedFiles = [];
      
      for (const [hash, pinData] of this.pins.entries()) {
        const fileData = this.files.get(hash);
        if (fileData) {
          pinnedFiles.push({
            hash: fileData.hash,
            fileName: fileData.fileName,
            size: fileData.size,
            type: fileData.type,
            ipfsUrl: this.getIPFSUrl(hash),
            pinnedAt: pinData.pinnedAt
          });
        }
      }

      return {
        success: true,
        pinnedFiles: pinnedFiles,
        count: pinnedFiles.length
      };
    } catch (error) {
      logger.error('Failed to list pinned files:', error);
      throw error;
    }
  }

  async searchFiles(query) {
    try {
      const results = [];
      const searchTerm = query.toLowerCase();
      
      for (const [hash, fileData] of this.files.entries()) {
        if (fileData.fileName.toLowerCase().includes(searchTerm) ||
            (fileData.metadata && JSON.stringify(fileData.metadata).toLowerCase().includes(searchTerm))) {
          results.push({
            hash: fileData.hash,
            fileName: fileData.fileName,
            size: fileData.size,
            type: fileData.type,
            ipfsUrl: this.getIPFSUrl(hash),
            addedAt: fileData.addedAt,
            pinned: fileData.pinned
          });
        }
      }

      return {
        success: true,
        query: query,
        results: results,
        count: results.length
      };
    } catch (error) {
      logger.error(`Failed to search files with query "${query}":`, error);
      throw error;
    }
  }

  async getFileStats() {
    try {
      let totalFiles = 0;
      let totalSize = 0;
      let pinnedFiles = 0;
      let pinnedSize = 0;
      const typeStats = {};

      for (const [hash, fileData] of this.files.entries()) {
        totalFiles++;
        totalSize += fileData.size;
        
        if (fileData.pinned) {
          pinnedFiles++;
          pinnedSize += fileData.size;
        }

        const type = fileData.type;
        typeStats[type] = (typeStats[type] || 0) + 1;
      }

      return {
        success: true,
        totalFiles,
        totalSize,
        pinnedFiles,
        pinnedSize,
        unpinnedFiles: totalFiles - pinnedFiles,
        unpinnedSize: totalSize - pinnedSize,
        typeStats
      };
    } catch (error) {
      logger.error('Failed to get file stats:', error);
      throw error;
    }
  }

  getIPFSUrl(hash) {
    return `${this.gateways[0]}${hash}`;
  }

  getAllGateways(hash) {
    return this.gateways.map(gateway => `${gateway}${hash}`);
  }

  calculateHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  getFileType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const typeMap = {
      '.txt': 'text',
      '.md': 'markdown',
      '.json': 'json',
      '.js': 'javascript',
      '.html': 'html',
      '.css': 'css',
      '.png': 'image',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.gif': 'image',
      '.svg': 'image',
      '.pdf': 'pdf',
      '.zip': 'archive',
      '.mp4': 'video',
      '.mp3': 'audio'
    };
    return typeMap[ext] || 'unknown';
  }

  async loadIPFSData() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      const filesPath = path.join(dataDir, 'ipfs-files.json');
      const pinsPath = path.join(dataDir, 'ipfs-pins.json');
      
      // Load files
      if (fs.existsSync(filesPath)) {
        const data = fs.readFileSync(filesPath, 'utf8');
        const files = JSON.parse(data);
        for (const [key, fileData] of Object.entries(files)) {
          this.files.set(key, fileData);
        }
      }
      
      // Load pins
      if (fs.existsSync(pinsPath)) {
        const data = fs.readFileSync(pinsPath, 'utf8');
        const pins = JSON.parse(data);
        for (const [key, pinData] of Object.entries(pins)) {
          this.pins.set(key, pinData);
        }
      }
      
      logger.info(`Loaded IPFS data: ${this.files.size} files, ${this.pins.size} pins`);
    } catch (error) {
      logger.error('Failed to load IPFS data:', error);
    }
  }

  async saveIPFSData() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Save files
      const filesPath = path.join(dataDir, 'ipfs-files.json');
      const filesObj = Object.fromEntries(this.files);
      fs.writeFileSync(filesPath, JSON.stringify(filesObj, null, 2));
      
      // Save pins
      const pinsPath = path.join(dataDir, 'ipfs-pins.json');
      const pinsObj = Object.fromEntries(this.pins);
      fs.writeFileSync(pinsPath, JSON.stringify(pinsObj, null, 2));
      
      logger.info(`Saved IPFS data: ${this.files.size} files, ${this.pins.size} pins`);
    } catch (error) {
      logger.error('Failed to save IPFS data:', error);
    }
  }

  async cleanup() {
    try {
      await this.saveIPFSData();
      this.files.clear();
      this.pins.clear();
      logger.info('IPFS Manager cleaned up');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

module.exports = new IPFSManager();
