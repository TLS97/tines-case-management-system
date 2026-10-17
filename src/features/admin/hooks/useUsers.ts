import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addUser, deactivateUser, usersQuery } from '../api';

export function useUsers() {
  return useQuery(usersQuery);
}

/** Adds a user; the user list and the mock user switcher are refreshed afterwards. */
export function useAddUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addUser,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: usersQuery.queryKey }),
        queryClient.invalidateQueries({ queryKey: ['mock', 'users'] }),
      ]),
  });
}

/** Deactivates a user; the user list, the switcher and leaders' notifications are refreshed. */
export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: usersQuery.queryKey }),
        queryClient.invalidateQueries({ queryKey: ['mock', 'users'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]),
  });
}
