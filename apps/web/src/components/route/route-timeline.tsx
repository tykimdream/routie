'use client';

import type { Route } from '@/lib/types';

const categoryLabels: Record<string, string> = {
  RESTAURANT: '맛집',
  CAFE: '카페',
  BAR: '바',
  ATTRACTION: '관광',
  SHOPPING: '쇼핑',
  SPA_MASSAGE: '스파',
  ENTERTAINMENT: '오락',
  ACCOMMODATION: '숙소',
  TRANSPORT_HUB: '교통',
  OTHER: '기타',
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatTravelTime(seconds: number): string {
  const mins = Math.ceil(seconds / 60);
  if (mins < 60) return `${mins}분`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

function getTravelIcon(mode: string | null): string {
  switch (mode) {
    case 'public_transit':
    case 'transit':
      return '🚇';
    case 'walking':
      return '🚶';
    case 'driving':
      return '🚗';
    case 'taxi':
      return '🚕';
    default:
      return '🚶';
  }
}

interface RouteTimelineProps {
  route: Route;
}

export function RouteTimeline({ route }: RouteTimelineProps) {
  return (
    <div className="space-y-0">
      {route.stops.map((stop, index) => {
        const isLast = index === route.stops.length - 1;

        return (
          <div key={stop.id}>
            {/* Travel segment */}
            {index > 0 && stop.travelTimeFromPrev && (
              <div className="flex items-center gap-3 pl-[52px] py-2">
                <div className="w-0.5 h-6 bg-sand-200 mx-auto" />
                <div className="flex items-center gap-2 text-xs text-sand-400 bg-sand-50 px-3 py-1.5 rounded-full">
                  <span>{getTravelIcon(stop.travelMode)}</span>
                  <span>{formatTravelTime(stop.travelTimeFromPrev)}</span>
                  {stop.travelDistFromPrev && (
                    <>
                      <span className="text-sand-200">|</span>
                      <span>
                        {stop.travelDistFromPrev >= 1000
                          ? `${(stop.travelDistFromPrev / 1000).toFixed(1)}km`
                          : `${stop.travelDistFromPrev}m`}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Stop */}
            <div className="flex gap-3">
              {/* Time column */}
              <div className="w-[44px] flex-shrink-0 text-right">
                <span className="text-sm font-bold text-sand-700">
                  {formatTime(stop.arrivalTime)}
                </span>
              </div>

              {/* Timeline dot */}
              <div className="relative flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 mt-1.5 ${
                    index === 0
                      ? 'bg-primary-500'
                      : isLast
                        ? 'bg-secondary-500'
                        : 'bg-sand-400'
                  }`}
                />
                {!isLast && (
                  <div className="w-0.5 flex-1 bg-sand-200 min-h-[40px]" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="bg-white rounded-[10px] border border-sand-200 p-3">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold text-sand-800 text-sm">
                      {stop.place.name}
                    </h4>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {stop.place.category && (
                        <span className="text-[10px] bg-sand-100 text-sand-500 px-1.5 py-0.5 rounded">
                          {categoryLabels[stop.place.category] ??
                            stop.place.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-sand-400">
                    <span>체류 {stop.duration}분</span>
                    <span className="text-sand-200">|</span>
                    <span>
                      {formatTime(stop.arrivalTime)} ~{' '}
                      {formatTime(stop.departureTime)}
                    </span>
                  </div>

                  {stop.selectionReason && (
                    <p className="mt-2 text-xs text-sand-500 leading-relaxed">
                      {stop.selectionReason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
