import React from 'react';
import { Steps } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

interface OrderLiveTrackingStepperProps {
  current: number;
  statusText: string;
  isError: boolean;
  statusCode?: string;
  animationKey?: number;
}

export const OrderLiveTrackingStepper: React.FC<OrderLiveTrackingStepperProps> = ({
  current,
  statusText,
  isError,
  statusCode,
  animationKey = 0,
}) => {
  const isCompleted = statusCode === 'DELIVERED' || statusCode === 'COMPLETED';

  return (
    <div className="py-2">
      <div
        key={`status-banner-${animationKey}`}
        className="bg-orange-50/70 border border-orange-100 rounded-2xl p-4 mb-6 flex items-center justify-between transition-all duration-500 hover:shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs relative">
            <ClockCircleOutlined />
            {!isCompleted && !isError && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-600"></span>
              </span>
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-orange-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>Trạng thái thời gian thực</span>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></span>
            </div>
            <div className="font-bold text-gray-900 text-base transition-all duration-300">
              {statusText}
            </div>
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
        key={`stepper-${animationKey}`}
        current={current}
        status={isError ? 'error' : undefined}
        responsive
        className="font-medium transition-all duration-500"
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
