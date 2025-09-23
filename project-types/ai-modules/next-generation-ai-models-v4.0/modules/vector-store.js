const { Pinecone } = require('pinecone-client');
const { WeaviateClient } = require('weaviate-ts-client');
const { ChromaClient } = require('chromadb');
const { QdrantClient } = require('qdrant-client');
const faiss = require('faiss-node');
const logger = require('./logger');

class VectorStore {
  constructor() {
    this.stores = new Map();
    this.isInitialized = false;
    this.config = {
      providers: {
        pinecone: {
          apiKey: process.env.PINECONE_API_KEY,
          environment: process.env.PINECONE_ENVIRONMENT
        },
        weaviate: {
          url: process.env.WEAVIATE_URL || 'http://localhost:8080'
        },
        chroma: {
          path: process.env.CHROMA_PATH || './chroma_db'
        },
        qdrant: {
          url: process.env.QDRANT_URL || 'http://localhost:6333'
        },
        faiss: {
          path: './faiss_indexes'
        }
      },
      defaultProvider: 'faiss',
      dimensions: 1536,
      metric: 'cosine'
    };
  }

  async initialize() {
    try {
      logger.info('Initializing Vector Store...');
      
      // Initialize FAISS (local)
      await this.initializeFAISS();
      
      // Initialize Pinecone if API key is available
      if (this.config.providers.pinecone.apiKey) {
        await this.initializePinecone();
      }
      
      // Initialize Weaviate if URL is available
      if (this.config.providers.weaviate.url) {
        await this.initializeWeaviate();
      }
      
      // Initialize Chroma
      await this.initializeChroma();
      
      // Initialize Qdrant if URL is available
      if (this.config.providers.qdrant.url) {
        await this.initializeQdrant();
      }
      
      this.isInitialized = true;
      logger.info('Vector Store initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Vector Store:', error);
      throw error;
    }
  }

  async initializeFAISS() {
    try {
      const faissStore = {
        name: 'faiss',
        type: 'local',
        client: null,
        indexes: new Map()
      };
      
      this.stores.set('faiss', faissStore);
      logger.info('FAISS vector store initialized');
    } catch (error) {
      logger.error('Failed to initialize FAISS:', error);
    }
  }

  async initializePinecone() {
    try {
      const pinecone = new Pinecone({
        apiKey: this.config.providers.pinecone.apiKey,
        environment: this.config.providers.pinecone.environment
      });
      
      const pineconeStore = {
        name: 'pinecone',
        type: 'cloud',
        client: pinecone,
        indexes: new Map()
      };
      
      this.stores.set('pinecone', pineconeStore);
      logger.info('Pinecone vector store initialized');
    } catch (error) {
      logger.error('Failed to initialize Pinecone:', error);
    }
  }

  async initializeWeaviate() {
    try {
      const weaviate = WeaviateClient.client({
        scheme: 'http',
        host: this.config.providers.weaviate.url.replace('http://', ''),
      });
      
      const weaviateStore = {
        name: 'weaviate',
        type: 'cloud',
        client: weaviate,
        indexes: new Map()
      };
      
      this.stores.set('weaviate', weaviateStore);
      logger.info('Weaviate vector store initialized');
    } catch (error) {
      logger.error('Failed to initialize Weaviate:', error);
    }
  }

  async initializeChroma() {
    try {
      const chroma = new ChromaClient({
        path: this.config.providers.chroma.path
      });
      
      const chromaStore = {
        name: 'chroma',
        type: 'local',
        client: chroma,
        indexes: new Map()
      };
      
      this.stores.set('chroma', chromaStore);
      logger.info('Chroma vector store initialized');
    } catch (error) {
      logger.error('Failed to initialize Chroma:', error);
    }
  }

  async initializeQdrant() {
    try {
      const qdrant = new QdrantClient({
        url: this.config.providers.qdrant.url
      });
      
      const qdrantStore = {
        name: 'qdrant',
        type: 'cloud',
        client: qdrant,
        indexes: new Map()
      };
      
      this.stores.set('qdrant', qdrantStore);
      logger.info('Qdrant vector store initialized');
    } catch (error) {
      logger.error('Failed to initialize Qdrant:', error);
    }
  }

