import Redis from 'ioredis';
import { RedisOptions } from 'ioredis';

export class RedisService {
  private static instance: RedisService;
  private client: Redis;

  private constructor() {
    const options: RedisOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    };

    this.client = new Redis(options);

    this.client.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
    });
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  public async set(
    key: string,
    value: string,
    expirationInSeconds?: number
  ): Promise<'OK'> {
    if (expirationInSeconds) {
      return await this.client.set(key, value, 'EX', expirationInSeconds);
    }
    return await this.client.set(key, value);
  }

  public async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  public async flushAll(): Promise<'OK'> {
    return await this.client.flushall();
  }

  public getClient(): Redis {
    return this.client;
  }
}
