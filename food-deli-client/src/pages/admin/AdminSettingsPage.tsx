import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Form,
  InputNumber,
  Switch,
  Button,
  Typography,
  Row,
  Col,
  Space,
  Divider,
  Alert,
  Tag,
  Select,
  Spin,
  message,
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  ReloadOutlined,
  UndoOutlined,
  CarOutlined,
  DollarOutlined,
  PercentageOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import {
  adminSettingsApi,
  DEFAULT_ORDER_COST_CONFIG,
  type UpdateSystemSettingsPayload,
} from '@/services/modules/adminSettingsApi';

const { Title, Text } = Typography;

interface SettingsFormValues {
  baseKm: number;
  baseFee: number;
  extraPerKm: number;
  priorityFee: number;
  serviceFee: number;
  vatPercent: number;
  vatIncluded: boolean;
  platformCommissionPercent: number;
}

const DEFAULT_FORM_VALUES: SettingsFormValues = {
  baseKm: DEFAULT_ORDER_COST_CONFIG.baseKm,
  baseFee: DEFAULT_ORDER_COST_CONFIG.baseFee,
  extraPerKm: DEFAULT_ORDER_COST_CONFIG.extraPerKm,
  priorityFee: DEFAULT_ORDER_COST_CONFIG.priorityFee,
  serviceFee: DEFAULT_ORDER_COST_CONFIG.serviceFee,
  vatPercent: Math.round(DEFAULT_ORDER_COST_CONFIG.vatRate * 1000) / 10,
  vatIncluded: DEFAULT_ORDER_COST_CONFIG.vatIncluded,
  platformCommissionPercent: DEFAULT_ORDER_COST_CONFIG.platformCommissionPercent,
};

