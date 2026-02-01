/**
 * HybridSearchService - Vector + Full-Text Search for RAG
 * 
 * Implements Reciprocal Rank Fusion (RRF) to combine:
 * 1. Semantic search (pgvector) - contextual meaning
 * 2. Lexical search (pg_trgm + tsvector) - exact keyword matches
 * 
 * This prevents the "vocabulary mismatch problem" where pure vector
 * search misses SKUs, error codes, and domain-specific terms.
 * 
 * @see https://paradedb.com/hybrid-search
 */
const logger = require('../../../shared/Logger').createModuleLogger('hybrid-search');

class HybridSearchService {
    constructor({ supabaseClient, embeddingService }) {
        this.supabase = supabaseClient;
        this.embeddingService = embeddingService;

        // RRF constant (typically 60 works well)
        this.RRF_K = 60;

        // Default limits
        this.SEMANTIC_LIMIT = 50;
        this.LEXICAL_LIMIT = 50;
        this.FINAL_LIMIT = 5;
    }

    /**
     * Hybrid search combining vector and full-text search.
     * Returns the most relevant documents using RRF.
     * 
     * @param {string} query - User query
     * @param {string} companyId - Company ID for RLS filtering
     * @param {Object} options - Search options
     * @param {string[]} options.tables - Tables to search (default: ['products', 'faqs'])
     * @param {number} options.limit - Max results (default: 5)
     * @param {number} options.minScore - Minimum RRF score threshold
     * @returns {Promise<Array<{id: string, content: string, score: number, source: string}>>}
     */
    async search(query, companyId, options = {}) {
        const {
            tables = ['products', 'faqs'],
            limit = this.FINAL_LIMIT,
            minScore = 0.01
        } = options;

        try {
            logger.debug({ query, companyId, tables }, 'Starting hybrid search');

            // Generate embedding for semantic search
            const queryEmbedding = await this.embeddingService?.getEmbedding(query);

            // Perform searches in parallel
            const [semanticResults, lexicalResults] = await Promise.all([
                queryEmbedding ? this.#semanticSearch(query, queryEmbedding, companyId, tables) : [],
                this.#lexicalSearch(query, companyId, tables)
            ]);

            // Combine with RRF
            const combined = this.#reciprocalRankFusion(semanticResults, lexicalResults);

            // Filter by minimum score and limit
            const filtered = combined
                .filter(r => r.score >= minScore)
                .slice(0, limit);

            logger.info({
                query,
                semanticCount: semanticResults.length,
                lexicalCount: lexicalResults.length,
                finalCount: filtered.length
            }, 'Hybrid search completed');

            return filtered;
        } catch (error) {
            logger.error({ query, error: error.message }, 'Hybrid search failed');
            return [];
        }
    }

    /**
     * Semantic search using pgvector cosine similarity.
     */
    async #semanticSearch(query, queryEmbedding, companyId, tables) {
        const results = [];

        for (const table of tables) {
            try {
                // Check if table has embedding column
                const { data, error } = await this.supabase
                    .rpc('match_documents', {
                        query_embedding: queryEmbedding,
                        match_threshold: 0.5,
                        match_count: this.SEMANTIC_LIMIT,
                        table_name: table,
                        company_id: companyId
                    });

                if (error) {
                    logger.warn({ table, error: error.message }, 'Semantic search RPC failed, trying fallback');
                    continue;
                }

                if (data) {
                    results.push(...data.map(d => ({
                        id: d.id,
                        content: d.content,
                        title: d.title,
                        score: 1 - d.similarity, // Convert distance to similarity
                        source: table,
                        type: 'semantic'
                    })));
                }
            } catch (err) {
                logger.warn({ table, error: err.message }, 'Semantic search error');
            }
        }

