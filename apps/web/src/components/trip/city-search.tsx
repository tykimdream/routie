'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { getChoseong } from 'es-hangul';
import { api } from '@/lib/api';
import { MapPinIcon, SearchIcon } from '@/components/icons';

function chosungIncludes(text: string, query: string): boolean {
  const textChosung = getChoseong(text);
  const queryChosung = getChoseong(query);
  return textChosung.includes(queryChosung);
}

interface PopularCity {
  name: string;
  country: string;
  nameEn: string;
  latitude: number;
  longitude: number;
}

const POPULAR_CITIES: PopularCity[] = [
  {
    name: '도쿄',
    country: '일본',
    nameEn: 'Tokyo',
    latitude: 35.6762,
    longitude: 139.6503,
  },
  {
    name: '오사카',
    country: '일본',
    nameEn: 'Osaka',
    latitude: 34.6937,
    longitude: 135.5023,
  },
  {
    name: '교토',
    country: '일본',
    nameEn: 'Kyoto',
    latitude: 35.0116,
    longitude: 135.7681,
  },
  {
    name: '후쿠오카',
    country: '일본',
    nameEn: 'Fukuoka',
    latitude: 33.5904,
    longitude: 130.4017,
  },
  {
    name: '방콕',
    country: '태국',
    nameEn: 'Bangkok',
    latitude: 13.7563,
    longitude: 100.5018,
  },
  {
    name: '파리',
    country: '프랑스',
    nameEn: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
  },
  {
    name: '런던',
    country: '영국',
    nameEn: 'London',
    latitude: 51.5074,
    longitude: -0.1278,
  },
  {
    name: '뉴욕',
    country: '미국',
    nameEn: 'New York',
    latitude: 40.7128,
    longitude: -74.006,
  },
  {
    name: '싱가포르',
    country: '싱가포르',
    nameEn: 'Singapore',
    latitude: 1.3521,
    longitude: 103.8198,
  },
  {
    name: '다낭',
    country: '베트남',
    nameEn: 'Da Nang',
    latitude: 16.0544,
    longitude: 108.2022,
  },
  {
    name: '타이베이',
    country: '대만',
    nameEn: 'Taipei',
    latitude: 25.033,
    longitude: 121.5654,
  },
  {
    name: '호치민',
    country: '베트남',
    nameEn: 'Ho Chi Minh',
    latitude: 10.8231,
    longitude: 106.6297,
  },
  {
    name: '바르셀로나',
    country: '스페인',
    nameEn: 'Barcelona',
    latitude: 41.3874,
    longitude: 2.1686,
  },
  {
    name: '로마',
    country: '이탈리아',
    nameEn: 'Rome',
    latitude: 41.9028,
    longitude: 12.4964,
  },
  {
    name: '세부',
    country: '필리핀',
    nameEn: 'Cebu',
    latitude: 10.3157,
    longitude: 123.8854,
  },
  {
    name: '하노이',
    country: '베트남',
    nameEn: 'Hanoi',
    latitude: 21.0278,
    longitude: 105.8342,
  },
  {
    name: '발리',
    country: '인도네시아',
    nameEn: 'Bali',
    latitude: -8.3405,
    longitude: 115.092,
  },
  {
    name: '프라하',
    country: '체코',
    nameEn: 'Prague',
    latitude: 50.0755,
    longitude: 14.4378,
  },
  {
    name: '제주',
    country: '한국',
    nameEn: 'Jeju',
    latitude: 33.4996,
    longitude: 126.5312,
  },
  {
    name: '부산',
    country: '한국',
    nameEn: 'Busan',
    latitude: 35.1796,
    longitude: 129.0756,
  },
];

interface CityResult {
  type: 'popular' | 'api';
  name: string;
  country: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
}

interface CitySearchProps {
  onSelect: (city: string, country: string, lat?: number, lng?: number) => void;
  initialCity?: string;
}

