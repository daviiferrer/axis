const { execSync } = require('child_process');
const fs = require('fs');

try {
    // Delete if exists
    if (fs.existsSync('axis_vps_deploy_key')) fs.unlinkSync('axis_vps_deploy_key');
    if (fs.existsSync('axis_vps_deploy_key.pub')) fs.unlinkSync('axis_vps_deploy_key.pub');

    console.log('Generating SSH keys...');
    // We use a specific N argument syntax that usually works better cross-platform
    execSync('ssh-keygen -t ed25519 -C "github-actions-deploy" -f "axis_vps_deploy_key" -N ""', { stdio: 'inherit' });

    console.log('Keys generated successfully.');

    const pub = fs.readFileSync('axis_vps_deploy_key.pub', 'utf8');
    const priv = fs.readFileSync('axis_vps_deploy_key', 'utf8');

    console.log('\n--- PUBLIC KEY (For Hostinger) ---');
    console.log(pub.trim());
    console.log('----------------------------------');

    console.log('\n--- PRIVATE KEY (For GitHub Secrets: VPS_SSH_KEY) ---');
    console.log(priv.trim());
    console.log('-----------------------------------------------------');

} catch (error) {
    console.error('Failed to generate keys:', error.message);
}
