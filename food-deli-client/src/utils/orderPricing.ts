import type { OrderCostConfig } from '@/services/modules/adminSettingsApi';

export function calculateHaversineDistanceKm(
  latitude1: number | null | undefined,
  longitude1: number | null | undefined,
  latitude2: number | null | undefined,
  longitude2: number | null | undefined
): number | null {
  if (
    latitude1 == null ||
    longitude1 == null ||
    latitude2 == null ||
    longitude2 == null ||
    !Number.isFinite(latitude1) ||
    !Number.isFinite(longitude1) ||
    !Number.isFinite(latitude2) ||
    !Number.isFinite(longitude2) ||
    (latitude1 === 0 && longitude1 === 0) ||
    (latitude2 === 0 && longitude2 === 0) ||
    latitude1 < -90 || latitude1 > 90 ||
    latitude2 < -90 || latitude2 > 90 ||
    longitude1 < -180 || longitude1 > 180 ||
    longitude2 < -180 || longitude2 > 180
  ) {
    return null;
  }

  const lat1 = (latitude1 * Math.PI) / 180;
  const lat2 = (latitude2 * Math.PI) / 180;
  const deltaLat = ((latitude2 - latitude1) * Math.PI) / 180;
  const deltaLng = ((longitude2 - longitude1) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 2 * 6371 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateShippingFee(
  distanceKm: number,
  config: OrderCostConfig,
  deliverySpeed: 'priority' | 'standard' | 'schedule'
): number {
  const distanceSurcharge = Math.max(0, distanceKm - config.baseKm) * config.extraPerKm;
  const prioritySurcharge = deliverySpeed === 'priority' ? config.priorityFee : 0;
  return Math.round(config.baseFee + distanceSurcharge + prioritySurcharge);
}

export function calculateVatAmount(subtotal: number, config: OrderCostConfig): number {
  return config.vatIncluded ? 0 : Math.round(subtotal * config.vatRate);
}
