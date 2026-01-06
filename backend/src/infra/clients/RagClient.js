/**
 * RagClient - Infrastructure Client for Vector Search and RAG
 * Translates similarity search requests to database RPC calls.
 */
class RagClient {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }

    /**
     * Performs a vector similarity search in the database.
     * @param {number[]} queryEmbedding - The embedding vector to search for.
     * @param {number} threshold - Similarity threshold (0-1).
     * @param {number} limit - Maximum number of results.
     */
    async matchDocuments(queryEmbedding, threshold = 0.7, matchCount = 5) {
        const { data, error } = await this.supabase.rpc('match_knowledge_base', {
            query_embedding: queryEmbedding,
            match_threshold: threshold,
            match_count: matchCount
        });

        if (error) {
            console.error("[RagClient] Vector Search Error:", error);
            throw error;
        }

        return data || [];
    }

    /**
     * Inserts a document with its embedding into the knowledge base.
     */
    async insertDocument(content, metadata, embedding) {
        const { data, error } = await this.supabase.from('knowledge_base').insert({
            content,
            metadata,
            embedding
        }).select();

        if (error) {
            console.error("[RagClient] Insert Document Error:", error);
            throw error;
        }
        return data;
    }
}

module.exports = RagClient;
