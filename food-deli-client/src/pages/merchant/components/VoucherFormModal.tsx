import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Radio,
  DatePicker,
  Switch,
  Button,
  Space,
  Row,
  Col,
  Tag,
} from 'antd';
import {
  GiftOutlined,
  ThunderboltOutlined,
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

export interface VoucherFormModalProps {
  isOpen?: boolean;
  open?: boolean;
  editingVoucher?: VoucherItem | null;
  restaurantId: number | string;
  submitting?: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: CreateVoucherPayload | UpdateVoucherPayload) => Promise<void>;
}

export const VoucherFormModal: React.FC<VoucherFormModalProps> = ({
  isOpen,
  open,
  editingVoucher,
  restaurantId,
  submitting = false,
  loading = false,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');

  const visible = open ?? isOpen ?? false;
  const isBusy = loading || submitting;

  useEffect(() => {
    if (visible) {
      if (editingVoucher) {
        const type = editingVoucher.discountType || 'FIXED';
        setDiscountType(type);
        form.setFieldsValue({
          code: editingVoucher.code,
          discountType: type,
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
        setDiscountType('PERCENTAGE');
        form.setFieldsValue({
          discountType: 'PERCENTAGE',
          discountValue: 15,
          maxDiscountAmount: 30000,
          minOrderValue: 50000,
          usageLimit: 100,
          dateRange: [dayjs(), dayjs().add(30, 'day')],
          isActive: true,
        });
      }
    }
  }, [visible, editingVoucher, form]);

  const handleGenerateCode = () => {
    const prefixes = ['THUNDER', 'GIAM', 'SALE', 'PROMO', 'VIP'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(10 + Math.random() * 90);
    form.setFieldsValue({ code: `${randomPrefix}${randomNum}` });
  };

  const handleApplyPreset = (code: string, type: 'PERCENTAGE' | 'FIXED', val: number, max?: number, min?: number) => {
    setDiscountType(type);
    form.setFieldsValue({
      code,
      discountType: type,
      discountValue: val,
      maxDiscountAmount: max,
      minOrderValue: min ?? 0,
    });
  };

  const handleFinish = async (values: any) => {
    const [startDateRaw, expiryDateRaw] = values.dateRange || [];
    const startDate = startDateRaw ? dayjs(startDateRaw).toISOString() : new Date().toISOString();
    const expiryDate = expiryDateRaw
      ? dayjs(expiryDateRaw).toISOString()
      : dayjs().add(30, 'day').toISOString();

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
        isActive: values.isActive,
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
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <GiftOutlined />
          </div>
          <div>
            <div className="font-bold text-base">
              {editingVoucher ? `Chỉnh sửa Voucher: ${editingVoucher.code}` : 'Tạo Voucher Khuyến Mãi Mới'}
            </div>
            <div className="text-xs text-slate-400 font-normal">
              {editingVoucher
                ? 'Cập nhật điều kiện hoặc thời hạn áp dụng của mã giảm giá'
                : 'Phát hành mã giảm giá cho quán — Khách hàng có thể nhập mã ngay tại trang Checkout'}
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      centered
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="mt-4 space-y-3"
        requiredMark={false}
      >
        {/* Code Input with auto-generator */}
        <Form.Item
          name="code"
          label={<span className="font-semibold text-slate-700">Mã Voucher (Code)</span>}
          rules={[
            { required: true, message: 'Vui lòng nhập mã voucher!' },
            {
              pattern: /^[A-Za-z0-9_]{3,20}$/,
              message: 'Mã voucher từ 3-20 ký tự (chữ, số hoặc gạch dưới)!',
            },
          ]}
          extra="Mã tự động chuyển thành chữ hoa. Khách hàng sẽ nhập mã này tại bước thanh toán."
        >
          <div className="flex gap-2">
            <Input
              disabled={!!editingVoucher}
              placeholder="VD: GIAM20K, SALE50, THUNDER30"
              size="large"
              className="rounded-lg uppercase font-bold tracking-wider text-slate-800"
              maxLength={20}
              onChange={(e) => {
                form.setFieldsValue({ code: e.target.value.toUpperCase() });
              }}
            />
            {!editingVoucher && (
              <Button
                icon={<ThunderboltOutlined />}
                onClick={handleGenerateCode}
                size="large"
                className="rounded-lg text-orange-600 border-orange-200 hover:border-orange-500 font-medium"
              >
                Tạo mã nhanh
              </Button>
            )}
          </div>
        </Form.Item>

        {/* Quick Presets for New Voucher */}
        {!editingVoucher && (
          <div className="flex flex-wrap items-center gap-1.5 pb-2">
            <span className="text-xs text-slate-400">Gợi ý mẫu:</span>
            <Tag
              className="cursor-pointer hover:border-orange-500"
              color="orange"
              onClick={() => handleApplyPreset('THUNDER20', 'PERCENTAGE', 20, 30000, 60000)}
            >
              THUNDER20 (Giảm 20% max 30k)
            </Tag>
            <Tag
              className="cursor-pointer hover:border-orange-500"
              color="volcano"
              onClick={() => handleApplyPreset('GIAM15K', 'FIXED', 15000, undefined, 50000)}
            >
              GIAM15K (Giảm thẳng 15k)
            </Tag>
            <Tag
              className="cursor-pointer hover:border-orange-500"
              color="purple"
              onClick={() => handleApplyPreset('CHAOQUANMOI', 'PERCENTAGE', 50, 50000, 100000)}
            >
              CHAOQUANMOI (Giảm 50% max 50k)
            </Tag>
          </div>
        )}

        {/* Discount Type Radio */}
        <Form.Item
          name="discountType"
          label={<span className="font-semibold text-slate-700">Hình thức giảm giá</span>}
        >
          <Radio.Group
            buttonStyle="solid"
            className="w-full grid grid-cols-2 gap-2"
            onChange={(e) => setDiscountType(e.target.value)}
          >
            <Radio.Button
              value="PERCENTAGE"
              className="text-center rounded-lg h-10 leading-10 font-medium"
            >
              <PercentageOutlined className="mr-1.5" /> Giảm theo phần trăm (%)
            </Radio.Button>
            <Radio.Button
              value="FIXED"
              className="text-center rounded-lg h-10 leading-10 font-medium"
            >
              <DollarOutlined className="mr-1.5" /> Giảm số tiền cố định (đ)
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        {/* Discount Value & Max Discount */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="discountValue"
              label={
                <span className="font-semibold text-slate-700">
                  {discountType === 'PERCENTAGE' ? 'Tỷ lệ giảm (%)' : 'Số tiền giảm (VNĐ)'}
                </span>
              }
              rules={[
                { required: true, message: 'Vui lòng nhập giá trị giảm!' },
                {
                  validator: (_, value) => {
                    if (discountType === 'PERCENTAGE' && (value < 1 || value > 100)) {
                      return Promise.reject(new Error('Tỷ lệ giảm phải từ 1% đến 100%!'));
                    }
                    if (discountType === 'FIXED' && value < 1000) {
                      return Promise.reject(new Error('Số tiền giảm tối thiểu là 1.000đ!'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                className="w-full rounded-lg"
                size="large"
                min={discountType === 'PERCENTAGE' ? 1 : 1000}
                max={discountType === 'PERCENTAGE' ? 100 : 10000000}
                step={discountType === 'PERCENTAGE' ? 5 : 5000}
                formatter={(value) =>
                  discountType === 'PERCENTAGE'
                    ? `${value}%`
                    : `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
                parser={(value) => (value ? value.replace(/\D/g, '') : '') as any}
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
                className="w-full rounded-lg"
                size="large"
                disabled={discountType !== 'PERCENTAGE'}
                min={1000}
                step={5000}
                placeholder="VD: 50,000"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => (value ? value.replace(/\D/g, '') : '') as any}
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
                className="w-full rounded-lg"
                size="large"
                min={0}
                step={10000}
                placeholder="VD: 50,000"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => (value ? value.replace(/\D/g, '') : '') as any}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="usageLimit"
              label={
                <span className="font-semibold text-slate-700">
                  Giới hạn lượt dùng{' '}
                  <span className="text-slate-400 font-normal text-xs">(Trống = Vô hạn)</span>
                </span>
              }
            >
              <InputNumber
                className="w-full rounded-lg"
                size="large"
                min={1}
                placeholder="VD: 100"
              />
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
            className="w-full rounded-lg h-10"
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
            <Button onClick={onClose} disabled={isBusy}>
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isBusy}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-sm"
            >
              {editingVoucher ? 'Lưu thay đổi' : 'Phát hành Voucher ngay'}
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default VoucherFormModal;
