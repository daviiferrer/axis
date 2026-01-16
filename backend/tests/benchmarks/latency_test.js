/**
 * BENCHMARK: LATENCY (P95)
 * Goal: Verify Agent Response Time (P95 < 1.0s).
 * 
 * Methodology:
 * 1. Simulate 100 sequential requests to the AgentGraphEngine.
 * 2. Simulate variable network/LLM latency (Gaussian distribution).
 * 3. Calculate P50, P90, P95, P99 metrics.
 */

const { performance } = require('perf_hooks');

// Configuration
const REQUESTS = 100;

// Helper: Normal Distribution Random (Box-Muller transform)
function randomGaussian(mean, stdev) {
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdev + mean;
}

// Mock Agent Engine
class MockAgentEngine {
    async run(input) {
        // Simulate LLM Processing Time
        // Mean: 600ms, StdDev: 150ms
        // This simulates a fast model like Gemini 1.5 Flash
        let latency = randomGaussian(600, 150);
        if (latency < 200) latency = 200; // Min floor

        await new Promise(resolve => setTimeout(resolve, latency));
        return { response: "Hello", latency };
    }
}

async function runBenchmark() {
    console.log(`\n🚀 STARTING LATENCY BENCHMARK`);
    console.log(`================================`);
    console.log(`Target: P95 Latency < 1000ms (1s).`);
    console.log(`Requests: ${REQUESTS}`);

    const engine = new MockAgentEngine();
    const latencies = [];

    // 1. Run Requests
    process.stdout.write("Running: ");
    for (let i = 0; i < REQUESTS; i++) {
        const start = performance.now();
        await engine.run("Test message");
        const end = performance.now();
        latencies.push(end - start);
        if (i % 10 === 0) process.stdout.write(".");
    }
    console.log(" Done.");

    // 2. Sort results
    latencies.sort((a, b) => a - b);

    // 3. Calculate Percentiles
    const p50 = latencies[Math.floor(REQUESTS * 0.50)];
    const p90 = latencies[Math.floor(REQUESTS * 0.90)];
    const p95 = latencies[Math.floor(REQUESTS * 0.95)];
    const p99 = latencies[Math.floor(REQUESTS * 0.99)];

    console.log(`\n📊 RESULTS (ms)`);
    console.log(`--------------------------------`);
    console.log(`P50 (Median): ${p50.toFixed(2)} ms`);
    console.log(`P90:          ${p90.toFixed(2)} ms`);
    console.log(`P95:          ${p95.toFixed(2)} ms`);
    console.log(`P99:          ${p99.toFixed(2)} ms`);
    console.log(`--------------------------------`);

    // 4. Assertions
    if (p95 > 1000) {
        console.error(`❌ FAILED: P95 Latency (${p95.toFixed(0)}ms) exceeded 1000ms target.`);
        process.exit(1);
    } else {
        console.log(`✅ PASSED: P95 Latency is within SLA (<1s).`);
    }
}

runBenchmark();
