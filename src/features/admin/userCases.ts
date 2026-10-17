import { z } from 'zod';
import { caseStatusSchema } from '@/features/cases';

/** F-004: an open case that keeps a user from moving department (they are its case worker). */
export const blockingCaseSchema = z.object({
  caseId: z.uuid(),
  caseNumber: z.string(),
  status: caseStatusSchema,
});

export type BlockingCase = z.infer<typeof blockingCaseSchema>;
