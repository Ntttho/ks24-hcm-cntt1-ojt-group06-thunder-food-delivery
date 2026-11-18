import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Tag } from 'antd';
import {
  CompassOutlined,
  ThunderboltOutlined,
  SyncOutlined,
  CarOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useDriverSimulation } from '@/hooks/useDriverSimulation';
import { calculateHaversineDistance, calculateBearing, formatLiveEta } from '@/utils/geoUtils';
import {
  TILE_PROVIDERS,
  calculateRealMap3Points,
  createRestaurantDivIcon,
  createCustomerDivIcon,
  createDriverDivIcon,
  type Route3PointsRealResult,
  type TileProviderKey,
} from '@/services/map/realMapService';

export interface DriverLiveCoords {
  lat: number;
  lng: number;
  heading?: number;
  speedKmh?: number;
}

export interface RealMapRouteViewProps {
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantLat?: number | null;
  restaurantLng?: number | null;
  customerName?: string;
  customerAddress?: string;
  customerLat?: number | null;
  customerLng?: number | null;
  driverLiveCoords?: DriverLiveCoords | null;
  isDelivering?: boolean;
  orderCode?: string;
  statusCode?: string;
  height?: number | string;
  interactive?: boolean;
  showInfoFooter?: boolean;
}

export const RealMapRouteView: React.FC<RealMapRouteViewProps> = ({
  restaurantName = 'Quán ăn',
  restaurantAddress,
  restaurantLat,
  restaurantLng,
  customerName = 'Khách hàng',
  customerAddress,
  customerLat,
  customerLng,
  driverLiveCoords,
  isDelivering = false,
  orderCode,
  statusCode,
  height = 360,
  interactive = true,
  showInfoFooter = true,
}) => {
  // 1. Normalized Coordinates (Default to HCMC center if null)
  const validRestaurantCoords = useMemo(() => ({
    lat: restaurantLat && Math.abs(restaurantLat) > 0.001 ? restaurantLat : 10.7769,
    lng: restaurantLng && Math.abs(restaurantLng) > 0.001 ? restaurantLng : 106.7009,
  }), [restaurantLat, restaurantLng]);

  const validCustomerCoords = useMemo(() => ({
    lat: customerLat && Math.abs(customerLat) > 0.001 ? customerLat : 10.7925,
    lng: customerLng && Math.abs(customerLng) > 0.001 ? customerLng : 106.7214,
  }), [customerLat, customerLng]);

  // Fallback Simulation Hook
  const { currentDriverLocation, isArrived } = useDriverSimulation({
    restaurantLat: validRestaurantCoords.lat,
    restaurantLng: validRestaurantCoords.lng,
    receiverLat: validCustomerCoords.lat,
    receiverLng: validCustomerCoords.lng,
    isDelivering,
  });

  // Effective Driver Coords (Priority: Live GPS > Simulation > Offset from Restaurant)
  const validShipperCoords = useMemo(() => {
    if (driverLiveCoords && Math.abs(driverLiveCoords.lat) > 0.001) {
      return { lat: driverLiveCoords.lat, lng: driverLiveCoords.lng };
    }
    if (currentDriverLocation) {
      return currentDriverLocation;
    }
    return {
      lat: validRestaurantCoords.lat - 0.0065,
      lng: validRestaurantCoords.lng - 0.0055,
    };
  }, [driverLiveCoords, currentDriverLocation, validRestaurantCoords]);

  // Leaflet DOM & instances refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<{
    driver?: L.Marker;
    restaurant?: L.Marker;
    customer?: L.Marker;
  }>({});
  const polylinesRef = useRef<{
    leg1?: L.Polyline;
    leg2?: L.Polyline;
  }>({});

  // Active Tile Layer State (Default: Google Maps Roadmap)
  const [selectedTile, setSelectedTile] = useState<TileProviderKey>('googleRoadmap');

  // Route State
  const [routeData, setRouteData] = useState<Route3PointsRealResult | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);
  const [currentBearing, setCurrentBearing] = useState<number>(() => driverLiveCoords?.heading || 0);

  // Live ETA & countdown
  const activeMilestoneCoords = isDelivering ? validCustomerCoords : validRestaurantCoords;
  const liveSpeedKmh = Math.max(15, driverLiveCoords?.speedKmh && driverLiveCoords.speedKmh > 3 ? driverLiveCoords.speedKmh : 24);
  const remainingDistKm = useMemo(() => {
    return calculateHaversineDistance(
      validShipperCoords.lat,
      validShipperCoords.lng,
      activeMilestoneCoords.lat,
      activeMilestoneCoords.lng
    );
  }, [validShipperCoords, activeMilestoneCoords]);

  const [countdownSeconds, setCountdownSeconds] = useState<number>(() =>
    Math.max(30, Math.round((remainingDistKm / liveSpeedKmh) * 3600))
  );

  useEffect(() => {
    setCountdownSeconds(Math.max(30, Math.round((remainingDistKm / liveSpeedKmh) * 3600)));
  }, [remainingDistKm, liveSpeedKmh]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 10 ? prev - 1 : prev));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update bearing when coordinates change
  useEffect(() => {
    if (driverLiveCoords?.heading !== undefined) {
      setCurrentBearing(driverLiveCoords.heading);
    } else {
      const target = isDelivering ? validCustomerCoords : validRestaurantCoords;
      const calcB = calculateBearing(
        validShipperCoords.lat,
        validShipperCoords.lng,
        target.lat,
        target.lng
      );
      setCurrentBearing(calcB);
    }
  }, [driverLiveCoords, validShipperCoords, isDelivering, validCustomerCoords, validRestaurantCoords]);

  // 2. Fetch OSRM Real Road Route
  useEffect(() => {
    let active = true;
    const fetchRoute = async () => {
      setIsLoadingRoute(true);
      try {
        const res = await calculateRealMap3Points(
          validShipperCoords,
          validRestaurantCoords,
          validCustomerCoords
        );
        if (active) {
          setRouteData(res);
        }
      } catch {
        // Handled inside calculateRealMap3Points
      } finally {
        if (active) setIsLoadingRoute(false);
      }
    };

    fetchRoute();
    return () => {
      active = false;
    };
  }, [validRestaurantCoords.lat, validRestaurantCoords.lng, validCustomerCoords.lat, validCustomerCoords.lng]);

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [validRestaurantCoords.lat, validRestaurantCoords.lng],
        zoom: 15,
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive ? 'center' : false,
        doubleClickZoom: interactive,
        attributionControl: false,
      });

      // Default: Google Maps Roadmap with full Vietnamese street names & addresses
      const initialProvider = TILE_PROVIDERS.googleRoadmap;
      tileLayerRef.current = L.tileLayer(initialProvider.url, {
        maxZoom: initialProvider.maxZoom,
        subdomains: initialProvider.subdomains as any,
      }).addTo(map);

      // Attribution
      L.control.attribution({ position: 'bottomright', prefix: 'Bản đồ Google Maps & OSRM' }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Place Restaurant Marker
    if (!markersRef.current.restaurant) {
      markersRef.current.restaurant = L.marker(
        [validRestaurantCoords.lat, validRestaurantCoords.lng],
        { icon: createRestaurantDivIcon(restaurantName) }
      ).addTo(map);
      if (restaurantAddress) {
        markersRef.current.restaurant.bindPopup(`<strong>${restaurantName}</strong><br/>${restaurantAddress}`);
      }
    } else {
      markersRef.current.restaurant.setLatLng([validRestaurantCoords.lat, validRestaurantCoords.lng]);
      markersRef.current.restaurant.setIcon(createRestaurantDivIcon(restaurantName));
    }

    // Place Customer Marker
    if (!markersRef.current.customer) {
      markersRef.current.customer = L.marker(
        [validCustomerCoords.lat, validCustomerCoords.lng],
        { icon: createCustomerDivIcon(customerAddress || customerName) }
      ).addTo(map);
      if (customerAddress) {
        markersRef.current.customer.bindPopup(`<strong>${customerName}</strong><br/>${customerAddress}`);
      }
    } else {
      markersRef.current.customer.setLatLng([validCustomerCoords.lat, validCustomerCoords.lng]);
      markersRef.current.customer.setIcon(createCustomerDivIcon(customerAddress || customerName));
    }

    // Initial Bounds Fitting
    const bounds = L.latLngBounds([
      [validShipperCoords.lat, validShipperCoords.lng],
      [validRestaurantCoords.lat, validRestaurantCoords.lng],
      [validCustomerCoords.lat, validCustomerCoords.lng],
    ]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });

    // Handle container resize & ensure 100% tile render
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      ro = new ResizeObserver(() => {
        map.invalidateSize();
      });
      ro.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(timer);
      if (ro) ro.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        markersRef.current = {};
        polylinesRef.current = {};
      }
    };
  }, []);

  // 4. Handle Tile Switching (Google Roadmap, Google Hybrid, OSM)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const provider = TILE_PROVIDERS[selectedTile];
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = L.tileLayer(provider.url, {
      maxZoom: provider.maxZoom,
      subdomains: provider.subdomains as any,
    }).addTo(map);
  }, [selectedTile]);

  // 5. Update Driver Marker Live Position & Bearing
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!markersRef.current.driver) {
      markersRef.current.driver = L.marker(
        [validShipperCoords.lat, validShipperCoords.lng],
        { icon: createDriverDivIcon(currentBearing, driverLiveCoords?.speedKmh), zIndexOffset: 1000 }
      ).addTo(map);
    } else {
      markersRef.current.driver.setLatLng([validShipperCoords.lat, validShipperCoords.lng]);
      markersRef.current.driver.setIcon(createDriverDivIcon(currentBearing, driverLiveCoords?.speedKmh));
    }
  }, [validShipperCoords, currentBearing, driverLiveCoords?.speedKmh]);

  // 6. Render / Update Real Polylines when Route Data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !routeData) return;

    // Leg 1: Driver -> Restaurant (Amber/Orange)
    if (routeData.leg1 && routeData.leg1.coordinates.length > 0) {
      if (polylinesRef.current.leg1) {
        polylinesRef.current.leg1.setLatLngs(routeData.leg1.coordinates);
      } else {
        polylinesRef.current.leg1 = L.polyline(routeData.leg1.coordinates, {
          color: '#f97316',
          weight: 5,
          opacity: 0.9,
          dashArray: isDelivering ? '6, 8' : undefined,
          lineJoin: 'round',
        }).addTo(map);
      }
    }

    // Leg 2: Restaurant -> Customer (Cyan / Emerald)
    if (routeData.leg2 && routeData.leg2.coordinates.length > 0) {
      if (polylinesRef.current.leg2) {
        polylinesRef.current.leg2.setLatLngs(routeData.leg2.coordinates);
      } else {
        polylinesRef.current.leg2 = L.polyline(routeData.leg2.coordinates, {
          color: '#06b6d4',
          weight: 5.5,
          opacity: 0.95,
          lineJoin: 'round',
        }).addTo(map);
      }
    }

    // Refit bounds
    const bounds = L.latLngBounds([
      [validShipperCoords.lat, validShipperCoords.lng],
      [validRestaurantCoords.lat, validRestaurantCoords.lng],
      [validCustomerCoords.lat, validCustomerCoords.lng],
    ]);
    map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16 });
  }, [routeData, isDelivering]);

  // Stage heading title
  const isDriverAcceptedStage = statusCode === 'DRIVER_ACCEPTED' || statusCode === 'PICKING_UP';
  const stageHeading = isDelivering
    ? isArrived
      ? 'Tài xế đã đến nơi giao hàng'
      : 'Tài xế đang giao đến bạn (Chặng 2)'
    : isDriverAcceptedStage
    ? 'Tài xế đang đến quán lấy món (Chặng 1)'
    : 'Lộ trình đơn hàng thực tế';

  const googleMapsExternalUrl = `https://www.google.com/maps/dir/?api=1&origin=${validShipperCoords.lat},${validShipperCoords.lng}&destination=${validCustomerCoords.lat},${validCustomerCoords.lng}&waypoints=${validRestaurantCoords.lat},${validRestaurantCoords.lng}&travelmode=two_wheeler`;

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 text-white shadow-xl transition-all">
      {/* 1. Header Toolbar Overlay */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between pointer-events-none gap-2 flex-wrap">
        <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-700/60 flex items-center gap-2 shadow-md pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-bold tracking-tight text-slate-100">
            {stageHeading}
          </span>
          {orderCode && <span className="text-[10px] text-slate-400">#{orderCode}</span>}
          {isLoadingRoute && <SyncOutlined spin className="text-xs text-orange-400 ml-1" />}
        </div>

        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          {/* Map Layer Switcher: Google Đường phố, Vệ tinh, OSM */}
          <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-700/60 flex items-center gap-1 shadow-md">
            <button
              type="button"
              onClick={() => setSelectedTile('googleRoadmap')}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                selectedTile === 'googleRoadmap'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Google Đường phố
            </button>
            <button
              type="button"
              onClick={() => setSelectedTile('googleHybrid')}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                selectedTile === 'googleHybrid'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Vệ tinh
            </button>
            <button
              type="button"
              onClick={() => setSelectedTile('osmStandard')}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                selectedTile === 'osmStandard'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              OSM
            </button>
          </div>

          <a
            href={googleMapsExternalUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-white/95 hover:bg-white text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-2xl shadow-md border border-slate-200 transition-all active:scale-95 flex items-center gap-1"
          >
            <CompassOutlined className="text-orange-500" />
            <span className="hidden sm:inline">Chỉ đường ngoài</span>
            <RightOutlined className="text-[9px]" />
          </a>
        </div>
      </div>

      {/* 2. Leaflet Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full z-0"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      />

      {/* 3. Bottom Route Info Bar */}
      {showInfoFooter && (
        <div className="p-3.5 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Chặng 1 */}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span className="text-slate-400">Tài xế ➔ Quán:</span>
              <span className="font-bold text-orange-400">
                {routeData?.leg1.distanceKm ?? calculateHaversineDistance(validShipperCoords.lat, validShipperCoords.lng, validRestaurantCoords.lat, validRestaurantCoords.lng)} km
              </span>
              <span className="text-[11px] text-slate-500">
                (~{routeData?.leg1.durationMinutes ?? 5} ph)
              </span>
            </div>

            {/* Chặng 2 */}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <span className="text-slate-400">Quán ➔ Khách:</span>
              <span className="font-bold text-cyan-300">
                {routeData?.leg2.distanceKm ?? calculateHaversineDistance(validRestaurantCoords.lat, validRestaurantCoords.lng, validCustomerCoords.lat, validCustomerCoords.lng)} km
              </span>
              <span className="text-[11px] text-slate-500">
                (~{routeData?.leg2.durationMinutes ?? 10} ph)
              </span>
            </div>
          </div>

          {/* Tổng quãng đường & ETA */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
              <CarOutlined className="text-emerald-400" />
              <span className="text-[11px] text-slate-400">Tổng chuyến:</span>
              <span className="font-bold text-emerald-400">
                {routeData?.totalDistanceKm ?? Math.round((remainingDistKm + 2.5) * 10) / 10} km
              </span>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-orange-400 font-semibold">
              <ThunderboltOutlined />
              <span>Dự kiến: {formatLiveEta(countdownSeconds)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
