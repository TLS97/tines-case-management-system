import { Button, Fieldset, FieldsetLegend, Label, Select } from '@digdir/designsystemet-react';
import { useId, useState } from 'react';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTIONS,
  AUDIT_RESULT_LABELS,
  AUDIT_RESULTS,
  caseReferenceSchema,
  hasAuditLogFilters,
  type AuditLogFilters as Filters,
} from '@/features/audit-log';
import type { User } from '@/features/auth';
import { TextInput } from '@/shared/components/TextInput';
import styles from './AuditLog.module.css';

interface AuditLogFiltersProps {
  filters: Filters;
  users: User[];
  onChange: (key: keyof Filters, value: string) => void;
  onClear: () => void;
}

// F-005 (T3.8): filters for the global audit log. Lists and dates apply right away; the case applies
// on Enter or when leaving the field, so it is not looked up while it is still being typed.
export function AuditLogFilters({ filters, users, onChange, onClear }: AuditLogFiltersProps) {
  const id = useId();
  const sortedUsers = [...users].sort(
    (a, b) =>
      a.surname.localeCompare(b.surname, 'nb') || a.firstName.localeCompare(b.firstName, 'nb'),
  );

  return (
    <Fieldset className={styles.filters}>
      <FieldsetLegend>Filter entries</FieldsetLegend>
      <div className={styles.filterRow}>
        {/* A fresh field when the filter is cleared or changed elsewhere (the address). */}
        <CaseFilter
          key={filters.case ?? ''}
          id={`${id}-case`}
          value={filters.case ?? ''}
          onApply={(value) => onChange('case', value)}
        />
        <div className={styles.filter}>
          <Label htmlFor={`${id}-action`}>Action</Label>
          <Select
            id={`${id}-action`}
            width="auto"
            value={filters.action ?? ''}
            onChange={(event) => onChange('action', event.target.value)}
          >
            <option value="">All actions</option>
            {AUDIT_ACTIONS.map((action) => (
              <option key={action} value={action}>
                {AUDIT_ACTION_LABELS[action]}
              </option>
            ))}
          </Select>
        </div>
        <div className={styles.filter}>
          <Label htmlFor={`${id}-user`}>User</Label>
          <Select
            id={`${id}-user`}
            width="auto"
            value={filters.userId ?? ''}
            onChange={(event) => onChange('userId', event.target.value)}
          >
            <option value="">All users</option>
            {sortedUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.surname}
              </option>
            ))}
          </Select>
        </div>
        <div className={styles.filter}>
          <Label htmlFor={`${id}-result`}>Result</Label>
          <Select
            id={`${id}-result`}
            width="auto"
            value={filters.result ?? ''}
            onChange={(event) => onChange('result', event.target.value)}
          >
            <option value="">All results</option>
            {AUDIT_RESULTS.map((result) => (
              <option key={result} value={result}>
                {AUDIT_RESULT_LABELS[result]}
              </option>
            ))}
          </Select>
        </div>
        <TextInput
          id={`${id}-from`}
          label="From"
          type="date"
          size={12}
          value={filters.from ?? ''}
          max={filters.to}
          onChange={(event) => onChange('from', event.target.value)}
        />
        <TextInput
          id={`${id}-to`}
          label="To"
          type="date"
          size={12}
          value={filters.to ?? ''}
          min={filters.from}
          onChange={(event) => onChange('to', event.target.value)}
        />
        {hasAuditLogFilters(filters) && (
          <Button variant="tertiary" onClick={onClear}>
            Clear filters
          </Button>
        )}
      </div>
    </Fieldset>
  );
}

interface CaseFilterProps {
  id: string;
  value: string;
  onApply: (value: string) => void;
}

function CaseFilter({ id, value, onApply }: CaseFilterProps) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string>();

  function apply() {
    const trimmed = draft.trim();
    if (trimmed === value) return;
    if (trimmed !== '' && !caseReferenceSchema.safeParse(trimmed).success) {
      setError('Enter a case number like 2026/0001, or a case id');
      return;
    }
    setError(undefined);
    onApply(trimmed);
  }

  return (
    <TextInput
      id={id}
      label="Case"
      description="Case number or case id"
      size={14}
      autoComplete="off"
      value={draft}
      error={error}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={apply}
      onKeyDown={(event) => {
        if (event.key === 'Enter') apply();
      }}
    />
  );
}
