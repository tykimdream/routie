import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto, UpdateTripDto } from './dto';

@Injectable()
export class TripService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTripDto) {
    return this.prisma.trip.create({
      data: {
        userId,
        title: dto.title,
        city: dto.city,
        country: dto.country,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        dailyStart: dto.dailyStart ?? '10:00',
        dailyEnd: dto.dailyEnd ?? '21:00',
        transport: dto.transport ?? 'PUBLIC_TRANSIT',
      },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.trip.findMany({
      where: { userId },
      include: {
        _count: { select: { tripPlaces: true } },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        tripPlaces: {
          include: { place: { include: { placeDetail: true } } },
          orderBy: [{ priority: 'asc' }, { sortOrder: 'asc' }],
        },
        routes: {
          include: {
            stops: {
              include: { place: true },
              orderBy: { stopOrder: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { tripPlaces: true } },
      },
    });
    if (!trip) {
      throw new NotFoundException('여행을 찾을 수 없습니다');
    }
    if (trip.userId !== userId) {
      throw new ForbiddenException('접근 권한이 없습니다');
    }
    return trip;
  }

  async update(id: string, userId: string, dto: UpdateTripDto) {
    await this.verifyOwnership(id, userId);

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
    if (dto.dailyStart !== undefined) data.dailyStart = dto.dailyStart;
    if (dto.dailyEnd !== undefined) data.dailyEnd = dto.dailyEnd;
    if (dto.transport !== undefined) data.transport = dto.transport;

    return this.prisma.trip.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    await this.verifyOwnership(id, userId);
    return this.prisma.trip.delete({ where: { id } });
  }

  private async verifyOwnership(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { userId: true },
    });
    if (!trip) {
      throw new NotFoundException('여행을 찾을 수 없습니다');
    }
    if (trip.userId !== userId) {
      throw new ForbiddenException('접근 권한이 없습니다');
    }
  }
}
