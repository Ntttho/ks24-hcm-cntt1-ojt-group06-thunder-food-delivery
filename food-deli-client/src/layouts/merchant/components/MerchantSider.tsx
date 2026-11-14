// sider bên trái trang merchant điều hướng qua các trang quản lý

import React from 'react';
import { Layout, Menu, Switch, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  InboxOutlined,
  AppstoreOutlined,
  TagsOutlined,
  ThunderboltFilled,
  FolderOutlined,
  GiftOutlined,
  MessageOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import type { Shop } from '@/services/modules/restaurantApi';

const { Sider } = Layout;

interface MerchantSiderProps {
  collapsed: boolean;
  onCollapse: (val: boolean) => void;
  activeRestaurant: Shop | null;
  hasRestaurants: boolean;
  isOpen: boolean;
  onToggleShopStatus: (checked: boolean) => void;
  selectedKey: string;
  onNavigate: (path: string) => void;
}

export const MerchantSider: React.FC<MerchantSiderProps> = ({
  collapsed,
  onCollapse,
  activeRestaurant,
  hasRestaurants,
  isOpen,
  onToggleShopStatus,
  selectedKey,
  onNavigate,
}) => {
  const siderMenuItems: MenuProps['items'] = [
    {
      key: '/merchant',
      icon: <InboxOutlined className="text-lg" />,
      label: <span className="font-semibold text-sm">Tiếp nhận đơn hàng</span>,
      onClick: () => onNavigate('/merchant'),
    },
    {
      key: '/merchant/revenue',
      icon: <BarChartOutlined className="text-lg" />,
      label: <span className="font-semibold text-sm">Báo cáo doanh thu</span>,
      onClick: () => onNavigate('/merchant/revenue'),
    },
    {
      key: '/merchant/menu',
      icon: <AppstoreOutlined className="text-lg" />,
      label: <span className="font-semibold text-sm">Quản lý thực đơn</span>,
      onClick: () => onNavigate('/merchant/menu'),
    },
    {
      key: '/merchant/categories',
      icon: <FolderOutlined className="text-lg" />,
      label: <span className="font-semibold text-sm">Quản lý Danh mục</span>,
      onClick: () => onNavigate('/merchant/categories'),
    },
    {
      key: '/merchant/toppings',
      icon: <TagsOutlined className="text-lg" />,
      label: <span className="font-semibold text-sm">Quản lý Topping</span>,
      onClick: () => onNavigate('/merchant/toppings'),
    },
    {
      key: '/merchant/vouchers',
      icon: <GiftOutlined className="text-lg" />,
      label: <span className="font-semibold text-sm">Khuyến mãi & Voucher</span>,
      onClick: () => onNavigate('/merchant/vouchers'),
    },
    {
      key: '/merchant/reviews',
      icon: <MessageOutlined className="text-lg" />,
      label: <span className="font-semibold text-sm">Quản lý Đánh giá</span>,
      onClick: () => onNavigate('/merchant/reviews'),
    },
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      trigger={null}
      width={256}
      collapsedWidth={80}
      theme="light"
      className="border-r border-gray-100 shadow-2xs sticky top-0 h-screen overflow-y-auto shrink-0 z-30 bg-white"
    >
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-4 border-b border-gray-100 gap-3">
        <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-xs shrink-0">
          <ThunderboltFilled className="text-xl" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden leading-tight">
            <span className="font-extrabold text-base tracking-tight text-gray-900 block truncate">
              THUNDER<span className="text-orange-500">FOOD</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600 block">
              Merchant Portal
            </span>
          </div>
        )}
      </div>

      {/* Quick Restaurant Status Card */}
      {activeRestaurant && (
        <div className="p-3">
          {!collapsed ? (
            <div className={`p-3 rounded-2xl border space-y-2 ${
              activeRestaurant.approvalStatus === 'PENDING'
                ? 'bg-amber-50/60 border-amber-200'
                : activeRestaurant.approvalStatus === 'REJECTED'
                ? 'bg-rose-50/60 border-rose-200'
                : 'bg-orange-50/60 border-orange-100'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">Trạng thái quán:</span>
                <Tooltip
                  title={
                    activeRestaurant.approvalStatus === 'PENDING'
                      ? 'Quán ăn đang chờ Ban quản trị duyệt'
                      : activeRestaurant.approvalStatus === 'REJECTED'
                      ? 'Quán ăn bị từ chối phê duyệt'
                      : 'Bật / Tắt nhận đơn'
                  }
                >
                  <Switch
                    checked={isOpen && activeRestaurant.approvalStatus === 'APPROVED'}
                    onChange={onToggleShopStatus}
                    disabled={activeRestaurant.approvalStatus !== 'APPROVED'}
                    checkedChildren="Mở"
                    unCheckedChildren="Đóng"
                    size="small"
                    style={{ backgroundColor: (isOpen && activeRestaurant.approvalStatus === 'APPROVED') ? '#10b981' : undefined }}
                  />
                </Tooltip>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${
                    activeRestaurant.approvalStatus === 'PENDING'
                      ? 'bg-amber-500 animate-pulse'
                      : activeRestaurant.approvalStatus === 'REJECTED'
                      ? 'bg-rose-500'
                      : isOpen
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-gray-400'
                  }`}
                />
                <span
                  className={`font-bold truncate text-[11px] ${
                    activeRestaurant.approvalStatus === 'PENDING'
                      ? 'text-amber-700'
                      : activeRestaurant.approvalStatus === 'REJECTED'
                      ? 'text-rose-700'
                      : isOpen
                      ? 'text-emerald-700'
                      : 'text-gray-500'
                  }`}
                >
                  {activeRestaurant.approvalStatus === 'PENDING'
                    ? 'Chờ duyệt phê duyệt'
                    : activeRestaurant.approvalStatus === 'REJECTED'
                    ? 'Bị từ chối'
                    : isOpen
                    ? 'Đang mở cửa nhận đơn'
                    : 'Tạm dừng nhận đơn'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <span
                title={
                  activeRestaurant.approvalStatus === 'PENDING'
                    ? 'Chờ duyệt'
                    : isOpen
                    ? 'Đang mở cửa'
                    : 'Tạm đóng'
                }
                className={`w-3.5 h-3.5 rounded-full ${
                  activeRestaurant.approvalStatus === 'PENDING'
                    ? 'bg-amber-500 animate-pulse'
                    : isOpen
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-gray-300'
                }`}
              />
            </div>
          )}
        </div>
      )}

      {/* Navigation Menu */}
      <div className="px-2 py-1">
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={siderMenuItems}
          className="border-none font-medium"
          disabled={!hasRestaurants}
        />
      </div>
    </Sider>
  );
};

export default MerchantSider;

