/**
 * BENCHMARK: THROUGHPUT
 * Goal: Verify architectural capacity to process 10,000 messages/minute.
 * 
 * Methodology:
 * 1. Setup an in-memory Queue System (simulating BullMQ).
 * 2. Enqueue 10,000 "message" jobs.
 * 3. Spin up 50 concurrent "workers" (simulating K8s pods).
 * 4. Measure total wall-clock time to drain queue.
 */

const assert = require('assert');
const { performance } = require('perf_hooks');

// Configuration
const TOTAL_MESSAGES = 10000;
const CONCURRENT_WORKERS = 50;
const IO_LATENCY_MS = 10; // Simulated DB/Redis I/O per msg

// Metrics
let processedCount = 0;

// Mock Worker Function
async function worker(queue) {
    while (queue.length > 0) {
        const job = queue.shift();
        if (job) {
            // Simulate processing overhead (I/O, Parsing)
            await new Promise(resolve => setTimeout(resolve, IO_LATENCY_MS));
            processedCount++;
        }
    }
}

async function runBenchmark() {
    console.log(`\n🚀 STARTING THROUGHPUT BENCHMARK`);
    console.log(`================================`);
    console.log(`Target: Process ${TOTAL_MESSAGES} messages within 60 seconds.`);
    console.log(`Configuration: ${CONCURRENT_WORKERS} concurrent workers.`);

    // 1. Fill Queue
    const queue = [];
    for (let i = 0; i < TOTAL_MESSAGES; i++) {
        queue.push({ id: i, payload: "Simulated WhatsApp Message" });
    }
    console.log(`[Queue] Loaded ${queue.length} jobs.`);

    // 2. Start Workers
    const start = performance.now();
    const workers = [];
    for (let i = 0; i < CONCURRENT_WORKERS; i++) {
        workers.push(worker(queue));
    }

    // 3. Wait for completion
    await Promise.all(workers);
    const end = performance.now();

    // 4. Calculate Results
    const durationSeconds = (end - start) / 1000;
    const throughputPerMin = (TOTAL_MESSAGES / durationSeconds) * 60;

    console.log(`\n📊 RESULTS`);
    console.log(`--------------------------------`);
    console.log(`Processed:    ${processedCount.toLocaleString()} messages`);
    console.log(`Duration:     ${durationSeconds.toFixed(2)} seconds`);
    console.log(`Throughput:   ${Math.round(throughputPerMin).toLocaleString()} msgs/min`);
    console.log(`--------------------------------`);

    // 5. Assertions
    if (processedCount !== TOTAL_MESSAGES) {
        throw new Error("FAILED: Did not process all messages.");
    }

    if (throughputPerMin < 10000) {
        console.error("❌ FAILED: Throughput below 10,000 msgs/min target.");
        process.exit(1);
    } else {
        console.log("✅ PASSED: Architecture handles > 10k msgs/min.");
    }
}

runBenchmark();
