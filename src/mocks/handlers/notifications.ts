import { http, HttpResponse } from 'msw';
import { can } from '@/features/auth';
import type { Notification } from '@/features/notifications';
import { toCaseWorkerSummary } from '../caseResponses';
import { currentUser, readDb } from '../db';

// Notifications for the current user. Reading them is not an audit action.
export const notificationHandlers = [
  http.get('/api/notifications', () => {
    const db = readDb();
    const user = currentUser(db);
    const notifications: Notification[] = [];

    // F-004: cases the leader can reassign (own department, not closed) whose case worker is deactivated.
    for (const supervisionCase of db.cases) {
      const caseWorker = db.users.find((u) => u.id === supervisionCase.assignedTo);
      if (caseWorker && !caseWorker.isActive && can(user, 'assignCase', supervisionCase)) {
        notifications.push({
          type: 'DeactivatedCaseWorker',
          caseId: supervisionCase.id,
          caseNumber: supervisionCase.caseNumber,
          caseWorker: toCaseWorkerSummary(caseWorker),
        });
      }
    }
    notifications.sort((a, b) => b.caseNumber.localeCompare(a.caseNumber, 'en', { numeric: true }));
    return HttpResponse.json(notifications);
  }),
];
