import React from 'react';
import { Rate, Progress, Button } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { ReviewStats } from '../types';

interface ReviewScoreOverviewProps {
  stats: ReviewStats;
  onOpenWriteReview: () => void;
}

export const ReviewScoreOverview: React.FC<ReviewScoreOverviewProps> = ({
  stats,
  onOpenWriteReview,
}) => {
  const getPercentage = (count: number) => {
    if (stats.totalReviews === 0) return 0;
    return Math.round((count / stats.totalReviews) * 100);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col md:flex-row items-center gap-8 justify-between">
      {/* Big Score Box */}
      <div className="flex flex-col items-center justify-center text-center md:border-r md:border-gray-100 md:pr-8 min-w-[180px]">
        <div className="text-5xl font-black text-gray-900 tracking-tight">
          {stats.averageRating.toFixed(1)}
        </div>
        <div className="mt-2">
          <Rate allowHalf disabled value={stats.averageRating} className="text-amber-500 text-lg" />
        </div>
        <div className="text-xs text-gray-500 mt-1 font-medium">
          Dựa trên {stats.totalReviews} lượt đánh giá thực
        </div>
        <div className="mt-3 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
          96% Khách hàng hài lòng
        </div>
      </div>

      {/* Star Progress Bars */}
      <div className="flex-1 w-full max-w-md space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = stats.ratingDistribution[star as keyof typeof stats.ratingDistribution] || 0;
          const pct = getPercentage(count);
          return (
            <div key={star} className="flex items-center gap-3 text-xs text-gray-500">
              <span className="w-10 font-bold text-gray-700">{star} sao</span>
              <div className="flex-1">
                <Progress
                  percent={pct}
                  strokeColor="#f59e0b"
                  showInfo={false}
                  size="small"
                />
              </div>
              <span className="w-12 text-right font-medium">{count}</span>
            </div>
          );
        })}
      </div>

      {/* CTA Button */}
      <div className="flex flex-col items-center gap-2">
        <Button
          type="primary"
          icon={<EditOutlined />}
          size="large"
          className="bg-orange-500 hover:bg-orange-600 shadow-sm font-bold h-11 px-6 rounded-xl"
          onClick={onOpenWriteReview}
        >
          Viết đánh giá
        </Button>
        <span className="text-[11px] text-gray-400">Đánh giá để nhận điểm thưởng</span>
      </div>
    </div>
  );
};

export default ReviewScoreOverview;

