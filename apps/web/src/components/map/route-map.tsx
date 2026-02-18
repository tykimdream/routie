'use client';

import { useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from '@vis.gl/react-google-maps';
import type { Route } from '@/lib/types';

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

function NumberMarker({ number }: { number: number }) {
  return (
    <div className="w-7 h-7 rounded-full bg-primary-500 border-2 border-white shadow-md flex items-center justify-center">
      <span className="text-white text-xs font-bold">{number}</span>
    </div>
  );
}

function RoutePolyline({ route }: { route: Route }) {
  const map = useMap();

  useEffect(() => {
    if (!map || route.stops.length < 2) return;

    const path = route.stops.map((stop) => ({
      lat: stop.place.latitude,
      lng: stop.place.longitude,
    }));

    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#D97706',
      strokeOpacity: 0.8,
      strokeWeight: 3,
    });

    polyline.setMap(map);

    // Fit bounds
    const bounds = new google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });

    return () => {
      polyline.setMap(null);
    };
  }, [map, route]);

  return null;
}

interface RouteMapProps {
  route: Route;
}

export function RouteMap({ route }: RouteMapProps) {
  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className="w-full h-[300px] bg-sand-100 rounded-[12px] flex items-center justify-center">
        <p className="text-sm text-sand-400">
          Google Maps API 키가 설정되지 않았습니다
        </p>
      </div>
    );
  }

  const firstStop = route.stops[0];
  const center = firstStop
    ? { lat: firstStop.place.latitude, lng: firstStop.place.longitude }
    : { lat: 35.6762, lng: 139.6503 };

  return (
    <div className="w-full h-[300px] rounded-[12px] overflow-hidden border border-sand-200">
      <APIProvider apiKey={GOOGLE_MAPS_KEY}>
        <Map
          defaultCenter={center}
          defaultZoom={13}
          mapId="routie-route-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          streetViewControl={false}
          mapTypeControl={false}
          fullscreenControl={false}
        >
          <RoutePolyline route={route} />
          {route.stops.map((stop, index) => (
            <AdvancedMarker
              key={stop.id}
              position={{
                lat: stop.place.latitude,
                lng: stop.place.longitude,
              }}
            >
              <NumberMarker number={index + 1} />
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}
