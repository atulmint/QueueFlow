import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { JobsService } from './jobs.service.js';

// ---------------------------------------------------------------------------
// Mock PrismaService
// ---------------------------------------------------------------------------
const mockPrismaJob = {
  create: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
};

const mockPrismaService = {
  job: mockPrismaJob,
};

// ---------------------------------------------------------------------------
// Helper: build a fake Job record
// ---------------------------------------------------------------------------
function makeJob(overrides: Partial<{ id: string; title: string; type: string; status: JobStatus }> = {}) {
  return {
    id: 'test-id-001',
    title: 'Send welcome email',
    type: 'email',
    status: JobStatus.pending,
    createdAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
describe('JobsService', () => {
  let service: JobsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new JobsService(mockPrismaService as any);
  });

  // ── 1. Create job ──────────────────────────────────────────────────────────
  describe('createJob()', () => {
    it('creates and returns a new job with pending status', async () => {
      const job = makeJob();
      mockPrismaJob.create.mockResolvedValue(job);

      const result = await service.createJob({ title: 'Send welcome email', type: 'email' });

      expect(mockPrismaJob.create).toHaveBeenCalledWith({
        data: { title: 'Send welcome email', type: 'email' },
      });
      expect(result).toEqual(job);
    });
  });

  // ── 2. Get jobs ────────────────────────────────────────────────────────────
  describe('getJobs()', () => {
    it('returns all jobs ordered by createdAt desc', async () => {
      const jobs = [makeJob(), makeJob({ id: 'test-id-002', status: JobStatus.running })];
      mockPrismaJob.findMany.mockResolvedValue(jobs);

      const result = await service.getJobs();

      expect(mockPrismaJob.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(jobs);
    });
  });

  // ── 5. Delete job ──────────────────────────────────────────────────────────
  describe('deleteJob()', () => {
    it('deletes an existing job and returns the deleted record', async () => {
      const job = makeJob();
      mockPrismaJob.findUnique.mockResolvedValue(job);
      mockPrismaJob.delete.mockResolvedValue(job);

      const result = await service.deleteJob('test-id-001');

      expect(mockPrismaJob.delete).toHaveBeenCalledWith({ where: { id: 'test-id-001' } });
      expect(result).toEqual(job);
    });

    it('throws NotFoundException when job does not exist', async () => {
      mockPrismaJob.findUnique.mockResolvedValue(null);

      await expect(service.deleteJob('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── State transitions ──────────────────────────────────────────────────────
  describe('updateJobStatus()', () => {
    // Valid transitions
    it('transitions pending → running successfully', async () => {
      const job = makeJob({ status: JobStatus.pending });
      const updatedJob = makeJob({ status: JobStatus.running });
      mockPrismaJob.findUnique.mockResolvedValue(job);
      mockPrismaJob.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaJob.findUniqueOrThrow.mockResolvedValue(updatedJob);

      const result = await service.updateJobStatus('test-id-001', JobStatus.running);

      expect(mockPrismaJob.updateMany).toHaveBeenCalledWith({
        where: { id: 'test-id-001', status: JobStatus.pending },
        data: { status: JobStatus.running },
      });
      expect(result.status).toBe(JobStatus.running);
    });

    it('transitions running → completed successfully', async () => {
      const job = makeJob({ status: JobStatus.running });
      const updatedJob = makeJob({ status: JobStatus.completed });
      mockPrismaJob.findUnique.mockResolvedValue(job);
      mockPrismaJob.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaJob.findUniqueOrThrow.mockResolvedValue(updatedJob);

      const result = await service.updateJobStatus('test-id-001', JobStatus.completed);
      expect(result.status).toBe(JobStatus.completed);
    });

    it('transitions running → failed successfully', async () => {
      const job = makeJob({ status: JobStatus.running });
      const updatedJob = makeJob({ status: JobStatus.failed });
      mockPrismaJob.findUnique.mockResolvedValue(job);
      mockPrismaJob.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaJob.findUniqueOrThrow.mockResolvedValue(updatedJob);

      const result = await service.updateJobStatus('test-id-001', JobStatus.failed);
      expect(result.status).toBe(JobStatus.failed);
    });

    // Invalid transitions
    it('throws ConflictException for invalid transition: pending → completed', async () => {
      const job = makeJob({ status: JobStatus.pending });
      mockPrismaJob.findUnique.mockResolvedValue(job);

      await expect(
        service.updateJobStatus('test-id-001', JobStatus.completed),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException for invalid transition: pending → failed', async () => {
      const job = makeJob({ status: JobStatus.pending });
      mockPrismaJob.findUnique.mockResolvedValue(job);

      await expect(
        service.updateJobStatus('test-id-001', JobStatus.failed),
      ).rejects.toThrow(ConflictException);
    });

    // Terminal states
    it('throws ConflictException when attempting to restart a completed job', async () => {
      const job = makeJob({ status: JobStatus.completed });
      mockPrismaJob.findUnique.mockResolvedValue(job);

      await expect(
        service.updateJobStatus('test-id-001', JobStatus.running),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when attempting to restart a failed job', async () => {
      const job = makeJob({ status: JobStatus.failed });
      mockPrismaJob.findUnique.mockResolvedValue(job);

      await expect(
        service.updateJobStatus('test-id-001', JobStatus.running),
      ).rejects.toThrow(ConflictException);
    });

    // Job not found
    it('throws NotFoundException when job does not exist', async () => {
      mockPrismaJob.findUnique.mockResolvedValue(null);

      await expect(
        service.updateJobStatus('nonexistent', JobStatus.running),
      ).rejects.toThrow(NotFoundException);
    });

    // Concurrent conflict
    it('throws ConflictException when updateMany returns count=0 (concurrent conflict)', async () => {
      const job = makeJob({ status: JobStatus.pending });
      const jobAfterConcurrentUpdate = makeJob({ status: JobStatus.running });

      // Pre-check sees pending → transition is valid
      mockPrismaJob.findUnique
        .mockResolvedValueOnce(job) // first call: pre-check
        .mockResolvedValueOnce(jobAfterConcurrentUpdate); // second call: disambiguation

      // Atomic update finds 0 rows (another request already won)
      mockPrismaJob.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.updateJobStatus('test-id-001', JobStatus.running),
      ).rejects.toThrow(ConflictException);
    });
  });
});
