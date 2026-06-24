import { buildApp } from './app.js';
import { validateEnv } from '../../config/validate-env.js';

async function main(): Promise<void> {
  const env = validateEnv();

  const app = await buildApp(env);

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`[server] Servidor rodando em http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    console.error('[server] Erro ao iniciar servidor:', err);
    process.exit(1);
  }
}

main();
