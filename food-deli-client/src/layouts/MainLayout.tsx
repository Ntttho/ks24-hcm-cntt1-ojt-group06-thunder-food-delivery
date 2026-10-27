import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Badge, Button, Dropdown, type MenuProps, Avatar, Modal, Tag, message } from 'antd';
import {
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  ThunderboltFilled,
  CompassOutlined,
  EnvironmentOutlined,
  ProfileOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useAppSelector } from '@/hooks/useAppSelector';
import { APP_ROUTES, ROLES } from '@/constants';

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { totalQuantity } = useAppSelector((state) => state.cart);

  // Safe Logout with confirmation
  const handleLogoutConfirm = () => {
    Modal.confirm({
      title: 'Xác nhận đăng xuất',
      icon: <ExclamationCircleOutlined className="text-orange-500" />,
      content: 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản Thunder Food Delivery không?',
      okText: 'Đăng xuất',
      cancelText: 'Hủy bỏ',
      okButtonProps: {
        danger: true,
        className: 'bg-red-500 hover:bg-red-600 font-medium',
      },
      onOk: () => {
        logout();
        message.success('Đã đăng xuất tài khoản an toàn!');
        navigate(APP_ROUTES.LOGIN);
      },
    });
  };

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'addresses':
        navigate(APP_ROUTES.ADDRESSES);
        break;
      case 'profile':
        navigate(APP_ROUTES.PROFILE);
        break;
      case 'orders':
        navigate(APP_ROUTES.ORDERS);
        break;
      case 'logout':
        handleLogoutConfirm();
        break;
      default:
        break;
    }
  };

  // Helper for role tag display
  const getRoleBadge = () => {
    if (!user) return null;
    const r = user.role;
    if (r === ROLES.ADMIN || r === 'ADMIN') {
      return <Tag color="red">Quản trị viên</Tag>;
    }
    if (r === ROLES.MERCHANT || r === 'MERCHANT') {
      return <Tag color="purple">Chủ quán</Tag>;
    }
    if (r === ROLES.SHIPPER || r === 'SHIPPER' || r === 'DRIVER' || r === ROLES.DRIVER) {
      return <Tag color="blue">Tài xế</Tag>;
    }
    return <Tag color="green">Khách hàng</Tag>;
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div className="py-2 px-1 max-w-[220px]">
          <div className="font-bold text-gray-900 text-sm truncate">
            {user?.fullName || 'Người dùng Thunder'}
          </div>
          <div className="text-xs text-gray-500 truncate">{user?.phone || user?.email}</div>
          <div className="mt-1.5 flex items-center gap-1.5">
            {getRoleBadge()}
            {user?.ratingAvg && (
              <span className="text-xs text-amber-600 font-semibold">
                ⭐ {user.ratingAvg}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'addresses',
      icon: <EnvironmentOutlined className="text-orange-500" />,
      label: <span className="font-medium text-gray-700">Sổ địa chỉ nhận hàng</span>,
    },
    {
      key: 'profile',
      icon: <ProfileOutlined className="text-blue-500" />,
      label: <span className="font-medium text-gray-700">Thông tin cá nhân</span>,
    },
    {
      key: 'orders',
      icon: <ShoppingCartOutlined className="text-emerald-500" />,
      label: <span className="font-medium text-gray-700">Đơn hàng của tôi</span>,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: <span className="font-bold">Đăng xuất an toàn</span>,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to={APP_ROUTES.HOME} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <ThunderboltFilled className="text-xl" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-linear-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Thunder
              </span>
              <span className="text-[10px] font-bold block text-gray-400 tracking-wider -mt-1 uppercase">
                Food Delivery
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              to={APP_ROUTES.HOME}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                location.pathname === APP_ROUTES.HOME
                  ? 'text-orange-600 bg-orange-50 font-bold'
                  : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'
              }`}
            >
              Trang chủ
            </Link>

            {isAuthenticated && (
              <Link
                to={APP_ROUTES.ADDRESSES}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  location.pathname === APP_ROUTES.ADDRESSES
                    ? 'text-orange-600 bg-orange-50 font-bold'
                    : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'
                }`}
              >
                <EnvironmentOutlined />
                <span>Sổ địa chỉ</span>
              </Link>
            )}
          </nav>

          {/* Right actions: Cart & User Profile / Login */}
          <div className="flex items-center gap-3">
            {/* Cart Preview Badge */}
            <Link
              to={APP_ROUTES.CART}
              className="p-2.5 rounded-xl text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors relative"
              title="Giỏ hàng"
            >
              <Badge count={totalQuantity} offset={[2, -2]} color="#f97316">
                <ShoppingCartOutlined className="text-xl" />
              </Badge>
            </Link>

            {/* Auth State Component */}
            {isAuthenticated && user ? (
              <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} trigger={['click']}>
                <div className="flex items-center gap-2 py-1 px-2.5 rounded-full border border-gray-200 hover:border-orange-400 hover:shadow-xs transition-all cursor-pointer bg-white group">
                  <Avatar
                    style={{ backgroundColor: '#f97316' }}
                    icon={<UserOutlined />}
                    src={user.avatarUrl}
                    size="small"
                  />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-gray-800 max-w-[110px] truncate leading-tight group-hover:text-orange-600">
                      {user.fullName || user.phone || 'Tài khoản'}
                    </span>
                    <span className="text-[10px] text-gray-400 capitalize leading-tight">
                      {user.role === 'CUSTOMER' || user.role === ROLES.CUSTOMER ? 'Khách hàng' : user.role}
                    </span>
                  </div>
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
                  <Button
                    type="primary"
                    className="bg-orange-500 hover:bg-orange-600 shadow-xs font-semibold"
                  >
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
              <CompassOutlined /> Spring Boot Microservices Platform
            </span>
            <span>React + Vite + Ant Design + Redux</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
