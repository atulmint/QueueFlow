import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { JobStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';

/**
 * Valid state transitions.
 * The backend is the single source of truth — the frontend never validates transitions.
 *
 * Allowed:
 *   pending  → running
 *   running  → completed
 *   running  → failed
 *
 * Terminal states (no transitions):
 *   completed → (none)
 *   failed    → (none)
 */
const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  [JobStatus.pending]: [JobStatus.running],
  [JobStatus.running]: [JobStatus.completed, JobStatus.failed],
  [JobStatus.completed]: [],
  [JobStatus.failed]: [],
};

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new job. Status defaults to 'pending' in the DB schema.
   */
  async createJob(dto: CreateJobDto) {
    return this.prisma.job.create({
      data: {
        title: dto.title,
        type: dto.type,
      },
    });
  }

  /**
   * Retrieve all jobs ordered by creation date (newest first).
   * Client-side filtering is applied by the frontend.
   */
  async getJobs() {
    return this.prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Atomically transition a job to a new status.
   *
   * Concurrency strategy:
   *   Uses prisma.job.updateMany() which generates:
   *     UPDATE "Job" SET status = newStatus WHERE id = ? AND status = currentStatus
   *
   *   PostgreSQL row-level locking ensures only one concurrent request can
   *   match the row. The second gets count = 0.
   *
   *   count = 1 → success
   *   count = 0 → job not found (404) OR concurrent conflict (409)
   */
  async updateJobStatus(id: string, newStatus: JobStatus) {
    // Step 1: Fetch the current state to validate the transition.
    // This is a pre-check for a helpful error message, not the safety gate.
    // The atomic updateMany() below is the actual safety gate.
    const currentJob = await this.prisma.job.findUnique({ where: { id } });

    if (!currentJob) {
      throw new NotFoundException(`Job '${id}' not found`);
    }

    const allowedTargets = VALID_TRANSITIONS[currentJob.status];
    if (!allowedTargets.includes(newStatus)) {
      throw new ConflictException(
        `Cannot transition job from '${currentJob.status}' to '${newStatus}'. ` +
          `Valid transitions from '${currentJob.status}': [${allowedTargets.join(', ') || 'none — terminal state'}]`,
      );
    }

    // Step 2: Atomic conditional update.
    // WHERE includes both id AND the expected current status.
    // If another request already changed the status, count will be 0.
    const result = await this.prisma.job.updateMany({
      where: {
        id,
        status: currentJob.status, // expected current status must still match
      },
      data: {
        status: newStatus,
      },
    });

    if (result.count === 0) {
      // The row no longer matches our expected state.
      // Distinguish: does the job still exist?
      const existingJob = await this.prisma.job.findUnique({ where: { id } });

      if (!existingJob) {
        throw new NotFoundException(`Job '${id}' not found`);
      }

      // Job exists but status was changed by a concurrent request.
      throw new ConflictException(
        `Job state was already changed by a concurrent request. ` +
          `Current status is '${existingJob.status}'.`,
      );
    }

    // Return the updated job record.
    return this.prisma.job.findUniqueOrThrow({ where: { id } });
  }

  /**
   * Delete a job by ID. Returns the deleted record.
   */
  async deleteJob(id: string) {
    // Verify existence before attempting delete for a clear 404.
    const job = await this.prisma.job.findUnique({ where: { id } });

    if (!job) {
      throw new NotFoundException(`Job '${id}' not found`);
    }

    return this.prisma.job.delete({ where: { id } });
  }
}
