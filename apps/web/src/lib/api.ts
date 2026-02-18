import type { Trip, Place, TripPlace, Route, PlaceDetail } from './types';

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

  // Handle 204 No Content and other empty responses
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
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
      latitude?: number;
      longitude?: number;
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
    get: (id: string) =>
      request<Place & { placeDetail?: PlaceDetail | null }>(`/places/${id}`),
    autocompleteCities: (input: string) =>
      request<{ placeId: string; mainText: string; secondaryText: string }[]>(
        `/places/autocomplete/cities?input=${encodeURIComponent(input)}`,
      ),
    nearby: (lat: number, lng: number, types?: string, radius?: number) => {
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
      });
      if (types) params.set('types', types);
      if (radius) params.set('radius', String(radius));
      return request<Place[]>(`/places/nearby?${params.toString()}`);
    },
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

/**
 * photoUrls 배열의 첫 번째 값으로 프록시 사진 URL 생성.
 * 기존 데이터(전체 URL)와 새 데이터(ref만) 모두 호환.
 */
export function getPhotoProxyUrl(photoRef: string): string {
  // 이미 전체 프록시 URL인 경우 그대로 반환
  if (photoRef.startsWith('http')) {
    return photoRef;
  }
  return `${API_BASE}/places/photo?ref=${encodeURIComponent(photoRef)}&maxwidth=400`;
}

export { ApiError };
