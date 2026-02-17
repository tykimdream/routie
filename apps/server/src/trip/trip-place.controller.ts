import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
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

  @Patch(':id')
  async updatePlace(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateTripPlaceDto,
  ) {
    await this.tripService.findOne(tripId, userId);

    return this.prisma.tripPlace.update({
      where: { id },
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

  @Patch('reorder')
  async reorder(
    @Param('tripId') tripId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ReorderTripPlacesDto,
  ) {
    await this.tripService.findOne(tripId, userId);

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

  @Delete(':id')
  async removePlace(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.tripService.findOne(tripId, userId);
    return this.prisma.tripPlace.delete({ where: { id } });
  }
}
