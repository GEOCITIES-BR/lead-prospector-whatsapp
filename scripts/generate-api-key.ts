import crypto from 'node:crypto';

const PREFIX = 'lp_';
const LENGTH = 48;

function generateKey(): void {
  const raw = crypto.randomBytes(LENGTH).toString('hex');
  const key = `${PREFIX}${raw}`;
  const prefix = key.substring(0, 10);

  console.log('=== Nova API Key ===');
  console.log(`Key:    ${key}`);
  console.log(`Prefix: ${prefix}`);
  console.log('');
  console.log('Use X-API-Key header nas requisições:');
  console.log(`  curl -H "X-API-Key: ${key}" http://localhost:3000/api/health`);
  console.log('');
  console.log('Para persistir, cadastre via:');
  console.log('  POST /api/auth/api-keys { "name": "descricao" }');
  console.log('  (requer autenticação prévia)');
}

generateKey();
