// Script para cadastrar API key manual no banco
// Usage: npx tsx scripts/seed-api-key.ts <name> <key>
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const name = process.argv[2];
  const key = process.argv[3];

  if (!name || !key) {
    console.error('Uso: npx tsx scripts/seed-api-key.ts <name> <key>');
    console.error('Gere uma key primeiro: npx tsx scripts/generate-api-key.ts');
    process.exit(1);
  }

  const prefix = key.substring(0, 10);
  const now = new Date();

  const apiKey = await prisma.apiKey.upsert({
    where: { key },
    update: { name, active: true, lastUsed: now },
    create: { tenantId: 'default', name, key, prefix, active: true, lastUsed: now },
  });

  console.log(`API key cadastrada: ${apiKey.prefix}... (name: ${apiKey.name})`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
