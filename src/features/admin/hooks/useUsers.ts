import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DepartmentId, UserFields } from '@/features/auth';
import {
  addUser,
  blockingCasesQuery,
  changeUserFields,
  deactivateUser,
  moveUser,
  reactivateUser,
  usersQuery,
} from '../api';

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

/**
 * Deactivates a user; the user list, the switcher and leaders' notifications are refreshed.
 * The refresh is not awaited: the refreshed list no longer shows the Deactivate button, and that
 * button's own success callback (closing the dialog, the confirmation) must run before it disappears.
 */
export function useDeactivateUser() {
  return useActivationMutation(deactivateUser);
}

/** Reactivates a user; refreshed like {@link useDeactivateUser}, as the Reactivate button disappears too. */
export function useReactivateUser() {
  return useActivationMutation(reactivateUser);
}

function useActivationMutation(mutationFn: typeof deactivateUser) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usersQuery.queryKey });
      void queryClient.invalidateQueries({ queryKey: ['mock', 'users'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

function useUserMutation<TInput>(mutationFn: (input: TInput) => ReturnType<typeof moveUser>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: usersQuery.queryKey }),
        queryClient.invalidateQueries({ queryKey: ['mock', 'users'] }),
      ]),
  });
}

export function useChangeUserFields(userId: string) {
  return useUserMutation((fields: UserFields) => changeUserFields(userId, fields));
}

export function useBlockingCases(userId: string) {
  return useQuery(blockingCasesQuery(userId));
}

export function useMoveUser(userId: string) {
  return useUserMutation((departmentId: DepartmentId) => moveUser(userId, departmentId));
}
