import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Radio,
  DatePicker,
  Button,
  Space,
  Switch,
  Typography,
  Tag,
  Divider,
} from 'antd';
import {
  GiftOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  DollarOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { CreateVoucherPayload } from '@/services/modules/restaurantApi';

const { Text } = Typography;

interface VoucherFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateVoucherPayload) => Promise<void>;
  restaurantId: number;
  loading?: boolean;
}

export const VoucherFormModal: React.FC<VoucherFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  restaurantId,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        discountType: 'PERCENTAGE',
        discountValue: 15,
        maxDiscountAmount: 30000,
        minOrderValue: 50000,
        usageLimit: 100,
        expiryDate: dayjs().add(30, 'day'),
        isActive: true,
      });
      setDiscountType('PERCENTAGE');
    }
  }, [open, form]);

  const handleGenerateCode = () => {
    const prefixes = ['THUNDER', 'GIAM', 'SALE', 'PROMO', 'VIP'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(10 + Math.random() * 90);
    form.setFieldsValue({ code: `${randomPrefix}${randomNum}` });
  };

  const handleFinish = async (values: any) => {
    const expiry = values.expiryDate ? dayjs(values.expiryDate).toISOString() : dayjs().add(30, 'day').toISOString();
    const start = values.startDate ? dayjs(values.startDate).toISOString() : new Date().toISOString();

    const payload: CreateVoucherPayload = {
      restaurantId,
      code: values.code.trim().toUpperCase(),
      discountType: values.discountType,
      discountValue: Number(values.discountValue),
      maxDiscountAmount:
        values.discountType === 'PERCENTAGE' && values.maxDiscountAmount
          ? Number(values.maxDiscountAmount)
          : undefined,
      minOrderValue: values.minOrderValue ? Number(values.minOrderValue) : 0,
      usageLimit: values.usageLimit ? Number(values.usageLimit) : 100,
      startDate: start,
      expiryDate: expiry,
    };

    await onSubmit(payload);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
            <GiftOutlined />
          </div>
          <div>
            <div className="font-bold text-base">Tạo Voucher Khuyến Mãi Mới</div>
            <div className="text-xs text-slate-400 font-normal">
              Phát hành mã giảm giá cho quán — Khách hàng có thể nhập mã ngay tại trang Checkout
            </div>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      centered
      width={560}
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
              message: 'Mã voucher chỉ từ 3-20 ký tự (chữ, số hoặc gạch dưới)!',
            },
          ]}
          extra="Mã tự động chuyển thành chữ hoa. Khách hàng sẽ nhập mã này tại bước thanh toán."
        >
          <div className="flex gap-2">
            <Input
              placeholder="VD: GIAM20K, SALE50, THUNDER30"
              size="large"
              className="rounded-lg uppercase font-bold tracking-wider text-slate-800"
              maxLength={20}
              onChange={(e) => {
                form.setFieldsValue({ code: e.target.value.toUpperCase() });
              }}
            />
            <Button
              icon={<ThunderboltOutlined />}
              onClick={handleGenerateCode}
              size="large"
              className="rounded-lg text-orange-600 border-orange-200 hover:border-orange-500 font-medium"
            >
              Tạo ngẫu nhiên
            </Button>
          </div>
        </Form.Item>

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

        {/* Discount Value */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          {discountType === 'PERCENTAGE' && (
            <Form.Item
              name="maxDiscountAmount"
              label={<span className="font-semibold text-slate-700">Mức giảm tối đa (VNĐ)</span>}
              extra="Để trống nếu không giới hạn trần giảm"
            >
              <InputNumber
                className="w-full rounded-lg"
                size="large"
                min={1000}
                step={5000}
                placeholder="VD: 30,000đ"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => (value ? value.replace(/\D/g, '') : '') as any}
              />
            </Form.Item>
          )}
        </div>

        {/* Min Order Value & Usage Limit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Form.Item
            name="minOrderValue"
            label={<span className="font-semibold text-slate-700">Đơn hàng tối thiểu (VNĐ)</span>}
            extra="Áp dụng khi đơn đạt từ mức này trở lên"
          >
            <InputNumber
              className="w-full rounded-lg"
              size="large"
              min={0}
              step={10000}
              placeholder="0đ (Không yêu cầu)"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => (value ? value.replace(/\D/g, '') : '') as any}
            />
          </Form.Item>

          <Form.Item
            name="usageLimit"
            label={<span className="font-semibold text-slate-700">Số lượt sử dụng tối đa</span>}
            extra="Tổng số lần mã có thể được áp dụng"
          >
            <InputNumber
              className="w-full rounded-lg"
              size="large"
              min={1}
              max={10000}
              placeholder="100 lượt"
            />
          </Form.Item>
        </div>

        {/* Expiry Date */}
        <Form.Item
          name="expiryDate"
          label={<span className="font-semibold text-slate-700">Ngày hết hạn sử dụng</span>}
          rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn!' }]}
        >
          <DatePicker
            showTime={{ format: 'HH:mm' }}
            format="YYYY-MM-DD HH:mm"
            className="w-full rounded-lg"
            size="large"
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>

        <Divider className="my-2" />

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Kích hoạt ngay khi tạo xong
          </div>
          <div className="flex gap-2">
            <Button onClick={onClose} disabled={loading} className="rounded-lg">
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-sm"
            >
              Phát hành Voucher ngay
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
};

export default VoucherFormModal;
