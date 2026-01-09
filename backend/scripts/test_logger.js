const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const LOG_DIR = path.join(__dirname, '../tests/logs');
const LOG_FILE = path.join(LOG_DIR, 'test_run.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Create write stream
const logStream = fs.createWriteStream(LOG_FILE);

console.log(`\n📝 Test Logs being saved to: ${LOG_FILE}\n`);

// Determine the command (npx jest on Windows/Linux compatibility)
const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = ['jest', ...process.argv.slice(2)];

const child = spawn(command, args, {
    env: { ...process.env, FORCE_COLOR: 'true' }, // Force colors for better readability
    stdio: 'pipe',
    shell: true
});

// Regex to strip ANSI codes (avoiding ESM issues with strip-ansi package)
const stripAnsi = (str) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

// Process stdout
child.stdout.on('data', (data) => {
    process.stdout.write(data);
    logStream.write(stripAnsi(data.toString()));
});

// Process stderr
child.stderr.on('data', (data) => {
    process.stderr.write(data);
    logStream.write(stripAnsi(data.toString()));
});

child.on('close', (code) => {
    logStream.end();
    process.exit(code);
});
