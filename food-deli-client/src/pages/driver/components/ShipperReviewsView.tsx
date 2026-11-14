import React from 'react';
import { Award, Star } from '../icons';
import type { DriverReviewSummary } from '@/services/modules/driverApi';

interface ShipperReviewsViewProps {
  reviewData: DriverReviewSummary | null;
  loadingReviews: boolean;
}

export const ShipperReviewsView: React.FC<ShipperReviewsViewProps> = ({
  reviewData,
  loadingReviews,
}) => {
  if (loadingReviews && !reviewData) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
        Đang tải đánh giá từ máy chủ...
      </div>
    );
  }

  if (!reviewData) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
        Không có dữ liệu đánh giá.
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm text-center">
        <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-2">
          <Award className="w-7 h-7" />
        </div>
        <div className="text-3xl font-black text-slate-900">
          {reviewData.totalReviews > 0 ? `${reviewData.averageRating} / 5.0` : 'Chưa có'}
        </div>
        {reviewData.totalReviews > 0 && (
          <div className="flex items-center justify-center gap-1 my-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${
                  s <= Math.round(reviewData.averageRating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-300'
                }`}
              />
            ))}
          </div>
        )}
        <p className="text-xs font-bold text-emerald-600 mt-1">{reviewData.ratingRank}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {reviewData.unavailableReason
            ? reviewData.unavailableReason
            : `Dựa trên ${reviewData.totalReviews} lượt đánh giá từ khách hàng`}
        </p>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
          Nhận xét từ khách hàng
        </h3>
        {reviewData.reviews && reviewData.reviews.length > 0 ? (
          <div className="space-y-2.5 text-xs">
            {reviewData.reviews.map((rev) => (
              <div key={rev.id} className="p-3 rounded-2xl bg-slate-50 space-y-1 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">{rev.customerName}</span>
                  <div className="flex text-amber-400 text-[11px]">
                    {'★'.repeat(rev.rating)}
                  </div>
                </div>
                {rev.comment && <p className="text-slate-600 italic">"{rev.comment}"</p>}
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                  <span>{rev.orderCode}</span>
                  <span>{rev.timeAgo}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">
            {reviewData.unavailableReason || 'Chưa có nhận xét nào từ khách hàng.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default ShipperReviewsView;
