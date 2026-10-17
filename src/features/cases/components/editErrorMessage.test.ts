import { describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/api/apiRequest';
import { editErrorMessage } from './editErrorMessage';

describe('editErrorMessage', () => {
  const fallback = 'Try again.';
  const conflict = 'Already there.';

  it('says the user may not edit when the mock API answers 403', () => {
    expect(editErrorMessage(new ApiError(403, '/x'), fallback, conflict)).toBe(
      'You are not allowed to edit this case.',
    );
  });

  it('uses the conflict message for 409, when there is one', () => {
    expect(editErrorMessage(new ApiError(409, '/x'), fallback, conflict)).toBe(conflict);
    expect(editErrorMessage(new ApiError(409, '/x'), fallback)).toBe(fallback);
  });

  it('falls back for anything else', () => {
    expect(editErrorMessage(new ApiError(500, '/x'), fallback, conflict)).toBe(fallback);
    expect(editErrorMessage(new Error('network'), fallback)).toBe(fallback);
  });
});
