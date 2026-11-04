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
  const selectedKey = location.pathname.includes('/merchant/menu')
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
  ];

  return (
    <Layout className="min-h-screen bg-slate-50 font-sans">
      {/* Sider Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={250}
        theme="light"
        className="border-r border-slate-200 shadow-sm fixed h-full z-20 left-0 top-0 bottom-0"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'sticky',
          top: 0,
          left: 0,
        }}
      >
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-white">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/30 flex-shrink-0">
            <ThunderboltFilled className="text-xl" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <Title level={5} className="!mb-0 !text-slate-800 !font-bold tracking-tight truncate">
                Food Thunder
              </Title>
              <div className="flex items-center gap-1.5">
                <Tag color="orange" className="!mr-0 text-[10px] font-semibold border-0 py-0 px-1.5">
                  MERCHANT PORTAL
                </Tag>
              </div>
            </div>
          )}
        </div>

        {/* Current Restaurant Badge in Sidebar */}
        {!collapsed && (
          <div className="m-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/60 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-medium text-orange-800 mb-1">
              <ShopOutlined /> <span>Quán đang quản lý</span>
            </div>
            <Text strong className="text-xs text-slate-800 line-clamp-1 block">
              {shopName}
            </Text>
          </div>
        )}

        {/* Navigation Menu */}
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={siderMenuItems}
          className="border-0 px-2 pt-2 text-slate-700 font-medium"
        />

        {/* Bottom Sider Actions */}
        {!collapsed && (
          <div className="absolute bottom-14 left-0 right-0 p-3 border-t border-slate-100 bg-white">
            <Link to={APP_ROUTES.HOME}>
              <Button
                type="text"
                icon={<HomeOutlined />}
                block
                className="text-left text-slate-600 hover:text-orange-600 hover:bg-orange-50 mb-1"
              >
                Về trang Khách hàng
              </Button>
            </Link>
          </div>
        )}
      </Sider>

      {/* Main Content Layout */}
      <Layout className="bg-slate-50 flex-1 min-w-0">
        {/* Top Header */}
        <Header className="bg-white px-6 h-16 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10 shadow-xs">
          {/* Left: Collapse Button & Shop Status Toggle */}
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-600 hover:text-orange-500"
            />
            <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Trạng thái nhận đơn:</span>
              <Switch
                checked={isOpen}
                onChange={handleToggleShopStatus}
                checkedChildren="Mở quán"
                unCheckedChildren="Nghỉ"
                style={{ backgroundColor: isOpen ? '#10b981' : undefined }}
              />
              <Tag color={isOpen ? 'success' : 'default'} className="font-medium">
                {isOpen ? '● Đang nhận đơn' : '○ Tạm dừng'}
              </Tag>
            </div>
          </div>

          {/* Right: Merchant Profile */}
          <div className="flex items-center gap-3">
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-slate-100 cursor-pointer transition">
                <Avatar
                  style={{ backgroundColor: '#f97316' }}
                  icon={<UserOutlined />}
                  src={user?.avatarUrl}
                />
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {user?.fullName || 'Chủ Quán Đối Tác'}
                  </div>
                  <span className="text-[10px] text-slate-500">Đối tác Quán ăn</span>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Dynamic Nested Content */}
        <Content className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
export default MerchantLayout;
