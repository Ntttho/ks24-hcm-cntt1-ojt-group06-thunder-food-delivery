import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet, useNavigate, useLocation, useOutletContext, Navigate } from 'react-router-dom';
import { Layout, message, Spin } from 'antd';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES } from '@/constants';
import { restaurantApi, type Shop } from '@/services/modules/restaurantApi';
import { MerchantOnboardingModal, MerchantOnboardingView } from '@/pages/merchant/components';
import { MerchantSider, MerchantNavbar } from './components';

const { Content } = Layout;

export interface MerchantContextType {
  restaurantId: number;
  activeRestaurant: Shop | null;
  restaurants: Shop[];
  refreshRestaurants: () => Promise<void>;
  setActiveRestaurant: (shop: Shop) => void;
}

export const useMerchantContext = () => useOutletContext<MerchantContextType>();

export const MerchantLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [restaurants, setRestaurants] = useState<Shop[]>([]);
  const [activeRestaurant, setActiveRestaurant] = useState<Shop | null>(null);
  const [loadingShops, setLoadingShops] = useState<boolean>(true);
  const [isAddShopModalOpen, setIsAddShopModalOpen] = useState<boolean>(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated, isMerchant, isAdmin } = useAuth();

  // Access control
  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.LOGIN} replace />;
  }

  if (!isMerchant && !isAdmin) {
    return <Navigate to={APP_ROUTES.HOME} replace />;
  }

  // Load all restaurants owned by this merchant
  const fetchMyRestaurants = useCallback(async () => {
    setLoadingShops(true);
    try {
      const res = await restaurantApi.getMyRestaurantsAll(Number(user?.id));
      const shops: Shop[] = Array.isArray(res.data) ? res.data : ((res.data as any)?.content || []);
      if (shops && shops.length > 0) {
        setRestaurants(shops);
        const savedId = localStorage.getItem('thunder_merchant_active_shop_id');
        const matched = savedId ? shops.find((s) => s.id === Number(savedId)) : null;
        const selected = matched || shops[0];
        setActiveRestaurant(selected);
        localStorage.setItem('thunder_merchant_active_shop_id', String(selected.id));
      } else {
        setRestaurants([]);
        setActiveRestaurant(null);
      }
    } catch {
      setRestaurants([]);
      setActiveRestaurant(null);
    } finally {
      setLoadingShops(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMyRestaurants();
  }, [fetchMyRestaurants]);

  // Handle switching active branch
  const handleSelectShop = (shop: Shop) => {
    setActiveRestaurant(shop);
    localStorage.setItem('thunder_merchant_active_shop_id', String(shop.id));
    message.info(`Đã chuyển sang quản lý chi nhánh: ${shop.name}`);
  };

  // Toggle restaurant open/close receiving orders
  const handleToggleShopStatus = async (checked: boolean) => {
    if (!activeRestaurant) return;
    try {
      await restaurantApi.updateRestaurantStatus(
        activeRestaurant.id,
        checked,
        checked ? undefined : 'Quán tạm nghỉ'
      );
      const updated = { ...activeRestaurant, isOpen: checked };
      setActiveRestaurant(updated);
      setRestaurants((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      message.success(checked ? 'Đã bật nhận đơn (Quán đang mở cửa)' : 'Đã chuyển sang tạm dừng nhận đơn');
    } catch {
      message.info(checked ? 'Chế độ: Đang mở cửa nhận đơn' : 'Chế độ: Tạm nghỉ nhận đơn');
    }
  };

  const handleLogout = () => {
    logout();
    message.success('Đã đăng xuất khỏi Merchant Portal');
    navigate(APP_ROUTES.LOGIN);
  };

  const handleOnboardingSuccess = (newShop: Shop) => {
    setRestaurants((prev) => [newShop, ...prev]);
    setActiveRestaurant(newShop);
    localStorage.setItem('thunder_merchant_active_shop_id', String(newShop.id));
    setIsAddShopModalOpen(false);
  };

  const selectedKey = useMemo(() => {
    if (location.pathname.includes('/merchant/toppings')) return '/merchant/toppings';
    if (location.pathname.includes('/merchant/categories')) return '/merchant/categories';
    if (location.pathname.includes('/merchant/vouchers')) return '/merchant/vouchers';
    if (location.pathname.includes('/merchant/menu')) return '/merchant/menu';
    return '/merchant';
  }, [location.pathname]);

  const isOpen = activeRestaurant ? activeRestaurant.isOpen !== false : true;

  return (
    <Layout className="min-h-screen bg-gray-50/50" hasSider>
      {/* 1. Sider Sidebar Component */}
      <MerchantSider
        collapsed={collapsed}
        onCollapse={setCollapsed}
        activeRestaurant={activeRestaurant}
        hasRestaurants={restaurants.length > 0}
        isOpen={isOpen}
        onToggleShopStatus={handleToggleShopStatus}
        selectedKey={selectedKey}
        onNavigate={(path) => navigate(path)}
      />

      {/* 2. Main Area (Navbar + Content) */}
      <Layout className="min-w-0 bg-gray-50/50">
        {/* Top Navbar Header Component */}
        <MerchantNavbar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          activeRestaurant={activeRestaurant}
          restaurants={restaurants}
          isOpen={isOpen}
          onSelectShop={handleSelectShop}
          onOpenAddShopModal={() => setIsAddShopModalOpen(true)}
          user={user}
          onLogout={handleLogout}
        />

        {/* Content Body */}
        <Content className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {loadingShops ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
              <Spin size="large" />
              <span className="text-gray-400 text-sm font-medium">
                Đang tải dữ liệu quán ăn của bạn...
              </span>
            </div>
          ) : restaurants.length === 0 ? (
            <MerchantOnboardingView onSuccess={handleOnboardingSuccess} />
          ) : (
            <Outlet
              context={{
                restaurantId: activeRestaurant?.id || restaurants[0]?.id || 1,
                activeRestaurant: activeRestaurant || restaurants[0] || null,
                restaurants,
                refreshRestaurants: fetchMyRestaurants,
                setActiveRestaurant: handleSelectShop,
              }}
            />
          )}
        </Content>
      </Layout>

      {/* 3. Modal: Add New Branch */}
      <MerchantOnboardingModal
        open={isAddShopModalOpen}
        onClose={() => setIsAddShopModalOpen(false)}
        onSuccess={handleOnboardingSuccess}
        title="Đăng ký thêm Chi nhánh Quán mới"
        isFirstShop={false}
      />
    </Layout>
  );
};

export default MerchantLayout;
