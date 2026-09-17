import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend dev servers and production Vercel frontend
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://queue-flow-pearl.vercel.app',
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  });

  // Global validation pipe — applies class-validator decorators on all DTOs.
  // whitelist: strips unknown properties
  // forbidNonWhitelisted: rejects requests with unknown properties
  // transform: auto-converts plain objects to typed DTO instances
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(JSON.stringify({ event: 'server_started', port, timestamp: new Date().toISOString() }));
}

await bootstrap();
