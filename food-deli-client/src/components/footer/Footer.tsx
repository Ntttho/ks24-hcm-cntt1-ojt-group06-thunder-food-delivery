import React from 'react';
import { Link } from 'react-router-dom';
import {
  ThunderboltFilled,
  CompassOutlined,
  PhoneOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { APP_ROUTES } from '@/constants';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 mt-16 pt-12 pb-8 text-gray-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <Link to={APP_ROUTES.HOME} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                <ThunderboltFilled className="text-lg" />
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-linear-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                ThunderFood
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Nền tảng giao đồ ăn siêu tốc hàng đầu, kết nối hàng ngàn quán ăn ngon với thực khách
              mỗi ngày cùng trải nghiệm ẩm thực tiện lợi và an toàn.
            </p>
            <div className="flex items-center gap-2 text-xs text-orange-600 font-semibold bg-orange-50 px-3 py-1.5 rounded-lg w-fit">
              <SafetyCertificateOutlined />
              <span>100% Đối tác quán ăn được kiểm định vệ sinh</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider">
              Khám phá
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to={APP_ROUTES.HOME} className="hover:text-orange-600 transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to="/restaurants/1" className="hover:text-orange-600 transition-colors">
                  Quán ăn đối tác nổi bật
                </Link>
              </li>
              <li>
                <Link to={APP_ROUTES.CART} className="hover:text-orange-600 transition-colors">
                  Giỏ hàng của tôi
                </Link>
              </li>
              <li>
                <Link to={APP_ROUTES.ADDRESSES} className="hover:text-orange-600 transition-colors">
                  Sổ địa chỉ giao hàng
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Partner Collaboration */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider">
              Hợp tác cùng Thunder
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to={APP_ROUTES.REGISTER}
                  className="flex items-center gap-1.5 hover:text-orange-600 transition-colors"
                >
                  <ShopOutlined className="text-purple-500" />
                  <span>Đăng ký mở quán đối tác</span>
                </Link>
              </li>
              <li>
                <Link
                  to={APP_ROUTES.REGISTER}
                  className="flex items-center gap-1.5 hover:text-orange-600 transition-colors"
                >
                  <CarOutlined className="text-blue-500" />
                  <span>Trở thành tài xế giao hàng</span>
                </Link>
              </li>
              <li>
                <span className="text-gray-400 text-xs">
                  Chính sách chiết khấu linh hoạt & ưu đãi độc quyền
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Support */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider">
              Hỗ trợ khách hàng
            </h4>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <PhoneOutlined className="text-orange-500" />
                <span className="font-semibold text-gray-800">Hotline: 1900-6868</span>
              </div>
              <div className="flex items-center gap-2">
                <MailOutlined className="text-orange-500" />
                <span>support@thunderfood.vn</span>
              </div>
              <div className="pt-2 text-xs text-gray-400 leading-relaxed">
                Hoạt động: 07:00 - 23:00 mỗi ngày (kể cả Thứ Bảy, Chủ Nhật & Ngày Lễ).
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Platform Stack */}
        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <ThunderboltFilled className="text-orange-500" />
            <span className="font-bold text-gray-700">Thunder Food Delivery</span>
            <span>© 2026. Nhóm 06 CNTT1 - OJT Project.</span>
          </div>

          <div className="flex items-center gap-4 text-gray-500">
            <span className="flex items-center gap-1">
              <CompassOutlined /> Spring Boot Microservices Hub
            </span>
            <span>•</span>
            <span>React 19 + Vite + Tailwind v4 + Ant Design</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

