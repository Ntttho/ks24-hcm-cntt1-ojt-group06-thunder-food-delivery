import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Badge, Button, Dropdown, type MenuProps, Avatar } from 'antd';
import {
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  ThunderboltFilled,
  CompassOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useAppSelector } from '@/hooks/useAppSelector';
import { APP_ROUTES } from '@/constants';

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { totalQuantity } = useAppSelector((state) => state.cart);

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate(APP_ROUTES.HOME);
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div className="py-1">
          <div className="font-bold text-gray-800">{user?.fullName || user?.email}</div>
          <div className="text-xs text-gray-400">{user?.role}</div>
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: 'Đăng xuất',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to={APP_ROUTES.HOME} className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <ThunderboltFilled className="text-xl" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-linear-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Thunder
              </span>
              <span className="text-xs font-semibold block text-gray-400 tracking-wider -mt-1 uppercase">
                Food Delivery
              </span>
            </div>
          </Link>

          {/* Center Navigation */}
          <nav className="flex items-center gap-2">
            <Link
              to={APP_ROUTES.HOME}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-orange-600 bg-orange-50"
            >
              Trang chủ
            </Link>
          </nav>

          {/* Right actions: Cart & User profile */}
          <div className="flex items-center gap-3">
            {/* Cart Preview Badge */}
            <Link
              to={APP_ROUTES.CART}
              className="p-2.5 rounded-xl text-gray-700 bg-gray-100/80 hover:bg-orange-50 hover:text-orange-600 transition-colors relative cursor-pointer block"
            >
              <Badge count={totalQuantity || 3} offset={[2, -2]} color="#00b14f">
                <ShoppingCartOutlined className="text-xl" />
              </Badge>
            </Link>

            {/* Auth actions */}
            {isAuthenticated && user ? (
              <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} trigger={['click']}>
                <div className="flex items-center gap-2 p-1.5 pr-3 rounded-full border border-gray-200 hover:border-orange-300 hover:shadow-xs transition-all cursor-pointer bg-white">
                  <Avatar
                    style={{ backgroundColor: '#f97316' }}
                    icon={<UserOutlined />}
                    src={user.avatarUrl}
                    size="small"
                  />
                  <span className="text-sm font-semibold text-gray-700 max-w-[120px] truncate">
                    {user.fullName || user.email}
                  </span>
                </div>
              </Dropdown>
            ) : (
              <div className="flex items-center gap-2">
                <Link to={APP_ROUTES.LOGIN}>
                  <Button type="text" className="font-semibold text-gray-700 hover:text-orange-600">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to={APP_ROUTES.REGISTER}>
                  <Button type="primary" className="bg-orange-500 hover:bg-orange-600 shadow-sm">
                    Đăng ký
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Outlet */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Global Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ThunderboltFilled className="text-orange-500 text-lg" />
            <span className="font-bold text-gray-800">Thunder Food Delivery</span>
            <span className="text-gray-400 text-sm">© 2026. Nhóm 06 CNTT1 - OJT.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <CompassOutlined /> Microservices Architecture
            </span>
            <span>React + Vite + AntD + Tailwind</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
