export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Job {
  id: string;
  title: string;
  type: string;
  status: JobStatus;
  createdAt: string;
}

export interface CreateJobPayload {
  title: string;
  type: string;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}

/** All valid status transitions the backend allows */
export const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  pending: ['running'],
  running: ['completed', 'failed'],
  completed: [],
  failed: [],
};

export const STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
};

export const ALL_STATUSES: JobStatus[] = ['pending', 'running', 'completed', 'failed'];
