import { config } from 'dotenv';
import { resolve } from 'path';
import { envSchema } from './env.schema';

function loadEnvFile(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';

  const files = [`.env.${nodeEnv}.local`, `.env.${nodeEnv}`, '.env.local', '.env'];

  for (const file of files) {
    const path = resolve(process.cwd(), file);
    config({ path });
  }
}

export function validateEnv(): ReturnType<typeof envSchema.parse> {
  loadEnvFile();

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    console.error('[validate-env] Erros de validação das variáveis de ambiente:');
    for (const [field, messages] of Object.entries(errors)) {
      console.error(`  ${field}: ${messages?.join(', ')}`);
    }
    process.exit(1);
  }

  console.log('[validate-env] Variáveis de ambiente validadas com sucesso.');
  return result.data;
}
