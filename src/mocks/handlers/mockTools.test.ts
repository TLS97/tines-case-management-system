import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { userSchema } from '@/features/auth';
import { ApiError, apiRequest } from '@/shared/api/apiRequest';
import { readDb, writeDb } from '../db';
import { DEFAULT_USER_ID, SEED_USERS } from '../seed/users';

const usersSchema = z.array(userSchema);
const KARI_SOLBERG = SEED_USERS.find((user) => user.email === 'kari.solberg@example.com');

function switchTo(body: unknown) {
  return apiRequest('/api/mock/current-user', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    schema: userSchema,
  });
}

describe('mock tool endpoints', () => {
  it('GET /api/mock/users returns the seed users', async () => {
    const users = await apiRequest('/api/mock/users', { schema: usersSchema });

    expect(users).toHaveLength(19);
  });

  it('GET /api/current-user returns Tine Tester by default', async () => {
    const user = await apiRequest('/api/current-user', { schema: userSchema });

    expect(user.id).toBe(DEFAULT_USER_ID);
  });

  it('PUT /api/mock/current-user switches the current user and saves the choice', async () => {
    const switched = await switchTo({ userId: KARI_SOLBERG?.id });

    expect(switched.email).toBe('kari.solberg@example.com');
    expect(readDb().currentUserId).toBe(KARI_SOLBERG?.id);
    const current = await apiRequest('/api/current-user', { schema: userSchema });
    expect(current.id).toBe(KARI_SOLBERG?.id);
  });

  it('PUT /api/mock/current-user rejects an unknown user with 404 and a bad body with 400', async () => {
    await expect(switchTo({ userId: '00000000-0000-4000-8000-000000000000' })).rejects.toEqual(
      new ApiError(404, '/api/mock/current-user'),
    );
    await expect(switchTo({ id: 'not-a-user-id' })).rejects.toEqual(
      new ApiError(400, '/api/mock/current-user'),
    );
    expect(readDb().currentUserId).toBe(DEFAULT_USER_ID);
  });

  it('POST /api/mock/reset restores the seed data and the default user', async () => {
    writeDb({ ...readDb(), users: [...SEED_USERS], currentUserId: KARI_SOLBERG?.id ?? '' });

    await apiRequest('/api/mock/reset', { method: 'POST' });

    expect(readDb().users).toHaveLength(19);
    expect(readDb().currentUserId).toBe(DEFAULT_USER_ID);
  });

  it('rejects a request to an API path without a handler', async () => {
    await expect(apiRequest('/api/does-not-exist')).rejects.toThrow();
  });
});
