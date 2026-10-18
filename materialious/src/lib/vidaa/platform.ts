/** VIDAA UI detection only. Never changes Capacitor/native/backend capabilities. */
export function isVidaa(): boolean {
  if (typeof window === 'undefined') return false;
  return /vidaa|hisense/i.test(navigator.userAgent) || import.meta.env.VITE_VIDAA_TV === 'true';
}
const originalUI = typeof window !== 'undefined' && new URLSearchParams(location.search).get('ui') === 'original';
export function isVidaaUI(): boolean { return isVidaa() && !originalUI; }
