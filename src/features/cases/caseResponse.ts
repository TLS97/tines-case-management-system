import { z } from 'zod';
import { restrictedSupervisionCaseSchema } from './restrictedView';
import { supervisionCaseSchema } from './types';

// What the mock API returns when a case is opened (GET /api/cases/:id): the full case, or for
// Admin the restricted view (F-004), plus the assigned case worker's name for display.

/** Name and active status of the assigned case worker. Not sensitive case data, so Admin gets it too. */
export const caseWorkerSummarySchema = z.object({
  id: z.uuid(),
  firstName: z.string(),
  surname: z.string(),
  isActive: z.boolean(),
});

export const caseResponseSchema = z.discriminatedUnion('access', [
  z.object({
    access: z.literal('full'),
    supervisionCase: supervisionCaseSchema,
    assignedCaseWorker: caseWorkerSummarySchema.nullable(),
  }),
  z.object({
    access: z.literal('restricted'),
    supervisionCase: restrictedSupervisionCaseSchema,
    assignedCaseWorker: caseWorkerSummarySchema.nullable(),
  }),
]);

export type CaseWorkerSummary = z.infer<typeof caseWorkerSummarySchema>;
export type CaseResponse = z.infer<typeof caseResponseSchema>;

/** "Magnus Berg", "Magnus Berg (deactivated)" (F-004: a deactivated case worker stays on the case) or "Not assigned". */
export function caseWorkerDisplayName(caseWorker: CaseWorkerSummary | null): string {
  if (!caseWorker) return 'Not assigned';
  const name = `${caseWorker.firstName} ${caseWorker.surname}`;
  return caseWorker.isActive ? name : `${name} (deactivated)`;
}
