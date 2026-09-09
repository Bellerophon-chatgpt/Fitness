import { Capacitor } from '@capacitor/core';

// True only inside the native (iOS/Android) shell — false in the browser/PWA.
export function isNativeHealth(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export interface HealthWeight {
  date: string; // YYYY-MM-DD
  kg: number;
}

// Reads recent body-weight samples from Apple Health (HealthKit) / Google Health
// Connect and reduces them to one value per day (latest wins). Returns [] on web
// or when unavailable/denied. The plugin is only imported on native so the web
// bundle never pulls it in at runtime.
export async function readHealthWeights(sinceDays = 180): Promise<HealthWeight[]> {
  if (!isNativeHealth()) return [];
  try {
    const { Health } = await import('@capgo/capacitor-health');
    const avail = await Health.isAvailable();
    if (!avail.available) return [];
    await Health.requestAuthorization({ read: ['weight'], write: [] });
    const startDate = new Date(Date.now() - sinceDays * 86400000).toISOString();
    const endDate = new Date().toISOString();
    const { samples } = await Health.readSamples({ dataType: 'weight', startDate, endDate, limit: 1000, ascending: true });
    const perDay = new Map<string, number>();
    for (const s of samples) {
      // weight samples come back in kilograms
      if (typeof s.value === 'number' && s.value > 0) perDay.set(s.startDate.slice(0, 10), Math.round(s.value * 10) / 10);
    }
    return [...perDay.entries()]
      .map(([date, kg]) => ({ date, kg }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  } catch {
    return [];
  }
}