export function CitySearch({ onSelect, initialCity }: CitySearchProps) {
  const [query, setQuery] = useState(initialCity ?? '');
  const [results, setResults] = useState<CityResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState(!!initialCity);
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
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const searchCities = useCallback((input: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (input.trim().length === 0) {
      setResults([]);
      setShowDropdown(true);
      return;
    }

    // Immediate local search (chosung + includes)
    const localResults: CityResult[] = POPULAR_CITIES.filter((city) => {
      const q = input.toLowerCase();
      return (
        city.name.includes(input) ||
        city.nameEn.toLowerCase().includes(q) ||
        city.country.includes(input) ||
        chosungIncludes(city.name, input)
      );
    }).map((city) => ({
      type: 'popular' as const,
      name: city.name,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
    }));

    setResults(localResults);
    setShowDropdown(true);

    // Debounced API search
    if (input.trim().length >= 2) {
      debounceRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const apiResults = await api.places.autocompleteCities(input);
          const apiCities: CityResult[] = apiResults.map((r) => ({
            type: 'api' as const,
            name: r.mainText,
            country: r.secondaryText,
            placeId: r.placeId,
          }));

          // Merge: local first, then API (deduplicated)
          const localNames = new Set(localResults.map((r) => r.name));
          const merged = [
            ...localResults,
            ...apiCities.filter((c) => !localNames.has(c.name)),
          ];
          setResults(merged);
        } catch {
          // Keep local results on API error
        } finally {
          setIsSearching(false);
        }
      }, 300);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelected(false);
    searchCities(value);
  };

  const handleSelect = async (city: CityResult) => {
    setQuery(city.name);
    setSelected(true);
    setShowDropdown(false);

    if (city.latitude != null && city.longitude != null) {
      onSelect(city.name, city.country, city.latitude, city.longitude);
    } else if (city.placeId) {
      // Fetch coordinates from API
      try {
        const details = await api.places.get(city.placeId);
        onSelect(city.name, city.country, details.latitude, details.longitude);
      } catch {
        // Fallback without coordinates
        onSelect(city.name, city.country);
      }
    } else {
      onSelect(city.name, city.country);
    }
  };

  const handleFocus = () => {
    if (!selected) {
      searchCities(query);
    }
  };

  const showPopularCities = showDropdown && query.trim().length === 0;
  const showSearchResults =
    showDropdown && results.length > 0 && query.trim().length > 0;

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-sand-700 mb-2">
        도시
      </label>
      <div className="relative">
        <SearchIcon
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-sand-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          placeholder="도시를 검색하세요 (예: 도쿄, tokyo, ㄷㅋ)"
          className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-sand-200 rounded-[12px] text-sand-800 placeholder:text-sand-300 focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all"
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-sand-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Popular cities quick picks */}
      {showPopularCities && (
        <div className="absolute z-30 top-full mt-2 w-full bg-white rounded-[12px] shadow-lg border border-sand-200 p-4">
          <p className="text-xs font-medium text-sand-400 mb-3">인기 여행지</p>
          <div className="grid grid-cols-3 gap-2">
            {POPULAR_CITIES.slice(0, 12).map((city) => (
              <button
                key={city.nameEn}
                type="button"
                onClick={() =>
                  handleSelect({
                    type: 'popular',
                    name: city.name,
                    country: city.country,
                    latitude: city.latitude,
                    longitude: city.longitude,
                  })
                }
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sand-50 hover:bg-primary-50 hover:text-primary-600 text-sand-600 text-sm transition-colors cursor-pointer text-left"
              >
                <MapPinIcon size={12} className="flex-shrink-0" />
                <span className="truncate">{city.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search results dropdown */}
      {showSearchResults && (
        <div className="absolute z-30 top-full mt-2 w-full bg-white rounded-[12px] shadow-lg border border-sand-200 max-h-64 overflow-y-auto">
          {results.map((city, idx) => (
            <button
              key={`${city.name}-${city.country}-${idx}`}
              type="button"
              onClick={() => handleSelect(city)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-sand-50 transition-colors border-b border-sand-100 last:border-b-0 cursor-pointer text-left"
            >
              <MapPinIcon size={16} className="text-sand-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sand-800">
                  {city.name}
                </p>
                <p className="text-xs text-sand-400">{city.country}</p>
              </div>
              {city.type === 'popular' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-50 text-accent-600 font-medium">
                  인기
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
