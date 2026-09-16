import { useState, type FormEvent } from 'react';
import type { CreateJobPayload } from '../types/job';

interface JobFormProps {
  onSubmit: (payload: CreateJobPayload) => Promise<boolean>;
}

export function JobForm({ onSubmit }: JobFormProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedTitle = title.trim();
    const trimmedType = type.trim();

    // Basic client-side check — backend also validates
    if (!trimmedTitle) {
      setFormError('Title is required');
      return;
    }
    if (!trimmedType) {
      setFormError('Type is required');
      return;
    }

    setSubmitting(true);
    const success = await onSubmit({ title: trimmedTitle, type: trimmedType });
    setSubmitting(false);

    if (success) {
      setTitle('');
      setType('');
    }
  };

  return (
    <form className="job-form" onSubmit={handleSubmit} aria-label="Create new job">
      <h2 className="form-title">Create Job</h2>

      {formError && (
        <div className="form-error" role="alert">
          {formError}
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="job-title" className="form-label">
            Title <span aria-hidden="true">*</span>
          </label>
          <input
            id="job-title"
            type="text"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Send welcome email"
            disabled={submitting}
            maxLength={255}
            aria-required="true"
          />
        </div>

        <div className="form-group">
          <label htmlFor="job-type" className="form-label">
            Type <span aria-hidden="true">*</span>
          </label>
          <input
            id="job-type"
            type="text"
            className="form-input"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="e.g. email, report, export"
            disabled={submitting}
            maxLength={100}
            aria-required="true"
          />
        </div>

        <button
          id="create-job-btn"
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting ? 'Creating…' : '+ Create Job'}
        </button>
      </div>
    </form>
  );
}
