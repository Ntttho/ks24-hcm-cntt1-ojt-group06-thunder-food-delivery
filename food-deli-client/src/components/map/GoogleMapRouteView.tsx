import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Tag, Tooltip } from 'antd';
import {
  CompassOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  CarOutlined,
  RightOutlined,
  SyncOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useDriverSimulation } from '@/hooks/useDriverSimulation';
import {
  calculateHaversineDistance,
  calculateBearing,
  formatLiveEta,
} from '@/utils/geoUtils';
import {
  calculateGoogleDirections3Points,
  calculateHaversineFallback,
  isGoogleMapsConfigured,
  loadGoogleMapsApi,
  THUNDER_DARK_MAP_STYLES,
  type Coordinates,
  type Route3PointsResult,
} from '@/services/map/googleMapService';
import { RealMapRouteView } from './RealMapRouteView';

export interface DriverLiveCoords {
  lat: number;
  lng: number;
  heading?: number;
  speedKmh?: number;
}

export interface GoogleMapRouteViewProps {
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
}

/**
 * Generates an SVG string of a motorcycle marker rotated to the specified bearing (0 - 360 deg)
 * with a forward direction indicator cone and radar pulse ring.
 */
const getShipperSvg = (bearingDeg: number): string => `
  <svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 46 46">
    <!-- Outer Radar Pulse Ring -->
    <circle cx="23" cy="23" r="21" fill="#10b981" fill-opacity="0.22" />
    
    <!-- Rotatable Vehicle Container -->
    <g transform="rotate(${bearingDeg}, 23, 23)">
      <!-- Direction Indicator Arrow -->
      <polygon points="23,3 27,10 19,10" fill="#10b981" />
      
      <!-- Motorbike Badge Base -->
      <circle cx="23" cy="23" r="14" fill="#059669" stroke="#ffffff" stroke-width="2.5" />
      
      <!-- Motorcycle Graphic -->
      <path d="M16 25c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v2H16v-2zm10-5h-5l-1.2 2h7.4l-1.2-2zm-7 8a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm8 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill="#ffffff" />
    </g>
  </svg>
`;

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
  if (!isGoogleMapsConfigured()) {
    return (
      <RealMapRouteView
        restaurantName={restaurantName}
        restaurantAddress={restaurantAddress}
        restaurantLat={restaurantLat}
        restaurantLng={restaurantLng}
        customerName={customerName}
        customerAddress={customerAddress}
        customerLat={customerLat}
        customerLng={customerLng}
        driverLiveCoords={driverLiveCoords}
        isDelivering={isDelivering}
        orderCode={orderCode}
        statusCode={statusCode}
        height={height}
      />
    );
  }

  // 1. Normalize Coordinates
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

  // Effective shipper coordinates (prioritize live GPS, fallback to simulation or restaurant offset)
  const validShipperCoords: Coordinates = useMemo(() => {
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

  // Realtime Animation & Bearing Refs for 60fps Smooth LERP
  const currentPosRef = useRef<Coordinates>(validShipperCoords);
  const currentBearingRef = useRef<number>(driverLiveCoords?.heading || 0);
  const animFrameIdRef = useRef<number | null>(null);
  const [currentBearingState, setCurrentBearingState] = useState<number>(driverLiveCoords?.heading || 0);

  // Route state
  const [routeData, setRouteData] = useState<Route3PointsResult>(() =>
    calculateHaversineFallback(validShipperCoords, validRestaurantCoords, validCustomerCoords)
  );
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);

  // Live ETA Countdown state (seconds remaining to next milestone)
  const activeMilestoneCoords = isDelivering ? validCustomerCoords : validRestaurantCoords;
  const liveSpeedKmh = Math.max(15, driverLiveCoords?.speedKmh && driverLiveCoords.speedKmh > 3 ? driverLiveCoords.speedKmh : 24);

  const initialRemainingDist = calculateHaversineDistance(
    validShipperCoords.lat,
    validShipperCoords.lng,
    activeMilestoneCoords.lat,
    activeMilestoneCoords.lng
  );
  const [countdownSeconds, setCountdownSeconds] = useState<number>(() =>
    Math.max(30, Math.round((initialRemainingDist / liveSpeedKmh) * 3600))
  );
  const [liveDistanceKm, setLiveDistanceKm] = useState<number>(initialRemainingDist);

  // Fallback animation progress ratio along the SVG curve
  const [initialCountdown] = useState<number>(() =>
    Math.max(60, Math.round((initialRemainingDist / liveSpeedKmh) * 3600))
  );
  const progressRatio = useMemo(() => {
    if (!initialCountdown || initialCountdown <= 0) return 0.5;
    return Math.max(0.05, Math.min(0.95, 1 - countdownSeconds / initialCountdown));
  }, [countdownSeconds, initialCountdown]);

  const fallbackShipperPos = useMemo(() => {
    if (isDelivering) {
      // Curve 2: Restaurant (45, 55) -> Customer (85, 25)
      const t = progressRatio;
      const x = 45 + (85 - 45) * t;
      const y = 55 + (25 - 55) * t;
      return { x, y };
    } else {
      // Curve 1: Shipper Start (14, 80) -> Restaurant (45, 55)
      const t = progressRatio;
      const x = 14 + (45 - 14) * t;
      const y = 80 + (55 - 80) * t;
      return { x, y };
    }
  }, [isDelivering, progressRatio]);

  // 2. Fetch 3-point Directions when coordinates change
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

  // 4. Smooth Coordinate Interpolation (LERP 60fps) & Bearing Rotation
  const animateMarkerToTarget = useCallback((target: Coordinates, targetBearing: number) => {
    if (!markersRef.current.shipper) return;

    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    const startLat = currentPosRef.current.lat;
    const startLng = currentPosRef.current.lng;
    const targetLat = target.lat;
    const targetLng = target.lng;

    const latDiff = Math.abs(targetLat - startLat);
    const lngDiff = Math.abs(targetLng - startLng);

    // If change is negligible, just set position directly
    if (latDiff < 0.000005 && lngDiff < 0.000005) {
      currentPosRef.current = target;
      markersRef.current.shipper.setPosition(new google.maps.LatLng(targetLat, targetLng));
      return;
    }

    const duration = 1400; // 1.4s smooth slide between GPS fixes
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);

      // easeInOutQuad
      const easedProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const currLat = startLat + (targetLat - startLat) * easedProgress;
      const currLng = startLng + (targetLng - startLng) * easedProgress;

      currentPosRef.current = { lat: currLat, lng: currLng };

      if (markersRef.current.shipper) {
        markersRef.current.shipper.setPosition(new google.maps.LatLng(currLat, currLng));
      }

      if (progress < 1) {
        animFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        currentPosRef.current = target;
        animFrameIdRef.current = null;
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    // Update rotated marker icon
    markersRef.current.shipper.setIcon({
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(getShipperSvg(targetBearing)),
      scaledSize: new google.maps.Size(46, 46),
      anchor: new google.maps.Point(23, 23),
    });
  }, []);

  // 5. Update Shipper Marker, Rotation and Dynamic ETA when live coords change
  useEffect(() => {
    // 5a. Calculate Bearing / Heading
    let effectiveBearing = 0;
    if (typeof driverLiveCoords?.heading === 'number' && driverLiveCoords.heading > 0) {
      effectiveBearing = driverLiveCoords.heading;
    } else {
      effectiveBearing = calculateBearing(
        currentPosRef.current.lat,
        currentPosRef.current.lng,
        validShipperCoords.lat,
        validShipperCoords.lng
      );
    }

    currentBearingRef.current = effectiveBearing;
    setCurrentBearingState(effectiveBearing);

    // 5b. Animate Marker on Map if ready
    if (isMapReady && mapInstanceRef.current && markersRef.current.shipper) {
      animateMarkerToTarget(validShipperCoords, effectiveBearing);
    }

    // 5c. Recalculate Live Remaining Distance & ETA
    const newDist = calculateHaversineDistance(
      validShipperCoords.lat,
      validShipperCoords.lng,
      activeMilestoneCoords.lat,
      activeMilestoneCoords.lng
    );
    setLiveDistanceKm(newDist);

    const calculatedSeconds = Math.max(30, Math.round((newDist / liveSpeedKmh) * 3600));
    setCountdownSeconds(calculatedSeconds);
  }, [validShipperCoords, driverLiveCoords, isMapReady, activeMilestoneCoords, liveSpeedKmh, animateMarkerToTarget]);

  // 6. Live ETA Countdown Ticker (decrements every 1 second)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) return 1; // Stay at 1 second minimum until arrived
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 7. Initialize Map Markers and Polylines
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || typeof google === 'undefined' || !google.maps) {
      return;
    }

    const map = mapInstanceRef.current;
    const bounds = new google.maps.LatLngBounds();

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

    // --- Create Shipper Marker ---
    const shipperPos = new google.maps.LatLng(validShipperCoords.lat, validShipperCoords.lng);
    bounds.extend(shipperPos);
    if (!markersRef.current.shipper) {
      markersRef.current.shipper = new google.maps.Marker({
        position: shipperPos,
        map,
        title: 'Tài xế (GPS Live)',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(getShipperSvg(currentBearingRef.current)),
          scaledSize: new google.maps.Size(46, 46),
          anchor: new google.maps.Point(23, 23),
        },
        zIndex: 999,
      });
    }

    // --- Create / Update Restaurant Marker ---
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

    // --- Create / Update Customer Marker ---
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

    // Auto-fit bounds on initial mount or route refresh
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { top: 40, right: 30, bottom: 40, left: 30 });
    }
  }, [isMapReady, routeData, isDelivering, validRestaurantCoords, validCustomerCoords, restaurantName, customerName, validShipperCoords]);

  // Cleanup on unmount
  useEffect(() => {
    const markers = markersRef.current;
    const polylines = polylinesRef.current;
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
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

            {/* Point 1: Shipper Pin (Live GPS with Bearing Rotation & Dynamic Position) */}
            <div
              className="absolute flex flex-col items-center z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
              style={{
                left: `${fallbackShipperPos.x}%`,
                top: `${fallbackShipperPos.y}%`,
              }}
            >
              <div
                className="relative transition-transform duration-700 ease-out"
                style={{
                  transform: `rotate(${currentBearingState}deg)`,
                }}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-emerald-500/20">
                  <CarOutlined className="text-sm" />
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                </span>
              </div>
              <span className="text-[9px] font-extrabold bg-slate-900/90 text-emerald-300 px-2 py-0.5 rounded-md mt-1 border border-emerald-500/40">
                Tài xế ({liveSpeedKmh} km/h)
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

      {/* 3. Bottom Metrics Bar - Chi tiết cả 3 chặng & Live ETA Countdown */}
      <div className="bg-slate-900/95 border-t border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Dynamic ETA Countdown to Next Destination */}
          <div className="bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-500/50 flex items-center gap-2 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
            <div>
              <span className="text-[10px] text-emerald-300/80 block font-medium">
                {isDelivering ? 'Dự kiến đến nơi' : 'Dự kiến tới quán'}
              </span>
              <span className="font-extrabold text-sm text-emerald-300">
                {formatLiveEta(countdownSeconds)} ({liveDistanceKm} km)
              </span>
            </div>
          </div>

          {/* Speed Indicator */}
          <div className="bg-slate-800/90 px-2.5 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5">
            <ThunderboltOutlined className="text-amber-400 text-xs" />
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Tốc độ xe</span>
              <span className="font-extrabold text-xs text-slate-100">
                {liveSpeedKmh} km/h
              </span>
            </div>
          </div>

          {/* Chặng 1 Info */}
          <div className={`px-2.5 py-1.5 rounded-xl border transition-all ${
            !isDelivering ? 'bg-amber-950/40 border-amber-500/50 text-amber-200' : 'bg-slate-800/80 border-slate-700 text-slate-300'
          }`}>
            <span className="text-[10px] text-slate-400 block font-medium">Chặng 1: Đến quán</span>
            <span className="font-extrabold text-xs">
              {routeData.leg1.distanceText} • ~{routeData.leg1.durationText}
            </span>
          </div>

          {/* Chặng 2 Info */}
          <div className={`px-2.5 py-1.5 rounded-xl border transition-all ${
            isDelivering ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 ring-2 ring-emerald-500/20' : 'bg-slate-800/80 border-slate-700 text-slate-300'
          }`}>
            <span className="text-[10px] text-slate-400 block font-medium">Chặng 2: Đến khách</span>
            <span className="font-extrabold text-xs">
              {routeData.leg2.distanceText} • ~{routeData.leg2.durationText}
            </span>
          </div>
        </div>

        <div className="text-right flex flex-col items-end">
          <span className="text-[11px] text-slate-300 font-medium block truncate max-w-[220px]">
            Giao đến: {customerAddress || 'Địa chỉ của bạn'}
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <Tag color={isDelivering ? 'processing' : 'default'} className="m-0 text-[10px] font-bold">
              {isDelivering ? 'Tài xế đang giao đến bạn' : isDriverAcceptedStage ? 'Tài xế đang đến quán' : 'Sẵn sàng theo dõi'}
            </Tag>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapRouteView;
