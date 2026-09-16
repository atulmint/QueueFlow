import { useState, useEffect, useCallback } from 'react';
import type { Job, JobStatus, CreateJobPayload } from '../types/job';
import * as jobsApi from '../services/jobsApi';

export interface StatusCounts {
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

export type FilterStatus = JobStatus | 'all';

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  // Per-job loading state: { [jobId]: boolean }
  const [operationLoading, setOperationLoading] = useState<Record<string, boolean>>({});

  // ── Derived values ────────────────────────────────────────────────────────

  const filteredJobs: Job[] =
    statusFilter === 'all' ? jobs : jobs.filter((j) => j.status === statusFilter);

  const statusCounts: StatusCounts = {
    pending: jobs.filter((j) => j.status === 'pending').length,
    running: jobs.filter((j) => j.status === 'running').length,
    completed: jobs.filter((j) => j.status === 'completed').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const setJobLoading = (id: string, value: boolean) => {
    setOperationLoading((prev) => ({ ...prev, [id]: value }));
  };

  // ── Fetch all jobs ────────────────────────────────────────────────────────

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await jobsApi.fetchJobs();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  // ── Create job ────────────────────────────────────────────────────────────

  const createJob = useCallback(async (payload: CreateJobPayload): Promise<boolean> => {
    setError(null);
    try {
      await jobsApi.createJob(payload);
      await loadJobs();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
      return false;
    }
  }, [loadJobs]);

  // ── Update job status ─────────────────────────────────────────────────────

  const updateJobStatus = useCallback(
    async (id: string, status: JobStatus): Promise<void> => {
      setJobLoading(id, true);
      setError(null);
      try {
        await jobsApi.updateJobStatus(id, status);
        await loadJobs();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update job status';
        // For concurrent conflicts: show error and refresh to show actual state
        setError(message);
        await loadJobs();
      } finally {
        setJobLoading(id, false);
      }
    },
    [loadJobs],
  );

  // ── Delete job ────────────────────────────────────────────────────────────

  const deleteJob = useCallback(
    async (id: string): Promise<void> => {
      setJobLoading(id, true);
      setError(null);
      try {
        await jobsApi.deleteJob(id);
        // Optimistic removal + re-fetch
        setJobs((prev) => prev.filter((j) => j.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete job');
        await loadJobs(); // re-sync on error
      } finally {
        setJobLoading(id, false);
      }
    },
    [loadJobs],
  );

  // ── Dismiss error ─────────────────────────────────────────────────────────

  const dismissError = useCallback(() => setError(null), []);

  return {
    // State
    jobs,
    filteredJobs,
    loading,
    error,
    statusFilter,
    statusCounts,
    operationLoading,
    // Actions
    setStatusFilter,
    createJob,
    updateJobStatus,
    deleteJob,
    refreshJobs: loadJobs,
    dismissError,
  };
}
