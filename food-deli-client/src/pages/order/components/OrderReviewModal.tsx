import React, { useState } from 'react';
import { Modal, Rate, Input, Button, Tag, message, Divider } from 'antd';
import {
  ShopOutlined,
  CarOutlined,
  StarFilled,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { CustomerOrder } from '@/types';
import { reviewApi } from '@/services/api/reviewApi';

interface OrderReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: CustomerOrder;
  onSuccess?: () => void;
}

export const OrderReviewModal: React.FC<OrderReviewModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}) => {
  // Restaurant rating state
  const [restaurantRating, setRestaurantRating] = useState<number>(5);
  const [restaurantComment, setRestaurantComment] = useState<string>('');
  const [selectedFoodItemId, setSelectedFoodItemId] = useState<number | undefined>(
    order.items && order.items.length > 0 ? (order.items[0].foodId as number) : undefined
  );

  // Driver rating state
  const [driverRating, setDriverRating] = useState<number>(5);
  const [driverComment, setDriverComment] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);

  const getRatingDesc = (val: number) => {
    switch (val) {
      case 5:
        return 'Tuyệt vời, rất hài lòng!';
      case 4:
        return 'Hài lòng, chất lượng tốt';
      case 3:
        return 'Bình thường, tạm ổn';
      case 2:
        return 'Chưa ngon, cần cải thiện';
      case 1:
        return 'Rất thất vọng';
      default:
        return '';
    }
  };

  const handleSubmit = async () => {
    if (!restaurantRating || restaurantRating < 1) {
      message.warning('Vui lòng chọn số sao đánh giá cho quán ăn!');
      return;
    }

    try {
      setSubmitting(true);
      await reviewApi.submitOrderReview({
        orderId: Number(order.id),
        restaurantReview: {
          rating: restaurantRating,
          comment: restaurantComment.trim() || undefined,
          foodItemId: selectedFoodItemId ? Number(selectedFoodItemId) : undefined,
        },
        driverReview: order.driverId
          ? {
              rating: driverRating,
              comment: driverComment.trim() || undefined,
            }
          : undefined,
      });

      message.success('Cảm ơn bạn! Đánh giá đơn hàng thành công.');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi gửi đánh giá';
      message.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-lg font-bold text-gray-900 border-b pb-3">
          <StarFilled className="text-amber-500" />
          <span>Đánh giá đơn hàng #{order.orderCode || order.id}</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={600}
      destroyOnClose
    >
      <div className="py-2 space-y-6 max-h-[75vh] overflow-y-auto px-1">
        {/* Phần 1: Đánh giá Quán Ăn */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-gray-800">
            <ShopOutlined className="text-orange-500 text-lg" />
            <span>Quán: {order.restaurantName || `Nhà hàng #${order.restaurantId}`}</span>
          </div>

          {/* Chọn món ăn cụ thể muốn review */}
          {order.items && order.items.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Chọn món ăn bạn muốn gắn vào đánh giá:
              </div>
              <div className="flex flex-wrap gap-2">
                {order.items.map((item) => {
                  const itemId = item.foodId || item.id;
                  const isSelected = selectedFoodItemId === itemId;
                  return (
                    <button
                      key={itemId}
                      type="button"
                      onClick={() => setSelectedFoodItemId(Number(itemId))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-orange-300'
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

          {/* Chọn số sao nhà hàng */}
          <div className="flex flex-col items-center justify-center gap-1 py-3 bg-orange-50/50 rounded-2xl border border-orange-100">
            <span className="text-xs font-bold text-gray-500">Chất lượng món ăn & quán:</span>
            <Rate
              value={restaurantRating}
              onChange={setRestaurantRating}
              className="text-amber-500 text-3xl"
            />
            <span className="text-sm font-bold text-orange-600 min-h-[20px]">
              {getRatingDesc(restaurantRating)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Nhận xét về món ăn & dịch vụ của quán:
            </label>
            <Input.TextArea
              rows={3}
              value={restaurantComment}
              onChange={(e) => setRestaurantComment(e.target.value)}
              placeholder="Món ăn vừa miệng chứ? Đóng gói cẩn thận không?..."
              className="rounded-xl"
            />
          </div>
        </div>

        {/* Phần 2: Đánh giá Tài Xế nếu có */}
        {order.driverId && (
          <>
            <Divider className="my-2" />
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-base font-bold text-gray-800">
                <CarOutlined className="text-emerald-500 text-lg" />
                <span>Nhân viên vận chuyển / Tài xế</span>
              </div>

              <div className="flex flex-col items-center justify-center gap-1 py-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <span className="text-xs font-bold text-gray-500">Dịch vụ giao hàng:</span>
                <Rate
                  value={driverRating}
                  onChange={setDriverRating}
                  className="text-amber-500 text-3xl"
                />
                <span className="text-sm font-bold text-emerald-600 min-h-[20px]">
                  {getRatingDesc(driverRating)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Nhận xét về tài xế (thời gian giao, thái độ):
                </label>
                <Input.TextArea
                  rows={2}
                  value={driverComment}
                  onChange={(e) => setDriverComment(e.target.value)}
                  placeholder="Tài xế giao nhanh, thái độ lịch sự chu đáo..."
                  className="rounded-xl"
                />
              </div>
            </div>
          </>
        )}

        {/* Thông tin quy tắc 24 giờ */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
          <strong>Lưu ý:</strong> Đánh giá đơn hàng chỉ được thực hiện duy nhất <strong>1 lần</strong> trong vòng <strong>24 giờ</strong> kể từ thời điểm đơn hàng giao thành công.
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button onClick={onClose} className="rounded-xl font-semibold">
            Đóng
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={submitting}
            className="bg-orange-500 hover:bg-orange-600 rounded-xl font-bold shadow-xs px-6"
          >
            Gửi đánh giá
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default OrderReviewModal;

