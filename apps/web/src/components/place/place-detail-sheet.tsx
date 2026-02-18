'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Drawer } from 'vaul';
import { StarIcon, MapPinIcon, ClockIcon } from '@/components/icons';
import { api, getPhotoProxyUrl } from '@/lib/api';
import type { TripPlace, Priority, PlaceDetail } from '@/lib/types';

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

const categoryIcons: Record<string, string> = {
  RESTAURANT: '🍽️',
  CAFE: '☕',
  BAR: '🍸',
  ATTRACTION: '🏛️',
  SHOPPING: '🛍️',
  SPA_MASSAGE: '💆',
  ENTERTAINMENT: '🎭',
  ACCOMMODATION: '🏨',
  TRANSPORT_HUB: '🚉',
  OTHER: '📍',
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

interface PlaceDetailSheetProps {
  tripPlace: TripPlace | null;
  onClose: () => void;
  onChangePriority: (id: string, priority: Priority) => void;
  onUpdateNote: (id: string, note: string) => void;
}

export function PlaceDetailSheet({
  tripPlace,
  onClose,
  onChangePriority,
  onUpdateNote,
}: PlaceDetailSheetProps) {
  const [note, setNote] = useState('');
  const [detail, setDetail] = useState<PlaceDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [failedPhotos, setFailedPhotos] = useState<Set<number>>(new Set());
  const prevPlaceId = useRef<string | null>(null);

  const fetchDetail = useCallback(async (placeId: string) => {
    setLoadingDetail(true);
    try {
      const data = await api.places.get(placeId);
      if (data.placeDetail) {
        setDetail(data.placeDetail);
      }
    } catch {
      // placeDetail이 없는 경우 무시
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (tripPlace) {
      // 장소가 바뀌면 사진 에러 상태 초기화
      if (prevPlaceId.current !== tripPlace.placeId) {
        setActivePhotoIdx(0);
        setFailedPhotos(new Set());
        prevPlaceId.current = tripPlace.placeId;
      }
      setNote(tripPlace.userNote ?? '');
      if (tripPlace.place.placeDetail) {
        setDetail(tripPlace.place.placeDetail);
      } else {
        setDetail(null);
        fetchDetail(tripPlace.placeId);
      }
    } else {
      setDetail(null);
      setNote('');
    }
  }, [tripPlace, fetchDetail]);

  const place = tripPlace?.place;
  const photos = (place?.photoUrls ?? [])
    .map((url, i) => ({ url: getPhotoProxyUrl(url), idx: i }))
    .filter(({ idx }) => !failedPhotos.has(idx));
  const activePhoto = photos.find((p) => p.idx === activePhotoIdx) ?? photos[0];

  const priorities: Priority[] = ['MUST', 'WANT', 'OPTIONAL'];

  return (
    <Drawer.Root
      open={!!tripPlace}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[16px] bg-white max-h-[90vh] md:max-w-lg md:mx-auto md:rounded-[16px] md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:after:hidden"
          aria-describedby={undefined}
        >
          <Drawer.Title className="sr-only">
            {place?.name ?? '장소 상세'}
          </Drawer.Title>
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-sand-300 my-3 md:hidden" />

          <div className="overflow-y-auto flex-1 px-5 pb-8 pt-4 min-h-[60vh] md:min-h-[400px]">
            {place && tripPlace && (
              <>
                {/* Photo Carousel or Fallback */}
                {activePhoto ? (
                  <div className="mb-4">
                    {/* Main photo */}
                    <div className="relative w-full h-48 rounded-[12px] overflow-hidden bg-sand-100">
                      <img
                        src={activePhoto.url}
                        alt={place.name}
                        className="w-full h-full object-cover"
                        onError={() =>
                          setFailedPhotos((prev) =>
                            new Set(prev).add(activePhoto.idx),
                          )
                        }
                      />
                      {/* Photo counter */}
                      {photos.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                          {photos.indexOf(activePhoto) + 1} / {photos.length}
                        </div>
                      )}
                    </div>
                    {/* Thumbnails */}
                    {photos.length > 1 && (
                      <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                        {photos.map((photo) => (
                          <button
                            key={photo.idx}
                            type="button"
                            onClick={() => setActivePhotoIdx(photo.idx)}
                            className={`flex-shrink-0 w-14 h-14 rounded-[8px] overflow-hidden border-2 transition-all cursor-pointer ${
                              photo.idx === activePhoto.idx
                                ? 'border-primary-500 opacity-100'
                                : 'border-transparent opacity-60 hover:opacity-90'
                            }`}
                          >
                            <img
                              src={photo.url}
                              alt={`${place.name} ${photo.idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={() =>
                                setFailedPhotos((prev) =>
                                  new Set(prev).add(photo.idx),
                                )
                              }
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative w-full h-32 rounded-[12px] overflow-hidden mb-4 bg-gradient-to-br from-sand-100 to-sand-200 flex flex-col items-center justify-center">
                    <span className="text-4xl mb-1">
                      {categoryIcons[place.category] ?? '📍'}
                    </span>
                    <span className="text-xs text-sand-400">
                      {categoryLabels[place.category] ?? '장소'}
                    </span>
                  </div>
                )}

                {/* Name & Category */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-sand-900">
                      {place.name}
                    </h3>
                    <span className="text-xs text-sand-400 bg-sand-100 px-2 py-0.5 rounded-full">
                      {categoryLabels[place.category] ?? place.category}
                    </span>
                  </div>
                  {place.rating != null && place.rating > 0 && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <StarIcon size={16} className="text-yellow-400" />
                      <span className="text-sm font-semibold text-sand-700">
                        {place.rating}
                      </span>
                      {place.userRatingCount != null && (
                        <span className="text-xs text-sand-400">
                          ({place.userRatingCount.toLocaleString()})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="flex items-center gap-1.5 text-sm text-sand-500 mb-2">
                  <MapPinIcon size={14} className="flex-shrink-0" />
                  <span>{place.address}</span>
                </div>

                {/* Static Map */}
                {place.latitude && place.longitude && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}&query_place_id=${place.googlePlaceId ?? ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mb-4 rounded-[10px] overflow-hidden border border-sand-200 hover:border-sand-300 transition-colors"
                  >
                    <img
                      src={`https://maps.googleapis.com/maps/api/staticmap?center=${place.latitude},${place.longitude}&zoom=15&size=600x180&scale=2&markers=color:0xD97706%7C${place.latitude},${place.longitude}&style=feature:poi%7Cvisibility:simplified&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}`}
                      alt={`${place.name} 위치`}
                      className="w-full h-[140px] object-cover"
                    />
                    <div className="flex items-center justify-center gap-1 py-1.5 bg-sand-50 text-xs text-sand-500">
                      <MapPinIcon size={12} />
                      <span>Google 지도에서 보기</span>
                    </div>
                  </a>
                )}

                {/* Opening Hours */}
                {place.openingHours && Array.isArray(place.openingHours) && (
                  <div className="mb-4 p-3 bg-sand-50 rounded-[10px]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ClockIcon size={14} className="text-sand-500" />
                      <span className="text-sm font-medium text-sand-700">
                        영업시간
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {(place.openingHours as string[]).map((line, i) => (
                        <p key={i} className="text-xs text-sand-500">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* PlaceDetail Sections */}
                {loadingDetail && (
                  <div className="text-center py-4">
                    <div className="animate-pulse text-sm text-sand-400">
                      상세 정보 불러오는 중...
                    </div>
                  </div>
                )}

                {detail && (
                  <div className="space-y-4 mb-4">
                    {/* Highlights */}
                    {detail.highlights.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-sand-700 mb-2">
                          하이라이트
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {detail.highlights.map((h, i) => (
                            <span
                              key={i}
                              className="text-xs bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vibes */}
                    {detail.vibes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-sand-700 mb-2">
                          분위기
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {detail.vibes.map((v, i) => (
                            <span
                              key={i}
                              className="text-xs bg-accent-50 text-accent-600 px-2.5 py-1 rounded-full"
                            >
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Signature Menus */}
                    {detail.signatureMenus.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-sand-700 mb-2">
                          시그니처 메뉴
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {detail.signatureMenus.map((m, i) => (
                            <span
                              key={i}
                              className="text-xs bg-secondary-50 text-secondary-600 px-2.5 py-1 rounded-full"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Review Highlights */}
                    {detail.reviewHighlights.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-sand-700 mb-2">
                          리뷰 하이라이트
                        </h4>
                        <div className="space-y-1.5">
                          {detail.reviewHighlights.map((r, i) => (
                            <p
                              key={i}
                              className="text-xs text-sand-600 bg-sand-50 px-3 py-2 rounded-[8px]"
                            >
                              &ldquo;{r}&rdquo;
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-3">
                      {detail.avgDuration != null && (
                        <div className="flex items-center gap-1.5 text-xs text-sand-500">
                          <ClockIcon size={12} />
                          <span>평균 {detail.avgDuration}분 체류</span>
                        </div>
                      )}
                      {detail.nearestStation && (
                        <div className="flex items-center gap-1.5 text-xs text-sand-500">
                          <span>🚇</span>
                          <span>{detail.nearestStation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {place.summary && (
                  <div className="mb-4">
                    <p className="text-sm text-sand-600 leading-relaxed">
                      {place.summary}
                    </p>
                  </div>
                )}

                {/* Note */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-sand-700 mb-2">
                    메모
                  </h4>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onBlur={() => onUpdateNote(tripPlace.id, note)}
                    placeholder="이 장소에 대한 메모를 남겨보세요..."
                    className="w-full p-3 text-sm border border-sand-200 rounded-[10px] resize-none focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 min-h-[80px] text-sand-700 placeholder:text-sand-300"
                  />
                </div>

                {/* Priority */}
                <div>
                  <h4 className="text-sm font-semibold text-sand-700 mb-2">
                    우선순위
                  </h4>
                  <div className="flex items-center gap-2">
                    {priorities.map((p) => {
                      const c = priorityConfig[p];
                      const isActive = tripPlace.priority === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => onChangePriority(tripPlace.id, p)}
                          className={`flex-1 px-3 py-2 text-sm font-medium rounded-[10px] border transition-all cursor-pointer ${
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
              </>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
