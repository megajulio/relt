import { api } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Organization {
  id: string;
  name: string;
  role: string;
}

export interface MeResponse {
  user: User;
  organizations: Organization[];
}

export async function login(email: string, password: string): Promise<{ user: User; organization: Organization }> {
  return api.post('/control/v1/auth/login', { email, password });
}

export async function register(
  email: string,
  password: string,
  name: string,
  organizationName: string
): Promise<{ user: User; organization: Organization }> {
  return api.post('/control/v1/auth/register', { email, password, name, organizationName });
}

export async function logout(): Promise<void> {
  await api.post('/control/v1/auth/logout', {});
}

export async function getMe(): Promise<MeResponse> {
  return api.get('/control/v1/auth/me');
}
