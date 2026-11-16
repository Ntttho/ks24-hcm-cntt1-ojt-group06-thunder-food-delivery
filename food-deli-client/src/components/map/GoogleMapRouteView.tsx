import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Tag, Tooltip } from 'antd';
import {
  CompassOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  CarOutlined,
  RightOutlined,
  SyncOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useDriverSimulation } from '@/hooks/useDriverSimulation';
import {
  calculateGoogleDirections3Points,
  calculateHaversineFallback,
  isGoogleMapsConfigured,
  loadGoogleMapsApi,
  THUNDER_DARK_MAP_STYLES,
  type Coordinates,
  type Route3PointsResult,
} from '@/services/map/googleMapService';

export interface GoogleMapRouteViewProps {
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantLat?: number | null;
  restaurantLng?: number | null;
  customerName?: string;
  customerAddress?: string;
  customerLat?: number | null;
  customerLng?: number | null;
  driverLiveCoords?: { lat: number; lng: number } | null;
  isDelivering?: boolean;
  orderCode?: string;
  statusCode?: string;
  height?: number | string;
}

export const GoogleMapRouteView: React.FC<GoogleMapRouteViewProps> = ({
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
  height = 320,
}) => {
  // 1. Coordinates normalization
  const validRestaurantCoords: Coordinates = useMemo(() => ({
    lat: restaurantLat && Math.abs(restaurantLat) > 0.001 ? restaurantLat : 10.7769,
    lng: restaurantLng && Math.abs(restaurantLng) > 0.001 ? restaurantLng : 106.7009,
  }), [restaurantLat, restaurantLng]);

  const validCustomerCoords: Coordinates = useMemo(() => ({
    lat: customerLat && Math.abs(customerLat) > 0.001 ? customerLat : 10.7925,
    lng: customerLng && Math.abs(customerLng) > 0.001 ? customerLng : 106.7214,
  }), [customerLat, customerLng]);

  // Fallback simulation hook
  const { currentDriverLocation, isArrived } = useDriverSimulation({
    restaurantLat: validRestaurantCoords.lat,
    restaurantLng: validRestaurantCoords.lng,
    receiverLat: validCustomerCoords.lat,
    receiverLng: validCustomerCoords.lng,
    isDelivering,
  });

  // Effective shipper coordinates (prioritize live GPS, fallback to simulation or slightly offset from restaurant)
  const validShipperCoords: Coordinates = useMemo(() => {
    if (driverLiveCoords && Math.abs(driverLiveCoords.lat) > 0.001) {
      return driverLiveCoords;
    }
    if (currentDriverLocation) {
      return currentDriverLocation;
    }
    // Default initial shipper position slightly southwest of the restaurant
    return {
      lat: validRestaurantCoords.lat - 0.0065,
      lng: validRestaurantCoords.lng - 0.0055,
    };
  }, [driverLiveCoords, currentDriverLocation, validRestaurantCoords]);

  // Map DOM & Google Maps instance refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<{
    shipper?: google.maps.Marker;
    restaurant?: google.maps.Marker;
    customer?: google.maps.Marker;
  }>({});
  const polylinesRef = useRef<{
    leg1?: google.maps.Polyline;
    leg2?: google.maps.Polyline;
  }>({});

  // Route state
  const [routeData, setRouteData] = useState<Route3PointsResult>(() =>
    calculateHaversineFallback(validShipperCoords, validRestaurantCoords, validCustomerCoords)
  );
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);

  // 2. Fetch 3-point Directions whenever coordinates change
  useEffect(() => {
    let isCancelled = false;

    const fetchRoute = async () => {
      setIsLoadingRoute(true);
      try {
        const result = await calculateGoogleDirections3Points(
          validShipperCoords,
          validRestaurantCoords,
          validCustomerCoords
        );
        if (!isCancelled) {
          setRouteData(result);
        }
      } catch {
        if (!isCancelled) {
          setRouteData(
            calculateHaversineFallback(validShipperCoords, validRestaurantCoords, validCustomerCoords)
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingRoute(false);
        }
      }
    };

    fetchRoute();

    return () => {
      isCancelled = true;
    };
  }, [validShipperCoords, validRestaurantCoords, validCustomerCoords]);

  // 3. Initialize Google Maps interactive canvas if configured
  useEffect(() => {
    let isMounted = true;

    if (!isGoogleMapsConfigured() || !mapContainerRef.current) {
      setIsMapReady(false);
      return;
    }

    loadGoogleMapsApi()
      .then((google) => {
        if (!isMounted || !mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
          const map = new google.maps.Map(mapContainerRef.current, {
            center: { lat: validRestaurantCoords.lat, lng: validRestaurantCoords.lng },
            zoom: 14,
            styles: THUNDER_DARK_MAP_STYLES,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
          mapInstanceRef.current = map;
        }

        setIsMapReady(true);
      })
      .catch((err) => {
        console.warn('[GoogleMapRouteView] Google Maps initialization skipped/failed:', err);
        if (isMounted) setIsMapReady(false);
      });

    return () => {
      isMounted = false;
    };
  }, [validRestaurantCoords.lat, validRestaurantCoords.lng]);

  // 4. Update Markers, Polylines and Camera Bounds on real map
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || typeof google === 'undefined' || !google.maps) {
      return;
    }

    const map = mapInstanceRef.current;
    const bounds = new google.maps.LatLngBounds();

    // SVG Marker Icons
    const shipperSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="20" fill="#10b981" fill-opacity="0.2" />
        <circle cx="22" cy="22" r="15" fill="#059669" stroke="#ffffff" stroke-width="2.5" />
        <path d="M15 24c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v2H15v-2zm10-5h-5l-1.2 2h7.4l-1.2-2zm-7 8a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm8 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill="#ffffff" />
      </svg>`;

    const restaurantSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="16" fill="#f97316" stroke="#ffffff" stroke-width="2.5" />
        <path d="M13 16l7-3.5 7 3.5v1H13v-1zm1.5 2.5h2v6h-2v-6zm4.5 0h2v6h-2v-6zm4.5 0h2v6h-2v-6zm-8 8h11v1.5h-11V26.5z" fill="#ffffff" />
      </svg>`;

    const customerSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="16" fill="#06b6d4" stroke="#ffffff" stroke-width="2.5" />
        <path d="M20 12c-3.1 0-5.5 2.4-5.5 5.5 0 4.2 5.5 9.5 5.5 9.5s5.5-5.3 5.5-9.5c0-3.1-2.4-5.5-5.5-5.5zm0 7.8a2.3 2.3 0 110-4.6 2.3 2.3 0 010 4.6z" fill="#ffffff" />
      </svg>`;

    // --- Update / Create Shipper Marker ---
    const shipperPos = new google.maps.LatLng(validShipperCoords.lat, validShipperCoords.lng);
    bounds.extend(shipperPos);
    if (!markersRef.current.shipper) {
      markersRef.current.shipper = new google.maps.Marker({
        position: shipperPos,
        map,
        title: 'Tài xế (GPS Live)',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(shipperSvg),
          scaledSize: new google.maps.Size(44, 44),
          anchor: new google.maps.Point(22, 22),
        },
        zIndex: 999,
      });
    } else {
      markersRef.current.shipper.setPosition(shipperPos);
    }

    // --- Update / Create Restaurant Marker ---
    const restPos = new google.maps.LatLng(validRestaurantCoords.lat, validRestaurantCoords.lng);
    bounds.extend(restPos);
    if (!markersRef.current.restaurant) {
      markersRef.current.restaurant = new google.maps.Marker({
        position: restPos,
        map,
        title: `${restaurantName} (Điểm lấy hàng)`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(restaurantSvg),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20),
        },
        zIndex: 900,
      });
    } else {
      markersRef.current.restaurant.setPosition(restPos);
    }

    // --- Update / Create Customer Marker ---
    const custPos = new google.maps.LatLng(validCustomerCoords.lat, validCustomerCoords.lng);
    bounds.extend(custPos);
    if (!markersRef.current.customer) {
      markersRef.current.customer = new google.maps.Marker({
        position: custPos,
        map,
        title: `${customerName} (Điểm giao hàng)`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(customerSvg),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20),
        },
        zIndex: 900,
      });
    } else {
      markersRef.current.customer.setPosition(custPos);
    }

    // --- Update Polylines ---
    const leg1Coords = routeData.leg1.path.map((p) => new google.maps.LatLng(p.lat, p.lng));
    const leg2Coords = routeData.leg2.path.map((p) => new google.maps.LatLng(p.lat, p.lng));

    // Leg 1: Shipper -> Restaurant (Amber / Orange)
    if (!polylinesRef.current.leg1) {
      polylinesRef.current.leg1 = new google.maps.Polyline({
        path: leg1Coords,
        map,
        strokeColor: '#f59e0b',
        strokeOpacity: isDelivering ? 0.45 : 0.95,
        strokeWeight: isDelivering ? 3.5 : 5,
        zIndex: isDelivering ? 10 : 20,
      });
    } else {
      polylinesRef.current.leg1.setPath(leg1Coords);
      polylinesRef.current.leg1.setOptions({
        strokeOpacity: isDelivering ? 0.45 : 0.95,
        strokeWeight: isDelivering ? 3.5 : 5,
        zIndex: isDelivering ? 10 : 20,
      });
    }

    // Leg 2: Restaurant -> Customer (Emerald / Green)
    if (!polylinesRef.current.leg2) {
      polylinesRef.current.leg2 = new google.maps.Polyline({
        path: leg2Coords,
        map,
        strokeColor: '#10b981',
        strokeOpacity: isDelivering ? 0.95 : 0.55,
        strokeWeight: isDelivering ? 5 : 4,
        zIndex: isDelivering ? 20 : 10,
      });
    } else {
      polylinesRef.current.leg2.setPath(leg2Coords);
      polylinesRef.current.leg2.setOptions({
        strokeOpacity: isDelivering ? 0.95 : 0.55,
        strokeWeight: isDelivering ? 5 : 4,
        zIndex: isDelivering ? 20 : 10,
      });
    }

    // Auto-fit bounds with padding
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { top: 40, right: 30, bottom: 40, left: 30 });
    }
  }, [isMapReady, routeData, isDelivering, validShipperCoords, validRestaurantCoords, validCustomerCoords, restaurantName, customerName]);

  // Cleanup on unmount
  useEffect(() => {
    const markers = markersRef.current;
    const polylines = polylinesRef.current;
    return () => {
      if (markers.shipper) markers.shipper.setMap(null);
      if (markers.restaurant) markers.restaurant.setMap(null);
      if (markers.customer) markers.customer.setMap(null);
      if (polylines.leg1) polylines.leg1.setMap(null);
      if (polylines.leg2) polylines.leg2.setMap(null);
    };
  }, []);

  // External Google Maps Turn-by-turn Navigation URL
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    restaurantAddress || `${validRestaurantCoords.lat},${validRestaurantCoords.lng}`
  )}&destination=${encodeURIComponent(
    customerAddress || `${validCustomerCoords.lat},${validCustomerCoords.lng}`
  )}&waypoints=${encodeURIComponent(
    `${validShipperCoords.lat},${validShipperCoords.lng}`
  )}&travelmode=two_wheeler`;

  // Status Stage calculation
  const isDriverAcceptedStage = statusCode === 'DRIVER_ACCEPTED' || statusCode === 'PICKING_UP';
  const stageHeading = isDelivering
    ? isArrived
      ? 'Tài xế đã đến nơi giao hàng'
      : 'Tài xế đang giao đến bạn (Chặng 2)'
    : isDriverAcceptedStage
    ? 'Tài xế đang đến quán lấy món (Chặng 1)'
    : 'Lộ trình 3 điểm đơn hàng';

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 text-white shadow-lg transition-all">
      {/* 1. Header Toolbar Overlay */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-700/60 flex items-center gap-2 shadow-md pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-bold tracking-tight text-slate-100">
            {stageHeading}
          </span>
          {orderCode && <span className="text-[10px] text-slate-400">#{orderCode}</span>}
          {isLoadingRoute && <SyncOutlined spin className="text-xs text-orange-400 ml-1" />}
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {routeData.isFallback && (
            <Tooltip title="Đang chạy ở chế độ ước tính ngoại tuyến / Haversine fallback khi chưa có Google Maps API Key">
              <Tag color="warning" className="m-0 text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                <InfoCircleOutlined />
                <span>Ước tính ngoại tuyến</span>
              </Tag>
            </Tooltip>
          )}

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-white/95 hover:bg-white text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-2xl shadow-md border border-slate-200 transition-all active:scale-95 flex items-center gap-1"
          >
            <CompassOutlined className="text-orange-500" />
            <span className="hidden sm:inline">Mở Google Maps</span>
            <span className="sm:hidden">Maps</span>
            <RightOutlined className="text-[9px]" />
          </a>
        </div>
      </div>

      {/* 2. Interactive Google Maps Canvas or Graceful SVG Fallback Canvas */}
      <div
        className="relative w-full bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 overflow-hidden"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        {/* Real Google Maps Container */}
        <div
          ref={mapContainerRef}
          className={`w-full h-full transition-opacity duration-500 ${
            isMapReady ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Fallback SVG Canvas (shown when Google Maps is not configured or loading) */}
        {!isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Map Grid Pattern */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

            {/* 3-Point Realistic Curve Simulation */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="leg1Grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
                <linearGradient id="leg2Grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>

              {/* Chặng 1: Shipper -> Quán */}
              <path
                d="M 14,80 Q 25,55 45,55"
                fill="none"
                stroke="url(#leg1Grad)"
                strokeWidth={isDelivering ? '2' : '3.5'}
                strokeDasharray={isDelivering ? '3 3' : 'none'}
                strokeLinecap="round"
                opacity={isDelivering ? 0.5 : 0.9}
              />

              {/* Chặng 2: Quán -> Khách */}
              <path
                d="M 45,55 Q 65,30 85,25"
                fill="none"
                stroke="url(#leg2Grad)"
                strokeWidth={isDelivering ? '3.5' : '2'}
                strokeDasharray={!isDelivering ? '3 3' : 'none'}
                strokeLinecap="round"
                opacity={isDelivering ? 0.95 : 0.6}
              />
            </svg>

            {/* Point 1: Shipper Pin (Live GPS) */}
            <div className="absolute left-[14%] bottom-[20%] flex flex-col items-center z-10 -translate-x-1/2">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-emerald-500/20">
                  <CarOutlined className="text-sm animate-pulse" />
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                </span>
              </div>
              <span className="text-[9px] font-extrabold bg-slate-900/90 text-emerald-300 px-2 py-0.5 rounded-md mt-1 border border-emerald-500/40">
                Tài xế (GPS)
              </span>
            </div>

            {/* Point 2: Restaurant Pin (Pickup) */}
            <div className="absolute left-[45%] top-[55%] flex flex-col items-center z-10 -translate-x-1/2 -translate-y-1/2">
              <div className="bg-orange-500 text-white p-2 rounded-2xl shadow-lg border-2 border-white ring-4 ring-orange-500/20 animate-bounce">
                <ShopOutlined className="text-sm" />
              </div>
              <span className="text-[10px] font-extrabold bg-slate-900/90 text-orange-300 px-2 py-0.5 rounded-md mt-1 shadow-xs truncate max-w-[110px]">
                {restaurantName}
              </span>
            </div>

            {/* Point 3: Customer Pin (Dropoff) */}
            <div className="absolute right-[15%] top-[25%] flex flex-col items-center z-10 translate-x-1/2 -translate-y-1/2">
              <div className="bg-cyan-500 text-white p-2 rounded-2xl shadow-lg border-2 border-white ring-4 ring-cyan-500/20">
                <EnvironmentOutlined className="text-sm" />
              </div>
              <span className="text-[10px] font-extrabold bg-slate-900/90 text-cyan-300 px-2 py-0.5 rounded-md mt-1 shadow-xs truncate max-w-[110px]">
                {customerName}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Metrics Bar - Chi tiết cả 3 chặng & ETA */}
      <div className="bg-slate-900/95 border-t border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Chặng 1: Shipper -> Quán */}
          <div className={`px-2.5 py-1.5 rounded-xl border transition-all ${
            !isDelivering ? 'bg-amber-950/40 border-amber-500/50 text-amber-200' : 'bg-slate-800/80 border-slate-700 text-slate-300'
          }`}>
            <span className="text-[10px] text-slate-400 block font-medium">Chặng 1: Đến quán</span>
            <span className="font-extrabold text-xs">
              {routeData.leg1.distanceText} • ~{routeData.leg1.durationText}
            </span>
          </div>

          {/* Chặng 2: Quán -> Khách */}
          <div className={`px-2.5 py-1.5 rounded-xl border transition-all ${
            isDelivering ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 ring-2 ring-emerald-500/20' : 'bg-slate-800/80 border-slate-700 text-slate-300'
          }`}>
            <span className="text-[10px] text-slate-400 block font-medium">Chặng 2: Đến khách</span>
            <span className="font-extrabold text-xs">
              {routeData.leg2.distanceText} • ~{routeData.leg2.durationText}
            </span>
          </div>

          {/* Tổng hành trình */}
          <div className="bg-slate-800/90 px-2.5 py-1.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 text-[10px] block font-medium">Tổng quãng đường</span>
            <span className="text-slate-100 font-extrabold text-xs">
              {routeData.totalDistanceKm} km
            </span>
          </div>
        </div>

        <div className="text-right flex flex-col items-end">
          <span className="text-[11px] text-slate-300 font-medium block truncate max-w-[220px]">
            Giao đến: {customerAddress || 'Địa chỉ của bạn'}
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <Tag color={isDelivering ? 'processing' : 'default'} className="m-0 text-[10px] font-bold">
              {isDelivering ? 'Đang tịnh tiến trực tiếp' : isDriverAcceptedStage ? 'Tài xế đang đến quán' : 'Sẵn sàng theo dõi'}
            </Tag>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapRouteView;
