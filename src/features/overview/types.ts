import { z } from 'zod';
import { departmentIdSchema, fieldSchema } from '@/features/auth';
import { caseStatusSchema, caseWorkerSummarySchema, reactionSchema } from '@/features/cases';

// F-003: one row in the case overview. Admin gets restricted rows (F-004): no reactions, which
// are sensitive case data. The restricted row is strict, so a row that still has reactions is rejected.

const rowFields = {
  id: z.uuid(),
  caseNumber: z.string(),
  field: fieldSchema,
  status: caseStatusSchema,
  departmentId: departmentIdSchema,
  assignedCaseWorker: caseWorkerSummarySchema.nullable(),
};

export const overviewRowSchema = z.discriminatedUnion('access', [
  z.object({ access: z.literal('full'), ...rowFields, reactions: z.array(reactionSchema) }),
  z.strictObject({ access: z.literal('restricted'), ...rowFields }),
]);

export type OverviewRow = z.infer<typeof overviewRowSchema>;

/**
 * F-004: a case in another department whose case worker is borrowed from the leader's department, for
 * the read-only "Lent out" list. The home leader cannot open these cases, so there is no more than this.
 */
export const lentOutCaseSchema = z.object({
  caseId: z.uuid(),
  caseNumber: z.string(),
  departmentId: departmentIdSchema,
  caseWorker: caseWorkerSummarySchema,
});

export type LentOutCase = z.infer<typeof lentOutCaseSchema>;
