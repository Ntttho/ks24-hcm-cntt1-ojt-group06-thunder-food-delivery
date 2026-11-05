import React from 'react';
import { Segmented, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface OrderFilterBarProps {
  activeTab: string;
  onChangeTab: (tab: string) => void;
  searchCode: string;
  onChangeSearch: (code: string) => void;
}

export const OrderFilterBar: React.FC<OrderFilterBarProps> = ({
  activeTab,
  onChangeTab,
  searchCode,
  onChangeSearch,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
      <Segmented
        value={activeTab}
        onChange={(val) => onChangeTab(val as string)}
        options={[
          { label: 'Tất cả', value: 'ALL' },
          { label: 'Đang xử lý', value: 'PROCESSING' },
          { label: 'Đang giao', value: 'DELIVERING' },
          { label: 'Hoàn tất', value: 'COMPLETED' },
          { label: 'Đã hủy', value: 'CANCELLED' },
        ]}
        className="p-1 font-semibold overflow-x-auto"
      />

      <div className="w-full md:w-72">
        <Input
          placeholder="Tìm theo mã đơn hoặc quán..."
          prefix={<SearchOutlined className="text-gray-400" />}
          value={searchCode}
          onChange={(e) => onChangeSearch(e.target.value)}
          allowClear
          className="rounded-xl hover:border-orange-400 focus:border-orange-500"
        />
      </div>
    </div>
  );
};

export default OrderFilterBar;

