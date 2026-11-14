import React from 'react';
import { Tag } from 'antd';
import {
  CompassOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  CarOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useDriverSimulation } from '@/hooks/useDriverSimulation';
import { calculateHaversineDistance } from '@/utils/geoUtils';

interface GoogleMapRouteViewProps {
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantLat?: number | null;
  restaurantLng?: number | null;
  customerName?: string;
  customerAddress?: string;
  customerLat?: number | null;
  customerLng?: number | null;
  isDelivering?: boolean;
  orderCode?: string;
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
  isDelivering = false,
  orderCode,
}) => {
  const { currentDriverLocation, remainingDistanceKm, remainingMinutes, progressPercent, isArrived } =
    useDriverSimulation({
      restaurantLat,
      restaurantLng,
      receiverLat: customerLat,
      receiverLng: customerLng,
      isDelivering,
    });

  const totalDistance = calculateHaversineDistance(
    restaurantLat,
    restaurantLng,
    customerLat,
    customerLng
  );

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    restaurantAddress || `${restaurantLat || 10.7769},${restaurantLng || 106.7009}`
  )}&destination=${encodeURIComponent(
    customerAddress || `${customerLat || 10.7925},${customerLng || 106.7214}`
  )}&travelmode=two_wheeler`;

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 text-white shadow-lg">
      {/* 1. Header Toolbar Overlay */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-700/60 flex items-center gap-2 shadow-md pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-bold tracking-tight text-slate-100">
            {isDelivering ? (isArrived ? 'Tài xế đã đến nơi' : 'Tài xế đang trên đường giao') : 'Lộ trình đơn hàng'}
          </span>
          {orderCode && <span className="text-[10px] text-slate-400">#{orderCode}</span>}
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-white/90 hover:bg-white text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-2xl shadow-md border border-slate-200 transition-all active:scale-95 pointer-events-auto flex items-center gap-1"
        >
          <CompassOutlined className="text-orange-500" />
          <span>Mở Google Maps</span>
          <RightOutlined className="text-[9px]" />
        </a>
      </div>

      {/* 2. Interactive SVG Map Canvas */}
      <div className="relative w-full h-[280px] sm:h-[320px] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center overflow-hidden">
        {/* Subtle Map Grid lines */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

        {/* SVG Route Visualization */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {/* Route path */}
          <path
            d="M 18,70 Q 50,30 82,30"
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="2.5"
            strokeDasharray="4 2"
            strokeLinecap="round"
            className="animate-pulse"
          />
        </svg>

        {/* Restaurant Pin */}
        <div className="absolute left-[14%] bottom-[25%] flex flex-col items-center z-10">
          <div className="bg-orange-500 text-white p-2.5 rounded-2xl shadow-lg border-2 border-white ring-4 ring-orange-500/20 animate-bounce">
            <ShopOutlined className="text-base" />
          </div>
          <span className="text-[10px] font-extrabold bg-slate-900/90 text-orange-300 px-2 py-0.5 rounded-md mt-1 shadow-xs truncate max-w-[110px]">
            {restaurantName}
          </span>
        </div>

        {/* Customer Pin */}
        <div className="absolute right-[14%] top-[20%] flex flex-col items-center z-10">
          <div className="bg-cyan-500 text-white p-2.5 rounded-2xl shadow-lg border-2 border-white ring-4 ring-cyan-500/20">
            <EnvironmentOutlined className="text-base" />
          </div>
          <span className="text-[10px] font-extrabold bg-slate-900/90 text-cyan-300 px-2 py-0.5 rounded-md mt-1 shadow-xs truncate max-w-[110px]">
            {customerName}
          </span>
        </div>

        {/* Moving Driver Marker */}
        <div
          className="absolute z-20 flex flex-col items-center transition-all duration-1000 ease-linear"
          style={{
            left: `${18 + (progressPercent / 100) * 64}%`,
            top: `${70 - Math.sin((progressPercent / 100) * Math.PI) * 40 - (progressPercent / 100) * 0}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl border-2 border-white ring-4 ring-emerald-500/30">
              <CarOutlined className="text-lg animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            </span>
          </div>
          <span className="text-[9px] font-extrabold bg-emerald-950/90 text-emerald-300 px-2 py-0.5 rounded-md mt-1 border border-emerald-500/40">
            Tài xế ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* 3. Bottom Metrics Bar */}
      <div className="bg-slate-900/95 border-t border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 text-[10px] block">Khoảng cách thực tế</span>
            <span className="text-slate-100 font-extrabold text-sm">
              {isDelivering ? `${remainingDistanceKm} km` : `${totalDistance} km`}
            </span>
          </div>

          <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 text-[10px] block">Dự kiến giao</span>
            <span className="text-emerald-400 font-extrabold text-sm">
              ~ {isDelivering ? remainingMinutes : Math.round(totalDistance * 3.5 + 10)} phút
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">
            Đến: {customerAddress || 'Địa chỉ giao hàng của bạn'}
          </span>
          <Tag color={isDelivering ? 'processing' : 'default'} className="mt-0.5 m-0 text-[10px] font-bold">
            {isDelivering ? 'Đang tịnh tiến trực tiếp' : 'Sẵn sàng theo dõi'}
          </Tag>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapRouteView;

