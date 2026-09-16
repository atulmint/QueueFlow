/**
 * Integration test: Concurrency safety for pending → running transition.
 *
 * This test uses a REAL PostgreSQL database (DATABASE_TEST_URL) to verify
 * that the atomic updateMany() WHERE clause prevents duplicate state transitions
 * when two requests fire simultaneously.
 *
 * Requires:
 *   - DATABASE_TEST_URL environment variable pointing to a test database
 *   - The test database to have migrations applied:
 *       DATABASE_URL=$DATABASE_TEST_URL npx prisma migrate deploy
 */
import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { PrismaClient, JobStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { JobsService } from '../src/jobs/jobs.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// Use the test database URL
const TEST_DATABASE_URL = process.env.DATABASE_TEST_URL;

if (!TEST_DATABASE_URL) {
  throw new Error(
    'DATABASE_TEST_URL environment variable is required for integration tests.\n' +
    'Example: DATABASE_TEST_URL=postgresql://postgres:password@127.0.0.1:5432/queueflow_test',
  );
}

describe('JobsService — Concurrency Integration Tests', () => {
  let prismaClient: PrismaClient;
  let prismaService: PrismaService;
  let jobsService: JobsService;

  beforeAll(async () => {
    // Raw client for test setup/teardown using Prisma 7 driver adapter API
    const adapter = new PrismaPg({ connectionString: TEST_DATABASE_URL });
    prismaClient = new PrismaClient({ adapter } as any);
    await prismaClient.$connect();

    // PrismaService reads DATABASE_TEST_URL via process.env.DATABASE_URL override
    // We temporarily set DATABASE_URL to the test DB for the service instance
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    prismaService = new PrismaService();
    await prismaService.$connect();

    jobsService = new JobsService(prismaService);
  });

  afterEach(async () => {
    // Clean up all jobs after each test
    await prismaClient.job.deleteMany();
  });

  afterAll(async () => {
    await prismaClient.$disconnect();
    await prismaService.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test #14: Concurrent pending → running
  // ─────────────────────────────────────────────────────────────────────────
  it('allows only ONE of two simultaneous pending→running requests to succeed', async () => {
    // Create a job in pending state
    const job = await prismaClient.job.create({
      data: { title: 'Concurrent Test Job', type: 'test' },
    });

    expect(job.status).toBe(JobStatus.pending);

    // Fire two simultaneous PATCH requests
    const [result1, result2] = await Promise.allSettled([
      jobsService.updateJobStatus(job.id, JobStatus.running),
      jobsService.updateJobStatus(job.id, JobStatus.running),
    ]);

    // Exactly one should succeed
    const succeeded = [result1, result2].filter((r) => r.status === 'fulfilled');
    const failed = [result1, result2].filter((r) => r.status === 'rejected');

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);

    // The failing request must be a ConflictException (409), not a server error
    const failedResult = failed[0] as PromiseRejectedResult;
    expect(failedResult.reason).toBeInstanceOf(ConflictException);

    // Verify the DB has the job in 'running' state
    const finalJob = await prismaClient.job.findUniqueOrThrow({ where: { id: job.id } });
    expect(finalJob.status).toBe(JobStatus.running);
  });
});
