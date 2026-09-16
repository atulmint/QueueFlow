import type { FilterStatus } from '../hooks/useJobs';
import { ALL_STATUSES } from '../types/job';

interface JobFiltersProps {
  activeFilter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
}

export function JobFilters({ activeFilter, onFilterChange }: JobFiltersProps) {
  const filters: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    ...ALL_STATUSES.map((s) => ({ key: s as FilterStatus, label: s.charAt(0).toUpperCase() + s.slice(1) })),
  ];

  return (
    <div className="filter-tabs" role="tablist" aria-label="Filter jobs by status">
      {filters.map(({ key, label }) => (
        <button
          key={key}
          id={`filter-tab-${key}`}
          role="tab"
          aria-selected={activeFilter === key}
          className={`filter-tab ${activeFilter === key ? 'active' : ''}`}
          onClick={() => onFilterChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
