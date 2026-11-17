import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import {
  calculateHaversineDistance,
  calculateEstimatedDeliveryMinutes,
  interpolateRouteWaypoints,
} from '@/utils/geoUtils';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RouteLegInfo {
  distanceKm: number;
  distanceText: string;
  durationMin: number;
  durationText: string;
  path: Coordinates[];
}

export interface Route3PointsResult {
  isFallback: boolean;
  fallbackReason?: string;
  leg1: RouteLegInfo; // Shipper (GPS Live) -> Restaurant (Pickup)
  leg2: RouteLegInfo; // Restaurant (Pickup) -> Customer (Dropoff)
  totalDistanceKm: number;
  totalDurationMin: number;
  overviewPolylinePath: Coordinates[];
}

let isSdkInitialized = false;
let googleMapsPromise: Promise<typeof google> | null = null;

export const getGoogleMapsApiKey = (): string => {
  return (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
};

export const isGoogleMapsConfigured = (): boolean => {
  const key = getGoogleMapsApiKey();
  return Boolean(key && key.length > 10 && !key.includes('your_key_here'));
};

/**
 * Loads Google Maps JavaScript API via the modern official importLibrary API
 */
export const loadGoogleMapsApi = async (): Promise<typeof google> => {
  if (typeof window !== 'undefined' && window.google?.maps) {
    return window.google;
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    throw new Error('Google Maps API key is not configured in VITE_GOOGLE_MAPS_API_KEY');
  }

  if (!isSdkInitialized) {
    setOptions({
      key: apiKey,
      v: 'weekly',
    });
    isSdkInitialized = true;
  }

  googleMapsPromise = (async () => {
    await Promise.all([
      importLibrary('maps'),
      importLibrary('routes'),
      importLibrary('geometry'),
    ]);
    return window.google;
  })();

  return googleMapsPromise;
};

/**
 * Calculates a fallback 3-point route using Haversine formula and interpolated waypoints.
 * Ensures the system never crashes or shows a blank UI even when offline or quota is exhausted.
 */
export const calculateHaversineFallback = (
  shipper: Coordinates,
  restaurant: Coordinates,
  customer: Coordinates,
  reason = 'Haversine Offline Fallback'
): Route3PointsResult => {
  // Leg 1: Shipper -> Restaurant
  const d1 = calculateHaversineDistance(shipper.lat, shipper.lng, restaurant.lat, restaurant.lng);
  const t1 = Math.max(3, calculateEstimatedDeliveryMinutes(d1, 26));
  const leg1Waypoints = interpolateRouteWaypoints(
    { lat: shipper.lat, lng: shipper.lng },
    { lat: restaurant.lat, lng: restaurant.lng },
    20
  );

  // Leg 2: Restaurant -> Customer
  const d2 = calculateHaversineDistance(restaurant.lat, restaurant.lng, customer.lat, customer.lng);
  const t2 = Math.max(5, calculateEstimatedDeliveryMinutes(d2, 24));
  const leg2Waypoints = interpolateRouteWaypoints(
    { lat: restaurant.lat, lng: restaurant.lng },
    { lat: customer.lat, lng: customer.lng },
    25
  );

  const totalDist = Math.round((d1 + d2) * 10) / 10;
  const totalMins = t1 + t2;

  return {
    isFallback: true,
    fallbackReason: reason,
    leg1: {
      distanceKm: d1,
      distanceText: `${d1} km`,
      durationMin: t1,
      durationText: `${t1} phút`,
      path: leg1Waypoints,
    },
    leg2: {
      distanceKm: d2,
      distanceText: `${d2} km`,
      durationMin: t2,
      durationText: `${t2} phút`,
      path: leg2Waypoints,
    },
    totalDistanceKm: totalDist,
    totalDurationMin: totalMins,
    overviewPolylinePath: [...leg1Waypoints, ...leg2Waypoints],
  };
};

/**
 * Calls Google Directions API to calculate real road-snapped polyline for 3 points:
 * Point A (Shipper Live GPS) -> Point B (Restaurant Pickup) -> Point C (Customer Dropoff)
 */
export const calculateGoogleDirections3Points = async (
  shipper: Coordinates,
  restaurant: Coordinates,
  customer: Coordinates
): Promise<Route3PointsResult> => {
  if (!isGoogleMapsConfigured()) {
    return calculateHaversineFallback(shipper, restaurant, customer, 'VITE_GOOGLE_MAPS_API_KEY chưa cấu hình');
  }

  try {
    const google = await loadGoogleMapsApi();
    const directionsService = new google.maps.DirectionsService();

    const origin = new google.maps.LatLng(shipper.lat, shipper.lng);
    const destination = new google.maps.LatLng(customer.lat, customer.lng);
    const restaurantWaypoint: google.maps.DirectionsWaypoint = {
      location: new google.maps.LatLng(restaurant.lat, restaurant.lng),
      stopover: true,
    };

    const request: google.maps.DirectionsRequest = {
      origin,
      destination,
      waypoints: [restaurantWaypoint],
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false,
    };

    const response = await directionsService.route(request);
    const route = response.routes?.[0];

    if (!route || !route.legs || route.legs.length < 2) {
      return calculateHaversineFallback(shipper, restaurant, customer, 'Không tìm thấy lộ trình chi tiết từ Google Maps');
    }

    const leg1 = route.legs[0]; // Shipper -> Restaurant
    const leg2 = route.legs[1]; // Restaurant -> Customer

    const extractLegPath = (leg: google.maps.DirectionsLeg): Coordinates[] => {
      const points: Coordinates[] = [];
      if (leg.steps) {
        for (const step of leg.steps) {
          if (step.path) {
            for (const pt of step.path) {
              points.push({ lat: pt.lat(), lng: pt.lng() });
            }
          }
        }
      }
      return points.length > 0
        ? points
        : [
            { lat: leg.start_location.lat(), lng: leg.start_location.lng() },
            { lat: leg.end_location.lat(), lng: leg.end_location.lng() },
          ];
    };

    const leg1Path = extractLegPath(leg1);
    const leg2Path = extractLegPath(leg2);

    const leg1DistKm = Math.round(((leg1.distance?.value || 0) / 1000) * 10) / 10;
    const leg1DurMin = Math.max(1, Math.round((leg1.duration?.value || 0) / 60));

    const leg2DistKm = Math.round(((leg2.distance?.value || 0) / 1000) * 10) / 10;
    const leg2DurMin = Math.max(1, Math.round((leg2.duration?.value || 0) / 60));

    const totalDistKm = Math.round((leg1DistKm + leg2DistKm) * 10) / 10;
    const totalDurMin = leg1DurMin + leg2DurMin;

    return {
      isFallback: false,
      leg1: {
        distanceKm: leg1DistKm,
        distanceText: leg1.distance?.text || `${leg1DistKm} km`,
        durationMin: leg1DurMin,
        durationText: leg1.duration?.text || `${leg1DurMin} phút`,
        path: leg1Path,
      },
      leg2: {
        distanceKm: leg2DistKm,
        distanceText: leg2.distance?.text || `${leg2DistKm} km`,
        durationMin: leg2DurMin,
        durationText: leg2.duration?.text || `${leg2DurMin} phút`,
        path: leg2Path,
      },
      totalDistanceKm: totalDistKm,
      totalDurationMin: totalDurMin,
      overviewPolylinePath: [...leg1Path, ...leg2Path],
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('[GoogleMapsService] Directions API error, activating Haversine fallback:', errorMsg);
    return calculateHaversineFallback(shipper, restaurant, customer, `Google API: ${errorMsg}`);
  }
};

/**
 * Modern dark midnight map style customized for Thunder Food Delivery
 */
export const THUNDER_DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#171d2c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#171d2c' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8898aa' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#cbd5e1' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#0f2922' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#273449' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94a3b8' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#334155' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0b1329' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38bdf8' }],
  },
];
