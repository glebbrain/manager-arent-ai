# Blockchain & Web3 Integration v4.0

## Overview

The Blockchain & Web3 Integration v4.0 module provides comprehensive blockchain and Web3 functionality for the ManagerAgentAI system. This module includes support for multiple blockchain networks, smart contracts, wallets, NFTs, DeFi protocols, DAOs, and IPFS integration.

## Features

### 🔗 Blockchain Management
- Multi-network support (Ethereum, Polygon, BSC)
- Network switching capabilities
- Balance checking and transaction management
- Block and transaction querying
- Gas estimation and price monitoring

### 📜 Smart Contract Management
- Contract deployment and loading
- Method calling and state management
- Event monitoring and filtering
- Gas estimation for contract interactions
- Contract balance management

### 💼 Wallet Management
- Wallet creation and import (private key, mnemonic)
- Wallet encryption and security
- Transaction sending and management
- Multi-wallet support
- Balance monitoring

### 🎨 NFT Management
- NFT collection creation and management
- NFT minting and transfer
- Metadata management
- Owner tracking and querying
- Collection statistics

### 💰 DeFi Integration
- Liquidity pool creation and management
- Token swapping functionality
- Yield farming and staking
- Position tracking
- Pool statistics and analytics

### 🏛️ DAO Management
- DAO creation and governance
- Proposal creation and voting
- Member management
- Voting power and quorum management
- Proposal execution

### 📁 IPFS Integration
- File and content storage
- File pinning and unpinning
- Content search and discovery
- Multiple gateway support
- File statistics and management

## Installation

```bash
npm install
```

## Dependencies

- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **helmet**: Security middleware
- **morgan**: HTTP request logger
- **web3**: Ethereum JavaScript API
- **ethers**: Ethereum library
- **multer**: File upload handling
- **dotenv**: Environment variable management

## Configuration

Create a `.env` file in the module directory:

```env
# Server Configuration
PORT=3003
NODE_ENV=development

# Blockchain Configuration
ETHEREUM_MAINNET_RPC=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
ETHEREUM_GOERLI_RPC=https://goerli.infura.io/v3/YOUR_PROJECT_ID
POLYGON_MAINNET_RPC=https://polygon-rpc.com
BSC_MAINNET_RPC=https://bsc-dataseed.binance.org

# Security
WALLET_ENCRYPTION_KEY=your-secure-encryption-key

# IPFS Configuration
IPFS_GATEWAY=https://ipfs.io/ipfs/
```

## API Endpoints

### Blockchain Management
- `GET /api/blockchain/network` - Get current network information
- `POST /api/blockchain/network/switch` - Switch blockchain network
- `GET /api/blockchain/balance/:address` - Get address balance
- `GET /api/blockchain/transaction/:txHash` - Get transaction details
- `POST /api/blockchain/transaction/send` - Send transaction
- `GET /api/blockchain/block/:blockNumber` - Get block information
- `GET /api/blockchain/block/latest` - Get latest block
- `POST /api/blockchain/gas/estimate` - Estimate gas for transaction
- `GET /api/blockchain/gas/price` - Get current gas price

### Smart Contract Management
- `POST /api/contract/deploy` - Deploy smart contract
- `POST /api/contract/load` - Load existing contract
- `POST /api/contract/call` - Call contract method
- `GET /api/contract/state/:contractName` - Get contract state
- `GET /api/contract/events/:contractName/:eventName` - Get contract events
- `POST /api/contract/gas/estimate` - Estimate gas for contract method
- `GET /api/contract/balance/:contractName` - Get contract balance

### Wallet Management
- `POST /api/wallet/create` - Create new wallet
- `POST /api/wallet/import/private-key` - Import wallet from private key
- `POST /api/wallet/import/mnemonic` - Import wallet from mnemonic
- `GET /api/wallet/:address` - Get wallet information
- `GET /api/wallet/:address/balance` - Get wallet balance
- `POST /api/wallet/:address/send` - Send transaction from wallet
- `GET /api/wallet/` - List all wallets
- `DELETE /api/wallet/:address` - Delete wallet

### NFT Management
- `POST /api/nft/collection` - Create NFT collection
- `POST /api/nft/mint` - Mint NFT
- `POST /api/nft/transfer` - Transfer NFT
- `GET /api/nft/:collectionName/:tokenId` - Get NFT details
- `GET /api/nft/owner/:ownerAddress` - Get NFTs by owner
- `GET /api/nft/collection/:collectionName` - Get collection info
- `PUT /api/nft/:collectionName/:tokenId/metadata` - Update NFT metadata
- `GET /api/nft/collections` - List all collections

### DeFi Management
- `POST /api/defi/pool` - Create liquidity pool
- `POST /api/defi/pool/:poolId/liquidity` - Add liquidity to pool
- `POST /api/defi/position/:positionId/remove` - Remove liquidity
- `POST /api/defi/swap` - Swap tokens
- `GET /api/defi/positions/:userAddress` - Get user positions
- `GET /api/defi/pool/:poolId` - Get pool information
- `GET /api/defi/pools` - List all pools
- `POST /api/defi/farm` - Create yield farm
- `POST /api/defi/farm/:farmId/stake` - Stake tokens in farm

