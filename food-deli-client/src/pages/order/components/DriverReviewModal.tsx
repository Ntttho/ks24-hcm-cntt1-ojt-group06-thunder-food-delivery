import React, { useState } from 'react';
import { Modal, Rate, Input, Button, Tag, message } from 'antd';
import {
  CarOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import type { CustomerOrder } from '@/types';
import { reviewApi } from '@/services/api/reviewApi';

interface DriverReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: CustomerOrder;
  onSuccess?: () => void;
}

const QUICK_TAGS = [
  '⚡ Giao siêu tốc',
  '😊 Thân thiện & Lịch sự',
  '📦 Bảo quản món nguyên vẹn',
  '🚪 Giao tận cửa phòng',
  '📞 Gọi điện trước chu đáo',
  '🛵 Lái xe an toàn',
];

export const DriverReviewModal: React.FC<DriverReviewModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['⚡ Giao siêu tốc', '😊 Thân thiện & Lịch sự']);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const getRatingDesc = (val: number) => {
    switch (val) {
      case 5:
        return 'Tuyệt vời, shipper rất chuyên nghiệp!';
      case 4:
        return 'Hài lòng, giao nhanh đúng hẹn';
      case 3:
        return 'Bình thường, tạm ổn';
      case 2:
        return 'Giao chậm / cần cải thiện thái độ';
      case 1:
        return 'Rất thất vọng về shipper';
      default:
        return '';
    }
  };

  const handleSubmit = async () => {
    if (!rating || rating < 1) {
      message.warning('Vui lòng chọn số sao đánh giá cho tài xế!');
      return;
    }

    try {
      setSubmitting(true);
      await reviewApi.submitDriverReview({
        orderId: Number(order.id),
        rating,
        comment: comment.trim() || undefined,
        quickTags: selectedTags.length > 0 ? selectedTags : undefined,
      });

      message.success('Cảm ơn bạn! Đánh giá tài xế đã được ghi nhận.');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi gửi đánh giá tài xế';
      message.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-gray-900 border-b pb-3">
          <CarOutlined className="text-emerald-500 text-xl" />
          <span>Đánh giá Tài xế giao hàng - Đơn #{order.orderCode || order.id}</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={540}
      destroyOnClose
    >
      <div className="py-3 space-y-5">
        {/* Driver Profile Summary Card */}
        <div className="flex items-center gap-3 p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xl font-bold shadow-2xs shrink-0">
            <UserOutlined />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-gray-900 text-sm sm:text-base truncate">
                {order.driverName || `Tài xế đối tác #${order.driverId || 'Thunder'}`}
              </span>
              <Tag color="green" className="text-[10px] font-bold rounded-md">
                Shipper chính thức
              </Tag>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <span>Giao đơn hàng từ: {order.restaurantName || 'Quán ăn'}</span>
            </div>
          </div>
        </div>

        {/* Rating Stars Picker */}
        <div className="flex flex-col items-center justify-center gap-1 py-4 bg-gray-50 rounded-2xl border border-gray-100">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Bạn chấm điểm dịch vụ shipper bao nhiêu sao?
          </span>
          <Rate
            value={rating}
            onChange={setRating}
            className="text-amber-500 text-3xl my-1"
          />
          <span className="text-sm font-bold text-emerald-600 min-h-[20px]">
            {getRatingDesc(rating)}
          </span>
        </div>

        {/* Quick Review Tags */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2">
            Đánh giá nhanh trải nghiệm:
          </label>
          <div className="flex flex-wrap gap-2">
            {QUICK_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-2xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  {isSelected && <CheckCircleOutlined />}
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Comment Input */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Góp ý thêm cho tài xế (không bắt buộc):
          </label>
          <Input.TextArea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tài xế có gọi trước khi tới không? Thái độ khi giao hàng thế nào?..."
            className="rounded-xl"
          />
        </div>

        {/* 24-hour validity badge note */}
        <div className="text-xs text-gray-400 bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-center gap-1.5">
          <ThunderboltFilled className="text-amber-500" />
          <span>Đánh giá tài xế có hiệu lực trong vòng 24 giờ kể từ khi hoàn tất đơn.</span>
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
            className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold px-6 shadow-xs"
          >
            Gửi đánh giá tài xế
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DriverReviewModal;

