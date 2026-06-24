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
  const email = process.env.ADMIN_EMAIL || 'admin@leadprospector.app';
  const password = process.env.ADMIN_PASSWORD || 'admin';
  const name = process.env.ADMIN_NAME || 'Admin';

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: { nome: 'Default', slug: 'default' },
  });

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name, active: true },
    create: { email, name, passwordHash, role: 'admin', tenantId: tenant.id },
  });

  console.log(
    '[seed-admin] Usuário admin criado/atualizado:',
    user.email,
    '(tenant:',
    tenant.slug,
    ')',
  );
}

main()
  .catch((err) => {
    console.error('[seed-admin] Erro:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
