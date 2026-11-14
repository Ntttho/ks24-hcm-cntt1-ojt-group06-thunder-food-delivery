import { useState, useEffect, useRef } from 'react';
import {
  calculateHaversineDistance,
  calculateEstimatedDeliveryMinutes,
  interpolateRouteWaypoints,
  type LatLngPoint,
} from '@/utils/geoUtils';

interface UseDriverSimulationProps {
  restaurantLat?: number | null;
  restaurantLng?: number | null;
  receiverLat?: number | null;
  receiverLng?: number | null;
  isDelivering?: boolean;
}

export function useDriverSimulation({
  restaurantLat,
  restaurantLng,
  receiverLat,
  receiverLng,
  isDelivering = false,
}: UseDriverSimulationProps) {
  const start: LatLngPoint = {
    lat: restaurantLat && Math.abs(restaurantLat) > 0.001 ? restaurantLat : 10.7769,
    lng: restaurantLng && Math.abs(restaurantLng) > 0.001 ? restaurantLng : 106.7009,
  };

  const end: LatLngPoint = {
    lat: receiverLat && Math.abs(receiverLat) > 0.001 ? receiverLat : 10.7925,
    lng: receiverLng && Math.abs(receiverLng) > 0.001 ? receiverLng : 106.7214,
  };

  const waypoints = useRef<LatLngPoint[]>(interpolateRouteWaypoints(start, end, 30));
  const [stepIndex, setStepIndex] = useState<number>(0);

  // Recalculate waypoints if coordinates change
  useEffect(() => {
    waypoints.current = interpolateRouteWaypoints(start, end, 30);
    setStepIndex(0);
  }, [start.lat, start.lng, end.lat, end.lng]);

  // Simulation timer tick when in DELIVERING state
  useEffect(() => {
    if (!isDelivering) {
      setStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= waypoints.current.length - 1) {
          return waypoints.current.length - 1; // Arrived
        }
        return prev + 1;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isDelivering]);

  const currentPoint = waypoints.current[stepIndex] || start;
  const remainingDistanceKm = calculateHaversineDistance(
    currentPoint.lat,
    currentPoint.lng,
    end.lat,
    end.lng
  );
  const remainingMinutes = calculateEstimatedDeliveryMinutes(remainingDistanceKm);
  const progressPercent = Math.min(100, Math.round((stepIndex / (waypoints.current.length - 1)) * 100));

  return {
    currentDriverLocation: currentPoint,
    remainingDistanceKm,
    remainingMinutes,
    progressPercent,
    isArrived: stepIndex >= waypoints.current.length - 1,
  };
}

