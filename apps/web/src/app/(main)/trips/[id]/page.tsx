'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTrip } from '@/hooks/use-trip';
import { api } from '@/lib/api';
import type { Priority, RouteType } from '@/lib/types';
import { PlaceSearch } from '@/components/place/place-search';
import { PlaceCard } from '@/components/place/place-card';
import { RouteTabs } from '@/components/route/route-tabs';
import { RouteTimeline } from '@/components/route/route-timeline';
import { RouteLoading } from '@/components/route/route-loading';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPinIcon, RouteIcon, SparklesIcon } from '@/components/icons';

const statusConfig: Record<string, { label: string; color: string }> = {
  PLANNING: { label: '계획 중', color: 'bg-accent-100 text-accent-700' },
  OPTIMIZED: {
    label: '경로 완성',
    color: 'bg-secondary-100 text-secondary-700',
  },
  CONFIRMED: { label: '확정', color: 'bg-primary-100 text-primary-700' },
  COMPLETED: { label: '완료', color: 'bg-sand-200 text-sand-600' },
};

const transportLabels: Record<string, string> = {
  PUBLIC_TRANSIT: '🚇 대중교통',
  WALKING: '🚶 도보',
  DRIVING: '🚗 자가용',
  TAXI: '🚕 택시',
};

type Tab = 'places' | 'routes';

