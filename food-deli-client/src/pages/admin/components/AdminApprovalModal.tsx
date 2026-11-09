import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Tag,
  Descriptions,
  Space,
  Alert,
  Divider,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ShopOutlined,
  CarOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  FileProtectOutlined,
  WarningOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;

export interface ApprovalPartnerData {
  id: number;
  userId?: number;
  type: 'MERCHANT' | 'DRIVER';
  name: string;
  phone: string;
  email?: string;
  address: string;
  businessLicense?: string;
  taxCode?: string;
  licensePlate?: string;
  vehicleType?: string;
  idCardNumber?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason?: string;
  createdAt?: string;
}

interface AdminApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: ApprovalPartnerData | null;
  onSuccess?: () => void;
}

export const AdminApprovalModal: React.FC<AdminApprovalModalProps> = ({
  isOpen,
  onClose,
  partner,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [showRejectForm, setShowRejectForm] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      form.resetFields();
      setShowRejectForm(false);
      if (partner?.rejectReason) {
        form.setFieldsValue({ rejectReason: partner.rejectReason });
      }
    }
  }, [isOpen, partner, form]);

  if (!partner) return null;

  const isMerchant = partner.type === 'MERCHANT';

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      // Simulate API call or call real endpoint
      await new Promise((resolve) => setTimeout(resolve, 600));
      message.success(`Đã phê duyệt hồ sơ đối tác ${partner.name} thành công!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err?.message || 'Có lỗi xảy ra khi phê duyệt hồ sơ!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectFinish = async (values: { rejectReason: string }) => {
    try {
      setSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 600));
      message.warning(`Đã từ chối hồ sơ đối tác với lý do: "${values.rejectReason}"`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err?.message || 'Có lỗi xảy ra khi từ chối hồ sơ!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2 text-base font-bold text-gray-900">
          {isMerchant ? (
            <ShopOutlined className="text-orange-500 text-lg" />
          ) : (
            <CarOutlined className="text-emerald-500 text-lg" />
          )}
          <span>
            Phê duyệt hồ sơ {isMerchant ? 'Quán ăn đối tác' : 'Tài xế giao hàng'} #{partner.id}
          </span>
        </div>
      }
      footer={null}
      width={720}
      destroyOnClose
      centered
      className="rounded-2xl overflow-hidden"
    >
      <div className="space-y-5 pt-3">
        {/* Status banner */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">Trạng thái hồ sơ:</span>
            {partner.status === 'APPROVED' && (
              <Tag color="success" icon={<CheckCircleOutlined />} className="px-2.5 py-0.5 rounded-lg font-bold">
                ĐÃ PHÊ DUYỆT
              </Tag>
            )}
            {partner.status === 'PENDING' && (
              <Tag color="processing" className="px-2.5 py-0.5 rounded-lg font-bold">
                CHỜ DUYỆT HỒ SƠ
              </Tag>
            )}
            {partner.status === 'REJECTED' && (
              <Tag color="error" icon={<CloseCircleOutlined />} className="px-2.5 py-0.5 rounded-lg font-bold">
                ĐÃ TỪ CHỐI
              </Tag>
            )}
          </div>
          <span className="text-xs text-gray-400">
            Ngày nộp: {partner.createdAt ? new Date(partner.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay'}
          </span>
        </div>

        {/* Rejection Note Alert if already rejected */}
        {partner.status === 'REJECTED' && partner.rejectReason && (
          <Alert
            type="error"
            showIcon
            icon={<WarningOutlined />}
            message="Lý do từ chối hồ sơ trước đó"
            description={partner.rejectReason}
            className="rounded-xl border-red-200"
          />
        )}

        {/* Detailed Descriptions */}
        <Descriptions
          bordered
          size="middle"
          column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
          className="rounded-xl overflow-hidden bg-white"
        >
          <Descriptions.Item label={<strong>Họ tên / Đại diện</strong>}>
            <span className="font-bold text-gray-800">{partner.name}</span>
          </Descriptions.Item>

          <Descriptions.Item label={<strong>Số điện thoại</strong>}>
            <Space>
              <PhoneOutlined className="text-blue-500" />
              <span className="font-semibold text-gray-800">{partner.phone}</span>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label={<strong>Địa chỉ đăng ký</strong>} span={2}>
            <Space align="start">
              <EnvironmentOutlined className="text-red-500 mt-1" />
              <span className="text-gray-700">{partner.address || 'Chưa cập nhật'}</span>
            </Space>
          </Descriptions.Item>

          {isMerchant ? (
            <>
              <Descriptions.Item label={<strong>Giấy phép KD (GPKD)</strong>}>
                <Space orientation="horizontal">
                  <FileProtectOutlined className="text-orange-500" />
                  <span className="font-mono font-semibold text-gray-900 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                    {partner.businessLicense || 'GPKD-HCM-2026-9988'}
                  </span>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label={<strong>Mã số thuế (MST)</strong>}>
                <span className="font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
                  {partner.taxCode || '0318992211'}
                </span>
              </Descriptions.Item>
            </>
          ) : (
            <>
              <Descriptions.Item label={<strong>Số CCCD / CMND</strong>}>
                <Space orientation="horizontal">
                  <IdcardOutlined className="text-emerald-500" />
                  <span className="font-mono font-semibold text-gray-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {partner.idCardNumber || '079123456789'}
                  </span>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label={<strong>Biển số xe & Loại xe</strong>}>
                <Space>
                  <Tag color="cyan" className="font-mono font-bold">
                    {partner.licensePlate || '59-A1 123.45'}
                  </Tag>
                  <span className="text-xs text-gray-600">({partner.vehicleType || 'Xe máy / Motorbike'})</span>
                </Space>
              </Descriptions.Item>
            </>
          )}
        </Descriptions>

        <Divider className="my-3" />

        {/* Action Form or Buttons */}
        {!showRejectForm ? (
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <Button onClick={onClose} className="rounded-xl w-full sm:w-auto font-medium">
              Đóng
            </Button>
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => setShowRejectForm(true)}
              className="rounded-xl w-full sm:w-auto font-semibold"
            >
              Từ chối hồ sơ
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={submitting}
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl w-full sm:w-auto font-bold shadow-xs"
            >
              Phê duyệt hồ sơ
            </Button>
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleRejectFinish}
            className="bg-red-50/50 p-4 rounded-2xl border border-red-100 space-y-3"
          >
            <div className="font-bold text-red-700 text-sm flex items-center gap-1.5">
              <CloseCircleOutlined /> Nhập lý do từ chối hồ sơ
            </div>

            <Form.Item
              name="rejectReason"
              label={<span className="text-xs font-semibold text-gray-700">Lý do từ chối (bắt buộc)</span>}
              rules={[
                { required: true, message: 'Vui lòng nhập lý do từ chối để đối tác nắm được thông tin!' },
                { min: 5, message: 'Lý do từ chối phải có ít nhất 5 ký tự!' },
              ]}
            >
              <TextArea
                rows={3}
                placeholder="Ví dụ: Ảnh chụp giấy phép kinh doanh bị mờ, địa chỉ không khớp với giấy phép đăng ký..."
                className="rounded-xl"
              />
            </Form.Item>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                onClick={() => setShowRejectForm(false)}
                className="rounded-xl font-medium"
                disabled={submitting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="primary"
                danger
                htmlType="submit"
                loading={submitting}
                className="rounded-xl font-bold shadow-xs"
              >
                Xác nhận từ chối hồ sơ
              </Button>
            </div>
          </Form>
        )}
      </div>
    </Modal>
  );
};

export default AdminApprovalModal;
