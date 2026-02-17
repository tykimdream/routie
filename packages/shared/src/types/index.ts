// ============================================
// Enums (mirrors Prisma schema)
// ============================================

export enum Transport {
  WALKING = 'WALKING',
  PUBLIC_TRANSIT = 'PUBLIC_TRANSIT',
  DRIVING = 'DRIVING',
  TAXI = 'TAXI',
}

export enum TripStatus {
  PLANNING = 'PLANNING',
  OPTIMIZED = 'OPTIMIZED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
}

export enum PlaceCategory {
  RESTAURANT = 'RESTAURANT',
  CAFE = 'CAFE',
  BAR = 'BAR',
  ATTRACTION = 'ATTRACTION',
  SHOPPING = 'SHOPPING',
  SPA_MASSAGE = 'SPA_MASSAGE',
  ENTERTAINMENT = 'ENTERTAINMENT',
  ACCOMMODATION = 'ACCOMMODATION',
  TRANSPORT_HUB = 'TRANSPORT_HUB',
  OTHER = 'OTHER',
}

export enum Priority {
  MUST = 'MUST',
  WANT = 'WANT',
  OPTIONAL = 'OPTIONAL',
}

export enum RouteType {
  EFFICIENT = 'EFFICIENT',
  RELAXED = 'RELAXED',
  CUSTOM = 'CUSTOM',
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