### DAO Management
- `POST /api/dao/` - Create DAO
- `POST /api/dao/:daoId/members` - Add member to DAO
- `POST /api/dao/:daoId/proposals` - Create proposal
- `POST /api/dao/proposals/:proposalId/vote` - Vote on proposal
- `POST /api/dao/proposals/:proposalId/execute` - Execute proposal
- `GET /api/dao/proposals/:proposalId` - Get proposal details
- `GET /api/dao/:daoId/proposals` - Get DAO proposals
- `GET /api/dao/:daoId/members` - Get DAO members
- `GET /api/dao/:daoId` - Get DAO information
- `GET /api/dao/` - List all DAOs

### IPFS Management
- `POST /api/ipfs/file` - Upload file to IPFS
- `POST /api/ipfs/content` - Add content to IPFS
- `GET /api/ipfs/file/:hash` - Get file from IPFS
- `POST /api/ipfs/file/:hash/pin` - Pin file
- `DELETE /api/ipfs/file/:hash/pin` - Unpin file
- `GET /api/ipfs/files` - List all files
- `GET /api/ipfs/pinned` - List pinned files
- `GET /api/ipfs/search?q=query` - Search files
- `GET /api/ipfs/stats` - Get file statistics
- `GET /api/ipfs/url/:hash` - Get IPFS URLs

### Health Monitoring
- `GET /api/health/` - Basic health check
- `GET /api/health/detailed` - Detailed health check
- `GET /api/health/blockchain` - Blockchain service health
- `GET /api/health/wallet` - Wallet service health

## Usage Examples

### Create and Use Wallet

```javascript
// Create new wallet
const response = await fetch('http://localhost:3003/api/wallet/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: 'secure-password' })
});

const wallet = await response.json();
console.log('New wallet:', wallet.address);

// Get wallet balance
const balanceResponse = await fetch(`http://localhost:3003/api/wallet/${wallet.address}/balance`);
const balance = await balanceResponse.json();
console.log('Balance:', balance.balance);
```

### Deploy Smart Contract

```javascript
// Deploy contract
const deployResponse = await fetch('http://localhost:3003/api/contract/deploy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contractName: 'MyContract',
    constructorArgs: ['Hello World'],
    options: { gasLimit: 1000000 }
  })
});

const contract = await deployResponse.json();
console.log('Contract deployed at:', contract.address);
```

### Create NFT Collection

```javascript
// Create NFT collection
const collectionResponse = await fetch('http://localhost:3003/api/nft/collection', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'MyNFTCollection',
    symbol: 'MNC',
    baseURI: 'https://api.mynft.com/metadata/',
    maxSupply: 10000
  })
});

const collection = await collectionResponse.json();
console.log('Collection created:', collection.collectionName);
```

### Add File to IPFS

```javascript
// Add file to IPFS
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('metadata', JSON.stringify({ description: 'My file' }));

const ipfsResponse = await fetch('http://localhost:3003/api/ipfs/file', {
  method: 'POST',
  body: formData
});

const ipfsResult = await ipfsResponse.json();
console.log('File added to IPFS:', ipfsResult.hash);
```

## Data Storage

The module stores data in the following locations:
- `data/wallets.json` - Wallet information
- `data/nfts.json` - NFT data
- `data/defi-pools.json` - DeFi pool data
- `data/defi-positions.json` - DeFi position data
- `data/defi-protocols.json` - DeFi protocol data
- `data/daos.json` - DAO data
- `data/dao-proposals.json` - DAO proposal data
- `data/dao-votes.json` - DAO vote data
- `data/dao-members.json` - DAO member data
- `data/ipfs-files.json` - IPFS file data
- `data/ipfs-pins.json` - IPFS pin data
- `logs/` - Application logs

## Security Considerations

1. **Private Key Security**: Wallets can be encrypted with passwords
2. **Environment Variables**: Sensitive data stored in environment variables
3. **HTTPS**: Use HTTPS in production
4. **Access Control**: Implement proper authentication and authorization
5. **Rate Limiting**: Consider implementing rate limiting for API endpoints

## Error Handling

The module includes comprehensive error handling:
- Input validation
- Network error handling
- Transaction error handling
- Service availability checks
- Graceful degradation

## Monitoring and Logging

- Structured logging with timestamps
- Health check endpoints
- Service status monitoring
- Performance metrics
- Error tracking

## Development

```bash
# Start development server
npm start

# Run with environment variables
NODE_ENV=development npm start
```

## Production Deployment

1. Set up environment variables
2. Configure blockchain RPC endpoints
3. Set up proper security measures
4. Configure monitoring and logging
5. Deploy with process manager (PM2, Docker, etc.)

## License

This module is part of the ManagerAgentAI system and follows the same licensing terms.

## Support

For issues and questions related to this module, please refer to the main ManagerAgentAI documentation or create an issue in the project repository.
