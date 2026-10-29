import { createAuthClient } from 'better-auth/react';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const authClient = createAuthClient({
  baseURL: API_URL,
  fetchOptions: {
    credentials: 'include',
  },
});

export type Role = 'producer' | 'transporter' | 'buyer';
