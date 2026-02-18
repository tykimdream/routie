'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CitySearch } from '@/components/trip/city-search';
import { PlaneIcon, ClockIcon, ArrowRightIcon } from '@/components/icons';
import { api, ApiError } from '@/lib/api';

type TransportMode = 'PUBLIC_TRANSIT' | 'WALKING' | 'DRIVING' | 'TAXI';

const transportOptions: {
  value: TransportMode;
  label: string;
  emoji: string;
  desc: string;
}[] = [
  {
    value: 'PUBLIC_TRANSIT',
    label: '대중교통',
    emoji: '🚇',
    desc: '지하철, 버스',
  },
  { value: 'WALKING', label: '도보', emoji: '🚶', desc: '걸어서 이동' },
  { value: 'DRIVING', label: '자가용', emoji: '🚗', desc: '렌터카, 자차' },
  { value: 'TAXI', label: '택시', emoji: '🚕', desc: '택시, 그랩' },
];

export default function NewTripPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    city: '',
    country: '',
    startDate: '',
    endDate: '',
    dailyStart: '10:00',
    dailyEnd: '21:00',
    transport: 'PUBLIC_TRANSIT' as TransportMode,
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  const totalSteps = 3;

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canGoNext = () => {
    switch (step) {
      case 1:
        return form.city.trim().length > 0;
      case 2:
        return form.startDate && form.endDate;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const title = form.title.trim() || `${form.city} 여행`;
      const trip = await api.trips.create({
        title,
        city: form.city,
        country: form.country || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        dailyStart: form.dailyStart,
        dailyEnd: form.dailyEnd,
        transport: form.transport,
        latitude: form.latitude,
        longitude: form.longitude,
      });
      router.push(`/trips/${trip.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('여행 생성 중 오류가 발생했습니다');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-sand-900">새 여행 만들기</h2>
          <span className="text-sm font-medium text-sand-400">
            {step}/{totalSteps}
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-sand-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-400 to-primary-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[12px] text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Step 1: 도시 */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlaneIcon size={28} className="text-primary-500" />
            </div>
            <h3 className="text-xl font-bold text-sand-800 mb-2">
              어디로 떠나시나요?
            </h3>
            <p className="text-sand-400">여행할 도시를 검색해주세요</p>
          </div>

          <CitySearch
            initialCity={form.city}
            onSelect={(city, country, lat, lng) => {
              setForm((prev) => ({
                ...prev,
                city,
                country,
                latitude: lat,
                longitude: lng,
              }));
            }}
          />

          <div>
            <label className="block text-sm font-medium text-sand-700 mb-2">
              나라{' '}
              <span className="text-sand-300">(자동 입력 / 수정 가능)</span>
            </label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => updateForm('country', e.target.value)}
              placeholder="도시를 선택하면 자동 입력됩니다"
              className="w-full px-4 py-3.5 bg-white border-2 border-sand-200 rounded-[12px] text-sand-800 placeholder:text-sand-300 focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sand-700 mb-2">
              여행 이름 <span className="text-sand-300">(선택)</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateForm('title', e.target.value)}
              placeholder={
                form.city ? `${form.city} 여행` : '예: 방콕 맛집 투어'
              }
              className="w-full px-4 py-3.5 bg-white border-2 border-sand-200 rounded-[12px] text-sand-800 placeholder:text-sand-300 focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all"
            />
          </div>
        </div>
      )}

      {/* Step 2: 날짜 */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-accent-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📅</span>
            </div>
            <h3 className="text-xl font-bold text-sand-800 mb-2">
              언제 떠나시나요?
            </h3>
            <p className="text-sand-400">여행 날짜를 선택해주세요</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-sand-700 mb-2">
                출발일
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => updateForm('startDate', e.target.value)}
                className="w-full px-4 py-3.5 bg-white border-2 border-sand-200 rounded-[12px] text-sand-800 focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sand-700 mb-2">
                귀국일
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => updateForm('endDate', e.target.value)}
                min={form.startDate}
                className="w-full px-4 py-3.5 bg-white border-2 border-sand-200 rounded-[12px] text-sand-800 focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all"
              />
            </div>
          </div>

          {form.startDate && form.endDate && (
            <Card className="bg-secondary-50 border-secondary-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✈️</span>
                <div>
                  <p className="font-semibold text-secondary-700">
                    {Math.ceil(
                      (new Date(form.endDate).getTime() -
                        new Date(form.startDate).getTime()) /
                        (1000 * 60 * 60 * 24),
                    ) + 1}
                    일간의 여행
                  </p>
                  <p className="text-sm text-secondary-500">
                    {form.city || '멋진 도시'}에서의 특별한 시간
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Step 3: 시간 & 교통 */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-secondary-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClockIcon size={28} className="text-secondary-500" />
            </div>
            <h3 className="text-xl font-bold text-sand-800 mb-2">
              여행 스타일을 알려주세요
            </h3>
            <p className="text-sand-400">
              하루 활동 시간과 이동 수단을 설정해주세요
            </p>
          </div>

          {/* Daily schedule */}
          <div>
            <label className="block text-sm font-medium text-sand-700 mb-3">
              하루 활동 시간
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-sand-400 mb-1 block">
                  시작 시간
                </span>
                <input
                  type="time"
                  value={form.dailyStart}
                  onChange={(e) => updateForm('dailyStart', e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-sand-200 rounded-[12px] text-sand-800 focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all"
                />
              </div>
              <div>
                <span className="text-xs text-sand-400 mb-1 block">
                  종료 시간
                </span>
                <input
                  type="time"
                  value={form.dailyEnd}
                  onChange={(e) => updateForm('dailyEnd', e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-sand-200 rounded-[12px] text-sand-800 focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Transport */}
          <div>
            <label className="block text-sm font-medium text-sand-700 mb-3">
              주 이동 수단
            </label>
            <div className="grid grid-cols-2 gap-3">
              {transportOptions.map((option) => {
                const isSelected = form.transport === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateForm('transport', option.value)}
                    className={`flex items-center gap-3 p-4 rounded-[12px] border-2 transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-primary-400 bg-primary-50 ring-4 ring-primary-100'
                        : 'border-sand-200 bg-white hover:border-sand-300'
                    }`}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <div>
                      <p
                        className={`font-semibold text-sm ${isSelected ? 'text-primary-700' : 'text-sand-700'}`}
                      >
                        {option.label}
                      </p>
                      <p className="text-xs text-sand-400">{option.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center gap-3 mt-10">
        {step > 1 && (
          <Button
            variant="outline"
            size="lg"
            fullWidth
            onClick={() => setStep(step - 1)}
          >
            이전
          </Button>
        )}
        {step < totalSteps ? (
          <Button
            size="lg"
            fullWidth
            disabled={!canGoNext()}
            onClick={() => setStep(step + 1)}
            className="gap-2"
          >
            다음
            <ArrowRightIcon size={18} />
          </Button>
        ) : (
          <Button
            size="lg"
            fullWidth
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="gap-2"
          >
            {isSubmitting ? (
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
                생성 중...
              </span>
            ) : (
              <>
                여행 만들기
                <PlaneIcon size={18} />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
