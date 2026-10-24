import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingSpinnerProps {
  tip?: string;
  size?: 'small' | 'default' | 'large';
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  tip = 'Đang tải...',
  size = 'large',
  fullScreen = false,
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: size === 'large' ? 36 : 24 }} spin />;

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs'
    : 'flex flex-col items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <Spin indicator={antIcon} />
      {tip && <p className="mt-3 text-sm font-medium text-gray-500 animate-pulse">{tip}</p>}
    </div>
  );
};
