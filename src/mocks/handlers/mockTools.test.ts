import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { userSchema } from '@/features/auth';
import { apiRequest } from '@/shared/api/apiRequest';
import { readDb, writeDb } from '../db';

const usersSchema = z.array(userSchema);

describe('mock tool endpoints', () => {
  it('GET /api/mock/users returns the seed users', async () => {
    const users = await apiRequest('/api/mock/users', { schema: usersSchema });

    expect(users).toHaveLength(19);
  });

  it('POST /api/mock/reset restores the seed data', async () => {
    writeDb({ ...readDb(), users: [] });

    await apiRequest('/api/mock/reset', { method: 'POST' });

    expect(readDb().users).toHaveLength(19);
  });

  it('rejects a request to an API path without a handler', async () => {
    await expect(apiRequest('/api/does-not-exist')).rejects.toThrow();
  });
});
