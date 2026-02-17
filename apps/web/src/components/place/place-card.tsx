'use client';

import { StarIcon, MapPinIcon } from '@/components/icons';
import type { TripPlace, Priority } from '@/lib/types';

const priorityConfig: Record<
  Priority,
  { label: string; color: string; bg: string }
> = {
  MUST: {
    label: '필수',
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
  },
  WANT: {
    label: '가고싶어',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 border-yellow-200',
  },
  OPTIONAL: {
    label: '선택',
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
  },
};

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

interface PlaceCardProps {
  tripPlace: TripPlace;
  onChangePriority: (id: string, priority: Priority) => void;
  onRemove: (id: string) => void;
}

export function PlaceCard({
  tripPlace,
  onChangePriority,
  onRemove,
}: PlaceCardProps) {
  const { place, priority } = tripPlace;
  const priorities: Priority[] = ['MUST', 'WANT', 'OPTIONAL'];

  return (
    <div className="bg-white rounded-[12px] border border-sand-200 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sand-800 truncate">
              {place.name}
            </h4>
            <span className="text-xs text-sand-400 bg-sand-100 px-2 py-0.5 rounded-full flex-shrink-0">
              {categoryLabels[place.category] ?? place.category}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-sand-400">
            <MapPinIcon size={12} />
            <span className="truncate">{place.address}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(tripPlace.id)}
          className="text-sand-300 hover:text-red-400 transition-colors p-1 cursor-pointer"
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          {place.rating && (
            <div className="flex items-center gap-1">
              <StarIcon size={14} className="text-yellow-400" />
              <span className="text-xs font-medium text-sand-600">
                {place.rating}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {priorities.map((p) => {
            const c = priorityConfig[p];
            const isActive = priority === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onChangePriority(tripPlace.id, p)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all cursor-pointer ${
                  isActive
                    ? `${c.bg} ${c.color}`
                    : 'bg-white border-sand-200 text-sand-400 hover:border-sand-300'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {tripPlace.userNote && (
        <p className="mt-2 text-xs text-sand-500 italic">
          {tripPlace.userNote}
        </p>
      )}
    </div>
  );
}
