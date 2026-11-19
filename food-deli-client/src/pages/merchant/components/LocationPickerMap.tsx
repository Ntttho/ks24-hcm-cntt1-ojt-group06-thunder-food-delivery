import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button, InputNumber, Tag, message } from 'antd';
import {
  CompassOutlined,
  EnvironmentOutlined,
  AimOutlined,
  CheckCircleFilled,
  GlobalOutlined,
} from '@ant-design/icons';
import { TILE_PROVIDERS, createRestaurantDivIcon } from '@/services/map/realMapService';

export interface LocationPickerMapProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
}

const CITY_PRESETS = [
  { name: 'TP. Hồ Chí Minh', lat: 10.7769, lng: 106.7009 },
  { name: 'Hà Nội', lat: 21.0285, lng: 105.8542 },
  { name: 'Đà Nẵng', lat: 16.0544, lng: 108.2022 },
  { name: 'Cần Thơ', lat: 10.0452, lng: 105.7469 },
  { name: 'Quy Nhơn', lat: 13.7820, lng: 109.2190 },
];

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  latitude = 10.7769,
  longitude = 106.7009,
  address: _address,
  onLocationChange,
}) => {
  const [loadingGps, setLoadingGps] = useState<boolean>(false);
  const [currentLat, setCurrentLat] = useState<number>(latitude);
  const [currentLng, setCurrentLng] = useState<number>(longitude);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Sync internal state when props change
  useEffect(() => {
    if (latitude && longitude && (latitude !== currentLat || longitude !== currentLng)) {
      setCurrentLat(latitude);
      setCurrentLng(longitude);
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([latitude, longitude], mapInstanceRef.current.getZoom() || 16);
      }
    }
  }, [latitude, longitude]);

  // Reverse geocoding to address from coordinates using OpenStreetMap Nominatim
  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`
      );
      if (response.ok) {
        const data = await response.json();
        return data.display_name || null;
      }
    } catch {
      // Ignore network errors on reverse geocoding
    }
    return null;
  };

  // Initialize interactive Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: 16,
      zoomControl: true,
      attributionControl: false,
    });

    const tileCfg = TILE_PROVIDERS.googleRoadmap;
    L.tileLayer(tileCfg.url, {
      subdomains: tileCfg.subdomains,
      maxZoom: tileCfg.maxZoom,
    }).addTo(map);

    const marker = L.marker([currentLat, currentLng], {
      icon: createRestaurantDivIcon('Vị trí quán'),
      draggable: true,
    }).addTo(map);

    marker.on('dragend', async () => {
      const pos = marker.getLatLng();
      const newLat = Number(pos.lat.toFixed(6));
      const newLng = Number(pos.lng.toFixed(6));
      setCurrentLat(newLat);
      setCurrentLng(newLng);
      const fetchedAddress = await reverseGeocode(newLat, newLng);
      onLocationChange(newLat, newLng, fetchedAddress || undefined);
    });

    map.on('click', async (e: L.LeafletMouseEvent) => {
      const newLat = Number(e.latlng.lat.toFixed(6));
      const newLng = Number(e.latlng.lng.toFixed(6));
      marker.setLatLng([newLat, newLng]);
      setCurrentLat(newLat);
      setCurrentLng(newLng);
      const fetchedAddress = await reverseGeocode(newLat, newLng);
      onLocationChange(newLat, newLng, fetchedAddress || undefined);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map & marker when coordinates change
  const applyCoordinates = async (lat: number, lng: number) => {
    setCurrentLat(lat);
    setCurrentLng(lng);
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16);
    }
    const fetchedAddress = await reverseGeocode(lat, lng);
    onLocationChange(lat, lng, fetchedAddress || undefined);
  };

  // Get Current GPS Location
  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      message.error('Trình duyệt của bạn không hỗ trợ định vị GPS!');
      return;
    }

    setLoadingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        await applyCoordinates(lat, lng);
        setLoadingGps(false);
        message.success('Đã lấy vị trí GPS thành công và tự động điền tọa độ!');
      },
      () => {
        setLoadingGps(false);
        message.warning(
          'Không thể lấy vị trí GPS tự động (vui lòng cấp quyền định vị hoặc nhấp chọn trên bản đồ).'
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleCityPreset = async (preset: { name: string; lat: number; lng: number }) => {
    await applyCoordinates(preset.lat, preset.lng);
    message.info(`Đã chọn tọa độ khu vực: ${preset.name}`);
  };

  const handleLatChange = (val: number | null) => {
    if (val !== null) {
      setCurrentLat(val);
      if (markerRef.current) {
        markerRef.current.setLatLng([val, currentLng]);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([val, currentLng]);
      }
      onLocationChange(val, currentLng);
    }
  };

  const handleLngChange = (val: number | null) => {
    if (val !== null) {
      setCurrentLng(val);
      if (markerRef.current) {
        markerRef.current.setLatLng([currentLat, val]);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([currentLat, val]);
      }
      onLocationChange(currentLat, val);
    }
  };

  return (
    <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
      {/* Header & GPS button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs uppercase tracking-wide">
          <EnvironmentOutlined className="text-orange-500 text-sm" />
          <span>Tọa độ vị trí & Bản đồ định vị Google Map (Leaflet)</span>
        </div>

        <Button
          type="primary"
          size="middle"
          icon={<AimOutlined />}
          loading={loadingGps}
          onClick={handleGetGpsLocation}
          className="bg-emerald-600 hover:bg-emerald-500 border-none rounded-xl text-xs font-bold shadow-xs text-white"
        >
          Lấy vị trí GPS hiện tại
        </Button>
      </div>

      {/* Lat/Long Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold text-slate-600 mb-1 block">
            Vĩ độ (Latitude):
          </label>
          <InputNumber
            value={currentLat}
            onChange={handleLatChange}
            step={0.0001}
            precision={6}
            className="w-full rounded-xl"
            prefix={<CompassOutlined className="text-orange-500 mr-1" />}
            placeholder="10.776900"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-600 mb-1 block">
            Kinh độ (Longitude):
          </label>
          <InputNumber
            value={currentLng}
            onChange={handleLngChange}
            step={0.0001}
            precision={6}
            className="w-full rounded-xl"
            prefix={<CompassOutlined className="text-orange-500 mr-1" />}
            placeholder="106.700900"
          />
        </div>
      </div>

      {/* City Presets Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] font-semibold text-slate-500 mr-1">Khu vực nhanh:</span>
        {CITY_PRESETS.map((city) => (
          <Tag
            key={city.name}
            onClick={() => handleCityPreset(city)}
            className="cursor-pointer rounded-lg text-xs py-0.5 px-2 hover:border-orange-500 hover:text-orange-600 bg-white"
          >
            {city.name}
          </Tag>
        ))}
      </div>

      {/* Interactive Map Visual Preview with Leaflet Click-to-Pin */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-2xs h-64 bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
        <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-700 shadow-2xs flex items-center gap-1 z-10 pointer-events-none">
          <CheckCircleFilled className="text-emerald-500" />
          <span>Vị trí: {currentLat}, {currentLng}</span>
        </div>
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-slate-500 font-medium z-10 pointer-events-none">
          Nhấp hoặc kéo ghim để đổi vị trí
        </div>
      </div>

      <div className="text-[11px] text-slate-500 flex items-center gap-1">
        <GlobalOutlined className="text-slate-400" />
        <span>
          Bạn có thể nhấp trực tiếp lên bản đồ hoặc kéo ghim để định vị chính xác vị trí quán ăn.
        </span>
      </div>
    </div>
  );
};

export default LocationPickerMap;
