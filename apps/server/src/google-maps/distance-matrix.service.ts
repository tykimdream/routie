import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export interface DistanceEntry {
  originId: string;
  destId: string;
  duration: number; // seconds
  distance: number; // meters
}

@Injectable()
export class DistanceMatrixService {
  private readonly apiKey: string;
  private readonly logger = new Logger(DistanceMatrixService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY') ?? '';
  }

  async getMatrix(
    places: { id: string; latitude: number; longitude: number }[],
    travelMode: string,
  ): Promise<DistanceEntry[]> {
    const entries: DistanceEntry[] = [];

    // Check cache first
    const cached = await this.getCachedDistances(places, travelMode);
    const missing: { originIdx: number; destIdx: number }[] = [];

    for (let i = 0; i < places.length; i++) {
      for (let j = 0; j < places.length; j++) {
        if (i === j) continue;
        const key = `${places[i]!.id}:${places[j]!.id}`;
        if (cached.has(key)) {
          entries.push(cached.get(key)!);
        } else {
          missing.push({ originIdx: i, destIdx: j });
        }
      }
    }

    if (missing.length === 0) return entries;

    // Fetch missing from Google API
    const origins = places.map((p) => `${p.latitude},${p.longitude}`);
    const destinations = origins;
    const mode =
      travelMode === 'PUBLIC_TRANSIT' ? 'transit' : travelMode.toLowerCase();

    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins.join('|')}&destinations=${destinations.join('|')}&mode=${mode}&key=${this.apiKey}&language=ko`;

      const res = await fetch(url);
      const data = (await res.json()) as any;

      if (data.status !== 'OK') {
        this.logger.warn(`Distance Matrix API error: ${data.status}`);
        return this.fallbackDistances(places, entries);
      }

      const cacheBatch: {
        originPlaceId: string;
        destPlaceId: string;
        travelMode: string;
        duration: number;
        distance: number;
        expiresAt: Date;
      }[] = [];

      for (const { originIdx, destIdx } of missing) {
        const element = data.rows?.[originIdx]?.elements?.[destIdx];
        const origin = places[originIdx]!;
        const dest = places[destIdx]!;

        if (element?.status === 'OK') {
          const entry: DistanceEntry = {
            originId: origin.id,
            destId: dest.id,
            duration: element.duration.value,
            distance: element.distance.value,
          };
          entries.push(entry);
          cacheBatch.push({
            originPlaceId: origin.id,
            destPlaceId: dest.id,
            travelMode,
            duration: entry.duration,
            distance: entry.distance,
            expiresAt: new Date(Date.now() + 86400 * 1000),
          });
        } else {
          // Use straight-line fallback
          const dist = this.haversine(origin, dest);
          entries.push({
            originId: origin.id,
            destId: dest.id,
            duration: Math.round((dist / 1000) * 120), // ~30km/h avg
            distance: Math.round(dist),
          });
        }
      }

      // Batch cache
      if (cacheBatch.length > 0) {
        await Promise.all(
          cacheBatch.map((c) =>
            this.prisma.distanceCache
              .upsert({
                where: {
                  originPlaceId_destPlaceId_travelMode: {
                    originPlaceId: c.originPlaceId,
                    destPlaceId: c.destPlaceId,
                    travelMode: c.travelMode,
                  },
                },
                create: c,
                update: {
                  duration: c.duration,
                  distance: c.distance,
                  expiresAt: c.expiresAt,
                  cachedAt: new Date(),
                },
              })
              .catch(() => {}),
          ),
        );
      }
    } catch (err) {
      this.logger.error('Distance Matrix fetch failed', err);
      return this.fallbackDistances(places, entries);
    }

    return entries;
  }

  private async getCachedDistances(
    places: { id: string }[],
    travelMode: string,
  ) {
    const ids = places.map((p) => p.id);
    const cached = await this.prisma.distanceCache.findMany({
      where: {
        originPlaceId: { in: ids },
        destPlaceId: { in: ids },
        travelMode,
        expiresAt: { gt: new Date() },
      },
    });

    const map = new Map<string, DistanceEntry>();
    for (const c of cached) {
      map.set(`${c.originPlaceId}:${c.destPlaceId}`, {
        originId: c.originPlaceId,
        destId: c.destPlaceId,
        duration: c.duration,
        distance: c.distance,
      });
    }
    return map;
  }

  private fallbackDistances(
    places: { id: string; latitude: number; longitude: number }[],
    existing: DistanceEntry[],
  ) {
    const existingKeys = new Set(
      existing.map((e) => `${e.originId}:${e.destId}`),
    );
    for (let i = 0; i < places.length; i++) {
      for (let j = 0; j < places.length; j++) {
        if (i === j) continue;
        const origin = places[i]!;
        const dest = places[j]!;
        const key = `${origin.id}:${dest.id}`;
        if (!existingKeys.has(key)) {
          const dist = this.haversine(origin, dest);
          existing.push({
            originId: origin.id,
            destId: dest.id,
            duration: Math.round((dist / 1000) * 120),
            distance: Math.round(dist),
          });
        }
      }
    }
    return existing;
  }

  private haversine(
    a: { latitude: number; longitude: number },
    b: { latitude: number; longitude: number },
  ): number {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const sinLat = Math.sin(dLat / 2);
    const sinLon = Math.sin(dLon / 2);
    const aVal =
      sinLat * sinLat +
      Math.cos(toRad(a.latitude)) *
        Math.cos(toRad(b.latitude)) *
        sinLon *
        sinLon;
    return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  }
}
