import { Button, Fieldset, FieldsetLegend, Label, Select } from '@digdir/designsystemet-react';
import { useId } from 'react';
import { FIELD_LABELS, FIELDS } from '@/features/auth';
import { CASE_STATUS_LABELS, CASE_STATUSES, REACTION_LABELS, REACTIONS } from '@/features/cases';
import { hasFilters, type OverviewFilters } from '../filters';
import styles from './CaseOverview.module.css';

interface CaseOverviewFiltersProps {
  filters: OverviewFilters;
  /** Admin's rows have no reactions, so there is nothing to filter on (F-003). */
  showReactionFilter: boolean;
  onChange: (key: keyof OverviewFilters, value: string) => void;
  onClear: () => void;
}

// F-003: field, status and reaction filters. Choosing a value applies it right away.
export function CaseOverviewFilters({
  filters,
  showReactionFilter,
  onChange,
  onClear,
}: CaseOverviewFiltersProps) {
  const id = useId();

  return (
    <Fieldset className={styles.filters}>
      <FieldsetLegend>Filter cases</FieldsetLegend>
      <div className={styles.filterRow}>
        <div className={styles.filter}>
          <Label htmlFor={`${id}-field`}>Field</Label>
          <Select
            id={`${id}-field`}
            width="auto"
            value={filters.field ?? ''}
            onChange={(event) => onChange('field', event.target.value)}
          >
            <option value="">All fields</option>
            {FIELDS.map((field) => (
              <option key={field} value={field}>
                {FIELD_LABELS[field]}
              </option>
            ))}
          </Select>
        </div>
        <div className={styles.filter}>
          <Label htmlFor={`${id}-status`}>Status</Label>
          <Select
            id={`${id}-status`}
            width="auto"
            value={filters.status ?? ''}
            onChange={(event) => onChange('status', event.target.value)}
          >
            <option value="">All statuses</option>
            {CASE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {CASE_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </div>
        {showReactionFilter && (
          <div className={styles.filter}>
            <Label htmlFor={`${id}-reaction`}>Reaction</Label>
            <Select
              id={`${id}-reaction`}
              width="auto"
              value={filters.reaction ?? ''}
              onChange={(event) => onChange('reaction', event.target.value)}
            >
              <option value="">All reactions</option>
              {REACTIONS.map((reaction) => (
                <option key={reaction} value={reaction}>
                  {REACTION_LABELS[reaction]}
                </option>
              ))}
            </Select>
          </div>
        )}
        {hasFilters(filters) && (
          <Button variant="tertiary" onClick={onClear}>
            Clear filters
          </Button>
        )}
      </div>
    </Fieldset>
  );
}
