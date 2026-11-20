import React, { useEffect, useState } from 'react';
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
  Tag,
} from 'antd';
import {
  GiftOutlined,
  EditOutlined,
  TagOutlined,
  DollarOutlined,
  PercentageOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  restaurantApi,
  type VoucherItem,
  type VoucherCategoryItem,
  type CreateVoucherPayload,
  type UpdateVoucherPayload,
} from '@/services/modules/restaurantApi';

const { RangePicker } = DatePicker;

const DEFAULT_VOUCHER_CATEGORIES: VoucherCategoryItem[] = [
  { id: 1, code: 'DISCOUNT_FOOD', name: 'Giảm giá món ăn', isActive: true },
  { id: 2, code: 'FREESHIP', name: 'Miễn phí vận chuyển', isActive: true },
  { id: 3, code: 'NEW_USER', name: 'Khách hàng mới', isActive: true },
];

interface VoucherFormModalProps {
  isOpen: boolean;
  editingVoucher: VoucherItem | null;
  restaurantId?: number | string | null;
  scopeMode?: 'MERCHANT' | 'ADMIN';
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: CreateVoucherPayload | UpdateVoucherPayload) => Promise<void>;
}

const formatNumberWithCommas = (val: string | number | undefined): string => {
  if (val === undefined || val === null || val === '') return '';
  return `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const parseDigitsOnly = (val: string | undefined): string => {
  return (val ?? '').replace(/[^\d]/g, '');
};

export const VoucherFormModal: React.FC<VoucherFormModalProps> = ({
  isOpen,
  editingVoucher,
  restaurantId,
  scopeMode = 'MERCHANT',
  submitting,
  onClose,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const discountType = Form.useWatch('discountType', form);
  const voucherCategory = Form.useWatch('voucherCategory', form);
  const [categories, setCategories] = useState<VoucherCategoryItem[]>(DEFAULT_VOUCHER_CATEGORIES);

  useEffect(() => {
    if (!isOpen) return;
    restaurantApi
      .getVoucherCategories(true)
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setCategories(res.data);
        }
      })
      .catch(() => {
        setCategories(DEFAULT_VOUCHER_CATEGORIES);
      });
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (editingVoucher) {
        form.setFieldsValue({
          code: editingVoucher.code,
          voucherCategory: editingVoucher.voucherCategory || 'DISCOUNT_FOOD',
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
          voucherCategory: scopeMode === 'ADMIN' ? 'FREESHIP' : 'DISCOUNT_FOOD',
          discountType: 'FIXED',
          discountValue: scopeMode === 'ADMIN' ? 15000 : 20000,
          minOrderValue: 50000,
          dateRange: [dayjs(), dayjs().add(30, 'day')],
          isActive: true,
        });
      }
    }
  }, [isOpen, editingVoucher, scopeMode, form]);

  const handleFinish = async (values: any) => {
    const startDate = values.dateRange?.[0]
      ? dayjs(values.dateRange[0]).format('YYYY-MM-DDTHH:mm:ss')
      : undefined;
    const expiryDate = values.dateRange?.[1]
      ? dayjs(values.dateRange[1]).format('YYYY-MM-DDTHH:mm:ss')
      : dayjs().add(30, 'day').format('YYYY-MM-DDTHH:mm:ss');

    if (editingVoucher) {
      const payload: UpdateVoucherPayload = {
        voucherCategory: values.voucherCategory || 'DISCOUNT_FOOD',
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
        restaurantId: scopeMode === 'ADMIN' ? undefined : Number(restaurantId),
        voucherCategory: values.voucherCategory || 'DISCOUNT_FOOD',
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
            {editingVoucher
              ? 'Chỉnh Sửa Voucher'
              : scopeMode === 'ADMIN'
              ? 'Tạo Voucher Toàn Hệ Thống'
              : 'Tạo Mã Giảm Giá Quán Ăn'}
          </span>
          <Tag color={scopeMode === 'ADMIN' ? 'volcano' : 'purple'} className="ml-1 text-[11px] font-semibold">
            {scopeMode === 'ADMIN' ? 'Toàn sàn' : 'Quán ăn'}
          </Tag>
        </div>
      }
      footer={null}
      destroyOnClose
      width={620}
      centered
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} className="pt-3">
        <Row gutter={16}>
          <Col span={12}>
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
                placeholder="Ví dụ: FREESHIP, GIAM20K"
                disabled={!!editingVoucher}
                className="uppercase font-mono"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="voucherCategory"
              label={<span className="font-semibold text-slate-700">Danh mục Voucher</span>}
              rules={[{ required: true, message: 'Chọn danh mục voucher!' }]}
            >
              <Select
                suffixIcon={<AppstoreOutlined />}
                options={categories.map((cat) => ({
                  value: cat.code,
                  label: `${cat.name} (${cat.code})`,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="discountType"
              label={<span className="font-semibold text-slate-700">Loại giảm giá</span>}
              rules={[{ required: true, message: 'Chọn loại giảm giá!' }]}
            >
              <Select
                onChange={(nextType) => {
                  const currentVal = Number(form.getFieldValue('discountValue'));
                  if (nextType === 'PERCENTAGE' && currentVal > 100) {
                    form.setFieldValue('discountValue', 10);
                  } else if (nextType === 'FIXED') {
                    form.setFieldValue('maxDiscountAmount', undefined);
                  }
                }}
                options={[
                  {
                    value: 'FIXED',
                    label: (
                      <span>
                        <DollarOutlined className="text-emerald-500 mr-1.5" /> Số tiền cố định (VNĐ)
                        {voucherCategory === 'FREESHIP' ? ' — Trừ vào phí giao hàng' : ''}
                      </span>
                    ),
                  },
                  {
                    value: 'PERCENTAGE',
                    label: (
                      <span>
                        <PercentageOutlined className="text-blue-500 mr-1.5" /> Phần trăm (%)
                        {voucherCategory === 'FREESHIP' ? ' — Giảm % phí giao hàng' : ''}
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
                min={1}
                max={discountType === 'PERCENTAGE' ? 100 : 10000000}
                precision={0}
                suffix={discountType === 'PERCENTAGE' ? '%' : 'đ'}
                formatter={discountType === 'PERCENTAGE' ? undefined : formatNumberWithCommas}
                parser={parseDigitsOnly}
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
                min={0}
                precision={0}
                disabled={discountType !== 'PERCENTAGE'}
                formatter={formatNumberWithCommas}
                parser={parseDigitsOnly}
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
                min={0}
                precision={0}
                formatter={formatNumberWithCommas}
                parser={parseDigitsOnly}
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