export const AdminSettingsPage: React.FC = () => {
  const [form] = Form.useForm<SettingsFormValues>();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Live preview simulator state
  const [simSubtotal, setSimSubtotal] = useState<number>(100000);
  const [simDistanceKm, setSimDistanceKm] = useState<number>(3.5);
  const [simSpeed, setSimSpeed] = useState<'standard' | 'priority'>('standard');

  const watchedValues = Form.useWatch([], form);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await adminSettingsApi.getAdminSettings();
      const data = res?.data;
      if (!data) {
        throw new Error('Máy chủ không trả về cấu hình hệ thống.');
      }
      form.setFieldsValue({
        baseKm: Number(data.baseKm),
        baseFee: Number(data.baseFee),
        extraPerKm: Number(data.extraPerKm),
        priorityFee: Number(data.priorityFee),
        serviceFee: Number(data.serviceFee),
        vatPercent: Number(data.vatRate),
        vatIncluded: Boolean(data.vatIncluded),
        platformCommissionPercent: Number(data.platformCommissionPercent),
      });
    } catch (err: unknown) {
      const apiMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      const messageText = apiMessage || (err instanceof Error ? err.message : 'Không thể tải cấu hình hệ thống');
      setLoadError(messageText);
      message.error(messageText);
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (values: SettingsFormValues) => {
    setSaving(true);
    try {
      const payload: UpdateSystemSettingsPayload = {
        baseKm: Number(values.baseKm),
        baseFee: Number(values.baseFee),
        extraPerKm: Number(values.extraPerKm),
        priorityFee: Number(values.priorityFee),
        serviceFee: Number(values.serviceFee),
        vatRate: Number(values.vatPercent),
        vatIncluded: Boolean(values.vatIncluded),
        platformCommissionPercent: Number(values.platformCommissionPercent),
      };

      const response = await adminSettingsApi.updateAdminSettings(payload);
      if (!response.data) {
        throw new Error('Máy chủ không trả về cấu hình sau khi cập nhật.');
      }
      form.setFieldsValue({
        baseKm: Number(response.data.baseKm),
        baseFee: Number(response.data.baseFee),
        extraPerKm: Number(response.data.extraPerKm),
        priorityFee: Number(response.data.priorityFee),
        serviceFee: Number(response.data.serviceFee),
        vatPercent: Number(response.data.vatRate),
        vatIncluded: Boolean(response.data.vatIncluded),
        platformCommissionPercent: Number(response.data.platformCommissionPercent),
      });
      message.success('Đã lưu cấu hình chi phí đơn hàng & hệ thống thành công');
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Lưu cấu hình thất bại, vui lòng kiểm tra lại');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    form.setFieldsValue(DEFAULT_FORM_VALUES);
    message.info('Đã điền giá trị mặc định vào biểu mẫu (bấm Lưu để áp dụng)');
  };

  const previewBreakdown = useMemo(() => {
    const v = watchedValues ?? DEFAULT_FORM_VALUES;
    const baseKm = Number(v.baseKm ?? 2);
    const baseFee = Number(v.baseFee ?? 15000);
    const extraPerKm = Number(v.extraPerKm ?? 5000);
    const priorityFee = Number(v.priorityFee ?? 5000);
    const serviceFee = Number(v.serviceFee ?? 3000);
    const vatRate = Number(v.vatPercent ?? DEFAULT_FORM_VALUES.vatPercent) / 100;
    const vatIncluded = Boolean(v.vatIncluded ?? true);
    const commissionPct = Number(v.platformCommissionPercent ?? DEFAULT_FORM_VALUES.platformCommissionPercent);

    const extraDistance = Math.max(0, simDistanceKm - baseKm);
    const distanceShipping = Math.round(baseFee + extraDistance * extraPerKm);
    const prioritySurcharge = simSpeed === 'priority' ? priorityFee : 0;
    const totalShipping = distanceShipping + prioritySurcharge;
    const vatAmount = vatIncluded ? 0 : Math.round(simSubtotal * vatRate);
    const customerTotal = simSubtotal + totalShipping + serviceFee + vatAmount;
    const platformCommission = Math.round((simSubtotal * commissionPct) / 100);

    return {
      extraDistance,
      distanceShipping,
      prioritySurcharge,
      totalShipping,
      serviceFee,
      vatAmount,
      vatIncluded,
      customerTotal,
      platformCommission,
    };
  }, [watchedValues, simSubtotal, simDistanceKm, simSpeed]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-sm">
              <SettingOutlined className="text-xl" />
            </div>
            <div>
              <Title level={3} className="!mb-0 text-slate-900">
                Cấu hình Hệ thống &amp; Chi phí Order
              </Title>
              <Text className="text-slate-500 text-sm">
                Quản lý biểu phí vận chuyển, phí dịch vụ đơn hàng, thuế VAT và hoa hồng toàn sàn
              </Text>
            </div>
          </div>
        </div>

        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={fetchSettings} loading={loading}>
            Tải lại
          </Button>
          <Button icon={<UndoOutlined />} onClick={handleResetDefaults} disabled={saving}>
            Mặc định
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={() => form.submit()}
            className="bg-orange-600 hover:!bg-orange-700 border-none font-semibold"
          >
            Lưu cấu hình
          </Button>
        </Space>
      </div>

      <Alert
        type="info"
        showIcon
        message="Đồng bộ trực tiếp với Checkout & Order Service"
        description="Mọi thay đổi về phí ship, phụ phí hỏa tốc, phí dịch vụ và cách tính VAT sẽ áp dụng ngay cho các đơn hàng mới tạo từ màn hình Thanh toán của khách hàng."
        className="rounded-xl"
      />

      {loadError && (
        <Alert
          type="error"
          showIcon
          message="Không thể tải cấu hình đã lưu"
          description={loadError}
          action={<Button onClick={() => void fetchSettings()}>Thử lại</Button>}
        />
      )}

      <Spin spinning={loading}>
        <Row gutter={[20, 20]}>
          {/* Left Column: Config Form */}
          <Col xs={24} lg={15}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              disabled={Boolean(loadError) || loading}
            >
              {/* Section 1: Shipping Config */}
              <Card
                title={
                  <Space>
                    <CarOutlined className="text-blue-600" />
                    <span className="font-bold">1. Biểu phí Giao hàng (Shipping Config)</span>
                  </Space>
                }
                className="rounded-2xl shadow-xs mb-5 border-slate-100"
              >
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="baseKm"
                      label="Khoảng cách cơ bản (km)"
                      tooltip="Chặng đầu áp dụng đồng giá phí ship cơ bản"
                      rules={[
                        { required: true, message: 'Vui lòng nhập khoảng cách cơ bản' },
                        { type: 'number', min: 0.5, max: 20, message: 'Từ 0.5 đến 20 km' },
                      ]}
                    >
                      <InputNumber
                        className="w-full"
                        min={0.5}
                        max={20}
                        step={0.5}
                        addonAfter="km"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="baseFee"
                      label="Phí ship chặng cơ bản (VNĐ)"
                      rules={[
                        { required: true, message: 'Vui lòng nhập phí ship cơ bản' },
                        { type: 'number', min: 0, message: 'Không được âm' },
                      ]}
                    >
                      <InputNumber<number>
                        className="w-full"
                        min={0}
                        step={1000}
                        formatter={(val) => `${val ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(val) => Number(val?.replace(/,/g, '') || 0)}
                        addonAfter="đ"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="extraPerKm"
                      label="Phí mỗi km vượt mức (VNĐ/km)"
                      tooltip="Áp dụng chính xác cho phần quãng đường vượt quá khoảng cách cơ bản"
                      rules={[
                        { required: true, message: 'Vui lòng nhập phí vượt km' },
                        { type: 'number', min: 0, message: 'Không được âm' },
                      ]}
                    >
                      <InputNumber<number>
                        className="w-full"
                        min={0}
                        step={500}
                        formatter={(val) => `${val ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(val) => Number(val?.replace(/,/g, '') || 0)}
                        addonAfter="đ/km"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="priorityFee"
                      label="Phụ phí Giao nhanh hỏa tốc (VNĐ)"
                      rules={[
                        { required: true, message: 'Vui lòng nhập phụ phí giao nhanh' },
                        { type: 'number', min: 0, message: 'Không được âm' },
                      ]}
                    >
                      <InputNumber<number>
                        className="w-full"
                        min={0}
                        step={1000}
                        formatter={(val) => `${val ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(val) => Number(val?.replace(/,/g, '') || 0)}
                        addonAfter="đ"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* Section 2: Order Fees & VAT */}
              <Card
                title={
                  <Space>
                    <DollarOutlined className="text-orange-600" />
                    <span className="font-bold">2. Chi phí Order &amp; Thuế VAT</span>
                  </Space>
                }
                className="rounded-2xl shadow-xs mb-5 border-slate-100"
              >
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="serviceFee"
                      label="Phí dịch vụ & đóng gói mỗi đơn (VNĐ)"
                      tooltip="Thu trực tiếp trên mỗi đơn hàng hiển thị ở Chi tiết hóa đơn"
                      rules={[
                        { required: true, message: 'Vui lòng nhập phí dịch vụ' },
                        { type: 'number', min: 0, message: 'Không được âm' },
                      ]}
                    >
                      <InputNumber<number>
                        className="w-full"
                        min={0}
                        step={500}
                        formatter={(val) => `${val ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(val) => Number(val?.replace(/,/g, '') || 0)}
                        addonAfter="đ"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="vatPercent"
                      label="Thuế suất VAT (%)"
                      rules={[
                        { required: true, message: 'Vui lòng nhập thuế VAT' },
                        { type: 'number', min: 0, max: 100, message: 'Từ 0% đến 100%' },
                      ]}
                    >
                      <InputNumber
                        className="w-full"
                        min={0}
                        max={100}
                        step={0.5}
                        addonAfter="%"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Form.Item
                      name="vatIncluded"
                      valuePropName="checked"
                      label="Giá niêm yết món ăn đã bao gồm VAT"
                      extra="Bật: khách không trả thêm VAT riêng. Tắt: hệ thống tự cộng thêm thuế VAT (%) vào tổng hóa đơn."
                      className="!mb-0"
                    >
                      <Switch checkedChildren="Đã bao gồm VAT" unCheckedChildren="Tính thêm VAT" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* Section 3: Platform Commission */}
              <Card
                title={
                  <Space>
                    <PercentageOutlined className="text-emerald-600" />
                    <span className="font-bold">3. Chiết khấu Hoa hồng Sàn (Commission)</span>
                  </Space>
                }
                className="rounded-2xl shadow-xs border-slate-100"
              >
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="platformCommissionPercent"
                      label="Tỷ lệ hoa hồng thu từ đối tác quán (%)"
                      rules={[
                        { required: true, message: 'Vui lòng nhập tỷ lệ hoa hồng' },
                        { type: 'number', min: 0, max: 100, message: 'Từ 0% đến 100%' },
                      ]}
                      className="!mb-0"
                    >
                      <InputNumber
                        className="w-full"
                        min={0}
                        max={100}
                        step={0.5}
                        addonAfter="%"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Form>
          </Col>

          {/* Right Column: Live Calculator Preview */}
          <Col xs={24} lg={9}>
            <Card
              title={
                <Space>
                  <CalculatorOutlined className="text-purple-600" />
                  <span className="font-bold">Mô phỏng Tính phí Đơn hàng</span>
                </Space>
              }
              className="rounded-2xl shadow-xs border-slate-100 sticky top-20"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Text className="text-xs text-slate-500 block mb-1">Tiền món giả định</Text>
                    <InputNumber<number>
                      className="w-full"
                      min={10000}
                      step={10000}
                      value={simSubtotal}
                      onChange={(val) => setSimSubtotal(Number(val ?? 100000))}
                      formatter={(val) => `${val ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(val) => Number(val?.replace(/,/g, '') || 0)}
                      addonAfter="đ"
                    />
                  </div>
                  <div>
                    <Text className="text-xs text-slate-500 block mb-1">Khoảng cách giao</Text>
                    <InputNumber
                      className="w-full"
                      min={0.5}
                      max={30}
                      step={0.5}
                      value={simDistanceKm}
                      onChange={(val) => setSimDistanceKm(Number(val ?? 1))}
                      addonAfter="km"
                    />
                  </div>
                </div>

                <div>
                  <Text className="text-xs text-slate-500 block mb-1">Chế độ giao hàng</Text>
                  <Select
                    className="w-full"
                    value={simSpeed}
                    onChange={(val) => setSimSpeed(val)}
                    options={[
                      { value: 'standard', label: 'Giao tiêu chuẩn' },
                      { value: 'priority', label: 'Giao nhanh hỏa tốc (+phụ phí)' },
                    ]}
                  />
                </div>

                <Divider className="!my-3" />

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Tiền món ăn</span>
                    <span className="font-semibold text-slate-900">
                      {simSubtotal.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>
                      Phí vận chuyển ({simDistanceKm} km
                      {previewBreakdown.extraDistance > 0 ? `, vượt ${previewBreakdown.extraDistance.toFixed(2)} km` : ''})
                    </span>
                    <span className="font-semibold text-slate-900">
                      {previewBreakdown.distanceShipping.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  {previewBreakdown.prioritySurcharge > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Phụ phí hỏa tốc</span>
                      <span className="font-semibold">
                        +{previewBreakdown.prioritySurcharge.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Phí dịch vụ &amp; đóng gói</span>
                    <span className="font-semibold text-slate-900">
                      {previewBreakdown.serviceFee.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>
                      Thuế VAT{' '}
                      <Tag color={previewBreakdown.vatIncluded ? 'green' : 'gold'} className="ml-1">
                        {previewBreakdown.vatIncluded ? 'Đã gồm' : 'Cộng thêm'}
                      </Tag>
                    </span>
                    <span className="font-semibold text-slate-900">
                      {previewBreakdown.vatAmount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>

                <Divider className="!my-3" />

                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Khách thanh toán</span>
                  <span className="text-xl font-extrabold text-orange-600">
                    {previewBreakdown.customerTotal.toLocaleString('vi-VN')}đ
                  </span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs">
                  <Space>
                    <CheckCircleOutlined className="text-emerald-600" />
                    <span className="text-emerald-800 font-medium">Hoa hồng sàn dự kiến thu</span>
                  </Space>
                  <span className="font-bold text-emerald-700">
                    {previewBreakdown.platformCommission.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default AdminSettingsPage;

