import React, { useState } from 'react';
import { Modal, Rate, Input, Button, message } from 'antd';
import { CameraOutlined } from '@ant-design/icons';

interface ReviewWriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopName: string;
  onSubmitReview: (reviewData: { rating: number; content: string; images: string[] }) => void;
}

export const ReviewWriteModal: React.FC<ReviewWriteModalProps> = ({
  isOpen,
  onClose,
  shopName,
  onSubmitReview,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = () => {
    if (!content.trim()) {
      message.warning('Vui lòng chia sẻ đôi lời cảm nhận về món ăn!');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      onSubmitReview({
        rating,
        content: content.trim(),
        images: [
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        ],
      });
      setLoading(false);
      setContent('');
      setRating(5);
      onClose();
      message.success('Cảm ơn bạn! Đánh giá đã được đăng thành công.');
    }, 600);
  };

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
        return 'Rất thất vọng';
      default:
        return '';
    }
  };

  return (
    <Modal
      title={
        <div className="text-base font-bold text-gray-900">
          Đánh giá trải nghiệm tại {shopName}
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnClose
    >
      <div className="py-4 space-y-5">
        {/* Rating Stars Picker */}
        <div className="flex flex-col items-center justify-center gap-2 py-3 bg-gray-50 rounded-2xl">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Bạn chấm quán bao nhiêu sao?
          </span>
          <Rate
            value={rating}
            onChange={setRating}
            className="text-amber-500 text-3xl"
          />
          <span className="text-sm font-bold text-orange-600 min-h-[20px]">
            {getRatingDesc(rating)}
          </span>
        </div>

        {/* Comment Input */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Nhận xét chi tiết của bạn
          </label>
          <Input.TextArea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Món ăn có nóng hổi không? Hương vị vừa miệng chứ? Tài xế giao hàng có chu đáo không?..."
            className="rounded-xl"
            maxLength={500}
            showCount
          />
        </div>

        {/* Mock Photo Upload Attachment */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Đính kèm hình ảnh món ăn
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => message.info('Đã chọn hình ảnh đính kèm!')}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 hover:border-orange-500 flex flex-col items-center justify-center text-gray-400 hover:text-orange-500 transition-colors cursor-pointer"
            >
              <CameraOutlined className="text-2xl" />
              <span className="text-[10px] font-semibold mt-1">Thêm ảnh</span>
            </button>
            <div className="text-xs text-gray-400 leading-relaxed">
              Tối đa 4 ảnh, dung lượng dưới 5MB. Hình ảnh đẹp sẽ được ưu tiên hiển thị đầu trang.
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
          <Button onClick={onClose} className="rounded-xl font-semibold">
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
            className="bg-orange-500 hover:bg-orange-600 rounded-xl font-bold px-6 shadow-sm"
          >
            Gửi đánh giá
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReviewWriteModal;

