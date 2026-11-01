import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { StoreReviewSection } from './StoreReviewSection';

export const StoreReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center gap-3">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="rounded-xl font-semibold"
        >
          Quay lại quán
        </Button>
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
          Đánh giá & Nhận xét quán ăn
        </h1>
      </div>

      <StoreReviewSection
        shopId={id || 1}
        shopName="Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi"
        rating={4.8}
        reviewCount={384}
      />
    </div>
  );
};

export default StoreReviewPage;

