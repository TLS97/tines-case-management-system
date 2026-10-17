import { z } from 'zod';
import { caseWorkerSummarySchema } from '@/features/cases';

// Notifications for the current user. F-004: a leader is told about cases in their department whose
// case worker is deactivated. F-012 (Draft) will add notifications about unassigned cases here.

export const notificationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('DeactivatedCaseWorker'),
    caseId: z.uuid(),
    caseNumber: z.string(),
    caseWorker: caseWorkerSummarySchema,
  }),
]);

export type Notification = z.infer<typeof notificationSchema>;
