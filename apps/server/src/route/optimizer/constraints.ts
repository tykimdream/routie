interface PlaceInfo {
  id: string;
  category: string;
  avgDuration?: number | null;
  customDuration?: number | null;
  preferredTime?: string | null;
}

/** Default stay duration in minutes by category */
const DURATION_MAP: Record<string, number> = {
  RESTAURANT: 60,
  CAFE: 45,
  BAR: 60,
  ATTRACTION: 90,
  SHOPPING: 60,
  SPA_MASSAGE: 90,
  ENTERTAINMENT: 120,
  ACCOMMODATION: 0,
  TRANSPORT_HUB: 15,
  OTHER: 60,
};

export function getStayDuration(place: PlaceInfo): number {
  if (place.customDuration) return place.customDuration;
  if (place.avgDuration) return place.avgDuration;
  return DURATION_MAP[place.category] ?? 60;
}

export function isMealPlace(category: string): boolean {
  return category === 'RESTAURANT';
}

export function isCafePlace(category: string): boolean {
  return category === 'CAFE' || category === 'BAR';
}

/** Calculate daily available minutes from HH:mm strings */
export function dailyMinutes(start: string, end: string): number {
  const [sh = 0, sm = 0] = start.split(':').map(Number);
  const [eh = 0, em = 0] = end.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

/** Parse HH:mm to minutes since midnight */
export function parseTime(time: string): number {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Format minutes since midnight to HH:mm */
export function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
