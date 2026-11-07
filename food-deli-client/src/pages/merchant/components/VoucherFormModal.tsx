import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  Button,
  Space,
  Row,
  Col,
} from 'antd';
import {
  GiftOutlined,
  EditOutlined,
  TagOutlined,
  DollarOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type {
  VoucherItem,
  CreateVoucherPayload,
  UpdateVoucherPayload,
} from '@/services/modules/restaurantApi';

const { RangePicker } = DatePicker;

interface VoucherFormModalProps {
  isOpen: boolean;
  editingVoucher: VoucherItem | null;
  restaurantId: number | string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: CreateVoucherPayload | UpdateVoucherPayload) => Promise<void>;
}

export const VoucherFormModal: React.FC<VoucherFormModalProps> = ({
  isOpen,
  editingVoucher,
  restaurantId,
  submitting,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const discountType = Form.useWatch('discountType', form);

  useEffect(() => {
    if (isOpen) {
      if (editingVoucher) {
        form.setFieldsValue({
          code: editingVoucher.code,
          discountType: editingVoucher.discountType || 'FIXED',
          discountValue: editingVoucher.discountValue,
          maxDiscountAmount: editingVoucher.maxDiscountAmount,
          minOrderValue: editingVoucher.minOrderValue ?? 0,
          usageLimit: editingVoucher.usageLimit,
          dateRange: [
            editingVoucher.startDate ? dayjs(editingVoucher.startDate) : dayjs(),
            editingVoucher.expiryDate ? dayjs(editingVoucher.expiryDate) : dayjs().add(30, 'day'),
          ],
          isActive: editingVoucher.isActive ?? true,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          discountType: 'FIXED',
          discountValue: 20000,
          minOrderValue: 50000,
          dateRange: [dayjs(), dayjs().add(30, 'day')],
          isActive: true,
        });
      }
    }
  }, [isOpen, editingVoucher, form]);

  const handleFinish = async (values: any) => {
    const startDate = values.dateRange?.[0]
      ? dayjs(values.dateRange[0]).format('YYYY-MM-DDTHH:mm:ss')
      : undefined;
    const expiryDate = values.dateRange?.[1]
      ? dayjs(values.dateRange[1]).format('YYYY-MM-DDTHH:mm:ss')
      : dayjs().add(30, 'day').format('YYYY-MM-DDTHH:mm:ss');

    if (editingVoucher) {
      const payload: UpdateVoucherPayload = {
        discountType: values.discountType,
        discountValue: Number(values.discountValue),
        maxDiscountAmount:
          values.discountType === 'PERCENTAGE' && values.maxDiscountAmount
            ? Number(values.maxDiscountAmount)
            : undefined,
        minOrderValue: values.minOrderValue ? Number(values.minOrderValue) : 0,
        usageLimit: values.usageLimit ? Number(values.usageLimit) : undefined,
        startDate,
        expiryDate,
        isActive: values.isActive ?? true,
      };
      await onSubmit(payload);
    } else {
      const payload: CreateVoucherPayload = {
        restaurantId: Number(restaurantId),
        code: values.code.trim().toUpperCase(),
        discountType: values.discountType,
        discountValue: Number(values.discountValue),
        maxDiscountAmount:
          values.discountType === 'PERCENTAGE' && values.maxDiscountAmount
            ? Number(values.maxDiscountAmount)
            : undefined,
        minOrderValue: values.minOrderValue ? Number(values.minOrderValue) : 0,
        usageLimit: values.usageLimit ? Number(values.usageLimit) : undefined,
        startDate,
        expiryDate,
      };
      await onSubmit(payload);
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2">
          {editingVoucher ? (
            <EditOutlined className="text-orange-500 text-lg" />
          ) : (
            <GiftOutlined className="text-orange-500 text-lg" />
          )}
          <span className="font-bold text-slate-800">
            {editingVoucher ? 'Chỉnh Sửa Voucher' : 'Tạo Mã Giảm Giá Mới'}
          </span>
        </div>
      }
      footer={null}
      destroyOnClose
      width={600}
      centered
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} className="pt-3">
        <Row gutter={16}>
          <Col span={14}>
            <Form.Item
              name="code"
              label={<span className="font-semibold text-slate-700">Mã voucher</span>}
              rules={[
                { required: !editingVoucher, message: 'Vui lòng nhập mã voucher!' },
                {
                  pattern: /^[A-Za-z0-9_]{3,20}$/,
                  message: 'Mã từ 3-20 ký tự gồm chữ, số và dấu gạch dưới!',
                },
              ]}
            >
              <Input
                prefix={<TagOutlined className="text-slate-400" />}
                placeholder="Ví dụ: GIAM20K, CHAOBANMOI"
                disabled={!!editingVoucher}
                className="uppercase font-mono"
              />
            </Form.Item>
          </Col>

          <Col span={10}>
            <Form.Item
              name="discountType"
              label={<span className="font-semibold text-slate-700">Loại giảm giá</span>}
              rules={[{ required: true, message: 'Chọn loại giảm giá!' }]}
            >
              <Select
                options={[
                  {
                    value: 'FIXED',
                    label: (
                      <span>
                        <DollarOutlined className="text-emerald-500 mr-1.5" /> Số tiền cố định
                      </span>
                    ),
                  },
                  {
                    value: 'PERCENTAGE',
                    label: (
                      <span>
                        <PercentageOutlined className="text-blue-500 mr-1.5" /> Phần trăm (%)
                      </span>
                    ),
                  },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="discountValue"
              label={
                <span className="font-semibold text-slate-700">
                  {discountType === 'PERCENTAGE' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)'}
                </span>
              }
              rules={[
                { required: true, message: 'Nhập giá trị giảm!' },
                {
                  type: 'number',
                  min: 1,
                  max: discountType === 'PERCENTAGE' ? 100 : 10000000,
                  message:
                    discountType === 'PERCENTAGE'
                      ? 'Phần trăm từ 1% đến 100%!'
                      : 'Số tiền tối thiểu 1 VNĐ!',
                },
              ]}
            >
              <InputNumber
                className="w-full"
                formatter={(val) =>
                  discountType === 'PERCENTAGE'
                    ? `${val}%`
                    : `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
                parser={(val) => Number(val?.replace(/\$\s?|(,*)|(%*)/g, '')) as any}
                placeholder={discountType === 'PERCENTAGE' ? 'Ví dụ: 15' : 'Ví dụ: 20,000'}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="maxDiscountAmount"
              label={
                <span className="font-semibold text-slate-700">
                  Giảm tối đa (VNĐ){' '}
                  {discountType !== 'PERCENTAGE' && (
                    <span className="text-slate-400 font-normal text-xs">(Không áp dụng)</span>
                  )}
                </span>
              }
            >
              <InputNumber
                className="w-full"
                disabled={discountType !== 'PERCENTAGE'}
                formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(val) => Number(val?.replace(/\$\s?|(,*)/g, '')) as any}
                placeholder="Ví dụ: 50,000"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="minOrderValue"
              label={<span className="font-semibold text-slate-700">Đơn tối thiểu (VNĐ)</span>}
            >
              <InputNumber
                className="w-full"
                formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(val) => Number(val?.replace(/\$\s?|(,*)/g, '')) as any}
                placeholder="Ví dụ: 50,000 (0 = Không yêu cầu)"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="usageLimit"
              label={
                <span className="font-semibold text-slate-700">
                  Giới hạn lượt dùng{' '}
                  <span className="text-slate-400 font-normal text-xs">(Để trống = Vô hạn)</span>
                </span>
              }
            >
              <InputNumber className="w-full" min={1} placeholder="Ví dụ: 100" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="dateRange"
          label={<span className="font-semibold text-slate-700">Thời hạn áp dụng</span>}
          rules={[{ required: true, message: 'Vui lòng chọn thời gian áp dụng voucher!' }]}
        >
          <RangePicker
            showTime
            format="DD/MM/YYYY HH:mm"
            className="w-full"
            placeholder={['Ngày bắt đầu', 'Ngày hết hạn']}
          />
        </Form.Item>

        {editingVoucher && (
          <Form.Item
            name="isActive"
            label={<span className="font-semibold text-slate-700">Trạng thái phát hành</span>}
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Đang hoạt động"
              unCheckedChildren="Tạm dừng"
              className="bg-slate-300"
            />
          </Form.Item>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Space>
            <Button onClick={onClose} disabled={submitting}>
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              className="bg-orange-500 hover:bg-orange-600 border-none font-semibold"
            >
              {editingVoucher ? 'Lưu thay đổi' : 'Tạo Voucher'}
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

