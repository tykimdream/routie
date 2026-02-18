'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, getPhotoProxyUrl } from '@/lib/api';
import { MapPinIcon, StarIcon, PlusIcon } from '@/components/icons';

interface RecommendedPlace {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number;
  userRatingCount?: number;
  types: string[];
  photoRef?: string;
}

const CATEGORY_TABS = [
  { key: 'tourist_attraction', label: '관광' },
  { key: 'restaurant', label: '맛집' },
  { key: 'cafe', label: '카페' },
  { key: 'shopping_mall', label: '쇼핑' },
] as const;

type CategoryKey = (typeof CATEGORY_TABS)[number]['key'];

interface PlaceRecommendationsProps {
  latitude: number | null;
  longitude: number | null;
  onAdd: (googlePlaceId: string) => Promise<void>;
}

export function PlaceRecommendations({
  latitude,
  longitude,
  onAdd,
}: PlaceRecommendationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] =
    useState<CategoryKey>('tourist_attraction');
  const [places, setPlaces] = useState<RecommendedPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const fetchRecommendations = useCallback(
    async (category: CategoryKey) => {
      if (latitude == null || longitude == null) return;
      setLoading(true);
      try {
        const data = await api.places.nearby(latitude, longitude, category);
        setPlaces(data as unknown as RecommendedPlace[]);
      } catch {
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    },
    [latitude, longitude],
  );

  useEffect(() => {
    if (isOpen && latitude != null && longitude != null) {
      fetchRecommendations(activeCategory);
    }
  }, [isOpen, activeCategory, fetchRecommendations, latitude, longitude]);

  const handleAdd = async (placeId: string) => {
    setAddingId(placeId);
    try {
      await onAdd(placeId);
    } finally {
      setAddingId(null);
    }
  };

  if (latitude == null || longitude == null) {
    return null;
  }

  const photoUrl = (ref?: string) => {
    if (!ref) return null;
    return getPhotoProxyUrl(ref);
  };

  return (
    <div className="border border-sand-200 rounded-[12px] overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-sand-50 hover:bg-sand-100 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <SparkleSimple />
          <span className="text-sm font-semibold text-sand-700">추천 장소</span>
        </div>
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-sand-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="p-4 space-y-4">
          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCategory(tab.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeCategory === tab.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-sand-100 text-sand-500 hover:bg-sand-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-sand-200 border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : places.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-sand-400">
                이 카테고리의 추천 장소가 없습니다
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {places.map((place) => (
                <div
                  key={place.placeId}
                  className="flex items-center gap-3 p-3 bg-white rounded-[10px] border border-sand-100 hover:border-sand-200 transition-colors"
                >
                  {/* Photo */}
                  {place.photoRef ? (
                    <img
                      src={photoUrl(place.photoRef) ?? ''}
                      alt={place.name}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-sand-100"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-sand-100 flex items-center justify-center flex-shrink-0">
                      <MapPinIcon size={20} className="text-sand-300" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-sand-800 truncate">
                      {place.name}
                    </p>
                    <p className="text-xs text-sand-400 truncate">
                      {place.address}
                    </p>
                    {place.rating != null && place.rating > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <StarIcon size={10} className="text-yellow-400" />
                        <span className="text-[11px] text-sand-500">
                          {place.rating}
                          {place.userRatingCount
                            ? ` (${place.userRatingCount})`
                            : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Add button */}
                  <button
                    type="button"
                    onClick={() => handleAdd(place.placeId)}
                    disabled={addingId === place.placeId}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-50 text-primary-500 hover:bg-primary-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {addingId === place.placeId ? (
                      <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                    ) : (
                      <PlusIcon size={16} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SparkleSimple() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary-500"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}
