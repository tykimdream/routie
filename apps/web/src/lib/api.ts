const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new ApiError(
      res.status,
      body.message ?? `Request failed with status ${res.status}`,
    );
  }

  return res.json();
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export const api = {
  auth: {
    signup: (data: { email: string; password: string; name: string }) =>
      request<AuthResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string }) =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request<AuthResponse['user']>('/auth/me'),
    refresh: () => request<AuthResponse>('/auth/refresh', { method: 'POST' }),
  },
};

export { ApiError };
