import { Button } from '@digdir/designsystemet-react';
import type { User } from '@/features/auth';
import { useReactivateUser } from '../hooks/useUsers';

interface ReactivateUserButtonProps {
  user: User;
  onReactivated: (user: User) => void;
  onFailed: (user: User, error: Error) => void;
}

// F-004: Admin reactivates a deactivated user. Nothing is lost by it, so there is no confirmation.
export function ReactivateUserButton({ user, onReactivated, onFailed }: ReactivateUserButtonProps) {
  const reactivate = useReactivateUser();

  return (
    <Button
      variant="tertiary"
      data-size="sm"
      aria-label={`Reactivate ${user.firstName} ${user.surname}`}
      loading={reactivate.isPending}
      onClick={() =>
        reactivate.mutate(user.id, {
          onSuccess: onReactivated,
          onError: (error) => onFailed(user, error),
        })
      }
    >
      Reactivate
    </Button>
  );
}
