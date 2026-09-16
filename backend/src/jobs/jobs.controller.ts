import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JobsService } from './jobs.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobStatusDto } from './dto/update-job-status.dto.js';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  /**
   * POST /jobs
   * Create a new job. Body is validated by the global ValidationPipe.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createJob(@Body() createJobDto: CreateJobDto) {
    return this.jobsService.createJob(createJobDto);
  }

  /**
   * GET /jobs
   * Returns all jobs ordered by createdAt desc.
   * Filtering is done client-side in the frontend.
   */
  @Get()
  getJobs() {
    return this.jobsService.getJobs();
  }

  /**
   * PATCH /jobs/:id/status
   * Transitions a job to a new status.
   * Business rules and concurrency safety are enforced in the service.
   */
  @Patch(':id/status')
  updateJobStatus(
    @Param('id') id: string,
    @Body() updateJobStatusDto: UpdateJobStatusDto,
  ) {
    return this.jobsService.updateJobStatus(id, updateJobStatusDto.status);
  }

  /**
   * DELETE /jobs/:id
   * Deletes a job. Returns 204 No Content on success.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteJob(@Param('id') id: string) {
    return this.jobsService.deleteJob(id);
  }
}
