import L from 'leaflet';
import { calculateHaversineDistance, interpolateRouteWaypoints, type LatLngPoint } from '@/utils/geoUtils';

export interface RouteLegResult {
  coordinates: [number, number][]; // [lat, lng][] format for Leaflet polyline
  distanceKm: number;
  durationMinutes: number;
  isRealRoad: boolean;
}

export interface Route3PointsRealResult {
  leg1: RouteLegResult; // Driver -> Restaurant
  leg2: RouteLegResult; // Restaurant -> Customer
  totalDistanceKm: number;
  totalDurationMinutes: number;
  isRealRoad: boolean;
}

// Tile layers (100% Free, No API key required, Official Google Maps & OSM tiles)
export const TILE_PROVIDERS = {
  googleRoadmap: {
    name: 'Google Đường phố',
    url: 'https://mt{s}.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 20,
  },
  googleHybrid: {
    name: 'Google Vệ tinh',
    url: 'https://mt{s}.google.com/vt/lyrs=y&hl=vi&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 20,
  },
  osmStandard: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19,
  },
  cartoVoyager: {
    name: 'CartoDB Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  },
};

export type TileProviderKey = keyof typeof TILE_PROVIDERS;

/**
 * Fetch a driving route between two points using the public Open Source Routing Machine (OSRM) API.
 * Falls back gracefully to interpolated curved waypoints if the API is unreachable.
 */
export async function fetchOsrmDrivingRoute(
  start: LatLngPoint,
  end: LatLngPoint
): Promise<RouteLegResult> {
  const haversineDist = calculateHaversineDistance(start.lat, start.lng, end.lat, end.lng);
  const fallbackDuration = Math.max(3, Math.round((haversineDist / 25) * 60));

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500); // 4.5s timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`OSRM HTTP status: ${res.status}`);

    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      // OSRM returns GeoJSON coordinates in [lng, lat] order -> convert to Leaflet [lat, lng]
      const coordinates: [number, number][] = route.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]]
      );
      const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
      const durationMinutes = Math.max(1, Math.round(route.duration / 60));

      return {
        coordinates,
        distanceKm,
        durationMinutes,
        isRealRoad: true,
      };
    }
  } catch {
    // Graceful fallback if offline or request blocked
  }

  // Fallback: smooth interpolated waypoints
  const waypoints = interpolateRouteWaypoints(start, end, 30);
  return {
    coordinates: waypoints.map((w) => [w.lat, w.lng]),
    distanceKm: haversineDist,
    durationMinutes: fallbackDuration,
    isRealRoad: false,
  };
}

/**
 * Calculates 3-point real road trip: Driver -> Restaurant and Restaurant -> Customer.
 */
export async function calculateRealMap3Points(
  driver: LatLngPoint,
  restaurant: LatLngPoint,
  customer: LatLngPoint
): Promise<Route3PointsRealResult> {
  const [leg1, leg2] = await Promise.all([
    fetchOsrmDrivingRoute(driver, restaurant),
    fetchOsrmDrivingRoute(restaurant, customer),
  ]);

  const totalDistanceKm = Math.round((leg1.distanceKm + leg2.distanceKm) * 10) / 10;
  const totalDurationMinutes = leg1.durationMinutes + leg2.durationMinutes;

  return {
    leg1,
    leg2,
    totalDistanceKm,
    totalDurationMinutes,
    isRealRoad: leg1.isRealRoad && leg2.isRealRoad,
  };
}

/**
 * Creates custom styled HTML Leaflet markers for Restaurant, Customer, and Driver.
 */
export function createRestaurantDivIcon(name: string = 'Quán ăn'): L.DivIcon {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 6px 10px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.4); display: flex; align-items: center; gap: 5px; font-weight: 700; font-size: 11px; white-space: nowrap; border: 2px solid white;">
          <span style="font-size: 14px;">🏪</span>
          <span>${name}</span>
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid #ea580c;"></div>
      </div>
    `,
    iconSize: [120, 42],
    iconAnchor: [60, 42],
  });
}

export function createCustomerDivIcon(address: string = 'Khách nhận'): L.DivIcon {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 6px 10px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4); display: flex; align-items: center; gap: 5px; font-weight: 700; font-size: 11px; white-space: nowrap; border: 2px solid white;">
          <span style="font-size: 14px;">📍</span>
          <span>${address}</span>
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid #dc2626;"></div>
      </div>
    `,
    iconSize: [120, 42],
    iconAnchor: [60, 42],
  });
}

export function createDriverDivIcon(bearing: number = 0, speedKmh?: number): L.DivIcon {
  const speedBadge = speedKmh && speedKmh > 0 ? `<div style="position: absolute; bottom: -14px; background: #0f172a; color: #4ade80; font-size: 9px; font-weight: bold; padding: 1px 5px; border-radius: 6px; white-space: nowrap; border: 1px solid #334155;">${Math.round(speedKmh)} km/h</div>` : '';

  return L.divIcon({
    className: 'custom-leaflet-marker driver-marker',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <!-- Pulse radar ring -->
        <div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(16, 185, 129, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        
        <!-- Rotating vehicle container -->
        <div style="transform: rotate(${bearing}deg); transition: transform 0.4s ease-out; width: 36px; height: 36px; background: #059669; border: 2.5px solid #ffffff; border-radius: 9999px; box-shadow: 0 4px 10px rgba(5, 150, 105, 0.45); display: flex; align-items: center; justify-content: center; position: relative;">
          <!-- Front direction arrow -->
          <div style="position: absolute; top: -6px; width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-bottom: 6px solid #10b981;"></div>
          <!-- Motorbike emoji/icon -->
          <span style="font-size: 18px; line-height: 1;">🛵</span>
        </div>
        ${speedBadge}
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}