  // Index Management
  async createIndex(indexName, options = {}) {
    try {
      const {
        provider = this.config.defaultProvider,
        dimensions = this.config.dimensions,
        metric = this.config.metric,
        metadata = {}
      } = options;

      const store = this.stores.get(provider);
      if (!store) {
        throw new Error(`Provider ${provider} not available`);
      }

      let result;
      switch (provider) {
        case 'faiss':
          result = await this.createFAISSIndex(indexName, dimensions, metric);
          break;
        case 'pinecone':
          result = await this.createPineconeIndex(indexName, dimensions, metric);
          break;
        case 'weaviate':
          result = await this.createWeaviateIndex(indexName, dimensions, metric);
          break;
        case 'chroma':
          result = await this.createChromaIndex(indexName, dimensions, metric);
          break;
        case 'qdrant':
          result = await this.createQdrantIndex(indexName, dimensions, metric);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      store.indexes.set(indexName, {
        name: indexName,
        provider,
        dimensions,
        metric,
        metadata,
        createdAt: new Date().toISOString(),
        ...result
      });

      logger.info(`Index ${indexName} created with provider ${provider}`);
      return result;
    } catch (error) {
      logger.error(`Failed to create index ${indexName}:`, error);
      throw error;
    }
  }

  async createFAISSIndex(indexName, dimensions, metric) {
    const index = faiss.IndexFlatL2(dimensions);
    return { index, type: 'flat' };
  }

  async createPineconeIndex(indexName, dimensions, metric) {
    const index = await this.stores.get('pinecone').client.Index(indexName);
    return { index, type: 'pinecone' };
  }

  async createWeaviateIndex(indexName, dimensions, metric) {
    // Weaviate schema creation would go here
    return { type: 'weaviate' };
  }

  async createChromaIndex(indexName, dimensions, metric) {
    const collection = await this.stores.get('chroma').client.createCollection({
      name: indexName,
      metadata: { dimension: dimensions }
    });
    return { collection, type: 'chroma' };
  }

  async createQdrantIndex(indexName, dimensions, metric) {
    const collection = await this.stores.get('qdrant').client.createCollection(indexName, {
      vectors: {
        size: dimensions,
        distance: metric.toUpperCase()
      }
    });
    return { collection, type: 'qdrant' };
  }

  // Vector Operations
  async addVectors(indexName, vectors, options = {}) {
    try {
      const {
        provider = this.config.defaultProvider,
        ids = null,
        metadata = null
      } = options;

      const store = this.stores.get(provider);
      if (!store) {
        throw new Error(`Provider ${provider} not available`);
      }

      const indexInfo = store.indexes.get(indexName);
      if (!indexInfo) {
        throw new Error(`Index ${indexName} not found`);
      }

      let result;
      switch (provider) {
        case 'faiss':
          result = await this.addFAISSVectors(indexInfo, vectors, ids, metadata);
          break;
        case 'pinecone':
          result = await this.addPineconeVectors(indexInfo, vectors, ids, metadata);
          break;
        case 'weaviate':
          result = await this.addWeaviateVectors(indexInfo, vectors, ids, metadata);
          break;
        case 'chroma':
          result = await this.addChromaVectors(indexInfo, vectors, ids, metadata);
          break;
        case 'qdrant':
          result = await this.addQdrantVectors(indexInfo, vectors, ids, metadata);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      logger.info(`Added ${vectors.length} vectors to index ${indexName}`);
      return result;
    } catch (error) {
      logger.error(`Failed to add vectors to index ${indexName}:`, error);
      throw error;
    }
  }

  async addFAISSVectors(indexInfo, vectors, ids, metadata) {
    const vectorsArray = vectors.map(v => Array.isArray(v) ? v : v.embedding);
    indexInfo.index.add(vectorsArray);
    return { count: vectors.length };
  }

  async addPineconeVectors(indexInfo, vectors, ids, metadata) {
    const upsertRequest = {
      vectors: vectors.map((vector, i) => ({
        id: ids ? ids[i] : `vec_${Date.now()}_${i}`,
        values: Array.isArray(vector) ? vector : vector.embedding,
        metadata: metadata ? metadata[i] : {}
      }))
    };
    
    await indexInfo.index.upsert(upsertRequest);
    return { count: vectors.length };
  }

  async addWeaviateVectors(indexInfo, vectors, ids, metadata) {
    // Weaviate vector addition would go here
    return { count: vectors.length };
  }

  async addChromaVectors(indexInfo, vectors, ids, metadata) {
    const documents = vectors.map((vector, i) => ({
      id: ids ? ids[i] : `vec_${Date.now()}_${i}`,
      embedding: Array.isArray(vector) ? vector : vector.embedding,
      metadata: metadata ? metadata[i] : {}
    }));
    
    await indexInfo.collection.add(documents);
    return { count: vectors.length };
  }

  async addQdrantVectors(indexInfo, vectors, ids, metadata) {
    const points = vectors.map((vector, i) => ({
      id: ids ? ids[i] : `vec_${Date.now()}_${i}`,
      vector: Array.isArray(vector) ? vector : vector.embedding,
      payload: metadata ? metadata[i] : {}
    }));
    
    await indexInfo.collection.upsert(points);
    return { count: vectors.length };
  }

  // Search Operations
  async search(indexName, queryVector, options = {}) {
    try {
      const {
        provider = this.config.defaultProvider,
        topK = 10,
        filter = null,
        includeMetadata = true
      } = options;

      const store = this.stores.get(provider);
      if (!store) {
        throw new Error(`Provider ${provider} not available`);
      }

      const indexInfo = store.indexes.get(indexName);
      if (!indexInfo) {
        throw new Error(`Index ${indexName} not found`);
      }

      let result;
      switch (provider) {
        case 'faiss':
          result = await this.searchFAISS(indexInfo, queryVector, topK);
          break;
        case 'pinecone':
          result = await this.searchPinecone(indexInfo, queryVector, topK, filter, includeMetadata);
          break;
        case 'weaviate':
          result = await this.searchWeaviate(indexInfo, queryVector, topK, filter, includeMetadata);
          break;
        case 'chroma':
          result = await this.searchChroma(indexInfo, queryVector, topK, filter, includeMetadata);
          break;
        case 'qdrant':
          result = await this.searchQdrant(indexInfo, queryVector, topK, filter, includeMetadata);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      return result;
    } catch (error) {
      logger.error(`Failed to search index ${indexName}:`, error);
      throw error;
    }
  }

  async searchFAISS(indexInfo, queryVector, topK) {
    const vector = Array.isArray(queryVector) ? queryVector : queryVector.embedding;
    const { distances, indices } = indexInfo.index.search([vector], topK);
    
    return {
      results: distances[0].map((distance, i) => ({
        id: indices[0][i],
        score: 1 / (1 + distance), // Convert distance to similarity score
        distance
      }))
    };
  }

  async searchPinecone(indexInfo, queryVector, topK, filter, includeMetadata) {
    const vector = Array.isArray(queryVector) ? queryVector : queryVector.embedding;
    
    const searchRequest = {
      vector,
      topK,
      includeMetadata
    };
    
    if (filter) {
      searchRequest.filter = filter;
    }
    
    const response = await indexInfo.index.query(searchRequest);
    
    return {
      results: response.matches.map(match => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata
      }))
    };
  }

  async searchWeaviate(indexInfo, queryVector, topK, filter, includeMetadata) {
    // Weaviate search implementation would go here
    return { results: [] };
  }

  async searchChroma(indexInfo, queryVector, topK, filter, includeMetadata) {
    const vector = Array.isArray(queryVector) ? queryVector : queryVector.embedding;
    
    const results = await indexInfo.collection.query({
      queryEmbeddings: [vector],
      nResults: topK,
      include: includeMetadata ? ['metadatas', 'documents'] : []
    });
    
    return {
      results: results.matches[0].map((match, i) => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata
      }))
    };
  }

  async searchQdrant(indexInfo, queryVector, topK, filter, includeMetadata) {
    const vector = Array.isArray(queryVector) ? queryVector : queryVector.embedding;
    
    const searchParams = {
      vector,
      limit: topK,
      with_payload: includeMetadata
    };
    
    if (filter) {
      searchParams.filter = filter;
    }
    
    const response = await indexInfo.collection.search(searchParams);
    
    return {
      results: response.map(point => ({
        id: point.id,
        score: point.score,
        metadata: point.payload
      }))
    };
  }

  // Index Management
  async deleteIndex(indexName, options = {}) {
    try {
      const { provider = this.config.defaultProvider } = options;
      
      const store = this.stores.get(provider);
      if (!store) {
        throw new Error(`Provider ${provider} not available`);
      }

      const indexInfo = store.indexes.get(indexName);
      if (!indexInfo) {
        throw new Error(`Index ${indexName} not found`);
      }

      switch (provider) {
        case 'faiss':
          // FAISS indexes are in-memory, just remove from map
          break;
        case 'pinecone':
          await indexInfo.index.delete();
          break;
        case 'weaviate':
          // Weaviate index deletion would go here
          break;
        case 'chroma':
          await indexInfo.collection.delete();
          break;
        case 'qdrant':
          await indexInfo.collection.delete();
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      store.indexes.delete(indexName);
      logger.info(`Index ${indexName} deleted successfully`);
    } catch (error) {
      logger.error(`Failed to delete index ${indexName}:`, error);
      throw error;
    }
  }

  async listIndexes(provider = null) {
    if (provider) {
      const store = this.stores.get(provider);
      return store ? Array.from(store.indexes.keys()) : [];
    }

    const allIndexes = {};
    for (const [storeName, store] of this.stores) {
      allIndexes[storeName] = Array.from(store.indexes.keys());
    }
    return allIndexes;
  }

  // Health Check
  async healthCheck() {
    try {
      const status = {
        initialized: this.isInitialized,
        providers: Array.from(this.stores.keys()),
        indexes: await this.listIndexes(),
        memoryUsage: process.memoryUsage()
      };

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        details: status
      };
    } catch (error) {
      logger.error('Vector Store health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // Cleanup
  async cleanup() {
    try {
      logger.info('Cleaning up Vector Store...');
      
      // Cleanup all indexes
      for (const [storeName, store] of this.stores) {
        for (const [indexName, indexInfo] of store.indexes) {
          try {
            if (indexInfo.index && typeof indexInfo.index.dispose === 'function') {
              indexInfo.index.dispose();
            }
          } catch (error) {
            logger.error(`Error disposing index ${indexName}:`, error);
          }
        }
        store.indexes.clear();
      }
      
      this.stores.clear();
      this.isInitialized = false;
      
      logger.info('Vector Store cleanup completed');
    } catch (error) {
      logger.error('Vector Store cleanup failed:', error);
    }
  }
}

module.exports = new VectorStore();
