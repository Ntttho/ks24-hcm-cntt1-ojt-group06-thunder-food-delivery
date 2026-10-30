import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Zap, Store, Bike, ShieldCheck } from 'lucide-react';
import { APP_ROUTES } from '@/constants';

type PortalType = 'customer' | 'merchant' | 'driver' | 'admin';

interface PortalConfig {
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ElementType;
  gradient: string;
  bgImage: string;
}

const PORTAL_CONFIG: Record<PortalType, PortalConfig> = {
  customer: {
    title: 'ThunderFood Customer',
    subtitle: 'Giao món siêu tốc, nóng hổi tận tay trong 20 phút!',
    badge: 'Khách Hàng',
    icon: Zap,
    gradient: 'from-rose-600/90 to-rose-800/90',
    bgImage:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop',
  },
  merchant: {
    title: 'ThunderFood Partner',
    subtitle: 'Đồng hành cùng ThunderFood, bứt phá doanh thu mỗi ngày.',
    badge: 'Chủ Quán',
    icon: Store,
    gradient: 'from-amber-500/90 to-orange-600/90',
    bgImage:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop',
  },
  driver: {
    title: 'ThunderFood Driver',
    subtitle: 'Nhận đơn liên tục, thu nhập ổn định, tự do thời gian.',
    badge: 'Tài Xế',
    icon: Bike,
    gradient: 'from-emerald-500/90 to-teal-700/90',
    bgImage:
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=2070&auto=format&fit=crop',
  },
  admin: {
    title: 'ThunderFood Admin',
    subtitle: 'Trung tâm kiểm soát hệ thống và vận hành.',
    badge: 'Quản Trị Viên',
    icon: ShieldCheck,
    gradient: 'from-indigo-600/90 to-blue-800/90',
    bgImage:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
  },
};

interface AuthLayoutProps {
  portalType?: PortalType;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ portalType = 'customer' }) => {
  const config = PORTAL_CONFIG[portalType];
  const IconComponent = config.icon;

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      {/* Left Banner Section (MD+) */}
      <div className="hidden md:flex w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: `url('${config.bgImage}')` }}
        />
        {/* Gradient Overlay */}
        <div className={`absolute inset-0 bg-linear-to-br ${config.gradient} z-0 opacity-85`} />

        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-white/10 blur-2xl z-0" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-black/30 blur-3xl z-0" />

        {/* Top Header Logo */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
            <IconComponent className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wider uppercase">ThunderFood</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20">
              {config.badge}
            </span>
          </div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 my-auto max-w-lg">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">{config.title}</h2>
          <p className="mt-4 text-lg text-white/90 font-medium">{config.subtitle}</p>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-white/70">
          © {new Date().getFullYear()} ThunderFood System. Nhóm 06 CNTT1 - OJT 2026.
        </div>
      </div>

      {/* Right Form Section */}
      <div className="flex w-full md:w-1/2 flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex md:hidden items-center justify-center space-x-2 mb-8">
            <Link to={APP_ROUTES.HOME} className="flex items-center gap-2">
              <div className={`p-2.5 rounded-xl bg-linear-to-r ${config.gradient} text-white`}>
                <IconComponent className="h-6 w-6" />
              </div>
              <span className="text-2xl font-black text-slate-900">
                Thunder<span className="text-primary">Food</span>
              </span>
            </Link>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
};
