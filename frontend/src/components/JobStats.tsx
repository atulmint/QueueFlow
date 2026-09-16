import type { StatusCounts } from '../hooks/useJobs';
import type { FilterStatus } from '../hooks/useJobs';

interface JobStatsProps {
  counts: StatusCounts;
  activeFilter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
}

const STAT_CONFIG = [
  { key: 'all' as const, label: 'All Jobs', color: 'stat-all', metricColor: 'var(--accent-primary)', metricGlow: 'var(--accent-glow)' },
  { key: 'pending' as const, label: 'Pending', color: 'stat-pending', metricColor: 'var(--status-pending)', metricGlow: 'rgba(217, 119, 6, 0.25)' },
  { key: 'running' as const, label: 'Running', color: 'stat-running', metricColor: 'var(--status-running)', metricGlow: 'rgba(79, 70, 229, 0.25)' },
  { key: 'completed' as const, label: 'Completed', color: 'stat-completed', metricColor: 'var(--status-completed)', metricGlow: 'rgba(13, 148, 136, 0.25)' },
  { key: 'failed' as const, label: 'Failed', color: 'stat-failed', metricColor: 'var(--status-failed)', metricGlow: 'rgba(225, 29, 72, 0.25)' },
];

export function JobStats({ counts, activeFilter, onFilterChange }: JobStatsProps) {
  const total = counts.pending + counts.running + counts.completed + counts.failed;

  const getCount = (key: FilterStatus | 'all') =>
    key === 'all' ? total : counts[key as keyof StatusCounts];

  return (
    <div className="stats-grid" role="region" aria-label="Job status counts">
      {STAT_CONFIG.map(({ key, label, color, metricColor, metricGlow }) => (
        <button
          key={key}
          id={`stat-btn-${key}`}
          className={`stat-card metric-card-glow ${color} ${activeFilter === key ? 'active' : ''}`}
          onClick={() => onFilterChange(key)}
          aria-pressed={activeFilter === key}
          style={{
            '--metric-color': metricColor,
            '--metric-glow': metricGlow,
          } as React.CSSProperties}
        >
          <span className="stat-count">{getCount(key)}</span>
          <span className="stat-label">{label}</span>
        </button>
      ))}
    </div>
  );
}
