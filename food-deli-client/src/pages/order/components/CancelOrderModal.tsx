import React, { useState } from 'react';
import { Modal, Radio, Input, Button, message, Alert } from 'antd';
import {
  ExclamationCircleOutlined,
  CloseCircleFilled,
  WarningFilled,
} from '@ant-design/icons';
import { orderApi } from '@/services/modules/orderApi';

const { TextArea } = Input;

const CANCEL_REASONS = [
  'Đổi ý không muốn mua nữa',
  'Chọn nhầm món hoặc chọn sai topping',
  'Đặt nhầm địa chỉ nhận hàng hoặc số điện thoại',
  'Thời gian quán chuẩn bị món quá lâu',
  'Muốn thay đổi phương thức thanh toán',
  'Lý do khác',
];

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | string;
  orderCode: string;
  onSuccess: (reason: string) => void;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderCode,
  onSuccess,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleConfirmCancel = async () => {
    let finalReason = selectedReason;
    if (selectedReason === 'Lý do khác') {
      if (!customReason.trim()) {
        message.warning('Vui lòng nhập chi tiết lý do hủy đơn hàng!');
        return;
      }
      finalReason = customReason.trim();
    }

    setIsSubmitting(true);
    try {
      const response = await orderApi.cancelOrder(orderId, finalReason);
      if (response && response.status === 200) {
        message.success('Đã hủy đơn hàng thành công! Hệ thống đã hoàn kho nguyên liệu cho quán.');
        onSuccess(finalReason);
        onClose();
      } else {
        message.success('Đã gửi yêu cầu hủy đơn hàng thành công!');
        onSuccess(finalReason);
        onClose();
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể hủy đơn hàng. Quán ăn có thể đã bắt đầu nấu món!';
      message.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-rose-600 font-black text-base">
          <CloseCircleFilled className="text-xl text-rose-500" />
          <span>Hủy Đơn Hàng {orderCode}</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      centered
      className="cancel-order-modal"
    >
      <div className="space-y-4 pt-2">
        <Alert
          message="Lưu ý quan trọng"
          description="Bạn chỉ có thể hủy đơn khi đơn còn ở trạng thái Chờ xác nhận (PENDING). Khi quán ăn đã xác nhận và bắt đầu nấu món, đơn hàng sẽ không thể hủy."
          type="warning"
          showIcon
          icon={<WarningFilled className="text-amber-500" />}
          className="rounded-2xl border-amber-200 bg-amber-50/70"
        />

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Vui lòng chọn lý do hủy đơn:
          </label>
          <Radio.Group
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="w-full space-y-2.5"
          >
            {CANCEL_REASONS.map((r) => (
              <div
                key={r}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedReason === r
                    ? 'border-rose-400 bg-rose-50/50 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => setSelectedReason(r)}
              >
                <Radio value={r} className="font-semibold text-xs sm:text-sm text-gray-800">
                  {r}
                </Radio>
              </div>
            ))}
          </Radio.Group>
        </div>

        {selectedReason === 'Lý do khác' && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Nhập chi tiết lý do của bạn:
            </label>
            <TextArea
              rows={3}
              placeholder="Chia sẻ thêm lý do bạn muốn hủy đơn để chúng tôi cải thiện dịch vụ..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              maxLength={200}
              showCount
              className="rounded-xl border-gray-200 focus:border-rose-500 focus:ring-rose-500/20 text-xs sm:text-sm"
            />
          </div>
        )}

        <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
          <Button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl font-bold text-xs sm:text-sm h-10 px-4"
          >
            Quay lại
          </Button>
          <Button
            danger
            type="primary"
            onClick={handleConfirmCancel}
            loading={isSubmitting}
            className="bg-rose-600 hover:bg-rose-700 rounded-xl font-black text-xs sm:text-sm h-10 px-5 shadow-md shadow-rose-600/20 active:scale-95"
          >
            Xác nhận hủy đơn hàng
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CancelOrderModal;

