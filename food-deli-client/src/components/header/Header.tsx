import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Badge, Button, Dropdown, type MenuProps, Avatar, Modal, Tag, message, Drawer } from 'antd';
import {
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  ThunderboltFilled,
  EnvironmentOutlined,
  ProfileOutlined,
  ExclamationCircleOutlined,
  ShopOutlined,
  CarOutlined,
  DashboardOutlined,
  MenuOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useAppSelector } from '@/hooks/useAppSelector';
import { APP_ROUTES, ROLES } from '@/constants';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { totalQuantity } = useAppSelector((state) => state.cart);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      case 'merchant-portal':
        navigate(APP_ROUTES.MERCHANT_DASHBOARD);
        break;
      case 'shipper-hub':
        navigate(APP_ROUTES.SHIPPER_DASHBOARD);
        break;
      case 'admin-portal':
        navigate(APP_ROUTES.ADMIN_DASHBOARD);
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

  // Context-specific portal items based on user role
  const roleSpecificMenuItems: MenuProps['items'] = [];
  if (user?.role === ROLES.MERCHANT || user?.role === 'MERCHANT') {
    roleSpecificMenuItems.push({
      key: 'merchant-portal',
      icon: <ShopOutlined className="text-purple-500" />,
      label: <span className="font-semibold text-purple-600">Quản lý Quán ăn (Merchant)</span>,
    });
  } else if (
    user?.role === ROLES.SHIPPER ||
    user?.role === 'SHIPPER' ||
    user?.role === 'DRIVER' ||
    user?.role === ROLES.DRIVER
  ) {
    roleSpecificMenuItems.push({
      key: 'shipper-hub',
      icon: <CarOutlined className="text-blue-500" />,
      label: <span className="font-semibold text-blue-600">Trung tâm Tài xế (Shipper Hub)</span>,
    });
  } else if (user?.role === ROLES.ADMIN || user?.role === 'ADMIN') {
    roleSpecificMenuItems.push({
      key: 'admin-portal',
      icon: <DashboardOutlined className="text-red-500" />,
      label: <span className="font-semibold text-red-600">Cổng Quản trị (Admin)</span>,
    });
  }

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
    ...(roleSpecificMenuItems.length > 0
      ? [...roleSpecificMenuItems, { type: 'divider' as const }]
      : []),
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

        {/* Center Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1.5">
          <Link
            to={APP_ROUTES.HOME}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              location.pathname === APP_ROUTES.HOME
                ? 'text-orange-600 bg-orange-50 font-bold'
                : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'
            }`}
          >
            <HomeOutlined />
            <span>Trang chủ</span>
          </Link>

          <Link
            to="/restaurants/1"
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              location.pathname.startsWith('/restaurants')
                ? 'text-orange-600 bg-orange-50 font-bold'
                : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'
            }`}
          >
            <ShopOutlined />
            <span>Quán ăn nổi bật</span>
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
                <div className="hidden sm:flex flex-col text-left">
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
            <div className="hidden sm:flex items-center gap-2">
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

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Menu"
          >
            <MenuOutlined className="text-lg" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <Drawer
        title="Danh mục Thunder"
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
      >
        <div className="flex flex-col gap-4">
          <Link
            to={APP_ROUTES.HOME}
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 text-gray-800 font-semibold py-2 hover:text-orange-600"
          >
            <HomeOutlined /> Trang chủ
          </Link>
          <Link
            to="/restaurants/1"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 text-gray-800 font-semibold py-2 hover:text-orange-600"
          >
            <ShopOutlined /> Quán ăn nổi bật
          </Link>
          <Link
            to={APP_ROUTES.CART}
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between text-gray-800 font-semibold py-2 hover:text-orange-600"
          >
            <span className="flex items-center gap-2">
              <ShoppingCartOutlined /> Giỏ hàng
            </span>
            {totalQuantity > 0 && <Tag color="orange">{totalQuantity} món</Tag>}
          </Link>
          {isAuthenticated && (
            <>
              <Link
                to={APP_ROUTES.ADDRESSES}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-gray-800 font-semibold py-2 hover:text-orange-600"
              >
                <EnvironmentOutlined /> Sổ địa chỉ
              </Link>
              <Link
                to={APP_ROUTES.PROFILE}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-gray-800 font-semibold py-2 hover:text-orange-600"
              >
                <ProfileOutlined /> Thông tin cá nhân
              </Link>
              <Button
                danger
                icon={<LogoutOutlined />}
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogoutConfirm();
                }}
                className="mt-4 w-full"
              >
                Đăng xuất
              </Button>
            </>
          )}
          {!isAuthenticated && (
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-100">
              <Link to={APP_ROUTES.LOGIN} onClick={() => setMobileMenuOpen(false)}>
                <Button block>Đăng nhập</Button>
              </Link>
              <Link to={APP_ROUTES.REGISTER} onClick={() => setMobileMenuOpen(false)}>
                <Button type="primary" block className="bg-orange-500 hover:bg-orange-600">
                  Đăng ký tài khoản
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Drawer>
    </header>
  );
};

export default Header;

