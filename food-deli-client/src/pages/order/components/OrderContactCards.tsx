import React from 'react';
import { Link } from 'react-router-dom';
import {
  CarOutlined,
  PhoneOutlined,
  ShopOutlined,
  MessageOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { Button, Tag } from 'antd';

interface OrderContactCardsProps {
  driverName?: string;
  driverPhone?: string;
  restaurantId: number;
  restaurantName?: string;
  distanceKm?: number;
  statusCode?: string;
  onOpenChat?: () => void;
}

const DRIVER_ASSIGNED_STATUSES = [
  'DRIVER_ACCEPTED',
  'PICKING_UP',
  'READY_FOR_PICKUP',
  'PICKED_UP',
  'DELIVERING',
  'DELIVERED',
  'COMPLETED',
];

export const OrderContactCards: React.FC<OrderContactCardsProps> = ({
  driverName,
  driverPhone,
  restaurantId,
  restaurantName,
  distanceKm = 2.1,
  statusCode = 'PENDING',
  onOpenChat,
}) => {
  const isDriverAssigned =
    DRIVER_ASSIGNED_STATUSES.includes(statusCode) && Boolean(driverName);

  const isCompletedWithoutDriver =
    (statusCode === 'DELIVERED' || statusCode === 'COMPLETED') && !driverName;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
      {/* Driver Card */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
        {isDriverAssigned ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl shrink-0 shadow-xs">
                <CarOutlined />
              </div>
              <div>
                <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                  <span>Tài xế phụ trách</span>
                  <Tag color="cyan" className="text-[10px] py-0 px-1 font-semibold rounded-md">
                    Đã nhận đơn
                  </Tag>
                </div>
                <div className="font-bold text-gray-900 text-sm">
                  {driverName || 'Nguyễn Tuấn Tài (Tài xế Thunder)'}
                </div>
                <div className="text-xs text-gray-500">
                  {driverPhone ? `SĐT: ${driverPhone}` : 'Xe máy • 59-P1 888.99'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenChat && (
                <Button
                  size="small"
                  icon={<MessageOutlined />}
                  onClick={onOpenChat}
                  className="rounded-xl font-bold text-xs bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  Nhắn tin
                </Button>
              )}
              {driverPhone && (
                <a
                  href={`tel:${driverPhone}`}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs"
                >
                  <PhoneOutlined /> Gọi
                </a>
              )}
            </div>
          </>
        ) : isCompletedWithoutDriver ? (
          <div className="flex items-center gap-3 w-full">
            <div className="w-11 h-11 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center text-xl shrink-0">
              <CheckCircleOutlined />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Vận chuyển đơn hàng
              </div>
              <div className="font-semibold text-gray-700 text-sm">
                Giao nhận trực tiếp tại quán
              </div>
              <div className="text-xs text-gray-400">
                Đơn hoàn tất không qua trung gian tài xế
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 w-full">
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl shrink-0">
              <LoadingOutlined spin />
            </div>
            <div>
              <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                Tìm kiếm tài xế
              </div>
              <div className="font-semibold text-gray-800 text-sm">
                Đang kết nối tài xế gần bạn nhất...
              </div>
              <div className="text-xs text-gray-400">
                Thông tin tài xế sẽ hiển thị ngay khi nhận đơn
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Restaurant Card */}
      <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-500 text-white flex items-center justify-center text-xl shrink-0 shadow-xs">
            <ShopOutlined />
          </div>
          <div>
            <div className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">
              Quán ăn
            </div>
            <div className="font-bold text-gray-900 text-sm truncate max-w-[200px]">
              {restaurantName}
            </div>
            <div className="text-xs text-gray-500">Khoảng cách: ~{distanceKm} km</div>
          </div>
        </div>
        <Link
          to={`/restaurants/${restaurantId}`}
          className="px-3 py-1.5 bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs"
        >
          Xem quán
        </Link>
      </div>
    </div>
  );
};

export default OrderContactCards;
