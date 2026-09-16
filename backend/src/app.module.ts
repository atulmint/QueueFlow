import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JobsModule } from './jobs/jobs.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { LoggingMiddleware } from './common/middleware/logging.middleware.js';

@Module({
  imports: [PrismaModule, JobsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
