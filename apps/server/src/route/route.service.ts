import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TripService } from '../trip/trip.service';
import { OptimizerService } from './optimizer/optimizer.service';
import { LlmService } from './optimizer/llm.service';

@Injectable()
export class RouteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tripService: TripService,
    private readonly optimizer: OptimizerService,
    private readonly llm: LlmService,
  ) {}

  async optimize(tripId: string, userId: string) {
    const trip = await this.tripService.findOne(tripId, userId);

    if (!trip.tripPlaces || trip.tripPlaces.length < 2) {
      throw new BadRequestException('최소 2개 이상의 장소가 필요합니다');
    }

    // Delete existing routes for this trip
    await this.prisma.route.deleteMany({ where: { tripId } });

    // Prepare place inputs
    const placeInputs = trip.tripPlaces.map((tp) => ({
      id: tp.id,
      placeId: tp.placeId,
      latitude: tp.place.latitude,
      longitude: tp.place.longitude,
      category: tp.place.category,
      priority: tp.priority,
      customDuration: tp.customDuration,
      avgDuration: tp.place.placeDetail?.avgDuration ?? null,
      preferredTime: tp.preferredTime,
    }));

    // Run optimization
    const routePlans = await this.optimizer.optimize(
      placeInputs,
      trip.transport,
      trip.dailyStart,
      trip.dailyEnd,
    );

    // Save routes with LLM-generated descriptions
    const routes = await Promise.all(
      routePlans.map(async (plan) => {
        // Generate reasoning
        const stopInfos = plan.stops.map((s) => {
          const tp = trip.tripPlaces.find((t) => t.placeId === s.placeId);
          return {
            name: tp?.place.name ?? '',
            category: tp?.place.category ?? '',
            priority: tp?.priority ?? 'WANT',
            duration: s.duration,
            rating: tp?.place.rating ?? undefined,
          };
        });

        const [reasoning, stopReasons] = await Promise.all([
          this.llm.generateRouteReasoning({
            routeType: plan.routeType,
            placeCount: plan.placeCount,
            totalDuration: plan.totalDuration,
            totalTravelTime: plan.totalTravelTime,
            stops: stopInfos,
          }),
          this.llm.generateStopReasons(stopInfos),
        ]);

        // Create route with stops
        const route = await this.prisma.route.create({
          data: {
            tripId,
            date: trip.startDate,
            routeType: plan.routeType as any,
            totalDuration: plan.totalDuration,
            totalDistance: plan.totalDistance,
            totalTravelTime: plan.totalTravelTime,
            placeCount: plan.placeCount,
            score: plan.score,
            reasoning,
            stops: {
              create: plan.stops.map((s, i) => {
                const baseDate = new Date(trip.startDate);
                const arrivalTime = new Date(baseDate);
                arrivalTime.setHours(0, s.arrivalMinutes, 0, 0);
                const departureTime = new Date(baseDate);
                departureTime.setHours(0, s.departureMinutes, 0, 0);

                return {
                  placeId: s.placeId,
                  stopOrder: s.stopOrder,
                  arrivalTime,
                  departureTime,
                  duration: s.duration,
                  travelTimeFromPrev: s.travelTimeFromPrev,
                  travelDistFromPrev: s.travelDistFromPrev,
                  travelMode: trip.transport.toLowerCase(),
                  selectionReason: stopReasons[i] ?? null,
                };
              }),
            },
          },
          include: {
            stops: {
              include: { place: true },
              orderBy: { stopOrder: 'asc' },
            },
          },
        });

        return route;
      }),
    );

    // Update trip status
    await this.prisma.trip.update({
      where: { id: tripId },
      data: { status: 'OPTIMIZED' },
    });

    return routes;
  }

  async findByTrip(tripId: string, userId: string) {
    await this.tripService.findOne(tripId, userId);

    return this.prisma.route.findMany({
      where: { tripId },
      include: {
        stops: {
          include: { place: true },
          orderBy: { stopOrder: 'asc' },
        },
      },
      orderBy: { score: 'desc' },
    });
  }

  async findOne(tripId: string, routeId: string, userId: string) {
    await this.tripService.findOne(tripId, userId);

    const route = await this.prisma.route.findUnique({
      where: { id: routeId },
      include: {
        stops: {
          include: { place: true },
          orderBy: { stopOrder: 'asc' },
        },
      },
    });

    if (!route || route.tripId !== tripId) {
      throw new NotFoundException('경로를 찾을 수 없습니다');
    }

    return route;
  }

  async selectRoute(tripId: string, routeId: string, userId: string) {
    await this.tripService.findOne(tripId, userId);

    // Deselect all routes for this trip
    await this.prisma.route.updateMany({
      where: { tripId },
      data: { isSelected: false },
    });

    // Select the chosen route
    const route = await this.prisma.route.update({
      where: { id: routeId },
      data: { isSelected: true },
      include: {
        stops: {
          include: { place: true },
          orderBy: { stopOrder: 'asc' },
        },
      },
    });

    // Update trip status to CONFIRMED
    await this.prisma.trip.update({
      where: { id: tripId },
      data: { status: 'CONFIRMED' },
    });

    return route;
  }
}
