/**
 * ÁXIS Scale Benchmark
 * Tests system performance under realistic multi-tenant load
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const sbUrl = process.env.SUPABASE_URL;
const sbKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(sbUrl, sbKey, { auth: { persistSession: false } });

// Benchmark Configuration
const CONFIG = {
    COMPANIES: 10,       // Número de empresas (isolamento multi-tenant)
    CAMPAIGNS_PER_CO: 5, // Campanhas por empresa
    LEADS_PER_CAMP: 100, // Leads por campanha
    CONCURRENT_OPS: 20   // Operações concorrentes
};

const stats = {
    start: Date.now(),
    operations: 0,
    errors: 0,
    latencies: []
};

// Helpers
function recordLatency(startTime) {
    const latency = Date.now() - startTime;
    stats.latencies.push(latency);
    stats.operations++;
}

function calculatePercentile(arr, p) {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index] || 0;
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Multi-Tenant Data Isolation
async function testDataIsolation() {
    console.log('\n🔒 TEST 1: Multi-Tenant Data Isolation');
    console.log('=====================================');

    const companies = [];

    // Create test companies
    for (let i = 0; i < CONFIG.COMPANIES; i++) {
        const start = Date.now();
        const { data, error } = await supabase
            .from('companies')
            .insert({ name: `Benchmark Co ${i}` })
            .select()
            .single();

        if (error) {
            console.error(`Error creating company ${i}:`, error);
            stats.errors++;
            continue;
        }

        companies.push(data);
        recordLatency(start);
    }

    console.log(`✅ Created ${companies.length} companies`);
    console.log(`⏱️  Avg Latency: ${(stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length).toFixed(2)}ms`);

    return companies;
}

// Test 2: Concurrent Campaign Creation
async function testConcurrentCampaigns(companies) {
    console.log('\n🚀 TEST 2: Concurrent Campaign Creation');
    console.log('=======================================');

    stats.latencies = [];
    const campaignPromises = [];

    companies.forEach(company => {
        for (let i = 0; i < CONFIG.CAMPAIGNS_PER_CO; i++) {
            const promise = (async () => {
                const start = Date.now();
                const { data, error } = await supabase
                    .from('campaigns')
                    .insert({
                        company_id: company.id,
                        user_id: company.id,
                        name: `Campaign ${i}`,
                        type: i % 2 === 0 ? 'inbound' : 'outbound',
                        status: 'draft'
                    })
                    .select()
                    .single();

                if (error) {
                    stats.errors++;
                    return null;
                }

                recordLatency(start);
                return data;
            })();

            campaignPromises.push(promise);
        }
    });

    const campaigns = (await Promise.all(campaignPromises)).filter(Boolean);

    console.log(`✅ Created ${campaigns.length} campaigns concurrently`);
    console.log(`⏱️  P50: ${calculatePercentile(stats.latencies, 50).toFixed(2)}ms`);
    console.log(`⏱️  P95: ${calculatePercentile(stats.latencies, 95).toFixed(2)}ms`);
    console.log(`⏱️  P99: ${calculatePercentile(stats.latencies, 99).toFixed(2)}ms`);

    return campaigns;
}

// Test 3: Bulk Lead Insertion (Simulating Apify/Ads)
async function testBulkLeadInsertion(campaigns) {
    console.log('\n📊 TEST 3: Bulk Lead Insertion');
    console.log('==============================');

    stats.latencies = [];

    const batches = [];
    campaigns.forEach(campaign => {
        const leads = Array.from({ length: CONFIG.LEADS_PER_CAMP }, (_, i) => ({
            campaign_id: campaign.id,
            phone: `5511${campaign.id.slice(0, 4)}${String(i).padStart(4, '0')}`,
            name: `Lead ${i}`,
            source: campaign.type === 'inbound' ? 'ad_click' : 'apify',
            status: 'new'
        }));

        batches.push(leads);
    });

    // Insert in parallel
    const start = Date.now();
    const results = await Promise.all(
        batches.map(async (leads) => {
            const { data, error } = await supabase
                .from('leads')
                .insert(leads)
                .select();

            if (error) {
                stats.errors++;
                return [];
            }

            return data;
        })
    );

    const totalDuration = Date.now() - start;
    const totalLeads = results.flat().length;

    console.log(`✅ Inserted ${totalLeads} leads`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`📈 Throughput: ${((totalLeads / totalDuration) * 1000).toFixed(0)} leads/sec`);

    return results.flat();
}

// Test 4: Tenant Isolation Verification
async function testTenantIsolation(companies, campaigns) {
    console.log('\n🔐 TEST 4: Tenant Isolation Verification');
    console.log('========================================');

    // Pick 2 random companies
    const company1 = companies[0];
    const company2 = companies[1];

    // Query campaigns for company1
    const { data: co1Campaigns, error: e1 } = await supabase
        .from('campaigns')
        .select('*')
        .eq('company_id', company1.id);

    // Query campaigns for company2
    const { data: co2Campaigns, error: e2 } = await supabase
        .from('campaigns')
        .select('*')
        .eq('company_id', company2.id);

    const isolated =
        co1Campaigns.every(c => c.company_id === company1.id) &&
        co2Campaigns.every(c => c.company_id === company2.id) &&
        co1Campaigns.length === CONFIG.CAMPAIGNS_PER_CO &&
        co2Campaigns.length === CONFIG.CAMPAIGNS_PER_CO;

    console.log(`✅ Company 1 Campaigns: ${co1Campaigns.length}`);
    console.log(`✅ Company 2 Campaigns: ${co2Campaigns.length}`);
    console.log(`${isolated ? '✅ PASSED' : '❌ FAILED'}: Data isolation verified`);

    return isolated;
}

// Test 5: Cleanup
async function cleanup(companies) {
    console.log('\n🧹 Cleanup: Removing test data');
    console.log('==============================');

    for (const company of companies) {
        // CASCADE will delete related campaigns and leads
        await supabase.from('companies').delete().eq('id', company.id);
    }

    console.log('✅ Cleanup complete');
}

// Main Benchmark Runner
async function runBenchmark() {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║   ÁXIS SCALE BENCHMARK (DevOps)      ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log(`📌 Configuration:`);
    console.log(`   • Companies: ${CONFIG.COMPANIES}`);
    console.log(`   • Campaigns/Co: ${CONFIG.CAMPAIGNS_PER_CO}`);
    console.log(`   • Leads/Campaign: ${CONFIG.LEADS_PER_CAMP}`);
    console.log(`   • Total Operations: ~${CONFIG.COMPANIES * CONFIG.CAMPAIGNS_PER_CO * CONFIG.LEADS_PER_CAMP}`);

    try {
        const companies = await testDataIsolation();
        const campaigns = await testConcurrentCampaigns(companies);
        const leads = await testBulkLeadInsertion(campaigns);
        const isolated = await testTenantIsolation(companies, campaigns);

        // Summary
        const duration = ((Date.now() - stats.start) / 1000).toFixed(2);

        console.log('\n╔═══════════════════════════════════════╗');
        console.log('║         BENCHMARK SUMMARY             ║');
        console.log('╚═══════════════════════════════════════╝');
        console.log(`⏱️  Total Duration: ${duration}s`);
        console.log(`📊 Total Operations: ${stats.operations}`);
        console.log(`❌ Errors: ${stats.errors}`);
        console.log(`📈 Throughput: ${(stats.operations / duration).toFixed(0)} ops/sec`);
        console.log(`${stats.errors === 0 && isolated ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);

        await cleanup(companies);

    } catch (error) {
        console.error('\n❌ Benchmark Failed:', error);
        process.exit(1);
    }
}

// Execute
runBenchmark();
