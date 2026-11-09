import React from 'react';
import { Avatar, Rate, Tag } from 'antd';
import { UserOutlined, CheckCircleFilled, MessageOutlined } from '@ant-design/icons';
import type { ReviewItem } from '../types';

interface ReviewCardItemProps {
  review: ReviewItem;
}

export const ReviewCardItem: React.FC<ReviewCardItemProps> = ({ review }) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-3">
      {/* Header: User Info & Rating */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={review.authorAvatar}
            icon={<UserOutlined />}
            size="large"
            style={{ backgroundColor: '#f97316' }}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-gray-900 text-sm">{review.authorName}</span>
              {review.isVerifiedBuyer && (
                <Tag color="green" className="text-[10px] font-semibold border-none rounded flex items-center gap-0.5 px-1.5 py-0">
                  <CheckCircleFilled /> Đã mua hàng
                </Tag>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Rate disabled value={review.rating} className="text-amber-500 text-xs" />
              <span className="text-gray-400 text-xs">{review.createdAt}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ordered dishes tags */}
      {review.dishesOrdered && review.dishesOrdered.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {review.dishesOrdered.map((dish, idx) => (
            <span
              key={idx}
              className="text-[11px] font-medium bg-gray-50 border border-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full"
            >
              🍴 {dish}
            </span>
          ))}
        </div>
      )}

      {/* Review text */}
      <p className="text-gray-800 text-sm leading-relaxed">{review.content}</p>

      {/* Photos */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto py-1">
          {review.images.map((imgUrl, idx) => (
            <div
              key={idx}
              className="w-20 h-20 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 shadow-2xs"
            >
              <img
                src={imgUrl}
                alt={`Review photo ${idx + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform"
              />
            </div>
          ))}
        </div>
      )}

      {/* Restaurant Owner Reply */}
      {review.restaurantReply && (
        <div className="bg-orange-50/60 border border-orange-100 rounded-xl p-3.5 mt-2 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700">
            <MessageOutlined />
            <span>Phản hồi từ Quán ăn</span>
            <span className="text-gray-400 font-normal">• {review.restaurantReply.repliedAt}</span>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed italic">
            "{review.restaurantReply.content}"
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewCardItem;

