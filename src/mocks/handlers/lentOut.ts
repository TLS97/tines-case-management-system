import { http, HttpResponse } from 'msw';
import { can } from '@/features/auth';
import { isBorrowed } from '@/features/cases';
import type { LentOutCase } from '@/features/overview';
import { toCaseWorkerSummary } from '../caseResponses';
import { currentUser, readDb } from '../db';

// F-004: the "Lent out" list for the leader of a case worker's home department. Reading it is not an
// audit action: it opens no case and shows no sensitive case data.
export const lentOutHandlers = [
  http.get('/api/lent-out-cases', () => {
    const db = readDb();
    const user = currentUser(db);
    if (!can(user, 'seeLentOutCases')) return new HttpResponse(null, { status: 403 });

    const lentOut: LentOutCase[] = [];
    for (const supervisionCase of db.cases) {
      const caseWorker = db.users.find((u) => u.id === supervisionCase.assignedTo);
      if (
        caseWorker &&
        caseWorker.departmentId === user.departmentId &&
        isBorrowed(caseWorker, supervisionCase) &&
        supervisionCase.status !== 'Closed'
      ) {
        lentOut.push({
          caseId: supervisionCase.id,
          caseNumber: supervisionCase.caseNumber,
          departmentId: supervisionCase.departmentId,
          caseWorker: toCaseWorkerSummary(caseWorker),
        });
      }
    }
    lentOut.sort((a, b) => b.caseNumber.localeCompare(a.caseNumber, 'en', { numeric: true }));
    return HttpResponse.json(lentOut);
  }),
];
