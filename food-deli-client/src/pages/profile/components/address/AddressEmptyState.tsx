import React from 'react';
import { Button, Empty, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Paragraph } = Typography;

interface AddressEmptyStateProps {
  onOpenCreateModal: () => void;
}

export const AddressEmptyState: React.FC<AddressEmptyStateProps> = ({
  onOpenCreateModal,
}) => {
  return (
    <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div className="space-y-1">
            <Paragraph className="font-bold text-gray-700 text-base !mb-0">
              Bạn chưa có địa chỉ giao hàng nào
            </Paragraph>
            <Paragraph className="text-gray-400 text-xs">
              Thêm địa chỉ nhà riêng hoặc văn phòng để việc giao đồ ăn diễn ra chính xác nhất
            </Paragraph>
          </div>
        }
      >
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onOpenCreateModal}
          className="bg-orange-500 hover:bg-orange-600 font-semibold rounded-xl"
        >
          Thêm địa chỉ đầu tiên
        </Button>
      </Empty>
    </div>
  );
};

export default AddressEmptyState;

