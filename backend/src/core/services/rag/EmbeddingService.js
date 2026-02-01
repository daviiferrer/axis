/**
 * EmbeddingService - Vector Embedding Generation
 * 
 * Uses Google's text-embedding model to generate embeddings
 * for semantic search in the RAG pipeline.
 * 
 * Supports caching to reduce API calls for repeated queries.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../../../shared/Logger').createModuleLogger('embedding');

class EmbeddingService {
    constructor({ systemConfig } = {}) {
        // Get API key from systemConfig (DI) or environment variables
        this.apiKey = systemConfig?.geminiKey || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

        if (this.apiKey) {
            this.genAI = new GoogleGenerativeAI(this.apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
            this.enabled = true;
            logger.info('✅ EmbeddingService initialized with text-embedding-004');
        } else {
            this.genAI = null;
            this.model = null;
            this.enabled = false;
            logger.warn('⚠️ EmbeddingService disabled - missing API key');
        }

        // Simple in-memory cache for embeddings
        this.cache = new Map();
        this.CACHE_MAX_SIZE = 1000;
        this.CACHE_TTL_MS = 3600000; // 1 hour
    }

    /**
     * Generate embedding for a single text.
     * 
     * @param {string} text - Text to embed
     * @param {Object} options - Options
     * @param {boolean} options.useCache - Whether to use cache (default: true)
     * @returns {Promise<number[]>} Embedding vector (768 dimensions)
     */
    async getEmbedding(text, options = { useCache: true }) {
        if (!this.enabled) {
            logger.warn('Embedding requested but service is disabled');
            return null;
        }

        if (!text || typeof text !== 'string') {
            return null;
        }

        // Normalize text for caching
        const normalizedText = text.trim().substring(0, 2000); // Limit text length
        const cacheKey = this.#generateCacheKey(normalizedText);

        // Check cache
        if (options.useCache) {
            const cached = this.#getFromCache(cacheKey);
            if (cached) {
                logger.debug({ textLength: text.length }, 'Embedding cache hit');
                return cached;
            }
        }

        try {
            const result = await this.model.embedContent(normalizedText);
            const embedding = result.embedding.values;

            // Store in cache
            if (options.useCache) {
                this.#setInCache(cacheKey, embedding);
            }

            logger.debug({
                textLength: text.length,
                embeddingDim: embedding.length
            }, 'Embedding generated');

            return embedding;
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to generate embedding');
            return null;
        }
    }

    /**
     * Generate embeddings for multiple texts (batch).
     * 
     * @param {string[]} texts - Array of texts to embed
     * @returns {Promise<Array<{text: string, embedding: number[]}>>}
     */
    async getBatchEmbeddings(texts) {
        if (!this.enabled || !texts || texts.length === 0) {
            return [];
        }

        const results = [];

        // Process in batches of 100 (API limit)
        const batchSize = 100;
        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);

            try {
                const embeddings = await Promise.all(
                    batch.map(text => this.getEmbedding(text, { useCache: true }))
                );

                batch.forEach((text, idx) => {
                    if (embeddings[idx]) {
                        results.push({ text, embedding: embeddings[idx] });
                    }
                });
            } catch (error) {
                logger.error({
                    batchStart: i,
                    batchSize: batch.length,
                    error: error.message
                }, 'Batch embedding failed');
            }
        }

        logger.info({
            totalTexts: texts.length,
            successfulEmbeddings: results.length
        }, 'Batch embeddings completed');

        return results;
    }

    /**
     * Calculate cosine similarity between two embeddings.
     * 
     * @param {number[]} a - First embedding
     * @param {number[]} b - Second embedding
     * @returns {number} Similarity score (0-1)
     */
    cosineSimilarity(a, b) {
        if (!a || !b || a.length !== b.length) {
            return 0;
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        if (normA === 0 || normB === 0) {
            return 0;
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Find most similar embeddings from a collection.
     * 
     * @param {number[]} queryEmbedding - Query embedding
     * @param {Array<{id: string, embedding: number[]}>} candidates - Candidate embeddings
     * @param {number} topK - Number of top results to return
     * @returns {Array<{id: string, similarity: number}>}
     */
    findMostSimilar(queryEmbedding, candidates, topK = 5) {
        if (!queryEmbedding || !candidates || candidates.length === 0) {
            return [];
        }

        const scored = candidates.map(candidate => ({
            id: candidate.id,
            similarity: this.cosineSimilarity(queryEmbedding, candidate.embedding)
        }));

        return scored
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK);
    }

    /**
     * Get service statistics.
     */
    getStats() {
        return {
            enabled: this.enabled,
            cacheSize: this.cache.size,
            cacheMaxSize: this.CACHE_MAX_SIZE
        };
    }

    /**
     * Clear embedding cache.
     */
    clearCache() {
        this.cache.clear();
        logger.info('Embedding cache cleared');
    }

    // --- Private methods ---

    #generateCacheKey(text) {
        // Simple hash for cache key
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return `emb_${hash}`;
    }

    #getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        // Check TTL
        if (Date.now() - cached.timestamp > this.CACHE_TTL_MS) {
            this.cache.delete(key);
            return null;
        }

        return cached.embedding;
    }

    #setInCache(key, embedding) {
        // Evict oldest if cache is full
        if (this.cache.size >= this.CACHE_MAX_SIZE) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            embedding,
            timestamp: Date.now()
        });
    }
}

module.exports = EmbeddingService;
