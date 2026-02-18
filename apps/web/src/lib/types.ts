export type Transport = 'WALKING' | 'PUBLIC_TRANSIT' | 'DRIVING' | 'TAXI';
export type TripStatus = 'PLANNING' | 'OPTIMIZED' | 'CONFIRMED' | 'COMPLETED';
export type PlaceCategory =
  | 'RESTAURANT'
  | 'CAFE'
  | 'BAR'
  | 'ATTRACTION'
  | 'SHOPPING'
  | 'SPA_MASSAGE'
  | 'ENTERTAINMENT'
  | 'ACCOMMODATION'
  | 'TRANSPORT_HUB'
  | 'OTHER';
export type Priority = 'MUST' | 'WANT' | 'OPTIONAL';
export type RouteType = 'EFFICIENT' | 'RELAXED' | 'CUSTOM';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface Trip {
  id: string;
  userId: string;
  title: string;
  city: string;
  country: string | null;
  startDate: string;
  endDate: string;
  dailyStart: string;
  dailyEnd: string;
  latitude: number | null;
  longitude: number | null;
  transport: Transport;
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
  _count?: { tripPlaces: number };
  tripPlaces?: TripPlace[];
  routes?: Route[];
}

export interface PlaceDetail {
  id: string;
  placeId: string;
  highlights: string[];
  signatureMenus: string[];
  vibes: string[];
  reviewHighlights: string[];
  avgDuration: number | null;
  nearestStation: string | null;
}

export interface Place {
  id: string;
  googlePlaceId: string | null;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: PlaceCategory;
  rating: number | null;
  userRatingCount: number | null;
  priceLevel: number | null;
  photoUrls: string[];
  summary: string | null;
  openingHours: unknown;
  placeDetail?: PlaceDetail | null;
}

export interface TripPlace {
  id: string;
  tripId: string;
  placeId: string;
  priority: Priority;
  sortOrder: number;
  customDuration: number | null;
  userNote: string | null;
  preferredTime: string | null;
  place: Place;
  createdAt: string;
  updatedAt: string;
}

export interface Route {
  id: string;
  tripId: string;
  date: string;
  routeType: RouteType;
  totalDuration: number;
  totalDistance: number;
  totalTravelTime: number;
  placeCount: number;
  score: number;
  reasoning: string | null;
  isSelected: boolean;
  stops: RouteStop[];
  createdAt: string;
}

export interface RouteStop {
  id: string;
  routeId: string;
  placeId: string;
  stopOrder: number;
  arrivalTime: string;
  departureTime: string;
  duration: number;
  travelTimeFromPrev: number | null;
  travelDistFromPrev: number | null;
  travelMode: string | null;
  selectionReason: string | null;
  place: Place;
}
