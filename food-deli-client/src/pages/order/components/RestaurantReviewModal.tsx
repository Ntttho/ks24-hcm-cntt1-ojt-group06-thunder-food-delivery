import React, { useState } from 'react';
import { Modal, Rate, Input, Button, Tag, message } from 'antd';
import {
  ShopOutlined,
  CheckCircleOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import type { CustomerOrder } from '@/types';
import { reviewApi } from '@/services/api/reviewApi';

interface RestaurantReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: CustomerOrder;
  onSuccess?: () => void;
}

export const RestaurantReviewModal: React.FC<RestaurantReviewModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [selectedFoodItemId, setSelectedFoodItemId] = useState<number | undefined>(
    order.items && order.items.length > 0 ? (order.items[0].foodId as number) : undefined
  );
  const [submitting, setSubmitting] = useState<boolean>(false);

  const getRatingDesc = (val: number) => {
    switch (val) {
      case 5:
        return 'Tuyệt vời, món ăn rất ngon!';
      case 4:
        return 'Hài lòng, đóng gói cẩn thận';
      case 3:
        return 'Bình thường, tạm ổn';
      case 2:
        return 'Chưa ngon, cần cải thiện';
      case 1:
        return 'Rất thất vọng về món ăn';
      default:
        return '';
    }
  };

  const handleSubmit = async () => {
    if (!rating || rating < 1) {
      message.warning('Vui lòng chọn số sao đánh giá cho quán ăn!');
      return;
    }

    try {
      setSubmitting(true);
      await reviewApi.submitRestaurantReview({
        orderId: Number(order.id),
        rating,
        comment: comment.trim() || undefined,
        foodItemId: selectedFoodItemId ? Number(selectedFoodItemId) : undefined,
      });

      message.success('Cảm ơn bạn! Đánh giá quán ăn đã được đăng thành công.');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi gửi đánh giá quán ăn';
      message.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-gray-900 border-b pb-3">
          <ShopOutlined className="text-orange-500 text-xl" />
          <span>Đánh giá Quán ăn - Đơn #{order.orderCode || order.id}</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={560}
      destroyOnClose
    >
      <div className="py-3 space-y-5">
        {/* Restaurant Header */}
        <div className="flex items-center gap-3 p-3.5 bg-orange-50/60 rounded-2xl border border-orange-100">
          <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center text-xl font-bold shadow-2xs shrink-0">
            <ShopOutlined />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-gray-900 text-base truncate">
              {order.restaurantName || `Quán ăn #${order.restaurantId}`}
            </div>
            <div className="text-xs text-gray-500">
              Đơn đặt gồm {order.items?.length || 0} món ăn
            </div>
          </div>
        </div>

        {/* Chọn món ăn cụ thể muốn review */}
        {order.items && order.items.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">
              Chọn món ăn bạn muốn gắn vào đánh giá:
            </label>
            <div className="flex flex-wrap gap-2">
              {order.items.map((item) => {
                const itemId = item.foodId || item.id;
                const isSelected = selectedFoodItemId === itemId;
                return (
                  <button
                    key={itemId}
                    type="button"
                    onClick={() => setSelectedFoodItemId(Number(itemId))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-orange-500 text-white border-orange-500 shadow-2xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {isSelected && <CheckCircleOutlined />}
                    <span>{item.foodName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Rating Stars Picker */}
        <div className="flex flex-col items-center justify-center gap-1 py-4 bg-gray-50 rounded-2xl border border-gray-100">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Bạn chấm chất lượng món ăn bao nhiêu sao?
          </span>
          <Rate
            value={rating}
            onChange={setRating}
            className="text-amber-500 text-3xl my-1"
          />
          <span className="text-sm font-bold text-orange-600 min-h-[20px]">
            {getRatingDesc(rating)}
          </span>
        </div>

        {/* Comment Input */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Cảm nhận chi tiết về hương vị & đóng gói:
          </label>
          <Input.TextArea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Món ăn có nóng hổi không? Nêm nếm vừa miệng chứ? Quán đóng gói cẩn thận không?..."
            className="rounded-xl"
          />
        </div>

        {/* 24-hour validity badge note */}
        <div className="text-xs text-gray-400 bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-center gap-1.5">
          <ThunderboltFilled className="text-amber-500" />
          <span>Đánh giá món ăn có hiệu lực trong vòng 24 giờ kể từ khi hoàn tất đơn.</span>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Button onClick={onClose} className="rounded-xl font-semibold">
            Bỏ qua
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={submitting}
            className="bg-orange-500 hover:bg-orange-600 rounded-xl font-bold px-6 shadow-xs"
          >
            Gửi đánh giá quán
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RestaurantReviewModal;

