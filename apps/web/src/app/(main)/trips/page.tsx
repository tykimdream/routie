import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  PlusIcon,
  PlaneIcon,
  MapPinIcon,
  ChevronRightIcon,
} from '@/components/icons';

type TripStatus = 'PLANNING' | 'OPTIMIZED' | 'CONFIRMED' | 'COMPLETED';

interface Trip {
  id: string;
  title: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  placeCount: number;
  status: TripStatus;
  progress: number;
  emoji: string;
}

// 더미 데이터 (추후 API 연동)
const upcomingTrips: Trip[] = [
  {
    id: '1',
    title: '방콕 3일 여행',
    city: 'Bangkok',
    country: 'Thailand',
    startDate: '2026-03-15',
    endDate: '2026-03-17',
    placeCount: 12,
    status: 'PLANNING' as const,
    progress: 60,
    emoji: '🇹🇭',
  },
  {
    id: '2',
    title: '도쿄 5일 여행',
    city: 'Tokyo',
    country: 'Japan',
    startDate: '2026-04-20',
    endDate: '2026-04-24',
    placeCount: 8,
    status: 'PLANNING' as const,
    progress: 25,
    emoji: '🇯🇵',
  },
];

const pastTrips: Trip[] = [
  {
    id: '3',
    title: '오사카 2일',
    city: 'Osaka',
    country: 'Japan',
    startDate: '2026-01-10',
    endDate: '2026-01-11',
    placeCount: 6,
    status: 'COMPLETED' as const,
    progress: 100,
    emoji: '🇯🇵',
  },
];

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

interface TripCardProps {
  trip: Trip;
  showProgress?: boolean;
}

function TripCard({ trip, showProgress = true }: TripCardProps) {
  const status = getStatusLabel(trip.status);
  const dday = getDaysUntil(trip.startDate);

  return (
    <Link href={`/trips/${trip.id}`}>
      <Card hoverable className="group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{trip.emoji}</span>
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
            <span>장소 {trip.placeCount}개</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
          >
            {status.text}
          </span>
        </div>

        {showProgress && trip.progress < 100 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-sand-400 mb-1.5">
              <span>진행률</span>
              <span>{trip.progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-sand-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-400 to-primary-500 rounded-full transition-all duration-500"
                style={{ width: `${trip.progress}%` }}
              />
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
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
  const hasTrips = upcomingTrips.length > 0 || pastTrips.length > 0;

  if (!hasTrips) {
    return <EmptyState />;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-sand-900">내 여행</h2>
          <p className="text-sm text-sand-400 mt-1">
            총 {upcomingTrips.length + pastTrips.length}개의 여행
          </p>
        </div>
        <Link href="/trips/new">
          <Button size="sm" className="gap-1.5">
            <PlusIcon size={16} />새 여행
          </Button>
        </Link>
      </div>

      {/* Upcoming Trips */}
      {upcomingTrips.length > 0 && (
        <section className="mb-8">
          <h3 className="text-sm font-semibold text-sand-500 uppercase tracking-wider mb-3">
            다가오는 여행
          </h3>
          <div className="space-y-3">
            {upcomingTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {/* Past Trips */}
      {pastTrips.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-sand-500 uppercase tracking-wider mb-3">
            지난 여행
          </h3>
          <div className="space-y-3">
            {pastTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} showProgress={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
