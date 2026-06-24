import Redis from 'ioredis';

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

let redisClient: Redis | null = null;

export function getRedisClient(config: RedisConfig): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redisClient.on('error', (err: Error) => {
      console.error('[redis] Erro na conexão:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('[redis] Conectado ao Redis');
    });
  }

  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
