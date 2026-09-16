import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/jobs (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/jobs')
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  afterEach(async () => {
    await app.close();
  });
});
