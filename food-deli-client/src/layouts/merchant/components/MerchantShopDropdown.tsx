import React from 'react';
import { Dropdown, Tag } from 'antd';
import type { MenuProps } from 'antd';
import {
  ShopOutlined,
  CheckOutlined,
  PlusCircleOutlined,
  DownOutlined,
} from '@ant-design/icons';
import type { Shop } from '@/services/modules/restaurantApi';

interface MerchantShopDropdownProps {
  activeRestaurant: Shop | null;
  restaurants: Shop[];
  isOpen: boolean;
  onSelectShop: (shop: Shop) => void;
  onOpenAddShopModal: () => void;
}

export const MerchantShopDropdown: React.FC<MerchantShopDropdownProps> = ({
  activeRestaurant,
  restaurants,
  isOpen,
  onSelectShop,
  onOpenAddShopModal,
}) => {
  if (!activeRestaurant) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <ShopOutlined className="text-orange-500 shrink-0" />
        <span className="font-semibold">Chưa có quán ăn</span>
      </div>
    );
  }

  const shopMenuItems: MenuProps['items'] = [
    ...restaurants.map((shop) => ({
      key: `shop-${shop.id}`,
      icon: <ShopOutlined className="text-orange-500 text-base" />,
      label: (
        <div className="flex items-center justify-between gap-3 py-1.5 min-w-[240px]">
          <div className="flex flex-col min-w-0 max-w-[200px]">
            <span className="font-bold text-gray-800 text-xs truncate">{shop.name}</span>
            <span className="text-[11px] text-gray-400 truncate">{shop.address}</span>
          </div>
          {Number(activeRestaurant?.id) === Number(shop.id) && (
            <CheckOutlined className="text-orange-500 font-extrabold ml-2 shrink-0" />
          )}
        </div>
      ),
      onClick: () => onSelectShop(shop),
    })),
    { type: 'divider' },
    {
      key: 'add-shop',
      icon: <PlusCircleOutlined className="text-orange-600 text-base" />,
      label: (
        <span className="font-bold text-orange-600 text-xs py-1 inline-block">
          + Đăng ký thêm chi nhánh mới
        </span>
      ),
      onClick: onOpenAddShopModal,
    },
  ];

  return (
    <Dropdown menu={{ items: shopMenuItems }} trigger={['click']} placement="bottomLeft">
      <div className="flex items-center gap-2.5 cursor-pointer py-1.5 px-3 rounded-xl hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all min-w-0 shadow-2xs">
        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-base shrink-0 font-bold">
          <ShopOutlined />
        </div>

        <div className="text-left leading-tight min-w-0">
          <span className="font-extrabold text-gray-900 text-xs sm:text-sm block truncate max-w-[140px] sm:max-w-[200px] md:max-w-[240px]">
            {activeRestaurant.name}
          </span>
          <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
            <span>Chi nhánh #{activeRestaurant.id}</span>
            <span>•</span>
            <span>{restaurants.length} quán</span>
            <DownOutlined className="text-[9px]" />
          </span>
        </div>

        <Tag
          color={isOpen ? 'success' : 'default'}
          className="ml-1 text-[11px] font-bold shrink-0 rounded-md"
        >
          {isOpen ? 'Đang mở cửa' : 'Tạm nghỉ'}
        </Tag>
      </div>
    </Dropdown>
  );
};

export default MerchantShopDropdown;

