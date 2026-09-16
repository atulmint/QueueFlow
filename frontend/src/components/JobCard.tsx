import type { Job, JobStatus } from '../types/job';
import { VALID_TRANSITIONS } from '../types/job';

interface JobCardProps {
  job: Job;
  isLoading: boolean;
  onStatusChange: (id: string, status: JobStatus) => void;
  onDelete: (id: string) => void;
}

const STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
};

const TRANSITION_BUTTON_LABELS: Partial<Record<JobStatus, string>> = {
  running: 'Start',
  completed: 'Complete',
  failed: 'Fail',
};

export function JobCard({ job, isLoading, onStatusChange, onDelete }: JobCardProps) {
  const validNextStatuses = VALID_TRANSITIONS[job.status];
  const createdAt = new Date(job.createdAt).toLocaleString();

  return (
    <div
      className={`job-card status-${job.status}`}
      role="listitem"
      aria-label={`Job: ${job.title}`}
    >
      <div className="job-card-header">
        <div className="job-info">
          <span className="job-title">{job.title}</span>
          <span className="job-type-badge">{job.type}</span>
        </div>
        <span className={`status-badge status-badge-${job.status}`} aria-label={`Status: ${STATUS_LABELS[job.status]}`}>
          {STATUS_LABELS[job.status]}
        </span>
      </div>

      <div className="job-card-footer">
        <span className="job-date" title={createdAt}>
          Created {createdAt}
        </span>

        <div className="job-actions">
          {validNextStatuses.length > 0 &&
            validNextStatuses.map((nextStatus) => (
              <button
                key={nextStatus}
                id={`job-${job.id}-action-${nextStatus}`}
                className={`btn btn-action btn-action-${nextStatus}`}
                onClick={() => onStatusChange(job.id, nextStatus)}
                disabled={isLoading}
                aria-label={`${TRANSITION_BUTTON_LABELS[nextStatus]} job ${job.title}`}
              >
                {isLoading ? '…' : TRANSITION_BUTTON_LABELS[nextStatus]}
              </button>
            ))}

          <button
            id={`job-${job.id}-delete`}
            className="btn btn-danger"
            onClick={() => onDelete(job.id)}
            disabled={isLoading}
            aria-label={`Delete job ${job.title}`}
          >
            {isLoading ? '…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
