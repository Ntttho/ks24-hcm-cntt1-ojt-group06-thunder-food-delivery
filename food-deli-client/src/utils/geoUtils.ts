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

