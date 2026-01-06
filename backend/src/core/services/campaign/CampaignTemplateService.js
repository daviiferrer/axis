const { v4: uuidv4 } = require('uuid');
const logger = require('../../../utils/logger');

/**
 * CAMPAIGN TEMPLATE SERVICE
 * "A Fábrica de Campanhas"
 * 
 * Responsável por instanciar novas campanhas baseadas na "Tríade de Ouro" (Inbound, SDR, Recovery).
 * Injeta variáveis de produto dinamicamente.
 */
class CampaignTemplateService {
    constructor(supabase) {
        this.supabase = supabase;

        // Template Base: A Tríade de Ouro
        // Em produção, isso viria do banco (tabela campaign_templates)
        this.GOLDEN_TRIAD_TEMPLATE = {
            nodes: [
                // 1. INBOUND FLOW (Velocity)
                {
                    id: 'inbound_entry',
                    type: 'trigger',
                    label: 'Inbound Entry (Ad Click)',
                    position: { x: 100, y: 100 },
                    data: { type: 'webhook', source: 'meta_ads' }
                },
                {
                    id: 'inbound_welcome',
                    type: 'message',
                    label: 'Boas Vindas Rápida',
                    position: { x: 100, y: 250 },
                    data: {
                        // Variáveis injetadas aqui
                        template: "Olá {{lead.first_name}}, vi que você se interessou pelo {{product.name}}. Tudo bem?"
                    }
                },

                // 2. SDR FLOW (Qualification)
                {
                    id: 'sdr_entry',
                    type: 'entry_point',
                    label: 'SDR Qualification',
                    position: { x: 400, y: 100 },
                    data: { flow_name: 'sdr' }
                },
                {
                    id: 'sdr_qualify_1',
                    type: 'ai_agent',
                    label: 'Qualificação Profunda',
                    position: { x: 400, y: 250 },
                    data: {
                        system_prompt: "Você é um especialista em {{product.niche}}. Seu objetivo é verificar se o lead sofre de {{product.pain_point_1}}. O preço do produto é {{product.price}}.",
                        model: 'gpt-4-turbo'
                    }
                },

                // 3. RECOVERY FLOW (Remarketing)
                {
                    id: 'recovery_entry',
                    type: 'entry_point',
                    label: 'Recovery Flow',
                    position: { x: 700, y: 100 },
                    data: { flow_name: 'recovery' }
                }
            ],
            edges: [
                { id: 'e1', source: 'inbound_entry', target: 'inbound_welcome' },
                // Conexões lógicas seriam definidas aqui
            ]
        };
    }

    /**
     * Instancia uma nova Campanha a partir do Template "Golden Triad"
     * @param {Object} productData - Dados do produto (nome, preço, dores)
     * @param {string} organizationId
     * @param {string} userId - Criador
     */
    async createCampaignFromTemplate(productData, organizationId, userId) {
        try {
            logger.info({ product: productData.name }, '🏭 Factory: Instantiating new Campaign');

            // 1. Validar Dados do Produto
            if (!productData.name || !productData.price) {
                throw new Error('Dados do produto incompletos para template.');
            }

            // 2. Preparar Grafo com Variáveis Injetadas (Inicialização)
            // Nota: A substituição real acontece em tempo de execução (WorkflowEngine),
            // mas aqui configuramos o metadata inicial.
            const operationalMetadata = {
                product_name: productData.name,
                product_price: productData.price,
                product_niche: productData.niche || 'Geral',
                pain_points: productData.pain_points || [],
                benefits: productData.benefits || [],
                created_from_template: 'GOLDEN_TRIAD_V1'
            };

            // 3. Criar Campanha no Banco
            const { data: campaign, error } = await this.supabase
                .from('campaigns')
                .insert({
                    name: `Campanha: ${productData.name}`,
                    organization_id: organizationId,
                    status: 'draft',
                    strategy_graph: this.GOLDEN_TRIAD_TEMPLATE, // Cópia inicial do template
                    metadata: operationalMetadata, // Variáveis vitais
                    created_by: userId
                })
                .select()
                .single();

            if (error) throw error;

            logger.info({ campaignId: campaign.id }, '✅ Factory: Campaign Created Successfully');
            return campaign;

        } catch (error) {
            logger.error({ error: error.message }, '❌ Factory Error');
            throw error;
        }
    }

    /**
     * Método futuro para propagar atualizações de template
     * (Updates por Referência)
     */
    async propagateTemplateUpdate(templateId, newGraphData) {
        // Implementação da Lógica "Master Linked Blocks"
        // Buscar todas campanhas onde metadata.template_id == templateId
        // Atualizar nós marcados como is_linked: true
    }
}

module.exports = CampaignTemplateService;
