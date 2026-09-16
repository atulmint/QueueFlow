import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Bonus: Structured JSON request logging middleware.
 *
 * Logs every request as a single JSON line, making output compatible
 * with log aggregators (Datadog, CloudWatch, etc.) in production.
 *
 * Example output:
 * {"timestamp":"2024-01-15T09:23:41.000Z","method":"PATCH","path":"/jobs/clx123/status","statusCode":409,"durationMs":12}
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const durationMs = Date.now() - startTime;
      const logEntry = {
        timestamp: new Date().toISOString(),
        method,
        path: originalUrl,
        statusCode: res.statusCode,
        durationMs,
      };
      console.log(JSON.stringify(logEntry));
    });

    next();
  }
}