export default function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { trip, loading, refetch } = useTrip(id);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('places');
  const [optimizing, setOptimizing] = useState(false);
  const [selectedRouteType, setSelectedRouteType] =
    useState<RouteType>('EFFICIENT');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddPlace = async (googlePlaceId: string) => {
    try {
      setError(null);
      await api.tripPlaces.add(id, { googlePlaceId });
      refetch();
    } catch {
      setError('장소 추가에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleChangePriority = async (
    tripPlaceId: string,
    priority: Priority,
  ) => {
    try {
      await api.tripPlaces.update(id, tripPlaceId, { priority });
      refetch();
    } catch {
      setError('우선순위 변경에 실패했습니다.');
    }
  };

  const handleRemovePlace = async (tripPlaceId: string) => {
    try {
      await api.tripPlaces.remove(id, tripPlaceId);
      refetch();
    } catch {
      setError('장소 삭제에 실패했습니다.');
    }
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    setError(null);
    try {
      await api.routes.optimize(id);
      await refetch();
      setActiveTab('routes');
    } catch {
      setError('경로 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setOptimizing(false);
    }
  };

  const handleConfirmRoute = async (routeId: string) => {
    setConfirming(true);
    try {
      await api.routes.select(id, routeId);
      await refetch();
    } catch {
      setError('경로 확정에 실패했습니다.');
    } finally {
      setConfirming(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('이 여행을 삭제하시겠습니까?')) return;
    try {
      await api.trips.delete(id);
      router.push('/trips');
    } catch {
      setError('여행 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-sand-500">여행을 찾을 수 없습니다</p>
        <Link href="/trips" className="text-primary-500 mt-4 inline-block">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const status = statusConfig[trip.status] ?? {
    label: '계획 중',
    color: 'bg-accent-100 text-accent-700',
  };
  const placeCount = trip.tripPlaces?.length ?? 0;
  const groupedPlaces = {
    MUST: trip.tripPlaces?.filter((tp) => tp.priority === 'MUST') ?? [],
    WANT: trip.tripPlaces?.filter((tp) => tp.priority === 'WANT') ?? [],
    OPTIONAL: trip.tripPlaces?.filter((tp) => tp.priority === 'OPTIONAL') ?? [],
  };

  const routes = trip.routes ?? [];
  const selectedRoute =
    routes.find((r) => r.routeType === selectedRouteType) ?? routes[0];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Trip Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-2xl font-bold text-sand-900">{trip.title}</h2>
          <button
            type="button"
            onClick={handleDelete}
            className="text-sand-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
          >
            <svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-sand-500">
          <span>
            {trip.city}
            {trip.country ? `, ${trip.country}` : ''}
          </span>
          <span className="text-sand-200">|</span>
          <span>
            {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
          </span>
          <span className="text-sand-200">|</span>
          <span>{transportLabels[trip.transport] ?? trip.transport}</span>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}
          >
            {status.label}
          </span>
          <span className="text-xs text-sand-400">장소 {placeCount}개</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-sand-200 mb-6">
        {[
          { key: 'places' as Tab, label: '장소', icon: MapPinIcon },
          {
            key: 'routes' as Tab,
            label: '경로',
            icon: RouteIcon,
            badge: routes.length > 0 ? routes.length : undefined,
          },
        ].map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === key
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-sand-400 hover:text-sand-600'
            }`}
          >
            <Icon size={16} />
            {label}
            {badge && (
              <span className="ml-1 text-[10px] bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded-full font-bold">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[10px] flex items-center justify-between">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 ml-2 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Places Tab */}
      {activeTab === 'places' && (
        <div className="space-y-6">
          <PlaceSearch onAdd={handleAddPlace} />

          {placeCount === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-sand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPinIcon size={28} className="text-sand-300" />
              </div>
              <p className="text-sand-500 mb-2">아직 장소가 없습니다</p>
              <p className="text-sm text-sand-400">
                위 검색창에서 가고 싶은 장소를 추가해보세요
              </p>
            </div>
          ) : (
            <>
              {(['MUST', 'WANT', 'OPTIONAL'] as const).map((priority) => {
                const places = groupedPlaces[priority];
                if (places.length === 0) return null;
                const labels = {
                  MUST: { emoji: '🔴', label: '필수 방문' },
                  WANT: { emoji: '🟡', label: '가고 싶어' },
                  OPTIONAL: { emoji: '🟢', label: '시간 되면' },
                };
                const { emoji, label } = labels[priority];
                return (
                  <div key={priority}>
                    <h4 className="text-sm font-semibold text-sand-500 mb-3">
                      {emoji} {label} ({places.length})
                    </h4>
                    <div className="space-y-2">
                      {places.map((tp) => (
                        <PlaceCard
                          key={tp.id}
                          tripPlace={tp}
                          onChangePriority={handleChangePriority}
                          onRemove={handleRemovePlace}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {placeCount >= 2 && (
                <Button
                  size="lg"
                  fullWidth
                  onClick={handleOptimize}
                  disabled={optimizing}
                  className="gap-2 mt-4"
                >
                  {optimizing ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      경로 생성 중...
                    </span>
                  ) : (
                    <>
                      <SparklesIcon size={20} />
                      {routes.length > 0
                        ? '경로 다시 생성하기'
                        : '경로 생성하기'}
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {/* Routes Tab */}
      {activeTab === 'routes' && (
        <div className="space-y-6">
          {optimizing ? (
            <RouteLoading />
          ) : routes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-sand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RouteIcon size={28} className="text-sand-300" />
              </div>
              <p className="text-sand-500 mb-2">아직 경로가 없습니다</p>
              <p className="text-sm text-sand-400 mb-6">
                장소를 2개 이상 추가하고 경로를 생성해보세요
              </p>
              {placeCount >= 2 && (
                <Button onClick={handleOptimize} className="gap-2">
                  <SparklesIcon size={18} />
                  경로 생성하기
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Route type tabs */}
              <RouteTabs
                routes={routes}
                selectedType={selectedRouteType}
                onSelect={setSelectedRouteType}
              />

              {selectedRoute && (
                <>
                  {/* Reasoning card */}
                  {selectedRoute.reasoning && (
                    <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-[12px] p-4 border border-primary-100">
                      <div className="flex items-start gap-2">
                        <SparklesIcon
                          size={16}
                          className="text-primary-500 flex-shrink-0 mt-0.5"
                        />
                        <p className="text-sm text-sand-700 leading-relaxed">
                          {selectedRoute.reasoning}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Route summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-white rounded-[10px] border border-sand-200">
                      <p className="text-lg font-bold text-sand-800">
                        {selectedRoute.placeCount}
                      </p>
                      <p className="text-xs text-sand-400">방문 장소</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-[10px] border border-sand-200">
                      <p className="text-lg font-bold text-sand-800">
                        {Math.floor(selectedRoute.totalDuration / 60)}h{' '}
                        {selectedRoute.totalDuration % 60}m
                      </p>
                      <p className="text-xs text-sand-400">총 소요</p>
                    </div>
                    <div className="text-center p-3 bg-white rounded-[10px] border border-sand-200">
                      <p className="text-lg font-bold text-sand-800">
                        {selectedRoute.totalDistance >= 1000
                          ? `${(selectedRoute.totalDistance / 1000).toFixed(1)}km`
                          : `${selectedRoute.totalDistance}m`}
                      </p>
                      <p className="text-xs text-sand-400">이동 거리</p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <RouteTimeline route={selectedRoute} />

                  {/* Confirm button */}
                  {!selectedRoute.isSelected && (
                    <Button
                      size="lg"
                      fullWidth
                      onClick={() => handleConfirmRoute(selectedRoute.id)}
                      disabled={confirming}
                      className="gap-2"
                    >
                      {confirming ? (
                        <span className="flex items-center gap-2">
                          <svg
                            className="animate-spin h-5 w-5"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          확정 중...
                        </span>
                      ) : (
                        <>이 경로로 확정하기</>
                      )}
                    </Button>
                  )}

                  {selectedRoute.isSelected && (
                    <div className="text-center p-4 bg-green-50 rounded-[12px] border border-green-200">
                      <p className="text-sm font-semibold text-green-700">
                        ✅ 이 경로가 확정되었습니다
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
