import { useState, useEffect } from 'react';
import { useJobs } from '../hooks/useJobs';
import { JobStats } from '../components/JobStats';
import { JobFilters } from '../components/JobFilters';
import { JobForm } from '../components/JobForm';
import { JobCard } from '../components/JobCard';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

export function DashboardPage() {
  const {
    filteredJobs,
    loading,
    error,
    statusFilter,
    statusCounts,
    operationLoading,
    setStatusFilter,
    createJob,
    updateJobStatus,
    deleteJob,
    refreshJobs,
    dismissError,
  } = useJobs();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
  });

  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('queueflow_theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="queueflow-logo" tabIndex={0} aria-label="QueueFlow Dashboard Logo">
              <div className="queueflow-logo-borde-back">
                <div className="queueflow-logo-icon">QF</div>
              </div>
              <div className="queueflow-logo-tooltip">QueueFlow Dashboard</div>
            </div>
            <div className="header-title-group">
              <h1 className="header-title">QueueFlow</h1>
              <p className="header-subtitle">Job Queue Management Dashboard</p>
            </div>
          </div>
          <div className="header-actions">
            <label className="theme-switch" aria-label="Toggle Light/Dark Theme">
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={toggleTheme}
                id="theme-toggle"
              />
              <span className="slider">
                <span className="sun">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <g fill="#ffd43b">
                      <circle r="5" cy="12" cx="12"></circle>
                      <path d="m21 13h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 0 2zm-17 0h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 0 2zm13.66-5.66a1 1 0 0 1 -.71-.29l-.7-.71a1 1 0 0 1 1.41-1.41l.71.71a1 1 0 0 1 -.71 1.7zm-12.02 12.02a1 1 0 0 1 -.71-.29l-.7-.71a1 1 0 0 1 1.41-1.41l.7.71a1 1 0 0 1 -.7 1.7zm12.02 0a1 1 0 0 1 -.71-1.7l.71-.7a1 1 0 0 1 1.41 1.41l-.71.71a1 1 0 0 1 -.7.28zm-12.02-12.02a1 1 0 0 1 -.71-1.7l.7-.71a1 1 0 0 1 1.41 1.41l-.7.71a1 1 0 0 1 -.7.29zm6.36-3.66a1 1 0 0 1 -1-1v-1a1 1 0 0 1 2 0v1a1 1 0 0 1 -1 1zm0 17a1 1 0 0 1 -1-1v-1a1 1 0 0 1 2 0v1a1 1 0 0 1 -1 1z"></path>
                    </g>
                  </svg>
                </span>
                <span className="moon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                    <path d="m223.5 32c-123.5 0-223.5 100.3-223.5 224s100 224 223.5 224c60.6 0 115.5-24.2 155.8-63.4 5-4.9 6.3-12.5 3.1-18.7s-9.6-9.9-16.7-9.9c-85.7 0-155.2-69.5-155.2-155.2 0-82 63.8-149.3 144.9-155.1 7.1-.5 13.1-5.1 15.6-11.7s.4-14.1-5.2-18.6c-40.1-39.7-95-64.4-155.8-64.4z"></path>
                  </svg>
                </span>
              </span>
            </label>
            <button
              id="refresh-btn"
              className="btn btn-secondary"
              onClick={refreshJobs}
              disabled={loading}
              aria-label="Refresh job list"
            >
              {loading ? '↻ Refreshing…' : '↻ Refresh'}
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Error Banner */}
        {error && <ErrorState message={error} onDismiss={dismissError} />}

        {/* Status Stats */}
        <section aria-label="Job statistics">
          <JobStats
            counts={statusCounts}
            activeFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />
        </section>

        {/* Create Job Form */}
        <section aria-label="Create a new job">
          <JobForm onSubmit={createJob} />
        </section>

        {/* Filter Tabs */}
        <section aria-label="Filter jobs">
          <div className="section-header">
            <h2 className="section-title">
              Jobs
              {statusFilter !== 'all' && (
                <span className="filter-indicator"> — {statusFilter}</span>
              )}
            </h2>
            <JobFilters activeFilter={statusFilter} onFilterChange={setStatusFilter} />
          </div>
        </section>

        {/* Job List */}
        <section aria-label="Job list" aria-live="polite">
          {loading && filteredJobs.length === 0 ? (
            <LoadingState />
          ) : filteredJobs.length === 0 ? (
            <div className="empty-state" role="status">
              <p className="empty-title">No jobs found</p>
              <p className="empty-subtitle">
                {statusFilter === 'all'
                  ? 'Create your first job using the form above.'
                  : `No ${statusFilter} jobs. Try a different filter.`}
              </p>
            </div>
          ) : (
            <div className="job-list" role="list">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isLoading={operationLoading[job.id] ?? false}
                  onStatusChange={updateJobStatus}
                  onDelete={deleteJob}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Back to Top Button */}
      <button
        id="back-to-top-btn"
        className={`back-to-top-btn ${showBackToTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <svg className="svgIcon" viewBox="0 0 384 512">
          <path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2l105.4 105.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z" />
        </svg>
      </button>
    </div>
  );
}
