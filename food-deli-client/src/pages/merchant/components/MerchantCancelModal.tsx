import React from 'react';
import { Modal, Radio, Input, Typography } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import type { MerchantOrder } from '@/services/modules/orderApi';

const { Paragraph } = Typography;
const { TextArea } = Input;

export const CANCEL_REASONS = [
  'Quán tạm hết nguyên liệu chế biến món ăn',
  'Quán đang quá tải đơn, không kịp phục vụ',
  'Khách hàng gọi điện yêu cầu hủy đơn',
  'Quán có việc đột xuất phải đóng cửa sớm',
  'Lý do khác (Vui lòng nhập chi tiết bên dưới)',
];

interface MerchantCancelModalProps {
  isOpen: boolean;
  selectedOrder: MerchantOrder | null;
  presetReason: string;
  customReason: string;
  submitting: boolean;
  onPresetChange: (val: string) => void;
  onCustomChange: (val: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const MerchantCancelModal: React.FC<MerchantCancelModalProps> = ({
  isOpen,
  selectedOrder,
  presetReason,
  customReason,
  submitting,
  onPresetChange,
  onCustomChange,
  onClose,
  onSubmit,
}) => {
  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
          <CloseCircleOutlined />
          <span>Từ chối / Hủy đơn hàng {selectedOrder?.orderCode}</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      onOk={onSubmit}
      confirmLoading={submitting}
      okText="Xác nhận từ chối đơn"
      okButtonProps={{ danger: true, className: 'font-semibold' }}
      cancelText="Đóng"
      destroyOnClose
    >
      <div className="py-2 space-y-4">
        <Paragraph className="text-slate-600 text-xs mb-3">
          Vui lòng chọn lý do quán từ chối đơn để hệ thống thông báo rõ ràng đến Khách hàng và hoàn tiền (nếu thanh toán online):
        </Paragraph>

        <Radio.Group
          value={presetReason}
          onChange={(e) => onPresetChange(e.target.value)}
          className="flex flex-col gap-2.5"
        >
          {CANCEL_REASONS.map((reason) => (
            <Radio key={reason} value={reason} className="text-xs text-slate-700">
              {reason}
            </Radio>
          ))}
        </Radio.Group>

        {presetReason === CANCEL_REASONS[4] && (
          <div className="mt-2">
            <TextArea
              rows={3}
              placeholder="Nhập chi tiết lý do quán từ chối đơn..."
              value={customReason}
              onChange={(e) => onCustomChange(e.target.value)}
              maxLength={200}
              showCount
              className="text-xs rounded-lg"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};
