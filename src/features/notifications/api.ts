import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest } from '@/shared/api/apiRequest';
import { notificationSchema } from './types';

/** Notifications for the current user (F-004). Refetched each time a page that shows them opens. */
export const notificationsQuery = queryOptions({
  queryKey: ['notifications'],
  queryFn: () => apiRequest('/api/notifications', { schema: z.array(notificationSchema) }),
});
