import React, { useState } from 'react';
import { Button, Input, InputNumber, Space, Tag, message, Tooltip } from 'antd';
import {
  CompassOutlined,
  EnvironmentOutlined,
  AimOutlined,
  CheckCircleFilled,
  GlobalOutlined,
} from '@ant-design/icons';

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
  address,
  onLocationChange,
}) => {
  const [loadingGps, setLoadingGps] = useState<boolean>(false);
  const [currentLat, setCurrentLat] = useState<number>(latitude);
  const [currentLng, setCurrentLng] = useState<number>(longitude);

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
        setCurrentLat(lat);
        setCurrentLng(lng);

        const fetchedAddress = await reverseGeocode(lat, lng);
        onLocationChange(lat, lng, fetchedAddress || undefined);
        setLoadingGps(false);
        message.success('Đã lấy vị trí GPS thành công và tự động điền tọa độ!');
      },
      (error) => {
        setLoadingGps(false);
        message.warning(
          'Không thể lấy vị trí GPS tự động (vui lòng cấp quyền định vị hoặc chọn trên bản đồ).'
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleCityPreset = async (preset: { name: string; lat: number; lng: number }) => {
    setCurrentLat(preset.lat);
    setCurrentLng(preset.lng);
    const fetchedAddress = await reverseGeocode(preset.lat, preset.lng);
    onLocationChange(preset.lat, preset.lng, fetchedAddress || undefined);
    message.info(`Đã chọn tọa độ khu vực: ${preset.name}`);
  };

  const handleLatChange = (val: number | null) => {
    if (val !== null) {
      setCurrentLat(val);
      onLocationChange(val, currentLng);
    }
  };

  const handleLngChange = (val: number | null) => {
    if (val !== null) {
      setCurrentLng(val);
      onLocationChange(currentLat, val);
    }
  };

  // Map Embed URL
  const mapEmbedUrl = `https://maps.google.com/maps?q=${currentLat},${currentLng}&hl=vi&z=16&output=embed`;

  return (
    <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
      {/* Header & GPS button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs uppercase tracking-wide">
          <EnvironmentOutlined className="text-orange-500 text-sm" />
          <span>Tọa độ vị trí & Bản đồ định vị Google Map</span>
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

      {/* Interactive Map Visual Preview */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-2xs h-56 bg-slate-100">
        <iframe
          title="Restaurant Google Map View"
          src={mapEmbedUrl}
          className="w-full h-full border-none"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-700 shadow-2xs flex items-center gap-1">
          <CheckCircleFilled className="text-emerald-500" />
          <span>Vị trí: {currentLat}, {currentLng}</span>
        </div>
      </div>

      <div className="text-[11px] text-slate-500 flex items-center gap-1">
        <GlobalOutlined className="text-slate-400" />
        <span>
          Tọa độ chính xác giúp tính khoảng cách giao hàng và chỉ đường cho Tài xế nhận đơn.
        </span>
      </div>
    </div>
  );
};

export default LocationPickerMap;

