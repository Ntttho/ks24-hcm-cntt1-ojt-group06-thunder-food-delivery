import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Avatar, Tag, Modal, message, Badge } from 'antd';
import {
  UserOutlined,
  ShoppingOutlined,
  EnvironmentOutlined,
  ShoppingCartOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined,
  ThunderboltFilled,
  PhoneOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { useAppSelector } from '@/hooks/useAppSelector';
import { APP_ROUTES, ROLES } from '@/constants';

export const UserLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { totalQuantity } = useAppSelector((state) => state.cart);

  const handleLogout = () => {
    Modal.confirm({
      title: 'Xác nhận đăng xuất',
      icon: <ExclamationCircleOutlined className="text-orange-500" />,
      content: 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?',
      okText: 'Đăng xuất',
      cancelText: 'Hủy',
      okButtonProps: { danger: true, className: 'bg-red-500 font-semibold' },
      onOk: () => {
        logout();
        message.success('Đã đăng xuất thành công');
        navigate(APP_ROUTES.LOGIN);
      },
    });
  };

  const getRoleBadge = () => {
    if (!user) return null;
    const r = user.role;
    if (r === ROLES.ADMIN || r === 'ADMIN') return <Tag color="red" className="font-semibold">Quản trị viên</Tag>;
    if (r === ROLES.MERCHANT || r === 'MERCHANT') return <Tag color="purple" className="font-semibold">Chủ quán</Tag>;
    if (r === ROLES.SHIPPER || r === 'SHIPPER' || r === 'DRIVER' || r === ROLES.DRIVER)
      return <Tag color="blue" className="font-semibold">Tài xế</Tag>;
    return <Tag color="orange" className="font-semibold">Khách hàng</Tag>;
  };

  const navItems = [
    {
      to: APP_ROUTES.PROFILE,
      label: 'Thông tin tài khoản',
      icon: <UserOutlined className="text-lg" />,
      exact: true,
    },
    {
      to: APP_ROUTES.ORDERS,
      label: 'Đơn hàng của tôi',
      icon: <ShoppingOutlined className="text-lg" />,
      exact: false,
    },
    {
      to: APP_ROUTES.ADDRESSES,
      label: 'Sổ địa chỉ nhận hàng',
      icon: <EnvironmentOutlined className="text-lg" />,
      exact: false,
    },
  ];

  const isNavActive = (path: string, exact: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-2">
      {/* Top Banner / Breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-linear-to-r from-orange-500 via-orange-600 to-amber-500 rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center gap-4">
          <Avatar
            size={64}
            icon={<UserOutlined />}
            src={user?.avatarUrl}
            className="border-2 border-white shadow-md bg-white text-orange-600 text-2xl"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white !mb-0">
                {user?.fullName || 'Người dùng Thunder Food'}
              </h1>
              {getRoleBadge()}
            </div>
            <p className="text-orange-100 text-sm flex items-center gap-2 mt-1">
              <PhoneOutlined /> {user?.phone || 'Chưa cập nhật SĐT'} • ID: #{user?.id || 0}
            </p>
          </div>
        </div>

        {/* Quick Cart Pill */}
        <button
          type="button"
          onClick={() => navigate(APP_ROUTES.CART)}
          className="flex items-center gap-2.5 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-white font-semibold transition-all border border-white/20 cursor-pointer shadow-xs active:scale-95"
        >
          <Badge count={totalQuantity} offset={[4, -4]} color="#ea580c">
            <ShoppingCartOutlined className="text-xl text-white" />
          </Badge>
          <span>Giỏ hàng ({totalQuantity})</span>
        </button>
      </div>

      {/* Mobile / Tablet Horizontal Navigation Tabs */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
        {navItems.map((item) => {
          const active = isNavActive(item.to, item.exact);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                active
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 border border-gray-100 shadow-2xs'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Desktop Sidebar (1 column) */}
        <aside className="hidden lg:block lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs sticky top-20">
          <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
            Quản lý tài khoản
          </div>

          <nav className="space-y-1.5 mt-2">
            {navItems.map((item) => {
              const active = isNavActive(item.to, item.exact);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all ${
                    active
                      ? 'bg-orange-50 text-orange-600 font-bold border-l-4 border-orange-500 shadow-2xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className={active ? 'text-orange-600' : 'text-gray-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <div className="pt-3 my-2 border-t border-gray-100" />

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm text-red-600 hover:bg-red-50 transition-all cursor-pointer text-left"
            >
              <LogoutOutlined className="text-red-500 text-lg" />
              <span>Đăng xuất</span>
            </button>
          </nav>
        </aside>

        {/* Right Main Content Area (3 columns) */}
        <main className="lg:col-span-3 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;

