'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import type { Trip } from '@/lib/types';

export function useTrip(id: string) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetch = useCallback(async () => {
    // 최초 로딩 시에만 loading=true, refetch 시에는 기존 데이터 유지
    if (!hasFetched.current) {
      setLoading(true);
    }
    try {
      const data = await api.trips.get(id);
      setTrip(data);
      setError(null);
      hasFetched.current = true;
    } catch {
      setError('여행 정보를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    hasFetched.current = false;
    fetch();
  }, [fetch]);

  return { trip, loading, error, refetch: fetch };
}
