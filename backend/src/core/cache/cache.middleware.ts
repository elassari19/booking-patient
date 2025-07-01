import { Request, Response, NextFunction } from 'express';
import { RedisService } from './redis.service';

const redisService = RedisService.getInstance();

// Cache middleware with support for query parameters
export const cacheMiddleware = (ttlSeconds = 60) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Create a cache key that includes the URL and query parameters
      const queryString = Object.keys(req.query).length
        ? `?${new URLSearchParams(
            req.query as Record<string, string>
          ).toString()}`
        : '';
      const cacheKey = `${req.originalUrl}${queryString}`;

      const cachedData = await redisService.get(cacheKey);

      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }

      // Store the original res.json function
      const originalJson = res.json;

      // Override res.json to cache the response
      res.json = function (data) {
        // Store response in cache
        redisService.set(cacheKey, JSON.stringify(data), ttlSeconds);
        // Call the original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Clear cache by pattern (useful for invalidating cache on updates)
export const clearCache = (pattern: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await redisService.del(`*${pattern}*`);
      next();
    } catch (error) {
      console.error('Clear cache error:', error);
    }
  };
};
