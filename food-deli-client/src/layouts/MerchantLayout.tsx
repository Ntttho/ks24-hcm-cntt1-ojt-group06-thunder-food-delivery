import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation, Link, useOutletContext, Navigate } from 'react-router-dom';
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Switch,
  Tag,
  Typography,
  message,
  Spin,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  InboxOutlined,
  AppstoreOutlined,
  ShopOutlined,
  LogoutOutlined,
  HomeOutlined,
  UserOutlined,
  ThunderboltFilled,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TagsOutlined,
  PlusCircleOutlined,
  DownOutlined,
  CheckOutlined,
  FolderOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES } from '@/constants';
import { restaurantApi, type Shop } from '@/services/modules/restaurantApi';
import { MerchantOnboardingModal, MerchantOnboardingView } from '@/pages/merchant/components';

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

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

  // Defense-in-depth: Ngăn chặn tuyệt đối người dùng không phải Quán ăn hoặc Admin
  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.LOGIN} replace />;
  }

  if (!isMerchant && !isAdmin) {
    return <Navigate to={APP_ROUTES.HOME} replace />;
  }

  // Load restaurants owned by current user
  const fetchMyRestaurants = useCallback(async () => {
    setLoadingShops(true);
    try {
      const res = await restaurantApi.getMyRestaurants(Number(user?.id));
      if (res && res.data && res.data.length > 0) {
        setRestaurants(res.data);
        const savedId = localStorage.getItem('thunder_merchant_active_shop_id');
        const matched = savedId ? res.data.find((s) => s.id === Number(savedId)) : null;
        const selected = matched || res.data[0];
        setActiveRestaurant(selected);
        localStorage.setItem('thunder_merchant_active_shop_id', String(selected.id));
      } else {
        setRestaurants([]);
        setActiveRestaurant(null);
      }
    } catch {
      // If error or unauthenticated, fallback to empty or initial check
      setRestaurants([]);
      setActiveRestaurant(null);
    } finally {
      setLoadingShops(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMyRestaurants();
  }, [fetchMyRestaurants]);

  // Handle shop switch (Multi-shops)
  const handleSelectShop = (shop: Shop) => {
    setActiveRestaurant(shop);
    localStorage.setItem('thunder_merchant_active_shop_id', String(shop.id));
    message.info(`Đã chuyển sang quản lý quán: ${shop.name}`);
  };

  // Toggle open/close status
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
    message.success('Đã đăng xuất');
    navigate(APP_ROUTES.LOGIN);
  };

  const handleOnboardingSuccess = (newShop: Shop) => {
    setRestaurants((prev) => [newShop, ...prev]);
    setActiveRestaurant(newShop);
    localStorage.setItem('thunder_merchant_active_shop_id', String(newShop.id));
    setIsAddShopModalOpen(false);
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: <Link to={APP_ROUTES.HOME}>Trang chủ đặt món</Link>,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ];

  // Multi-shops dropdown menu items
  const shopDropdownItems: MenuProps['items'] = [
    ...restaurants.map((shop) => ({
      key: `shop-${shop.id}`,
      icon: <ShopOutlined className="text-orange-500" />,
      label: (
        <div className="flex items-center justify-between gap-4 py-1">
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 text-xs">{shop.name}</span>
            <span className="text-[11px] text-slate-400 truncate max-w-[200px]">{shop.address}</span>
          </div>
          {activeRestaurant?.id === shop.id && (
            <CheckOutlined className="text-orange-500 font-bold" />
          )}
        </div>
      ),
      onClick: () => handleSelectShop(shop),
    })),
    {
      type: 'divider',
    },
    {
      key: 'add-shop',
      icon: <PlusCircleOutlined className="text-orange-600" />,
      label: <span className="font-bold text-orange-600 text-xs">+ Đăng ký thêm quán mới</span>,
      onClick: () => setIsAddShopModalOpen(true),
    },
  ];

  // Active navigation key
  const selectedKey = location.pathname.includes('/merchant/vouchers')
    ? '/merchant/vouchers'
    : location.pathname.includes('/merchant/categories')
    ? '/merchant/categories'
    : location.pathname.includes('/merchant/toppings')
    ? '/merchant/toppings'
    : location.pathname.includes('/merchant/menu')
    ? '/merchant/menu'
    : '/merchant';

  const siderMenuItems: MenuProps['items'] = [
    {
      key: '/merchant',
      icon: <InboxOutlined style={{ fontSize: '18px' }} />,
      label: 'Tiếp nhận đơn hàng',
      onClick: () => navigate('/merchant'),
    },
    {
      key: '/merchant/menu',
      icon: <AppstoreOutlined style={{ fontSize: '18px' }} />,
      label: 'Quản lý món ăn',
      onClick: () => navigate('/merchant/menu'),
    },
    {
      key: '/merchant/categories',
      icon: <FolderOutlined style={{ fontSize: '18px' }} />,
      label: 'Quản lý danh mục',
      onClick: () => navigate('/merchant/categories'),
    },
    {
      key: '/merchant/toppings',
      icon: <TagsOutlined style={{ fontSize: '18px' }} />,
      label: 'Quản lý Topping',
      onClick: () => navigate('/merchant/toppings'),
    },
    {
      key: '/merchant/vouchers',
      icon: <GiftOutlined style={{ fontSize: '18px' }} />,
      label: 'Khuyến mãi & Voucher',
      onClick: () => navigate('/merchant/vouchers'),
    },
  ];

  const isOpen = activeRestaurant ? activeRestaurant.isOpen !== false : true;

  return (
    <Layout className="min-h-screen bg-slate-50 font-sans">
      {/* Sider Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        trigger={null}
        width={250}
        theme="light"
        className="border-r border-slate-200/80 shadow-xs fixed left-0 top-0 bottom-0 z-30"
      >
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center px-4 border-b border-slate-100 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <ThunderboltFilled className="text-xl" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden leading-tight">
              <span className="font-extrabold text-base tracking-tight text-slate-800 block">
                THUNDER<span className="text-orange-500">FOOD</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Merchant Portal
              </span>
            </div>
          )}
        </div>

        {/* Quick Restaurant Status Block */}
        {!collapsed && activeRestaurant && (
          <div className="p-3 m-3 rounded-xl bg-orange-50/70 border border-orange-100/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Trạng thái quán:</span>
              <Switch
                checked={isOpen}
                onChange={handleToggleShopStatus}
                checkedChildren="Mở"
                unCheckedChildren="Đóng"
                size="small"
                style={{ backgroundColor: isOpen ? '#10b981' : undefined }}
              />
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span className={`font-semibold ${isOpen ? 'text-emerald-700' : 'text-slate-500'}`}>
                {isOpen ? 'Đang mở cửa nhận đơn' : 'Tạm dừng nhận đơn'}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <div className="px-2 py-2">
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={siderMenuItems}
            className="border-none font-medium"
            disabled={restaurants.length === 0}
          />
        </div>
      </Sider>

      {/* Main Content Layout */}
      <Layout
        className="transition-all duration-200"
        style={{ marginLeft: collapsed ? 80 : 250 }}
      >
        {/* Top Navbar */}
        <Header className="h-16 px-6 bg-white border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-600 hover:text-orange-500 text-lg"
            />
            {activeRestaurant ? (
              <Dropdown menu={{ items: shopDropdownItems }} trigger={['click']}>
                <div className="flex items-center gap-2 cursor-pointer py-1.5 px-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                  <ShopOutlined className="text-orange-500 text-base" />
                  <div className="text-left leading-tight">
                    <span className="font-bold text-slate-800 text-sm block">
                      {activeRestaurant.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Quán #{activeRestaurant.id} • {restaurants.length} chi nhánh ▾
                    </span>
                  </div>
                  <Tag color={isOpen ? 'success' : 'default'} className="ml-1 text-[11px] font-semibold">
                    {isOpen ? 'Đang mở cửa' : 'Tạm nghỉ'}
                  </Tag>
                </div>
              </Dropdown>
            ) : (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <ShopOutlined className="text-orange-500" />
                <span className="font-semibold">Chưa có quán ăn</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Add Shop Button (Multi-shops) */}
            {restaurants.length > 0 && (
              <Button
                type="dashed"
                size="small"
                icon={<PlusCircleOutlined />}
                onClick={() => setIsAddShopModalOpen(true)}
                className="hidden sm:inline-flex rounded-lg text-xs font-semibold text-orange-600 border-orange-200 hover:border-orange-500"
              >
                + Thêm quán
              </Button>
            )}

            {/* User Profile Dropdown */}
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <div className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                <Avatar
                  size={34}
                  icon={<UserOutlined />}
                  src={user?.avatarUrl}
                  className="bg-orange-500 border border-orange-200 shadow-2xs"
                />
                <div className="hidden md:block text-left leading-tight">
                  <div className="font-bold text-slate-800 text-xs truncate max-w-[140px]">
                    {user?.fullName || 'Chủ Quán Ăn'}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Đối tác Merchant</span>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content Body */}
        <Content className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {loadingShops ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
              <Spin size="large" />
              <span className="text-slate-400 text-sm font-medium">
                Đang tải dữ liệu quán ăn của bạn...
              </span>
            </div>
          ) : restaurants.length === 0 ? (
            /* First Restaurant Onboarding View */
            <MerchantOnboardingView onSuccess={handleOnboardingSuccess} />
          ) : (
            /* Normal Outlet with Context */
            <Outlet
              context={{
                restaurantId: activeRestaurant?.id || restaurants[0].id,
                activeRestaurant: activeRestaurant || restaurants[0],
                restaurants,
                refreshRestaurants: fetchMyRestaurants,
                setActiveRestaurant: handleSelectShop,
              }}
            />
          )}
        </Content>
      </Layout>

      {/* Modal Add Additional Restaurant (Multi-shops) */}
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
