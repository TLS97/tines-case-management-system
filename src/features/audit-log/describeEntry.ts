import { DEPARTMENT_NAMES, departmentIdSchema, FIELD_LABELS, fieldSchema } from '@/features/auth';
import type { AuditDetails, AuditEntry } from './types';

// F-005: an entry's details as a short sentence for the audit log screens. Details hold ids and codes
// only (never sensitive case data), so names come from lookups. Parties (health personnel, companies)
// are only named for viewers who may see the case's full data; Admin never gets their names.

export interface AuditNames {
  /** A user's name, or undefined for an unknown id. */
  user: (id: string) => string | undefined;
  /** A case status label ("In progress"). */
  status: (status: string) => string;
  /** A health personnel's or company's name, for viewers with full access. Undefined: not shown. */
  party?: (id: string) => string | undefined;
}

const CHANGE_LABELS: Record<string, string> = {
  FieldChanged: 'Field changed',
  HealthPersonnelAdded: 'Health personnel added',
  HealthPersonnelRemoved: 'Health personnel removed',
  CompanyAdded: 'Company added',
  CompanyRemoved: 'Company removed',
  HealthPersonnelReactionGiven: 'Reaction given to health personnel',
  CompanyReactionGiven: 'Reaction given to company',
};

const text = (details: AuditDetails, key: string): string | undefined => {
  const value = details[key];
  return typeof value === 'string' ? value : undefined;
};

function department(value: unknown): string | undefined {
  const parsed = departmentIdSchema.safeParse(value);
  return parsed.success ? DEPARTMENT_NAMES[parsed.data] : undefined;
}

function field(value: string | undefined): string | undefined {
  const parsed = fieldSchema.safeParse(value);
  return parsed.success ? FIELD_LABELS[parsed.data] : value;
}

export function describeEntry(entry: AuditEntry, names: AuditNames): string {
  const { details } = entry;
  const user = (key: string) => {
    const id = text(details, key);
    return id ? (names.user(id) ?? 'an unknown user') : undefined;
  };

  switch (entry.action) {
    case 'CaseCreated':
      return details.field ? `Field: ${field(text(details, 'field'))}` : '';
    case 'CaseOpened':
      if (details.view === 'full') return 'Full view';
      if (details.view === 'restricted') return 'Restricted view (no sensitive data)';
      return '';
    case 'CaseAssigned': {
      const to = user('newCaseWorkerId');
      const from = user('previousCaseWorkerId');
      const home = department(details.homeDepartmentId);
      return [
        to && `To ${to}${home ? `, borrowed from the ${home}` : ''}`,
        from && `instead of ${from}`,
      ]
        .filter(Boolean)
        .join(', ');
    }
    case 'StatusChanged': {
      const from = text(details, 'from');
      const to = text(details, 'to');
      return from && to ? `${names.status(from)} → ${names.status(to)}` : '';
    }
    case 'CaseUpdated':
    case 'ReactionGiven':
      return describeCaseChange(details, names);
    case 'ReadAccessGranted':
    case 'ReadAccessRemoved': {
      const caseWorker = user('caseWorkerId') ?? '';
      return details.reason === 'MovedDepartment'
        ? `${caseWorker}, who moved to another department`
        : caseWorker;
    }
    case 'UserAdded':
      return user('addedUserId') ?? '';
    case 'UserUpdated':
      return describeUserUpdate(details, user('updatedUserId'));
  }
}

function describeCaseChange(details: AuditDetails, names: AuditNames): string {
  const change = text(details, 'change');
  const label = (change && CHANGE_LABELS[change]) ?? change ?? '';
  if (change === 'FieldChanged' && details.to) return `${label} to ${field(text(details, 'to'))}`;
  const partyId = text(details, 'healthPersonnelId') ?? text(details, 'companyId');
  if (!partyId || !names.party) return label;
  return `${label}: ${names.party(partyId) ?? '(removed from the case)'}`;
}

// Worded as what was asked for, so it reads right for both Success and Denied entries.
function describeUserUpdate(details: AuditDetails, who: string | undefined): string {
  const name = who ?? 'a user';
  if (details.isActive === false) return `Deactivate ${name}`;
  if (details.isActive === true) return `Reactivate ${name}`;
  if (details.change === 'Fields') {
    const fields = text(details, 'fields')
      ?.split(', ')
      .map((value) => field(value))
      .join(', ');
    return fields
      ? `Change the fields of ${name} to ${fields} (primary: ${field(text(details, 'primaryField'))})`
      : `Change the fields of ${name}`;
  }
  if (details.change === 'Department') {
    const from = department(details.fromDepartmentId);
    const to = department(details.toDepartmentId);
    return `Move ${name}${from ? ` from the ${from}` : ''}${to ? ` to the ${to}` : ''}`;
  }
  return who ?? '';
}
