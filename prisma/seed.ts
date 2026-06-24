import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HASH_ALGO = 'pbkdf2_sha512';
const HASH_ITERATIONS = 100000;
const HASH_KEY_LENGTH = 64;

function hashPassword(password: string, salt: string): string {
  const hash = crypto
    .pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, 'sha512')
    .toString('hex');
  return `${HASH_ALGO}$${HASH_ITERATIONS}$${salt}$${hash}`;
}

async function main(): Promise<void> {
  console.log('[seed] Iniciando seed do banco...');

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: { nome: 'Default', slug: 'default' },
  });

  console.log('[seed] Tenant padrão:', tenant.id);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@leadprospector.app';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
  const adminSalt = crypto.randomBytes(16).toString('hex');
  const adminHash = hashPassword(adminPassword, adminSalt);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminHash, active: true },
    create: {
      email: adminEmail,
      name: 'Admin',
      passwordHash: adminHash,
      role: 'admin',
      tenantId: tenant.id,
    },
  });

  console.log('[seed] Usuário admin criado/atualizado:', adminEmail);

  const lead = await prisma.lead.create({
    data: {
      nome: 'Empresa Exemplo',
      empresa: 'Exemplo Ltda',
      cargo: 'CEO',
      telefone: '5511999999999',
      whatsapp: '5511999999999',
      email: 'contato@exemplo.com',
      website: 'https://exemplo.com',
      origem: 'manual',
      score: 50,
      status: 'new',
      tenantId: tenant.id,
    },
  });

  console.log('[seed] Lead criado:', lead.id);

  const templateRecord = await prisma.template.create({
    data: {
      nome: 'Boas Vindas',
      conteudo: 'Olá {{nome}}, tudo bem?',
      variaveis: ['nome'],
      tenantId: tenant.id,
    },
  });

  console.log('[seed] Template criado:', templateRecord.id);

  const campaign = await prisma.campaign.create({
    data: {
      nome: 'Campanha Inicial',
      templateId: templateRecord.id,
      status: 'draft',
      tenantId: tenant.id,
    },
  });

  console.log('[seed] Campanha criada:', campaign.id);

  console.log('[seed] Seed concluído com sucesso.');
}

main()
  .catch((err) => {
    console.error('[seed] Erro:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
