import React from 'react';
import { Result, Button } from 'antd';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '@/constants';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Result
        status="404"
        title="404"
        subTitle="Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển."
        extra={
          <Link to={APP_ROUTES.HOME}>
            <Button type="primary" className="bg-orange-500 hover:bg-orange-600 font-bold">
              Trở về Trang chủ
            </Button>
          </Link>
        }
      />
    </div>
  );
};
