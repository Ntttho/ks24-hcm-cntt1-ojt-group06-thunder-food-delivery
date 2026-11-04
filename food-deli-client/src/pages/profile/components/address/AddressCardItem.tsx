import React from 'react';
import { Card, Tag, Button, Popconfirm } from 'antd';
import {
  HomeOutlined,
  BankOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  CompassOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { UserAddress } from '@/types';

interface AddressCardItemProps {
  item: UserAddress;
  onSetDefault: (id: number) => void;
  onOpenEditModal: (item: UserAddress) => void;
  onDelete: (id: number) => void;
}

export const AddressCardItem: React.FC<AddressCardItemProps> = ({
  item,
  onSetDefault,
  onOpenEditModal,
  onDelete,
}) => {
  const renderLabelTag = (label?: string | null) => {
    const l = label || 'Khác';
    if (l === 'Nhà riêng') {
      return (
        <Tag color="cyan" className="font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md">
          <HomeOutlined /> Nhà riêng
        </Tag>
      );
    }
    if (l === 'Văn phòng' || l === 'Công ty') {
      return (
        <Tag color="purple" className="font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md">
          <BankOutlined /> {l}
        </Tag>
      );
    }
    return (
      <Tag color="default" className="font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md">
        <EnvironmentOutlined /> {l}
      </Tag>
    );
  };

  return (
    <Card
      className={`rounded-2xl transition-all border ${
        item.isDefault
          ? 'border-orange-300 bg-orange-50/20 shadow-xs'
          : 'border-gray-100 hover:border-gray-300 bg-white'
      }`}
      bodyStyle={{ padding: 20 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left: Info */}
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {renderLabelTag(item.label)}
            {item.isDefault && (
              <Tag
                color="orange"
                className="font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 border-orange-300 bg-orange-100 text-orange-700"
              >
                <CheckCircleOutlined /> Mặc định
              </Tag>
            )}
          </div>

          {/* Address text */}
          <div className="font-bold text-base text-gray-900 leading-snug">
            {item.address}
          </div>

          {/* Lat / Lng badge */}
          {(item.latitude || item.longitude) && (
            <div className="text-xs text-gray-400 flex items-center gap-1.5">
              <CompassOutlined />
              <span>
                Tọa độ: {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}
              </span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-end sm:self-center">
          {!item.isDefault && (
            <Button
              size="middle"
              onClick={() => onSetDefault(item.id)}
              className="text-xs font-semibold hover:border-orange-400 hover:text-orange-600 rounded-lg"
            >
              Đặt làm mặc định
            </Button>
          )}

          <Button
            icon={<EditOutlined />}
            size="middle"
            onClick={() => onOpenEditModal(item)}
            className="rounded-lg text-gray-600 hover:text-orange-600 hover:border-orange-400"
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xóa địa chỉ này?"
            description="Bạn có chắc muốn xóa địa chỉ này khỏi danh bạ giao hàng không?"
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(item.id)}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="middle"
              className="rounded-lg"
            >
              Xóa
            </Button>
          </Popconfirm>
        </div>
      </div>
    </Card>
  );
};

export default AddressCardItem;

