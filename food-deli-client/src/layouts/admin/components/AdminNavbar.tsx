import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Modal,
  Tag,
  Drawer,
  message,
  type MenuProps,
} from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  AuditOutlined,
  StarOutlined,
  CarOutlined,
  SettingOutlined,
  ShopOutlined,
  HomeOutlined,
  UserOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined,
  ThunderboltFilled,
  MenuOutlined,
  SwapOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES } from '@/constants';
import { adminApprovalApi } from '@/services/modules/adminApprovalApi';

export const AdminNavbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);

  // Load pending approvals count for badge notification
  useEffect(() => {
    let mounted = true;
    adminApprovalApi
      .getRestaurantChangeRequests('PENDING')
      .then((res) => {
        if (!mounted) return;
        const count = Array.isArray(res.data) ? res.data.length : 0;
        setPendingApprovalsCount(count);
      })
      .catch(() => {
        // Fallback silently if network fails
      });

    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  // Safe Logout with confirmation
  const handleLogoutConfirm = () => {
    Modal.confirm({
      title: 'Xác nhận đăng xuất quản trị',
      icon: <ExclamationCircleOutlined className="text-red-500" />,
      content: 'Bạn có chắc chắn muốn đăng xuất khỏi Cổng Quản trị Admin Portal không?',
      okText: 'Đăng xuất',
      cancelText: 'Hủy bỏ',
      okButtonProps: {
        danger: true,
        className: 'bg-red-500 hover:bg-red-600 font-bold',
      },
      onOk: () => {
        logout();
        message.success('Đã đăng xuất khỏi Cổng Quản trị hệ thống.');
        navigate(APP_ROUTES.ADMIN_LOGIN);
      },
    });
  };

  // Admin Navigation Items
  const navItems = [
    {
      key: 'analytics',
      path: '/admin/dashboard',
      altPaths: ['/admin/analytics'],
      label: 'Tổng quan & Thống kê',
      icon: <DashboardOutlined className="text-base" />,
    },
    {
      key: 'users',
      path: '/admin/users',
      altPaths: ['/users'],
      label: 'Quản lý Người dùng',
      icon: <TeamOutlined className="text-base" />,
    },
    {
      key: 'approvals',
      path: '/admin/approvals',
      label: 'Kiểm duyệt Hồ sơ',
      icon: <AuditOutlined className="text-base" />,
      badgeCount: pendingApprovalsCount,
    },
    {
      key: 'reviews-restaurants',
      path: '/admin/reviews/restaurants',
      label: 'Đánh giá Quán ăn',
      icon: <StarOutlined className="text-base" />,
    },
    {
      key: 'reviews-drivers',
      path: '/admin/reviews/drivers',
      label: 'Đánh giá Tài xế',
      icon: <CarOutlined className="text-base" />,
    },
    {
      key: 'settings',
      path: '/admin/settings',
      altPaths: ['/admin/system-settings'],
      label: 'Cài đặt Hệ thống',
      icon: <SettingOutlined className="text-base" />,
    },
  ];

  // Helper check active route
  const isActiveRoute = (path: string, altPaths?: string[]) => {
    if (location.pathname === path) return true;
    if (altPaths && altPaths.some((p) => location.pathname === p)) return true;
    if (path !== '/admin/dashboard' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Portal Switcher Menu items
  const portalMenuItems: MenuProps['items'] = [
    {
      key: 'header-portals',
      disabled: true,
      label: (
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Chuyển sang Cổng làm việc khác
        </span>
      ),
    },
    {
      key: 'customer-portal',
      icon: <HomeOutlined className="text-emerald-500 text-base" />,
      label: (
        <div className="py-1">
          <div className="font-bold text-slate-800">Trang Khách Hàng (Customer)</div>
          <div className="text-xs text-slate-400">Giao diện đặt món & tìm kiếm nhà hàng</div>
        </div>
      ),
      onClick: () => navigate(APP_ROUTES.HOME),
    },
    {
      key: 'merchant-portal',
      icon: <ShopOutlined className="text-purple-600 text-base" />,
      label: (
        <div className="py-1">
          <div className="font-bold text-slate-800">Cổng Quán Ăn (Merchant)</div>
          <div className="text-xs text-slate-400">Quản lý thực đơn, đơn hàng & quán ăn</div>
        </div>
      ),
      onClick: () => navigate(APP_ROUTES.MERCHANT_DASHBOARD),
    },
    {
      key: 'shipper-portal',
      icon: <CarOutlined className="text-blue-600 text-base" />,
      label: (
        <div className="py-1">
          <div className="font-bold text-slate-800">Cổng Tài Xế (Shipper Hub)</div>
          <div className="text-xs text-slate-400">Dò đơn, nhận cuốc & giao hàng</div>
        </div>
      ),
      onClick: () => navigate(APP_ROUTES.SHIPPER_DASHBOARD),
    },
  ];

  // User Dropdown items
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-header',
      disabled: true,
      label: (
        <div className="py-1.5 px-1 max-w-[220px]">
          <div className="font-extrabold text-slate-900 text-sm truncate">
            {user?.fullName || 'Quản trị viên'}
          </div>
          <div className="text-xs text-slate-400 truncate">{user?.email || user?.phone}</div>
          <div className="mt-1">
            <Tag color="red" className="font-bold text-[10px] uppercase">
              Quản trị viên hệ thống
            </Tag>
          </div>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'profile',
      icon: <UserOutlined className="text-blue-500" />,
      label: <span className="font-semibold text-slate-700">Thông tin cá nhân</span>,
      onClick: () => navigate(APP_ROUTES.PROFILE),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: <span className="font-bold">Đăng xuất quản trị</span>,
      onClick: handleLogoutConfirm,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
      {/* Top Navbar Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Portal Tag */}
        <Link to="/admin/dashboard" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
            <ThunderboltFilled className="text-xl" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-white group-hover:text-orange-400 transition-colors">
                THUNDER<span className="text-orange-500">FOOD</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-600/30 text-red-400 border border-red-500/30">
                Admin Portal
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase -mt-0.5">
              Hệ thống Quản trị & Điều phối
            </span>
          </div>
        </Link>

        {/* Center Desktop Navigation Tabs */}
        <nav className="hidden xl:flex items-center gap-1">
          {navItems.map((item) => {
            const active = isActiveRoute(item.path, item.altPaths);
            return (
              <Link
                key={item.key}
                to={item.path}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative ${
                  active
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badgeCount && item.badgeCount > 0 ? (
                  <Badge
                    count={item.badgeCount}
                    className="ml-1"
                    style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Portal Switcher & User Profile */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Quick Portal Switcher Dropdown */}
          <Dropdown menu={{ items: portalMenuItems }} placement="bottomRight" trigger={['click']}>
            <Button
              type="text"
              icon={<SwapOutlined className="text-orange-400" />}
              className="text-slate-200 hover:text-orange-400 hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 border border-slate-700/60 h-9"
            >
              <span className="hidden sm:inline">Chuyển cổng</span>
            </Button>
          </Dropdown>

          {/* User Profile Dropdown */}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
            <div className="flex items-center gap-2.5 cursor-pointer py-1 px-2 rounded-xl hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
              <Avatar
                size={34}
                icon={<UserOutlined />}
                src={user?.avatarUrl}
                className="bg-red-600 text-white font-bold border border-red-400 shadow-2xs"
              />
              <div className="hidden md:block text-left leading-tight">
                <div className="font-extrabold text-white text-xs truncate max-w-[130px]">
                  {user?.fullName || 'Quản trị viên'}
                </div>
                <div className="text-[10px] text-red-400 font-bold uppercase mt-0.5">
                  Super Admin
                </div>
              </div>
            </div>
          </Dropdown>

          {/* Mobile Menu Toggle Button */}
          <Button
            type="text"
            icon={<MenuOutlined className="text-lg text-white" />}
            onClick={() => setMobileMenuOpen(true)}
            className="xl:hidden hover:bg-slate-800 text-white rounded-xl w-9 h-9 p-0 flex items-center justify-center"
            aria-label="Mở menu quản trị"
          />
        </div>
      </div>

      {/* Sub-header Navigation Bar for Mid-sized screens (lg to xl) */}
      <div className="hidden lg:flex xl:hidden border-t border-slate-800/80 bg-slate-900/90 px-4 py-2 overflow-x-auto gap-1">
        {navItems.map((item) => {
          const active = isActiveRoute(item.path, item.altPaths);
          return (
            <Link
              key={item.key}
              to={item.path}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                active
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badgeCount && item.badgeCount > 0 ? (
                <Badge count={item.badgeCount} size="small" />
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* Mobile Drawer Menu */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white">
              <ThunderboltFilled />
            </div>
            <span className="font-bold text-slate-800">Admin Portal Navigation</span>
          </div>
        }
        placement="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        width={300}
      >
        <div className="space-y-6">
          {/* User Info Card in Drawer */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <Avatar size={42} icon={<UserOutlined />} src={user?.avatarUrl} className="bg-red-600" />
            <div>
              <div className="font-bold text-slate-800 text-sm truncate">{user?.fullName || 'Admin'}</div>
              <Tag color="red" className="font-semibold text-[10px] mt-0.5">
                Quản trị viên
              </Tag>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
              Phân Hệ Quản Trị
            </div>
            {navItems.map((item) => {
              const active = isActiveRoute(item.path, item.altPaths);
              return (
                <Link
                  key={item.key}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-sm font-bold transition-all ${
                    active
                      ? 'bg-orange-50 text-orange-600 font-extrabold border border-orange-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badgeCount && item.badgeCount > 0 ? (
                    <Badge count={item.badgeCount} />
                  ) : null}
                </Link>
              );
            })}
          </div>

          {/* Switch Portals Section */}
          <div className="space-y-1 pt-4 border-t border-slate-200">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
              Chuyển Sang Cổng Khác
            </div>
            <Link
              to={APP_ROUTES.HOME}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <HomeOutlined className="text-emerald-600" />
                <span>Trang Khách Hàng</span>
              </div>
              <ArrowRightOutlined className="text-xs text-slate-400" />
            </Link>
            <Link
              to={APP_ROUTES.MERCHANT_DASHBOARD}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShopOutlined className="text-purple-600" />
                <span>Cổng Quán Ăn (Merchant)</span>
              </div>
              <ArrowRightOutlined className="text-xs text-slate-400" />
            </Link>
            <Link
              to={APP_ROUTES.SHIPPER_DASHBOARD}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <CarOutlined className="text-blue-600" />
                <span>Cổng Tài Xế (Shipper)</span>
              </div>
              <ArrowRightOutlined className="text-xs text-slate-400" />
            </Link>
          </div>

          {/* Logout Button */}
          <div className="pt-4 border-t border-slate-200">
            <Button
              danger
              block
              icon={<LogoutOutlined />}
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogoutConfirm();
              }}
              className="rounded-xl font-bold h-10"
            >
              Đăng xuất
            </Button>
          </div>
        </div>
      </Drawer>
    </header>
  );
};

export default AdminNavbar;

