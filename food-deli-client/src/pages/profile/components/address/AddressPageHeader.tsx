import React from 'react';
import { Button, Typography } from 'antd';
import { EnvironmentOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface AddressPageHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
}

export const AddressPageHeader: React.FC<AddressPageHeaderProps> = ({
  isLoading,
  onRefresh,
  onOpenCreateModal,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl">
            <EnvironmentOutlined />
          </div>
          <div>
            <Title level={4} className="!mb-0 text-gray-900 font-extrabold">
              Sổ địa chỉ giao hàng
            </Title>
            <Text type="secondary" className="text-xs sm:text-sm">
              Quản lý các địa chỉ nhận hàng yêu thích để đặt món nhanh chóng
            </Text>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          icon={<ReloadOutlined />}
          onClick={onRefresh}
          loading={isLoading}
          className="rounded-xl"
        >
          Làm mới
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onOpenCreateModal}
          className="bg-orange-500 hover:bg-orange-600 shadow-sm font-bold rounded-xl"
        >
          Thêm địa chỉ mới
        </Button>
      </div>
    </div>
  );
};

export default AddressPageHeader;

