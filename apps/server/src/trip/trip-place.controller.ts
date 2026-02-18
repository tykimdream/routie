import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TripService } from './trip.service';
import { PlaceService } from '../place/place.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddTripPlaceDto,
  UpdateTripPlaceDto,
  ReorderTripPlacesDto,
} from './dto/add-trip-place.dto';

@Controller('trips/:tripId/places')
@UseGuards(JwtAuthGuard)
export class TripPlaceController {
  constructor(
    private readonly tripService: TripService,
    private readonly placeService: PlaceService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  async addPlace(
    @Param('tripId') tripId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddTripPlaceDto,
  ) {
    // Verify trip ownership
    await this.tripService.findOne(tripId, userId);

    // Find or create place from Google Places
    const place = await this.placeService.findOrCreate(dto.googlePlaceId);

    // Get current max sortOrder
    const maxSort = await this.prisma.tripPlace.findFirst({
      where: { tripId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    return this.prisma.tripPlace.create({
      data: {
        tripId,
        placeId: place.id,
        priority: (dto.priority as any) ?? 'WANT',
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
        userNote: dto.userNote,
        customDuration: dto.customDuration,
        preferredTime: dto.preferredTime,
      },
      include: { place: true },
    });
  }

  // IMPORTANT: 'reorder' must be declared BEFORE ':id' to prevent route conflict
  @Patch('reorder')
  async reorder(
    @Param('tripId') tripId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ReorderTripPlacesDto,
  ) {
    await this.tripService.findOne(tripId, userId);

    // Verify all IDs belong to this trip
    const tripPlaces = await this.prisma.tripPlace.findMany({
      where: { tripId },
      select: { id: true },
    });
    const validIds = new Set(tripPlaces.map((tp) => tp.id));
    const invalidIds = dto.orderedIds.filter((id) => !validIds.has(id));
    if (invalidIds.length > 0) {
      throw new NotFoundException(
        `TripPlace not found in this trip: ${invalidIds.join(', ')}`,
      );
    }

    await Promise.all(
      dto.orderedIds.map((id, index) =>
        this.prisma.tripPlace.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return { success: true };
  }

  @Patch(':id')
  async updatePlace(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateTripPlaceDto,
  ) {
    await this.tripService.findOne(tripId, userId);

    // Verify TripPlace belongs to this trip (prevents IDOR)
    return this.prisma.tripPlace.update({
      where: { id, tripId },
      data: {
        ...(dto.priority !== undefined && { priority: dto.priority as any }),
        ...(dto.userNote !== undefined && { userNote: dto.userNote }),
        ...(dto.customDuration !== undefined && {
          customDuration: dto.customDuration,
        }),
        ...(dto.preferredTime !== undefined && {
          preferredTime: dto.preferredTime,
        }),
      },
      include: { place: true },
    });
  }

  @Delete(':id')
  async removePlace(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.tripService.findOne(tripId, userId);
    // Verify TripPlace belongs to this trip (prevents IDOR)
    return this.prisma.tripPlace.delete({ where: { id, tripId } });
  }
}
