import type { Trip, Place, TripPlace, Route } from './types';

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

  trips: {
    list: () => request<Trip[]>('/trips'),
    get: (id: string) => request<Trip>(`/trips/${id}`),
    create: (data: {
      title: string;
      city: string;
      country?: string;
      startDate: string;
      endDate: string;
      dailyStart?: string;
      dailyEnd?: string;
      transport?: string;
    }) =>
      request<Trip>('/trips', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      request<Trip>(`/trips/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request<Trip>(`/trips/${id}`, { method: 'DELETE' }),
  },

  places: {
    search: (query: string) =>
      request<Place[]>(`/places/search?query=${encodeURIComponent(query)}`),
    get: (id: string) => request<Place>(`/places/${id}`),
  },

  tripPlaces: {
    add: (
      tripId: string,
      data: { placeId?: string; priority?: string; googlePlaceId?: string },
    ) =>
      request<TripPlace>(`/trips/${tripId}/places`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (tripId: string, id: string, data: Record<string, unknown>) =>
      request<TripPlace>(`/trips/${tripId}/places/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    reorder: (tripId: string, data: { orderedIds: string[] }) =>
      request<void>(`/trips/${tripId}/places/reorder`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    remove: (tripId: string, id: string) =>
      request<void>(`/trips/${tripId}/places/${id}`, { method: 'DELETE' }),
  },

  routes: {
    optimize: (tripId: string) =>
      request<Route[]>(`/trips/${tripId}/routes/optimize`, {
        method: 'POST',
      }),
    list: (tripId: string) => request<Route[]>(`/trips/${tripId}/routes`),
    get: (tripId: string, routeId: string) =>
      request<Route>(`/trips/${tripId}/routes/${routeId}`),
    select: (tripId: string, routeId: string) =>
      request<Route>(`/trips/${tripId}/routes/${routeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isSelected: true }),
      }),
  },
};

export { ApiError };
