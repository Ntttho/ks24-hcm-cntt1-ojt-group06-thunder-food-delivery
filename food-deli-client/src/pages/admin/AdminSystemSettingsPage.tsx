import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, InputNumber, Modal, Spin, message } from 'antd';
import { SaveOutlined, SettingOutlined } from '@ant-design/icons';
import { systemSettingsApi, type SystemSettings, type UpdateSystemSettings } from '@/services/modules/systemSettingsApi';

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const apiMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (apiMessage) return apiMessage;
  }
  return error instanceof Error ? error.message : 'Không thể tải hoặc lưu cấu hình. Vui lòng thử lại.';
};

const formatUpdatedAt = (value: string | null | undefined): string =>
  value ? new Date(value).toLocaleString('vi-VN') : 'Chưa ghi nhận';

export const AdminSystemSettingsPage: React.FC = () => {
  const [form] = Form.useForm<UpdateSystemSettings>();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await systemSettingsApi.getAdminSettings();
      if (!response.data) {
        throw new Error('Máy chủ không trả về cấu hình hệ thống.');
      }
      setSettings(response.data);
      form.setFieldsValue({
        defaultShippingFee: response.data.defaultShippingFee,
        shippingFeePerKilometer: response.data.shippingFeePerKilometer,
        platformCommissionRate: response.data.platformCommissionRate ?? undefined,
      });
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const handleSave = (values: UpdateSystemSettings) => {
    Modal.confirm({
      title: 'Xác nhận thay đổi cấu hình',
      content: 'Các đơn hàng mới sẽ áp dụng mức phí và tỷ lệ hoa hồng sau khi lưu. Đơn hàng đã tạo không bị cập nhật.',
      okText: 'Lưu cấu hình',
      cancelText: 'Quay lại',
      onOk: async () => {
        setSaving(true);
        try {
          const response = await systemSettingsApi.updateAdminSettings(values);
          if (!response.data) {
            throw new Error('Máy chủ không trả về cấu hình sau khi cập nhật.');
          }
          setSettings(response.data);
          form.setFieldsValue({
            defaultShippingFee: response.data.defaultShippingFee,
            shippingFeePerKilometer: response.data.shippingFeePerKilometer,
            platformCommissionRate: response.data.platformCommissionRate ?? undefined,
          });
          message.success('Đã lưu cấu hình hệ thống.');
        } catch (error) {
          message.error(getErrorMessage(error));
        } finally {
          setSaving(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spin size="large" tip="Đang tải cấu hình hệ thống..." />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <Alert
          type="error"
          showIcon
          message="Không thể tải cấu hình hệ thống"
          description={loadError}
          action={<Button onClick={() => void loadSettings()}>Thử lại</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-6">
      <div>
        <div className="flex items-center gap-3">
          <SettingOutlined className="text-2xl text-orange-500" />
          <h1 className="m-0 text-2xl font-extrabold text-gray-900">Cấu hình hệ thống</h1>
        </div>
        <p className="mb-0 mt-2 text-sm text-gray-500">
          Thiết lập phí giao hàng và hoa hồng áp dụng cho đơn hàng mới.
        </p>
      </div>

      {settings?.platformCommissionRate == null && (
        <Alert
          type="warning"
          showIcon
          message="Chưa có tỷ lệ hoa hồng được lưu"
          description="Nhập tỷ lệ hoa hồng và lưu để bắt đầu áp dụng cho các đơn hàng mới."
        />
      )}

      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <Form form={form} layout="vertical" onFinish={handleSave} requiredMark={false}>
          <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
            <Form.Item
              name="defaultShippingFee"
              label={<span className="font-semibold">Phí ship mặc định</span>}
              extra="Phần phí cơ bản được tính cho mỗi đơn giao hàng."
              rules={[
                { required: true, message: 'Vui lòng nhập phí ship mặc định.' },
                { type: 'number', min: 0, message: 'Giá trị không được âm.' },
              ]}
            >
              <InputNumber min={0} precision={2} className="w-full" addonAfter="VNĐ" />
            </Form.Item>

            <Form.Item
              name="shippingFeePerKilometer"
              label={<span className="font-semibold">Phí ship mỗi kilomet</span>}
              extra="Phí giao hàng được nhân với khoảng cách giao."
              rules={[
                { required: true, message: 'Vui lòng nhập phí ship/km.' },
                { type: 'number', min: 0, message: 'Giá trị không được âm.' },
              ]}
            >
              <InputNumber min={0} precision={2} className="w-full" addonAfter="VNĐ/km" />
            </Form.Item>

            <Form.Item
              name="platformCommissionRate"
              label={<span className="font-semibold">Tỷ lệ hoa hồng sàn</span>}
              extra="Tỷ lệ tính trên giá trị món ăn để xác định khoản hoa hồng."
              rules={[
                { required: true, message: 'Vui lòng nhập tỷ lệ hoa hồng.' },
                { type: 'number', min: 0, max: 100, message: 'Tỷ lệ phải nằm trong khoảng 0–100%.' },
              ]}
            >
              <InputNumber min={0} max={100} precision={2} className="w-full" addonAfter="%" />
            </Form.Item>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="m-0 text-xs text-gray-500">
              Phí ship: {formatUpdatedAt(settings?.defaultShippingFeeUpdatedAt)} · Phí/km:{' '}
              {formatUpdatedAt(settings?.shippingFeePerKilometerUpdatedAt)} · Hoa hồng:{' '}
              {formatUpdatedAt(settings?.platformCommissionRateUpdatedAt)}
            </p>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saving}
              className="bg-orange-500 sm:min-w-40"
            >
              Lưu cấu hình
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default AdminSystemSettingsPage;
