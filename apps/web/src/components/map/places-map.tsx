'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import type { TripPlace } from '@/lib/types';

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

const priorityColors: Record<string, string> = {
  MUST: '#EF4444',
  WANT: '#EAB308',
  OPTIONAL: '#22C55E',
};

function MarkerDot({ color }: { color: string }) {
  return (
    <div
      className="w-6 h-6 rounded-full border-2 border-white shadow-md"
      style={{ backgroundColor: color }}
    />
  );
}

interface PoiInfo {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
}

interface MapContentProps {
  tripPlaces: TripPlace[];
  onClickMarker?: (tripPlace: TripPlace) => void;
  onAddPlace?: (googlePlaceId: string) => void;
}

function MapContent({
  tripPlaces,
  onClickMarker,
  onAddPlace,
}: MapContentProps) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [selectedPlace, setSelectedPlace] = useState<TripPlace | null>(null);
  const [poiInfo, setPoiInfo] = useState<PoiInfo | null>(null);
  const [adding, setAdding] = useState(false);
  const initialFitDone = useRef(false);
  const tripPlacesRef = useRef(tripPlaces);
  tripPlacesRef.current = tripPlaces;

  // Fit bounds — 최초 마운트 시에만 실행
  useEffect(() => {
    if (!map || tripPlaces.length === 0 || initialFitDone.current) return;
    initialFitDone.current = true;

    const bounds = new google.maps.LatLngBounds();
    tripPlaces.forEach((tp) => {
      bounds.extend({ lat: tp.place.latitude, lng: tp.place.longitude });
    });

    const first = tripPlaces[0];
    if (tripPlaces.length === 1 && first) {
      map.setCenter({
        lat: first.place.latitude,
        lng: first.place.longitude,
      });
      map.setZoom(15);
    } else {
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [map, tripPlaces]);

  const handleMarkerClick = useCallback(
    (tp: TripPlace) => {
      setPoiInfo(null);
      setSelectedPlace(tp);
      onClickMarker?.(tp);
    },
    [onClickMarker],
  );

  // Register click listener on the map for POI clicks
  useEffect(() => {
    if (!map || !placesLib) return;

    const listener = map.addListener(
      'click',
      (e: google.maps.MapMouseEvent & { placeId?: string }) => {
        if (!e.placeId || !e.latLng) {
          setPoiInfo(null);
          setSelectedPlace(null);
          return;
        }

        // Prevent default Google Maps info window
        e.stop?.();

        const clickedPlaceId = e.placeId;
        const lat = e.latLng!.lat();
        const lng = e.latLng!.lng();

        const alreadyAdded = tripPlacesRef.current.some(
          (tp) => tp.place.googlePlaceId === clickedPlaceId,
        );
        if (alreadyAdded) {
          setPoiInfo(null);
          return;
        }

        // Places API (New) — use Place.fetchFields()
        const place = new placesLib.Place({ id: clickedPlaceId });
        place
          .fetchFields({ fields: ['displayName'] })
          .then(() => {
            setPoiInfo({
              placeId: clickedPlaceId,
              name: place.displayName ?? '알 수 없는 장소',
              lat,
              lng,
            });
          })
          .catch(() => {
            setPoiInfo({
              placeId: clickedPlaceId,
              name: '장소',
              lat,
              lng,
            });
          });
      },
    );

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, placesLib]);

  const handleAddPoi = useCallback(async () => {
    if (!poiInfo || !onAddPlace) return;
    setAdding(true);
    try {
      await onAddPlace(poiInfo.placeId);
      setPoiInfo(null);
    } finally {
      setAdding(false);
    }
  }, [poiInfo, onAddPlace]);

  return (
    <>
      {tripPlaces.map((tp) => (
        <AdvancedMarker
          key={tp.id}
          position={{ lat: tp.place.latitude, lng: tp.place.longitude }}
          onClick={() => handleMarkerClick(tp)}
        >
          <MarkerDot color={priorityColors[tp.priority] ?? '#9CA3AF'} />
        </AdvancedMarker>
      ))}

      {selectedPlace && (
        <InfoWindow
          position={{
            lat: selectedPlace.place.latitude,
            lng: selectedPlace.place.longitude,
          }}
          onCloseClick={() => setSelectedPlace(null)}
          pixelOffset={[0, -30]}
        >
          <div className="p-1 max-w-[200px]">
            <h4 className="font-semibold text-sm text-gray-900">
              {selectedPlace.place.name}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              {selectedPlace.place.address}
            </p>
          </div>
        </InfoWindow>
      )}

      {poiInfo && (
        <InfoWindow
          position={{ lat: poiInfo.lat, lng: poiInfo.lng }}
          onCloseClick={() => setPoiInfo(null)}
        >
          <div className="p-1.5 max-w-[220px]">
            <h4 className="font-semibold text-sm text-gray-900 mb-2">
              {poiInfo.name}
            </h4>
            <button
              type="button"
              onClick={handleAddPoi}
              disabled={adding}
              className="w-full px-3 py-1.5 bg-[#D97706] text-white text-xs font-semibold rounded-lg hover:bg-[#B45309] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {adding ? '추가 중...' : '여행에 추가하기'}
            </button>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

interface PlacesMapProps {
  tripPlaces: TripPlace[];
  onClickMarker?: (tripPlace: TripPlace) => void;
  onAddPlace?: (googlePlaceId: string) => void;
}

export function PlacesMap({
  tripPlaces,
  onClickMarker,
  onAddPlace,
}: PlacesMapProps) {
  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className="w-full h-[400px] bg-sand-100 rounded-[12px] flex items-center justify-center">
        <p className="text-sm text-sand-400">
          Google Maps API 키가 설정되지 않았습니다
        </p>
      </div>
    );
  }

  const firstPlace = tripPlaces[0];
  const center = firstPlace
    ? { lat: firstPlace.place.latitude, lng: firstPlace.place.longitude }
    : { lat: 35.6762, lng: 139.6503 };

  return (
    <div className="w-full h-[400px] rounded-[12px] overflow-hidden border border-sand-200">
      <APIProvider apiKey={GOOGLE_MAPS_KEY}>
        <Map
          defaultCenter={center}
          defaultZoom={13}
          mapId="routie-places-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          streetViewControl={false}
          mapTypeControl={false}
          fullscreenControl={false}
        >
          <MapContent
            tripPlaces={tripPlaces}
            onClickMarker={onClickMarker}
            onAddPlace={onAddPlace}
          />
        </Map>
      </APIProvider>
    </div>
  );
}