        // Sort by score descending
        return results.sort((a, b) => b.score - a.score);
    }

    /**
     * Lexical search using PostgreSQL trigram similarity and full-text search.
     */
    async #lexicalSearch(query, companyId, tables) {
        const results = [];
        const searchTerms = this.#prepareSearchTerms(query);

        for (const table of tables) {
            try {
                // Use multiple search strategies
                const { data: trigramData } = await this.supabase
                    .from(table)
                    .select('id, name, description, content')
                    .eq('company_id', companyId)
                    .or(`name.ilike.%${searchTerms}%,description.ilike.%${searchTerms}%`)
                    .limit(this.LEXICAL_LIMIT);

                if (trigramData) {
                    results.push(...trigramData.map(d => ({
                        id: d.id,
                        content: d.content || d.description || d.name,
                        title: d.name,
                        score: this.#calculateTrigramScore(query, d),
                        source: table,
                        type: 'lexical'
                    })));
                }

                // Full-text search with ts_rank
                const { data: ftsData } = await this.supabase
                    .from(table)
                    .select('id, name, description, content')
                    .eq('company_id', companyId)
                    .textSearch('fts', searchTerms, {
                        type: 'websearch',
                        config: 'portuguese'
                    })
                    .limit(this.LEXICAL_LIMIT);

                if (ftsData) {
                    // Avoid duplicates
                    const existingIds = new Set(results.map(r => r.id));
                    results.push(...ftsData
                        .filter(d => !existingIds.has(d.id))
                        .map(d => ({
                            id: d.id,
                            content: d.content || d.description || d.name,
                            title: d.name,
                            score: 0.5, // FTS match base score
                            source: table,
                            type: 'fts'
                        }))
                    );
                }
            } catch (err) {
                logger.warn({ table, error: err.message }, 'Lexical search error');
            }
        }

        // Sort by score descending
        return results.sort((a, b) => b.score - a.score);
    }

    /**
     * Reciprocal Rank Fusion (RRF) to combine semantic and lexical results.
     * 
     * Formula: RRF(d) = Σ 1 / (k + rank(d))
     * 
     * @see https://www.elastic.co/guide/en/elasticsearch/reference/current/rrf.html
     */
    #reciprocalRankFusion(semanticResults, lexicalResults) {
        const scores = new Map();

        // Calculate semantic RRF scores
        semanticResults.forEach((result, index) => {
            const rrfScore = 1 / (this.RRF_K + index + 1);
            const existing = scores.get(result.id) || { ...result, score: 0 };
            existing.score += rrfScore;
            existing.semanticRank = index + 1;
            scores.set(result.id, existing);
        });

        // Calculate lexical RRF scores
        lexicalResults.forEach((result, index) => {
            const rrfScore = 1 / (this.RRF_K + index + 1);
            const existing = scores.get(result.id) || { ...result, score: 0 };
            existing.score += rrfScore;
            existing.lexicalRank = index + 1;
            scores.set(result.id, existing);
        });

        // Convert to array and sort by combined score
        const combined = Array.from(scores.values())
            .sort((a, b) => b.score - a.score);

        return combined;
    }

    /**
     * Prepare search terms for lexical queries.
     */
    #prepareSearchTerms(query) {
        // Normalize and escape special characters
        return query
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .trim()
            .split(/\s+/)
            .filter(term => term.length > 2)
            .join(' & ');
    }

    /**
     * Calculate trigram similarity score.
     */
    #calculateTrigramScore(query, document) {
        const queryLower = query.toLowerCase();
        const content = (document.name || '') + ' ' + (document.description || '');
        const contentLower = content.toLowerCase();

        // Simple overlap calculation
        const queryWords = new Set(queryLower.split(/\s+/));
        const contentWords = new Set(contentLower.split(/\s+/));

        let matches = 0;
        for (const word of queryWords) {
            if (contentWords.has(word)) matches++;
        }

        return queryWords.size > 0 ? matches / queryWords.size : 0;
    }

    /**
     * Format search results for injection into prompt.
     * 
     * @param {Array} results - Search results
     * @param {number} maxTokens - Approximate token limit
     * @returns {string} Formatted context for prompt
     */
    formatForPrompt(results, maxTokens = 1000) {
        if (!results || results.length === 0) {
            return '';
        }

        let context = '';
        let estimatedTokens = 0;

        for (const result of results) {
            const entry = `
📌 ${result.title || 'Document'} (${result.source})
${result.content}
---`;

            // Rough token estimation (4 chars per token)
            const entryTokens = Math.ceil(entry.length / 4);

            if (estimatedTokens + entryTokens > maxTokens) {
                break;
            }

            context += entry;
            estimatedTokens += entryTokens;
        }

        return context.trim();
    }
}

module.exports = HybridSearchService;
