const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class DeFiManager {
  constructor() {
    this.protocols = new Map();
    this.pools = new Map();
    this.positions = new Map();
    this.provider = null;
    this.signer = null;
  }

  async initialize() {
    try {
      logger.info('Initializing DeFi Manager...');
      
      // Load existing data
      await this.loadDeFiData();
      
      logger.info('DeFi Manager initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize DeFi Manager:', error);
      throw error;
    }
  }

  setProvider(provider, signer = null) {
    this.provider = provider;
    this.signer = signer;
  }

  async createLiquidityPool(tokenA, tokenB, fee = 3000, tickSpacing = 60) {
    try {
      if (!this.provider) {
        throw new Error('Provider not set. Please initialize blockchain connection first.');
      }

      const poolId = `${tokenA}-${tokenB}-${fee}`;
      const poolData = {
        poolId,
        tokenA,
        tokenB,
        fee,
        tickSpacing,
        liquidity: 0,
        sqrtPriceX96: 0,
        tick: 0,
        createdAt: new Date().toISOString(),
        contractAddress: null
      };

      this.pools.set(poolId, poolData);
      await this.saveDeFiData();

      logger.info(`Liquidity pool created: ${poolId}`);
      
      return {
        success: true,
        poolId,
        tokenA,
        tokenB,
        fee,
        tickSpacing,
        message: 'Liquidity pool created successfully'
      };
    } catch (error) {
      logger.error(`Failed to create liquidity pool ${poolId}:`, error);
      throw error;
    }
  }

  async addLiquidity(poolId, amountA, amountB, userAddress) {
    try {
      const pool = this.pools.get(poolId);
      if (!pool) {
        throw new Error(`Pool not found: ${poolId}`);
      }

      const positionId = `${poolId}-${userAddress}-${Date.now()}`;
      const positionData = {
        positionId,
        poolId,
        userAddress,
        amountA,
        amountB,
        liquidity: Math.sqrt(amountA * amountB), // Simplified calculation
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      this.positions.set(positionId, positionData);
      
      // Update pool liquidity
      pool.liquidity += positionData.liquidity;
      this.pools.set(poolId, pool);
      
      await this.saveDeFiData();

      logger.info(`Liquidity added to pool ${poolId}: ${amountA} ${pool.tokenA} + ${amountB} ${pool.tokenB}`);
      
      return {
        success: true,
        positionId,
        poolId,
        amountA,
        amountB,
        liquidity: positionData.liquidity,
        userAddress
      };
    } catch (error) {
      logger.error(`Failed to add liquidity to pool ${poolId}:`, error);
      throw error;
    }
  }

  async removeLiquidity(positionId, userAddress) {
    try {
      const position = this.positions.get(positionId);
      if (!position) {
        throw new Error(`Position not found: ${positionId}`);
      }

      if (position.userAddress !== userAddress) {
        throw new Error(`Position not owned by ${userAddress}`);
      }

      if (position.status !== 'active') {
        throw new Error(`Position is not active: ${positionId}`);
      }

      // Update position status
      position.status = 'removed';
      position.removedAt = new Date().toISOString();
      this.positions.set(positionId, position);

      // Update pool liquidity
      const pool = this.pools.get(position.poolId);
      if (pool) {
        pool.liquidity -= position.liquidity;
        this.pools.set(position.poolId, pool);
      }

      await this.saveDeFiData();

      logger.info(`Liquidity removed from position ${positionId}`);
      
      return {
        success: true,
        positionId,
        amountA: position.amountA,
        amountB: position.amountB,
        removedAt: position.removedAt
      };
    } catch (error) {
      logger.error(`Failed to remove liquidity from position ${positionId}:`, error);
      throw error;
    }
  }

  async swapTokens(tokenIn, tokenOut, amountIn, userAddress, poolId = null) {
    try {
      if (!poolId) {
        // Find pool automatically
        for (const [id, pool] of this.pools.entries()) {
          if ((pool.tokenA === tokenIn && pool.tokenB === tokenOut) || 
              (pool.tokenA === tokenOut && pool.tokenB === tokenIn)) {
            poolId = id;
            break;
          }
        }
      }

      if (!poolId) {
        throw new Error(`No pool found for ${tokenIn}/${tokenOut}`);
      }

      const pool = this.pools.get(poolId);
      if (!pool) {
        throw new Error(`Pool not found: ${poolId}`);
      }

      // Simplified swap calculation (in real implementation, use proper AMM formula)
      const amountOut = amountIn * 0.997; // 0.3% fee
      const swapId = `swap-${Date.now()}`;

      const swapData = {
        swapId,
        poolId,
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        userAddress,
        createdAt: new Date().toISOString()
      };

      logger.info(`Swap executed: ${amountIn} ${tokenIn} -> ${amountOut} ${tokenOut}`);
      
      return {
        success: true,
        swapId,
        poolId,
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        userAddress
      };
    } catch (error) {
      logger.error(`Failed to swap tokens:`, error);
      throw error;
    }
  }

  async getUserPositions(userAddress) {
    try {
      const userPositions = [];
      
      for (const [positionId, position] of this.positions.entries()) {
        if (position.userAddress === userAddress) {
          const pool = this.pools.get(position.poolId);
          userPositions.push({
            positionId,
            poolId: position.poolId,
            tokenA: pool ? pool.tokenA : 'Unknown',
            tokenB: pool ? pool.tokenB : 'Unknown',
            amountA: position.amountA,
            amountB: position.amountB,
            liquidity: position.liquidity,
            status: position.status,
            createdAt: position.createdAt,
            removedAt: position.removedAt
          });
        }
      }

      return {
        success: true,
        userAddress,
        positions: userPositions,
        count: userPositions.length
      };
    } catch (error) {
      logger.error(`Failed to get positions for user ${userAddress}:`, error);
      throw error;
    }
  }

  async getPoolInfo(poolId) {
    try {
      const pool = this.pools.get(poolId);
      if (!pool) {
        throw new Error(`Pool not found: ${poolId}`);
      }

      // Count active positions
      let activePositions = 0;
      for (const [positionId, position] of this.positions.entries()) {
        if (position.poolId === poolId && position.status === 'active') {
          activePositions++;
        }
      }

      return {
        success: true,
        poolId: pool.poolId,
        tokenA: pool.tokenA,
        tokenB: pool.tokenB,
        fee: pool.fee,
        liquidity: pool.liquidity,
        activePositions: activePositions,
        createdAt: pool.createdAt
      };
    } catch (error) {
      logger.error(`Failed to get pool info for ${poolId}:`, error);
      throw error;
    }
  }

  async listPools() {
    try {
      const poolsList = [];
      
      for (const [poolId, pool] of this.pools.entries()) {
        poolsList.push({
          poolId: pool.poolId,
          tokenA: pool.tokenA,
          tokenB: pool.tokenB,
          fee: pool.fee,
          liquidity: pool.liquidity,
          createdAt: pool.createdAt
        });
      }

      return {
        success: true,
        pools: poolsList,
        count: poolsList.length
      };
    } catch (error) {
      logger.error('Failed to list pools:', error);
      throw error;
    }
  }

  async createYieldFarm(tokenAddress, rewardToken, rewardRate, duration) {
    try {
      const farmId = `farm-${tokenAddress}-${Date.now()}`;
      const farmData = {
        farmId,
        tokenAddress,
        rewardToken,
        rewardRate,
        duration,
        totalStaked: 0,
        totalRewards: 0,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      this.protocols.set(farmId, farmData);
      await this.saveDeFiData();

      logger.info(`Yield farm created: ${farmId}`);
      
      return {
        success: true,
        farmId,
        tokenAddress,
        rewardToken,
        rewardRate,
        duration,
        message: 'Yield farm created successfully'
      };
    } catch (error) {
      logger.error(`Failed to create yield farm:`, error);
      throw error;
    }
  }

  async stakeTokens(farmId, amount, userAddress) {
    try {
      const farm = this.protocols.get(farmId);
      if (!farm) {
        throw new Error(`Farm not found: ${farmId}`);
      }

      if (farm.status !== 'active') {
        throw new Error(`Farm is not active: ${farmId}`);
      }

      const stakeId = `stake-${farmId}-${userAddress}-${Date.now()}`;
      const stakeData = {
        stakeId,
        farmId,
        userAddress,
        amount,
        stakedAt: new Date().toISOString(),
        status: 'active'
      };

      this.positions.set(stakeId, stakeData);
      
      // Update farm total staked
      farm.totalStaked += amount;
      this.protocols.set(farmId, farm);
      
      await this.saveDeFiData();

      logger.info(`Tokens staked in farm ${farmId}: ${amount}`);
      
      return {
        success: true,
        stakeId,
        farmId,
        amount,
        userAddress
      };
    } catch (error) {
      logger.error(`Failed to stake tokens in farm ${farmId}:`, error);
      throw error;
    }
  }

  async loadDeFiData() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      const poolsPath = path.join(dataDir, 'defi-pools.json');
      const positionsPath = path.join(dataDir, 'defi-positions.json');
      const protocolsPath = path.join(dataDir, 'defi-protocols.json');
      
      // Load pools
      if (fs.existsSync(poolsPath)) {
        const data = fs.readFileSync(poolsPath, 'utf8');
        const pools = JSON.parse(data);
        for (const [key, poolData] of Object.entries(pools)) {
          this.pools.set(key, poolData);
        }
      }
      
      // Load positions
      if (fs.existsSync(positionsPath)) {
        const data = fs.readFileSync(positionsPath, 'utf8');
        const positions = JSON.parse(data);
        for (const [key, positionData] of Object.entries(positions)) {
          this.positions.set(key, positionData);
        }
      }
      
      // Load protocols
      if (fs.existsSync(protocolsPath)) {
        const data = fs.readFileSync(protocolsPath, 'utf8');
        const protocols = JSON.parse(data);
        for (const [key, protocolData] of Object.entries(protocols)) {
          this.protocols.set(key, protocolData);
        }
      }
      
      logger.info(`Loaded DeFi data: ${this.pools.size} pools, ${this.positions.size} positions, ${this.protocols.size} protocols`);
    } catch (error) {
      logger.error('Failed to load DeFi data:', error);
    }
  }

  async saveDeFiData() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Save pools
      const poolsPath = path.join(dataDir, 'defi-pools.json');
      const poolsObj = Object.fromEntries(this.pools);
      fs.writeFileSync(poolsPath, JSON.stringify(poolsObj, null, 2));
      
      // Save positions
      const positionsPath = path.join(dataDir, 'defi-positions.json');
      const positionsObj = Object.fromEntries(this.positions);
      fs.writeFileSync(positionsPath, JSON.stringify(positionsObj, null, 2));
      
      // Save protocols
      const protocolsPath = path.join(dataDir, 'defi-protocols.json');
      const protocolsObj = Object.fromEntries(this.protocols);
      fs.writeFileSync(protocolsPath, JSON.stringify(protocolsObj, null, 2));
      
      logger.info(`Saved DeFi data: ${this.pools.size} pools, ${this.positions.size} positions, ${this.protocols.size} protocols`);
    } catch (error) {
      logger.error('Failed to save DeFi data:', error);
    }
  }

  async cleanup() {
    try {
      await this.saveDeFiData();
      this.pools.clear();
      this.positions.clear();
      this.protocols.clear();
      logger.info('DeFi Manager cleaned up');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

module.exports = new DeFiManager();
