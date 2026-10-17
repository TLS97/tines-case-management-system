import { currentUserHandlers } from './currentUser';
import { mockToolHandlers } from './mockTools';

export const handlers = [...currentUserHandlers, ...mockToolHandlers];
