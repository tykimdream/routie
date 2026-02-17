'use client';

import type { Route, RouteType } from '@/lib/types';

const typeConfig: Record<
  RouteType,
  { label: string; emoji: string; desc: string }
> = {
  EFFICIENT: {
    label: '효율',
    emoji: '⚡',
    desc: '이동 최소, 장소 최대',
  },
  RELAXED: {
    label: '여유',
    emoji: '🌿',
    desc: '느긋하게 핵심만',
  },
  CUSTOM: {
    label: '맞춤',
    emoji: '🎯',
    desc: '우선순위 기반',
  },
};

interface RouteTabsProps {
  routes: Route[];
  selectedType: RouteType;
  onSelect: (type: RouteType) => void;
}

export function RouteTabs({ routes, selectedType, onSelect }: RouteTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {routes.map((route) => {
        const config = typeConfig[route.routeType];
        const isActive = selectedType === route.routeType;

        return (
          <button
            key={route.id}
            type="button"
            onClick={() => onSelect(route.routeType)}
            className={`flex-shrink-0 px-4 py-3 rounded-[12px] border-2 transition-all cursor-pointer text-left min-w-[120px] ${
              isActive
                ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-100'
                : 'border-sand-200 bg-white hover:border-sand-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{config.emoji}</span>
              <span
                className={`text-sm font-bold ${isActive ? 'text-primary-700' : 'text-sand-700'}`}
              >
                {config.label}
              </span>
            </div>
            <p className="text-xs text-sand-400">{config.desc}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-sand-500">
              <span>{route.placeCount}곳</span>
              <span className="text-sand-200">|</span>
              <span>
                {Math.round(route.totalDuration / 60)}h{' '}
                {route.totalDuration % 60}m
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
