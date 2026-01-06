const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Global Mocks for External Infrastructure
jest.mock('../src/infra/clients/GeminiClient');
jest.mock('../src/infra/clients/WahaClient');

console.log('🧪 Test Environment Setup Complete');
