import { z } from 'zod';
import { departmentIdSchema } from '@/features/auth';
import { restrictedSupervisionCaseSchema } from './restrictedView';
import { supervisionCaseSchema } from './types';

// What the mock API returns when a case is opened (GET /api/cases/:id): the full case, or for
// Admin the restricted view (F-004), plus the assigned case worker's name for display.

/**
 * Name, active status and home department of a case worker. Not sensitive case data, so Admin gets it
 * too. The department shows whether they are borrowed for a case (F-004).
 */
export const caseWorkerSummarySchema = z.object({
  id: z.uuid(),
  firstName: z.string(),
  surname: z.string(),
  isActive: z.boolean(),
  departmentId: departmentIdSchema,
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

/** F-004: who has read access to a case, and who the leader could give it to. */
export const readAccessResponseSchema = z.object({
  granted: z.array(caseWorkerSummarySchema),
  candidates: z.array(caseWorkerSummarySchema),
});

export type CaseWorkerSummary = z.infer<typeof caseWorkerSummarySchema>;
export type ReadAccessResponse = z.infer<typeof readAccessResponseSchema>;
export type CaseResponse = z.infer<typeof caseResponseSchema>;

/** "Magnus Berg", "Magnus Berg (deactivated)" (F-004: a deactivated case worker stays on the case) or "Not assigned". */
export function caseWorkerDisplayName(caseWorker: CaseWorkerSummary | null): string {
  if (!caseWorker) return 'Not assigned';
  const name = `${caseWorker.firstName} ${caseWorker.surname}`;
  return caseWorker.isActive ? name : `${name} (deactivated)`;
}
