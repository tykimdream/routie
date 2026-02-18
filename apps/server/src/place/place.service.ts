import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleMapsService } from '../google-maps/google-maps.service';

@Injectable()
export class PlaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly googleMaps: GoogleMapsService,
  ) {}

  async search(query: string) {
    const results = await this.googleMaps.searchPlaces(query);

    return results.map((r) => ({
      googlePlaceId: r.placeId,
      name: r.name,
      address: r.address,
      latitude: r.latitude,
      longitude: r.longitude,
      category: this.googleMaps.mapTypesToCategory(r.types),
      rating: r.rating ?? null,
      userRatingCount: r.userRatingCount ?? null,
      priceLevel: r.priceLevel ?? null,
      photoUrl: r.photoRef ? this.googleMaps.getPhotoUrl(r.photoRef) : null,
    }));
  }

  async findOrCreate(googlePlaceId: string) {
    const existing = await this.prisma.place.findUnique({
      where: { googlePlaceId },
    });
    if (existing) return existing;

    const details = await this.googleMaps.getPlaceDetails(googlePlaceId);
    if (!details) {
      throw new NotFoundException('Google Places에서 장소를 찾을 수 없습니다');
    }

    const photoUrls = details.photoRefs.map((ref) =>
      this.googleMaps.getPhotoUrl(ref),
    );

    return this.prisma.place.create({
      data: {
        googlePlaceId: details.placeId,
        name: details.name,
        address: details.address,
        latitude: details.latitude,
        longitude: details.longitude,
        category: this.googleMaps.mapTypesToCategory(details.types) as any,
        rating: details.rating ?? null,
        userRatingCount: details.userRatingCount ?? null,
        priceLevel: details.priceLevel ?? null,
        photoUrls,
        openingHours: details.openingHours ?? undefined,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.place.findUnique({
      where: { id },
      include: { placeDetail: true },
    });
  }
}
