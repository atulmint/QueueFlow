import type { Job, CreateJobPayload, JobStatus } from '../types/job';

const API_BASE = 'http://localhost:3000';

/**
 * Parses the response and throws a descriptive error for non-2xx responses.
 * Extracts the `message` field from the NestJS error envelope when available.
 */
async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  let message = `Request failed with status ${res.status}`;
  try {
    const body = await res.json();
    if (body?.message) {
      message = Array.isArray(body.message)
        ? body.message.join('; ')
        : body.message;
    }
  } catch {
    // Could not parse JSON body — use the default message
  }

  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = res.status;
  throw error;
}

/**
 * Fetch all jobs.
 * Filtering is done client-side from the returned array.
 */
export async function fetchJobs(): Promise<Job[]> {
  const res = await fetch(`${API_BASE}/jobs`);
  return handleResponse<Job[]>(res);
}

/**
 * Create a new job.
 */
export async function createJob(payload: CreateJobPayload): Promise<Job> {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<Job>(res);
}

/**
 * Transition a job to a new status.
 * Returns the updated job or throws a typed error (400/404/409).
 */
export async function updateJobStatus(id: string, status: JobStatus): Promise<Job> {
  const res = await fetch(`${API_BASE}/jobs/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return handleResponse<Job>(res);
}

/**
 * Delete a job by ID.
 */
export async function deleteJob(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<void>(res);
}
