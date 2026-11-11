import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, Space, Tag } from 'antd';
import { CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

interface RejectReasonModalProps {
  isOpen: boolean;
  title?: string;
  subTitle?: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

const PRESET_REASONS = [
  'Thông tin đăng ký chưa đầy đủ hoặc không chính xác',
  'Hình ảnh quán ăn / phương tiện không đạt tiêu chuẩn',
  'Số CCCD hoặc biển số xe không hợp lệ',
  'Địa chỉ và tọa độ GPS không trùng khớp',
  'Quán chưa đáp ứng đủ điều kiện an toàn thực phẩm',
];

export const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  isOpen,
  title = 'Từ Chối Hồ Sơ',
  subTitle,
  submitting,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen) {
      form.resetFields();
    }
  }, [isOpen, form]);

  const handleFinish = async (values: { reason: string }) => {
    await onSubmit(values.reason.trim());
  };

  const handleSelectPreset = (preset: string) => {
    form.setFieldsValue({ reason: preset });
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2 text-rose-600">
          <CloseCircleOutlined className="text-lg" />
          <span className="font-bold text-base">{title}</span>
        </div>
      }
      footer={null}
      destroyOnClose
      centered
      width={520}
    >
      <div className="pt-2">
        {subTitle && (
          <p className="text-sm text-slate-500 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            {subTitle}
          </p>
        )}

        <div className="mb-3">
          <span className="text-xs font-semibold text-slate-500 block mb-1.5">Gợi ý lý do nhanh:</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_REASONS.map((preset, idx) => (
              <Tag
                key={idx}
                className="cursor-pointer hover:border-rose-400 hover:text-rose-600 text-xs py-0.5 px-2 rounded-md transition-all"
                onClick={() => handleSelectPreset(preset)}
              >
                {preset}
              </Tag>
            ))}
          </div>
        </div>

        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item
            name="reason"
            label={<span className="font-semibold text-slate-700">Lý do từ chối hồ sơ (Gửi đến đối tác)</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập lý do từ chối!' },
              { min: 5, message: 'Lý do từ chối phải có ít nhất 5 ký tự!' },
              { max: 500, message: 'Lý do từ chối không được vượt quá 500 ký tự!' },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập lý do chi tiết để thông báo cho đối tác biết và khắc phục..."
              showCount
              maxLength={500}
              className="rounded-lg"
            />
          </Form.Item>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button onClick={onClose} disabled={submitting} className="rounded-lg px-4">
              Hủy bỏ
            </Button>
            <Button
              type="primary"
              danger
              htmlType="submit"
              loading={submitting}
              icon={<ExclamationCircleOutlined />}
              className="font-medium rounded-lg px-5 shadow-sm"
            >
              Xác nhận Từ Chối
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};
