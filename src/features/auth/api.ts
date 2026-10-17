import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/shared/api/apiRequest';
import { userSchema } from './types';

/** The user the app acts as. Shared by useCurrentUser and the mock user switcher. */
export const currentUserQuery = queryOptions({
  queryKey: ['current-user'],
  queryFn: () => apiRequest('/api/current-user', { schema: userSchema }),
});
