import { caseEditingHandlers } from './caseEditing';
import { caseReadAccessHandlers } from './caseReadAccess';
import { caseHandlers } from './cases';
import { caseStatusHandlers } from './caseStatus';
import { currentUserHandlers } from './currentUser';
import { mockToolHandlers } from './mockTools';
import { notificationHandlers } from './notifications';
import { userHandlers } from './users';

export const handlers = [
  ...currentUserHandlers,
  ...caseHandlers,
  ...caseEditingHandlers,
  ...caseStatusHandlers,
  ...caseReadAccessHandlers,
  ...userHandlers,
  ...notificationHandlers,
  ...mockToolHandlers,
];
