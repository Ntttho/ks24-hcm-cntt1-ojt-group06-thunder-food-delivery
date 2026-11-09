import React from 'react';
import { Avatar, Dropdown, Modal } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  HomeOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/constants';

interface MerchantUserDropdownProps {
  user: any;
  onLogout: () => void;
}

export const MerchantUserDropdown: React.FC<MerchantUserDropdownProps> = ({
  user,
  onLogout,
}) => {
  const navigate = useNavigate();

  const handleLogoutConfirm = () => {
    Modal.confirm({
      title: 'Xác nhận đăng xuất',
      icon: <ExclamationCircleOutlined className="text-orange-500" />,
      content: 'Bạn có chắc chắn muốn đăng xuất khỏi cổng Merchant Portal không?',
      okText: 'Đăng xuất',
      cancelText: 'Hủy bỏ',
      okButtonProps: { danger: true, className: 'bg-red-500 font-semibold' },
      onOk: () => {
        onLogout();
      },
    });
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'home',
      icon: <HomeOutlined className="text-base text-gray-500" />,
      label: (
        <Link to={APP_ROUTES.HOME} className="font-semibold text-gray-700 py-1 inline-block">
          Trang chủ đặt món
        </Link>
      ),
    },
    {
      key: 'profile',
      icon: <ProfileOutlined className="text-base text-gray-500" />,
      label: (
        <Link to={APP_ROUTES.PROFILE} className="font-semibold text-gray-700 py-1 inline-block">
          Thông tin tài khoản
        </Link>
      ),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined className="text-base text-red-500" />,
      danger: true,
      label: <span className="font-bold py-1 inline-block">Đăng xuất</span>,
      onClick: handleLogoutConfirm,
    },
  ];

  return (
    <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
      <div className="flex items-center gap-2.5 cursor-pointer py-1.5 px-2.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
        <Avatar
          size={36}
          icon={<UserOutlined />}
          src={user?.avatarUrl}
          className="bg-orange-500 border border-orange-200 shadow-2xs shrink-0 text-white font-bold"
        />
        <div className="hidden md:block text-left leading-tight">
          <div className="font-extrabold text-gray-900 text-xs truncate max-w-[140px]">
            {user?.fullName || 'Chủ Quán Ăn'}
          </div>
          <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-1.5 py-0.2 rounded mt-0.5 inline-block">
            Merchant Partner
          </span>
        </div>
      </div>
    </Dropdown>
  );
};

export default MerchantUserDropdown;

