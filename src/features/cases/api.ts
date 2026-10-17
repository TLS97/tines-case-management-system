import { queryOptions } from '@tanstack/react-query';
import type { Field } from '@/features/auth';
import { apiRequest } from '@/shared/api/apiRequest';
import { z } from 'zod';
import {
  caseResponseSchema,
  caseWorkerSummarySchema,
  readAccessResponseSchema,
} from './caseResponse';
import {
  supervisionCaseSchema,
  type CompanyReaction,
  type HealthPersonnelReaction,
  type NewCompany,
  type NewHealthPersonnel,
} from './types';

export function createCase(input: { field: Field }) {
  return apiRequest('/api/cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    schema: supervisionCaseSchema,
  });
}

/**
 * One case, as the current user may see it. Every fetch is logged as "case opened" (F-005), so it is
 * fetched once each time the page is opened, not again on window focus, and a refused or missing
 * case is not retried.
 */
export function caseQuery(id: string) {
  return queryOptions({
    queryKey: ['cases', id],
    queryFn: () =>
      apiRequest(`/api/cases/${encodeURIComponent(id)}`, { schema: caseResponseSchema }),
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
}

/** F-004: the case workers the case can be assigned to (leaders only). */
export function eligibleCaseWorkersQuery(caseId: string) {
  return queryOptions({
    queryKey: ['cases', caseId, 'eligible-case-workers'],
    queryFn: () =>
      apiRequest(`/api/cases/${encodeURIComponent(caseId)}/eligible-case-workers`, {
        schema: z.array(caseWorkerSummarySchema),
      }),
  });
}

/** F-004: assigns or reassigns the case. Returns the updated case. */
export function assignCase(caseId: string, caseWorkerId: string) {
  return apiRequest(`/api/cases/${encodeURIComponent(caseId)}/assignee`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseWorkerId }),
    schema: caseResponseSchema,
  });
}

function editRequest(method: string, path: string, body?: unknown) {
  return apiRequest(path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    schema: caseResponseSchema,
  });
}

/** F-002: changes the case's field. Returns the updated case. */
export function changeCaseField(caseId: string, field: Field) {
  return editRequest('PATCH', `/api/cases/${encodeURIComponent(caseId)}/field`, { field });
}

/** F-002: adds a health personnel. Returns the updated case. */
export function addHealthPersonnel(caseId: string, person: NewHealthPersonnel) {
  return editRequest('POST', `/api/cases/${encodeURIComponent(caseId)}/health-personnel`, person);
}

/** F-002: removes a health personnel. Returns the updated case. */
export function removeHealthPersonnel(caseId: string, personId: string) {
  return editRequest(
    'DELETE',
    `/api/cases/${encodeURIComponent(caseId)}/health-personnel/${encodeURIComponent(personId)}`,
  );
}

/** F-002: adds a company. Returns the updated case. */
export function addCompany(caseId: string, company: NewCompany) {
  return editRequest('POST', `/api/cases/${encodeURIComponent(caseId)}/companies`, company);
}

/** F-002: removes a company. Returns the updated case. */
export function removeCompany(caseId: string, companyId: string) {
  return editRequest(
    'DELETE',
    `/api/cases/${encodeURIComponent(caseId)}/companies/${encodeURIComponent(companyId)}`,
  );
}

/** F-002: gives a health personnel a reaction. Returns the updated case. */
export function setHealthPersonnelReaction(
  caseId: string,
  personId: string,
  reaction: HealthPersonnelReaction,
) {
  return editRequest(
    'PUT',
    `/api/cases/${encodeURIComponent(caseId)}/health-personnel/${encodeURIComponent(personId)}/reaction`,
    { reaction },
  );
}

/** F-002: gives a company a reaction. Returns the updated case. */
export function setCompanyReaction(caseId: string, companyId: string, reaction: CompanyReaction) {
  return editRequest(
    'PUT',
    `/api/cases/${encodeURIComponent(caseId)}/companies/${encodeURIComponent(companyId)}/reaction`,
    { reaction },
  );
}

/** F-002: closes the case (assigned case worker, every party has a reaction). Returns the updated case. */
export function closeCase(caseId: string) {
  return editRequest('POST', `/api/cases/${encodeURIComponent(caseId)}/close`);
}

/** F-004: reopens a closed case (leader). Returns the updated case. */
export function reopenCase(caseId: string) {
  return editRequest('POST', `/api/cases/${encodeURIComponent(caseId)}/reopen`);
}

/** F-004: who has read access to the case and who could get it (leaders). Not logged. */
export function readAccessQuery(caseId: string) {
  return queryOptions({
    queryKey: ['cases', caseId, 'read-access'],
    queryFn: () =>
      apiRequest(`/api/cases/${encodeURIComponent(caseId)}/read-access`, {
        schema: readAccessResponseSchema,
      }),
  });
}

/** F-004: gives a case worker read access. Returns the updated read-access lists. */
export function grantReadAccess(caseId: string, caseWorkerId: string) {
  return apiRequest(`/api/cases/${encodeURIComponent(caseId)}/read-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caseWorkerId }),
    schema: readAccessResponseSchema,
  });
}

/** F-004: removes a case worker's read access. Returns the updated read-access lists. */
export function removeReadAccess(caseId: string, caseWorkerId: string) {
  return apiRequest(
    `/api/cases/${encodeURIComponent(caseId)}/read-access/${encodeURIComponent(caseWorkerId)}`,
    { method: 'DELETE', schema: readAccessResponseSchema },
  );
}
