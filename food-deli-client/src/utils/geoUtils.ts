/**
 * Haversine Formula for distance calculation between two latitude/longitude points in kilometers.
 */
export function calculateHaversineDistance(
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null
): number {
  if (
    lat1 === undefined || lat1 === null ||
    lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null ||
    lon2 === undefined || lon2 === null ||
    (lat1 === 0 && lon1 === 0) ||
    (lat2 === 0 && lon2 === 0)
  ) {
    return 1.8; // Fallback sensible default distance in km
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

/**
 * Calculates estimated delivery time in minutes based on distance and average inner-city speed.
 */
export function calculateEstimatedDeliveryMinutes(distanceKm: number, speedKmH: number = 24): number {
  const travelMinutes = (distanceKm / speedKmH) * 60;
  const prepAndWaitingMinutes = 10;
  return Math.max(10, Math.round(travelMinutes + prepAndWaitingMinutes));
}

export interface LatLngPoint {
  lat: number;
  lng: number;
}

/**
 * Generates an array of interpolated waypoints between two coordinates.
 */
export function interpolateRouteWaypoints(
  start: LatLngPoint,
  end: LatLngPoint,
  totalSteps: number = 25
): LatLngPoint[] {
  const points: LatLngPoint[] = [];
  for (let i = 0; i <= totalSteps; i++) {
    const fraction = i / totalSteps;
    // Add a slight realistic curve jitter
    const curveOffset = Math.sin(fraction * Math.PI) * 0.0012;
    points.push({
      lat: start.lat + (end.lat - start.lat) * fraction + curveOffset,
      lng: start.lng + (end.lng - start.lng) * fraction + curveOffset * 0.7,
    });
  }
  return points;
}

/**
 * Calculates the forward azimuth bearing in degrees (0 - 360) between two coordinates.
 * 0° = North, 90° = East, 180° = South, 270° = West.
 */
export function calculateBearing(
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null
): number {
  if (
    lat1 === undefined || lat1 === null ||
    lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null ||
    lon2 === undefined || lon2 === null ||
    (lat1 === lat2 && lon1 === lon2)
  ) {
    return 0;
  }

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lon2 - lon1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  return Math.round(((toDeg(theta) + 360) % 360) * 10) / 10;
}

/**
 * Formats seconds into a human-readable live ETA string for countdown timers.
 */
export function formatLiveEta(seconds: number): string {
  if (seconds <= 0) return 'Đã đến nơi';
  if (seconds < 60) return `Còn ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  if (minutes < 60) {
    return remainingSecs > 0 ? `${minutes} ph ${remainingSecs}s` : `${minutes} phút`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}ph`;
}

