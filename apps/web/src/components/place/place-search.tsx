'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { MapPinIcon, StarIcon, PlusIcon } from '@/components/icons';

interface SearchResult {
  googlePlaceId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  rating: number | null;
  userRatingCount: number | null;
  priceLevel: number | null;
  photoUrl: string | null;
}

interface PlaceSearchProps {
  onAdd: (googlePlaceId: string) => Promise<void>;
}

export function PlaceSearch({ onAdd }: PlaceSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await api.places.search(value);
        setResults(data as unknown as SearchResult[]);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleAdd = async (googlePlaceId: string) => {
    setAddingId(googlePlaceId);
    try {
      await onAdd(googlePlaceId);
      setQuery('');
      setResults([]);
      setShowResults(false);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <MapPinIcon
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-sand-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="장소를 검색하세요..."
          className="w-full pl-11 pr-4 py-3 bg-white border-2 border-sand-200 rounded-[12px] text-sand-800 placeholder:text-sand-300 focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all"
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-sand-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-30 top-full mt-2 w-full bg-white rounded-[12px] shadow-lg border border-sand-200 max-h-80 overflow-y-auto">
          {results.map((place) => (
            <div
              key={place.googlePlaceId}
              className="flex items-center justify-between p-3 hover:bg-sand-50 transition-colors border-b border-sand-100 last:border-b-0"
            >
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-sm font-semibold text-sand-800 truncate">
                  {place.name}
                </p>
                <p className="text-xs text-sand-400 truncate">
                  {place.address}
                </p>
                {place.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <StarIcon size={12} className="text-yellow-400" />
                    <span className="text-xs text-sand-500">
                      {place.rating}
                      {place.userRatingCount
                        ? ` (${place.userRatingCount})`
                        : ''}
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleAdd(place.googlePlaceId)}
                disabled={addingId === place.googlePlaceId}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-50 text-primary-500 hover:bg-primary-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              >
                {addingId === place.googlePlaceId ? (
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
  );
}
