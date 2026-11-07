import React from 'react';
import { Layout, Button } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import type { Shop } from '@/services/modules/restaurantApi';
import { MerchantShopDropdown } from './MerchantShopDropdown';
import { MerchantUserDropdown } from './MerchantUserDropdown';

const { Header } = Layout;

interface MerchantNavbarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeRestaurant: Shop | null;
  restaurants: Shop[];
  isOpen: boolean;
  onSelectShop: (shop: Shop) => void;
  onOpenAddShopModal: () => void;
  user: any;
  onLogout: () => void;
}

export const MerchantNavbar: React.FC<MerchantNavbarProps> = ({
  collapsed,
  onToggleCollapse,
  activeRestaurant,
  restaurants,
  isOpen,
  onSelectShop,
  onOpenAddShopModal,
  user,
  onLogout,
}) => {
  return (
    <Header style={{ background: '#fff' }} className="h-16 px-4 sm:px-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      {/* Left side: Collapse Button & Shop Selector */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleCollapse}
          className="text-gray-600 hover:text-orange-500 text-lg shrink-0 rounded-xl w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
        />

        <MerchantShopDropdown
          activeRestaurant={activeRestaurant}
          restaurants={restaurants}
          isOpen={isOpen}
          onSelectShop={onSelectShop}
          onOpenAddShopModal={onOpenAddShopModal}
        />
      </div>

      {/* Right side: Add Branch Button & User Menu */}
      <div className="flex items-center gap-3 shrink-0">
        {restaurants.length > 0 && (
          <Button
            type="dashed"
            icon={<PlusCircleOutlined />}
            onClick={onOpenAddShopModal}
            className="hidden sm:inline-flex rounded-xl text-xs font-bold text-orange-600 border-orange-200 hover:border-orange-500 hover:text-orange-700 bg-orange-50/50 hover:bg-orange-50 h-9"
          >
            + Thêm quán
          </Button>
        )}

        <MerchantUserDropdown user={user} onLogout={onLogout} />
      </div>
    </Header>
  );
};

export default MerchantNavbar;

