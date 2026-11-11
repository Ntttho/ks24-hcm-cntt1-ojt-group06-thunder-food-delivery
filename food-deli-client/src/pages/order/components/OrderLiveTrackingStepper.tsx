import React from 'react';
import { Steps } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

interface OrderLiveTrackingStepperProps {
  current: number;
  statusText: string;
  isError: boolean;
  statusCode?: string;
}

export const OrderLiveTrackingStepper: React.FC<OrderLiveTrackingStepperProps> = ({
  current,
  statusText,
  isError,
  statusCode,
}) => {
  const isCompleted = statusCode === 'DELIVERED' || statusCode === 'COMPLETED';

  return (
    <div className="py-2">
      <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
            <ClockCircleOutlined />
          </div>
          <div>
            <div className="text-xs font-bold text-orange-800 uppercase tracking-wider">
              Trạng thái thời gian thực
            </div>
            <div className="font-bold text-gray-900 text-base">{statusText}</div>
          </div>
        </div>
        {!isError && !isCompleted && statusCode !== 'AWAITING_PAYMENT' && (
          <div className="text-right hidden sm:block">
            <span className="text-xs text-gray-500 block">Dự kiến nhận món</span>
            <span className="text-base font-extrabold text-orange-600">~ 15 - 20 phút</span>
          </div>
        )}
      </div>

      {/* Live Stepper 5 bước tự động nhảy trạng thái */}
      <Steps
        current={current}
        status={isError ? 'error' : undefined}
        responsive
        className="font-medium"
        items={[
          {
            title: 'Chờ nhận',
            description: 'Đơn chờ tiếp nhận',
          },
          {
            title: 'Đang nấu',
            description: 'Quán đang chế biến',
          },
          {
            title: 'Tài xế nhận',
            description: 'Shipper đã nhận đơn',
          },
          {
            title: 'Đang giao',
            description: 'Giao hỏa tốc tới bạn',
          },
          {
            title: 'Đã giao',
            description: 'Giao hàng thành công',
          },
        ]}
      />
    </div>
  );
};

export default OrderLiveTrackingStepper;
