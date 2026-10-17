import { describe, expect, it } from 'vitest';
import { caseWorkerDisplayName } from './caseResponse';

describe('caseWorkerDisplayName', () => {
  const caseWorker = {
    id: crypto.randomUUID(),
    firstName: 'Magnus',
    surname: 'Berg',
    isActive: true,
  };

  it('shows the name of an active case worker', () => {
    expect(caseWorkerDisplayName(caseWorker)).toBe('Magnus Berg');
  });

  it('marks a deactivated case worker, who stays on the case (F-004)', () => {
    expect(caseWorkerDisplayName({ ...caseWorker, isActive: false })).toBe(
      'Magnus Berg (deactivated)',
    );
  });

  it('says "Not assigned" when there is no case worker', () => {
    expect(caseWorkerDisplayName(null)).toBe('Not assigned');
  });
});
