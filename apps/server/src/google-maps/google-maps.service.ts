import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PlaceSearchResult {
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

interface PlaceDetailsResult extends PlaceSearchResult {
  openingHours?: { weekday_text: string[] };
  photoRefs: string[];
}

@Injectable()
export class GoogleMapsService {
  private readonly apiKey: string;
  private readonly logger = new Logger(GoogleMapsService.name);

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY') ?? '';
  }

  async searchPlaces(query: string): Promise<PlaceSearchResult[]> {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}&language=ko`;

    const res = await fetch(url);
    const data = (await res.json()) as any;

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      this.logger.warn(
        `Places API error: ${data.status} - ${data.error_message}`,
      );
      return [];
    }

    return (data.results ?? []).slice(0, 10).map((r: any) => ({
      placeId: r.place_id,
      name: r.name,
      address: r.formatted_address,
      latitude: r.geometry.location.lat,
      longitude: r.geometry.location.lng,
      rating: r.rating,
      userRatingCount: r.user_ratings_total,
      priceLevel: r.price_level,
      types: r.types ?? [],
      photoRef: r.photos?.[0]?.photo_reference,
    }));
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetailsResult | null> {
    const fields =
      'place_id,name,formatted_address,geometry,rating,user_ratings_total,price_level,types,opening_hours,photos';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${this.apiKey}&language=ko`;

    const res = await fetch(url);
    const data = (await res.json()) as any;

    if (data.status !== 'OK') {
      this.logger.warn(`Place Details API error: ${data.status}`);
      return null;
    }

    const r = data.result;
    return {
      placeId: r.place_id,
      name: r.name,
      address: r.formatted_address,
      latitude: r.geometry.location.lat,
      longitude: r.geometry.location.lng,
      rating: r.rating,
      userRatingCount: r.user_ratings_total,
      priceLevel: r.price_level,
      types: r.types ?? [],
      openingHours: r.opening_hours,
      photoRefs: (r.photos ?? [])
        .slice(0, 5)
        .map((p: any) => p.photo_reference),
    };
  }

  getPhotoUrl(photoRef: string, maxWidth = 400): string {
    // Return a server-side proxy URL instead of embedding the API key
    const apiBase = process.env.API_BASE_URL ?? 'http://localhost:4000/api';
    return `${apiBase}/places/photo?ref=${encodeURIComponent(photoRef)}&maxwidth=${maxWidth}`;
  }

  async fetchPhoto(
    photoRef: string,
    maxWidth = 400,
  ): Promise<{ buffer: Buffer; contentType: string }> {
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoRef}&key=${this.apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Photo fetch failed: ${res.status}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    return { buffer, contentType };
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
