import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PlaceSearchResult {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: number;
  types: string[];
  photoRef?: string;
}

export interface PlaceDetailsResult extends PlaceSearchResult {
  openingHours?: { weekday_text: string[] };
  photoRefs: string[];
}

export interface CityAutocompleteResult {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

const PRICE_LEVEL_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

@Injectable()
export class GoogleMapsService {
  private readonly apiKey: string;
  private readonly logger = new Logger(GoogleMapsService.name);
  private readonly baseUrl = 'https://places.googleapis.com/v1';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY') ?? '';
  }

  async searchPlaces(query: string): Promise<PlaceSearchResult[]> {
    const url = `${this.baseUrl}/places:searchText`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.types,places.photos',
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'ko',
      }),
    });

    const data = (await res.json()) as any;

    if (!res.ok) {
      this.logger.warn(
        `Places API (New) searchText error: ${res.status} - ${JSON.stringify(data.error?.message)}`,
      );
      return [];
    }

    return (data.places ?? []).slice(0, 10).map((p: any) => ({
      placeId: p.id,
      name: p.displayName?.text ?? '',
      address: p.formattedAddress ?? '',
      latitude: p.location?.latitude ?? 0,
      longitude: p.location?.longitude ?? 0,
      rating: p.rating,
      userRatingCount: p.userRatingCount,
      priceLevel:
        p.priceLevel != null ? PRICE_LEVEL_MAP[p.priceLevel] : undefined,
      types: p.types ?? [],
      photoRef: p.photos?.[0]?.name,
    }));
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetailsResult | null> {
    const fieldMask = [
      'id',
      'displayName',
      'formattedAddress',
      'location',
      'rating',
      'userRatingCount',
      'priceLevel',
      'types',
      'regularOpeningHours',
      'photos',
    ].join(',');

    const url = `${this.baseUrl}/places/${placeId}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
    });

    const data = (await res.json()) as any;

    if (!res.ok) {
      this.logger.warn(
        `Places API (New) details error: ${res.status} - ${JSON.stringify(data.error?.message)}`,
      );
      return null;
    }

    return {
      placeId: data.id,
      name: data.displayName?.text ?? '',
      address: data.formattedAddress ?? '',
      latitude: data.location?.latitude ?? 0,
      longitude: data.location?.longitude ?? 0,
      rating: data.rating,
      userRatingCount: data.userRatingCount,
      priceLevel:
        data.priceLevel != null ? PRICE_LEVEL_MAP[data.priceLevel] : undefined,
      types: data.types ?? [],
      openingHours: data.regularOpeningHours
        ? { weekday_text: data.regularOpeningHours.weekdayDescriptions ?? [] }
        : undefined,
      photoRefs: (data.photos ?? []).slice(0, 5).map((p: any) => p.name),
    };
  }

  getPhotoUrl(photoRef: string, maxWidth = 400): string {
    const apiBase = process.env.API_BASE_URL ?? 'http://localhost:4000/api';
    return `${apiBase}/places/photo?ref=${encodeURIComponent(photoRef)}&maxwidth=${maxWidth}`;
  }

  async fetchPhoto(
    photoRef: string,
    maxWidth = 400,
  ): Promise<{ buffer: Buffer; contentType: string }> {
    let url: string;

    if (photoRef.startsWith('places/')) {
      // New API format: places/{placeId}/photos/{photoId}
      url = `${this.baseUrl}/${photoRef}/media?maxWidthPx=${maxWidth}&key=${this.apiKey}`;
    } else {
      // Legacy format: photo_reference string (for existing DB data)
      url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoRef}&key=${this.apiKey}`;
    }

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Photo fetch failed: ${res.status}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    return { buffer, contentType };
  }

  async autocompleteCities(input: string): Promise<CityAutocompleteResult[]> {
    const url = `${this.baseUrl}/places:autocomplete`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
      },
      body: JSON.stringify({
        input,
        includedPrimaryTypes: ['locality', 'administrative_area_level_1'],
        languageCode: 'ko',
      }),
    });

    const data = (await res.json()) as any;

    if (!res.ok) {
      this.logger.warn(
        `Places Autocomplete error: ${res.status} - ${JSON.stringify(data.error?.message)}`,
      );
      return [];
    }

    return (data.suggestions ?? [])
      .filter((s: any) => s.placePrediction)
      .slice(0, 8)
      .map((s: any) => ({
        placeId: s.placePrediction.placeId,
        mainText: s.placePrediction.structuredFormat?.mainText?.text ?? '',
        secondaryText:
          s.placePrediction.structuredFormat?.secondaryText?.text ?? '',
      }));
  }

  async searchNearby(
    lat: number,
    lng: number,
    types: string[],
    radius = 5000,
  ): Promise<PlaceSearchResult[]> {
    const url = `${this.baseUrl}/places:searchNearby`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.types,places.photos',
      },
      body: JSON.stringify({
        includedTypes: types,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius,
          },
        },
        maxResultCount: 10,
        languageCode: 'ko',
      }),
    });

    const data = (await res.json()) as any;

    if (!res.ok) {
      this.logger.warn(
        `Places Nearby error: ${res.status} - ${JSON.stringify(data.error?.message)}`,
      );
      return [];
    }

    return (data.places ?? []).map((p: any) => ({
      placeId: p.id,
      name: p.displayName?.text ?? '',
      address: p.formattedAddress ?? '',
      latitude: p.location?.latitude ?? 0,
      longitude: p.location?.longitude ?? 0,
      rating: p.rating,
      userRatingCount: p.userRatingCount,
      priceLevel:
        p.priceLevel != null ? PRICE_LEVEL_MAP[p.priceLevel] : undefined,
      types: p.types ?? [],
      photoRef: p.photos?.[0]?.name,
    }));
  }

  mapTypesToCategory(types: string[]): string {
    if (types.includes('restaurant') || types.includes('food'))
      return 'RESTAURANT';
    if (types.includes('cafe')) return 'CAFE';
    if (types.includes('bar')) return 'BAR';
    if (types.includes('tourist_attraction') || types.includes('museum'))
      return 'ATTRACTION';
    if (types.includes('shopping_mall') || types.includes('store'))
      return 'SHOPPING';
    if (types.includes('spa')) return 'SPA_MASSAGE';
    if (types.includes('amusement_park') || types.includes('night_club'))
      return 'ENTERTAINMENT';
    if (types.includes('lodging')) return 'ACCOMMODATION';
    if (types.includes('transit_station') || types.includes('airport'))
      return 'TRANSPORT_HUB';
    return 'OTHER';
  }
}
