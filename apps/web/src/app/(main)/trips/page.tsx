'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  PlusIcon,
  PlaneIcon,
  MapPinIcon,
  ChevronRightIcon,
} from '@/components/icons';
import { api } from '@/lib/api';
import type { Trip } from '@/lib/types';

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = {
    month: 'numeric',
    day: 'numeric',
  };
  return `${s.toLocaleDateString('ko-KR', opts)} ~ ${e.toLocaleDateString('ko-KR', opts)}`;
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'PLANNING':
      return { text: '계획 중', color: 'bg-accent-100 text-accent-700' };
    case 'OPTIMIZED':
      return {
        text: '경로 완성',
        color: 'bg-secondary-100 text-secondary-700',
      };
    case 'CONFIRMED':
      return { text: '확정', color: 'bg-primary-100 text-primary-700' };
    case 'COMPLETED':
      return { text: '완료', color: 'bg-sand-200 text-sand-600' };
    default:
      return { text: status, color: 'bg-sand-100 text-sand-500' };
  }
}

function getDaysUntil(dateStr: string) {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = Math.ceil(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff < 0) return null;
  if (diff === 0) return '오늘 출발!';
  return `D-${diff}`;
}

function TripCard({ trip }: { trip: Trip }) {
  const status = getStatusLabel(trip.status);
  const dday = getDaysUntil(trip.startDate);
  const placeCount = trip._count?.tripPlaces ?? 0;

  return (
    <Link href={`/trips/${trip.id}`}>
      <Card hoverable className="group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {trip.country ? getCountryEmoji(trip.country) : '✈️'}
            </span>
            <div>
              <h3 className="font-bold text-sand-800 group-hover:text-primary-600 transition-colors">
                {trip.title}
              </h3>
              <p className="text-sm text-sand-400">
                {formatDateRange(trip.startDate, trip.endDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dday && (
              <span className="text-xs font-bold text-primary-500 bg-primary-50 px-2 py-1 rounded-full">
                {dday}
              </span>
            )}
            <ChevronRightIcon
              size={18}
              className="text-sand-300 group-hover:text-sand-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-sand-500">
          <div className="flex items-center gap-1">
            <MapPinIcon size={14} />
            <span>장소 {placeCount}개</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
          >
            {status.text}
          </span>
        </div>
      </Card>
    </Link>
  );
}

function getCountryEmoji(country: string): string {
  const map: Record<string, string> = {
    Thailand: '🇹🇭',
    Japan: '🇯🇵',
    Korea: '🇰🇷',
    France: '🇫🇷',
    Italy: '🇮🇹',
    Spain: '🇪🇸',
    USA: '🇺🇸',
    UK: '🇬🇧',
    Vietnam: '🇻🇳',
    Singapore: '🇸🇬',
    Taiwan: '🇹🇼',
    China: '🇨🇳',
    Indonesia: '🇮🇩',
    Philippines: '🇵🇭',
    Malaysia: '🇲🇾',
    Australia: '🇦🇺',
  };
  return map[country] ?? '✈️';
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-6">
        <PlaneIcon size={36} className="text-primary-400" />
      </div>
      <h3 className="text-xl font-bold text-sand-800 mb-2">
        첫 여행을 계획해볼까요?
      </h3>
      <p className="text-sand-400 mb-8 max-w-sm">
        가고 싶은 도시를 선택하고 장소를 추가하면
        <br />
        Routie가 최적의 경로를 만들어드려요
      </p>
      <Link href="/trips/new">
        <Button size="lg" className="gap-2">
          <PlusIcon size={20} />새 여행 만들기
        </Button>
      </Link>
    </div>
  );
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    api.trips
      .list()
      .then(setTrips)
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-sand-100 rounded-lg" />
          <div className="h-24 bg-sand-100 rounded-[12px]" />
          <div className="h-24 bg-sand-100 rounded-[12px]" />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <p className="text-sand-500 mb-4">여행 목록을 불러오지 못했습니다.</p>
        <button
          type="button"
          onClick={() => {
            setFetchError(false);
            setLoading(true);
            api.trips
              .list()
              .then(setTrips)
              .catch(() => setFetchError(true))
              .finally(() => setLoading(false));
          }}
          className="text-primary-500 font-medium cursor-pointer"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (trips.length === 0) {
    return <EmptyState />;
  }

  const now = new Date();
  const upcoming = trips.filter((t) => new Date(t.startDate) >= now);
  const past = trips.filter((t) => new Date(t.startDate) < now);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-sand-900">내 여행</h2>
          <p className="text-sm text-sand-400 mt-1">
            총 {trips.length}개의 여행
          </p>
        </div>
        <Link href="/trips/new">
          <Button size="sm" className="gap-1.5">
            <PlusIcon size={16} />새 여행
          </Button>
        </Link>
      </div>

      {/* Upcoming Trips */}
      {upcoming.length > 0 && (
        <section className="mb-8">
          <h3 className="text-sm font-semibold text-sand-500 uppercase tracking-wider mb-3">
            다가오는 여행
          </h3>
          <div className="space-y-3">
            {upcoming.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {/* Past Trips */}
      {past.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-sand-500 uppercase tracking-wider mb-3">
            지난 여행
          </h3>
          <div className="space-y-3">
            {past.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
