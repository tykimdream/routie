import { Injectable, Logger } from '@nestjs/common';
import {
  DistanceMatrixService,
  DistanceEntry,
} from '../../google-maps/distance-matrix.service';
import { solveTsp } from './tsp-solver';
import { getStayDuration, parseTime, dailyMinutes } from './constraints';

interface PlaceInput {
  id: string;
  placeId: string;
  latitude: number;
  longitude: number;
  category: string;
  priority: string;
  customDuration: number | null;
  avgDuration: number | null;
  preferredTime: string | null;
}

interface StopPlan {
  placeId: string;
  tripPlaceId: string;
  stopOrder: number;
  duration: number;
  travelTimeFromPrev: number;
  travelDistFromPrev: number;
  arrivalMinutes: number;
  departureMinutes: number;
}

export interface RoutePlan {
  routeType: 'EFFICIENT' | 'RELAXED' | 'CUSTOM';
  stops: StopPlan[];
  totalDuration: number;
  totalDistance: number;
  totalTravelTime: number;
  placeCount: number;
  score: number;
}

@Injectable()
export class OptimizerService {
  private readonly logger = new Logger(OptimizerService.name);

  constructor(private readonly distanceMatrix: DistanceMatrixService) {}

  async optimize(
    tripPlaces: PlaceInput[],
    transport: string,
    dailyStart: string,
    dailyEnd: string,
  ): Promise<RoutePlan[]> {
    if (tripPlaces.length < 2) {
      throw new Error('최소 2개 이상의 장소가 필요합니다');
    }

    const places = tripPlaces.map((tp) => ({
      id: tp.placeId,
      latitude: tp.latitude,
      longitude: tp.longitude,
    }));

    const distEntries = await this.distanceMatrix.getMatrix(places, transport);
    const distMap = this.buildDistMap(distEntries);

    const availMinutes = dailyMinutes(dailyStart, dailyEnd);
    const startMin = parseTime(dailyStart);

    const routes: RoutePlan[] = [];

    // 1. EFFICIENT: all places, minimize travel
    routes.push(
      this.buildRoute(
        'EFFICIENT',
        tripPlaces,
        distMap,
        startMin,
        availMinutes,
        1.0,
      ),
    );

    // 2. RELAXED: MUST only (or MUST+WANT if not enough), buffer 30%
    const mustPlaces = tripPlaces.filter((tp) => tp.priority === 'MUST');
    const relaxedPlaces =
      mustPlaces.length >= 2
        ? mustPlaces
        : tripPlaces.filter(
            (tp) => tp.priority === 'MUST' || tp.priority === 'WANT',
          );
    routes.push(
      this.buildRoute(
        'RELAXED',
        relaxedPlaces.length >= 2 ? relaxedPlaces : tripPlaces,
        distMap,
        startMin,
        availMinutes,
        1.3,
      ),
    );

    // 3. CUSTOM: weighted by priority
    routes.push(
      this.buildRoute(
        'CUSTOM',
        tripPlaces,
        distMap,
        startMin,
        availMinutes,
        1.0,
        true,
      ),
    );

    return routes;
  }

  private buildRoute(
    type: 'EFFICIENT' | 'RELAXED' | 'CUSTOM',
    places: PlaceInput[],
    distMap: Map<string, DistanceEntry>,
    startMinutes: number,
    availableMinutes: number,
    bufferFactor: number,
    priorityWeighted = false,
  ): RoutePlan {
    const n = places.length;
    const matrix: number[][] = Array.from({ length: n }, () =>
      Array(n).fill(0),
    );

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const key = `${places[i]!.placeId}:${places[j]!.placeId}`;
        const entry = distMap.get(key);
        let cost = entry ? entry.duration : 99999;

        if (priorityWeighted) {
          const weight =
            places[j]!.priority === 'MUST'
              ? 0.33
              : places[j]!.priority === 'WANT'
                ? 0.67
                : 1.5;
          cost *= weight;
        }

        matrix[i]![j] = cost;
      }
    }

    const tspResult = solveTsp(matrix);

    const stops: StopPlan[] = [];
    let currentMinutes = startMinutes;
    let totalDistance = 0;
    let totalTravelSeconds = 0;

    for (let idx = 0; idx < tspResult.order.length; idx++) {
      const placeIdx = tspResult.order[idx]!;
      const place = places[placeIdx]!;
      const stayDuration = Math.round(
        getStayDuration({
          id: place.id,
          category: place.category,
          customDuration: place.customDuration,
          avgDuration: place.avgDuration,
        }) * bufferFactor,
      );

      let travelTime = 0;
      let travelDist = 0;

      if (idx > 0) {
        const prevPlaceIdx = tspResult.order[idx - 1]!;
        const key = `${places[prevPlaceIdx]!.placeId}:${place.placeId}`;
        const entry = distMap.get(key);
        travelTime = entry ? entry.duration : 0;
        travelDist = entry ? entry.distance : 0;
        totalTravelSeconds += travelTime;
        totalDistance += travelDist;
      }

      const arrivalMinutes = currentMinutes + Math.ceil(travelTime / 60);
      const departureMinutes = arrivalMinutes + stayDuration;

      if (
        departureMinutes > startMinutes + availableMinutes &&
        stops.length >= 2
      ) {
        break;
      }

      stops.push({
        placeId: place.placeId,
        tripPlaceId: place.id,
        stopOrder: stops.length,
        duration: stayDuration,
        travelTimeFromPrev: idx > 0 ? travelTime : 0,
        travelDistFromPrev: idx > 0 ? travelDist : 0,
        arrivalMinutes,
        departureMinutes,
      });

      currentMinutes = departureMinutes;
    }

    const lastStop = stops[stops.length - 1];
    const totalDuration = lastStop
      ? lastStop.departureMinutes - startMinutes
      : 0;

    const placeCount = stops.length;
    const travelEfficiency =
      totalDuration > 0
        ? 1 - Math.ceil(totalTravelSeconds / 60) / totalDuration
        : 0;
    const priorityScore = stops.reduce((acc, s) => {
      const tp = places.find((p) => p.placeId === s.placeId);
      if (!tp) return acc;
      if (tp.priority === 'MUST') return acc + 3;
      if (tp.priority === 'WANT') return acc + 1.5;
      return acc + 0.5;
    }, 0);

    const score =
      Math.round(
        (travelEfficiency * 30 +
          (placeCount / places.length) * 30 +
          priorityScore * 5) *
          10,
      ) / 10;

    return {
      routeType: type,
      stops,
      totalDuration,
      totalDistance,
      totalTravelTime: Math.ceil(totalTravelSeconds / 60),
      placeCount,
      score,
    };
  }

  private buildDistMap(entries: DistanceEntry[]) {
    const map = new Map<string, DistanceEntry>();
    for (const e of entries) {
      map.set(`${e.originId}:${e.destId}`, e);
    }
    return map;
  }
}
