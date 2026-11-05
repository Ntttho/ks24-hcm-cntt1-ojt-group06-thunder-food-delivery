import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
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
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES } from '@/constants';
import { restaurantApi } from '@/services/modules/restaurantApi';

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

export const MerchantLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [shopName] = useState('Hạnh Dũng - Ẩm Thực Chay Mặn (Quán #1)');
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

  const handleToggleShopStatus = async (checked: boolean) => {
    setIsOpen(checked);
    try {
      await restaurantApi.updateRestaurantStatus(1, checked, checked ? undefined : 'Quán tạm nghỉ');
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

  // Determine active menu item based on current URL
  const selectedKey = location.pathname.includes('/merchant/toppings')
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
      label: 'Quản lý thực đơn',
      onClick: () => navigate('/merchant/menu'),
    },
    {
      key: '/merchant/toppings',
      icon: <TagsOutlined style={{ fontSize: '18px' }} />,
      label: 'Quản lý Topping',
      onClick: () => navigate('/merchant/toppings'),
    },
  ];

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
        {!collapsed && (
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
            <div className="hidden sm:flex items-center gap-2">
              <ShopOutlined className="text-orange-500 text-base" />
              <span className="font-bold text-slate-800 text-sm">{shopName}</span>
              <Tag color={isOpen ? 'success' : 'default'} className="ml-1 text-[11px] font-semibold">
                {isOpen ? 'Đang hoạt động' : 'Tạm nghỉ'}
              </Tag>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
                  <span className="text-[10px] text-slate-400 font-medium">Chủ Quán (#1)</span>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content Body */}
        <Content className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MerchantLayout;
