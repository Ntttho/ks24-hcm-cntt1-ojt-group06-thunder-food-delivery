import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Radio,
  Switch,
  Popconfirm,
  message,
  Spin,
  Alert,
  Empty,
  Typography,
} from 'antd';
import {
  EnvironmentOutlined,
  HomeOutlined,
  BankOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CompassOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { addressApi } from '@/services/modules/addressApi';
import type { UserAddress, AddressRequest } from '@/types';

const { Title, Text, Paragraph } = Typography;

export const AddressManagementPage: React.FC = () => {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [form] = Form.useForm();

  // Selected label type in modal
  const [labelType, setLabelType] = useState<string>('Nhà riêng');

  // Fetch all addresses for current user
  const fetchAddresses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await addressApi.getMyAddresses();
      setAddresses(response.data || []);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể tải danh sách địa chỉ. Vui lòng thử lại!';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const response = await addressApi.getMyAddresses();
        if (isMounted) {
          setAddresses(response.data || []);
        }
      } catch (err: any) {
        if (isMounted) {
          const msg = err.response?.data?.message || 'Không thể tải danh sách địa chỉ. Vui lòng thử lại!';
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingAddress(null);
    setLabelType('Nhà riêng');
    form.resetFields();
    form.setFieldsValue({
      label: 'Nhà riêng',
      address: '',
      latitude: 10.762622,
      longitude: 106.660172,
      isDefault: addresses.length === 0,
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (item: UserAddress) => {
    setEditingAddress(item);
    const knownLabels = ['Nhà riêng', 'Văn phòng'];
    const currentLabel = item.label || 'Khác';
    if (knownLabels.includes(currentLabel)) {
      setLabelType(currentLabel);
    } else {
      setLabelType('Khác');
    }

    form.resetFields();
    form.setFieldsValue({
      label: currentLabel,
      customLabel: knownLabels.includes(currentLabel) ? '' : currentLabel,
      address: item.address,
      latitude: item.latitude,
      longitude: item.longitude,
      isDefault: item.isDefault,
    });
    setIsModalOpen(true);
  };

  // Submit Create or Edit form
  const handleFormFinish = async (values: any) => {
    setIsSubmitting(true);
    try {
      const finalLabel =
        values.label === 'Khác' ? values.customLabel || 'Khác' : values.label;

      const payload: AddressRequest = {
        address: values.address.trim(),
        label: finalLabel,
        latitude: values.latitude ? Number(values.latitude) : null,
        longitude: values.longitude ? Number(values.longitude) : null,
        isDefault: Boolean(values.isDefault),
      };

      if (editingAddress) {
        await addressApi.updateAddress(editingAddress.id, payload);
        message.success('Cập nhật địa chỉ thành công!');
      } else {
        await addressApi.createAddress(payload);
        message.success('Thêm mới địa chỉ nhận hàng thành công!');
      }

      setIsModalOpen(false);
      fetchAddresses();
    } catch (err: any) {
      const msg =
        err.response?.data?.message || 'Có lỗi xảy ra khi lưu địa chỉ. Vui lòng thử lại!';
      message.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set an address as default
  const handleSetDefault = async (id: number) => {
    try {
      await addressApi.setDefaultAddress(id);
      message.success('Đã đặt địa chỉ làm mặc định thành công!');
      fetchAddresses();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể đặt làm địa chỉ mặc định.';
      message.error(msg);
    }
  };

  // Delete address
  const handleDeleteAddress = async (id: number) => {
    try {
      await addressApi.deleteAddress(id);
      message.success('Đã xóa địa chỉ thành công!');
      fetchAddresses();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể xóa địa chỉ. Vui lòng thử lại!';
      message.error(msg);
    }
  };

  // Use browser geolocation to fill coordinates
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      message.warning('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setFieldsValue({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        });
        message.success('Đã lấy tọa độ vị trí hiện tại của bạn!');
      },
      (err) => {
        message.warning(`Không thể lấy vị trí hiện tại: ${err.message}`);
      }
    );
  };

  // Quick preset coordinates
  const handleSetPresetLocation = (city: 'HANOI' | 'HCM') => {
    if (city === 'HCM') {
      form.setFieldsValue({
        latitude: 10.7769,
        longitude: 106.7009,
      });
      message.info('Đã điền tọa độ mẫu TP. Hồ Chí Minh (Quận 1)');
    } else {
      form.setFieldsValue({
        latitude: 21.0285,
        longitude: 105.8542,
      });
      message.info('Đã điền tọa độ mẫu TP. Hà Nội (Hoàn Kiếm)');
    }
  };

  // Label tag helper
  const renderLabelTag = (label?: string | null) => {
    const l = label || 'Khác';
    if (l === 'Nhà riêng') {
      return (
        <Tag color="cyan" className="font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md">
          <HomeOutlined /> Nhà riêng
        </Tag>
      );
    }
    if (l === 'Văn phòng' || l === 'Công ty') {
      return (
        <Tag color="purple" className="font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md">
          <BankOutlined /> {l}
        </Tag>
      );
    }
    return (
      <Tag color="default" className="font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md">
        <EnvironmentOutlined /> {l}
      </Tag>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl">
              <EnvironmentOutlined />
            </div>
            <div>
              <Title level={4} className="!mb-0 text-gray-900 font-extrabold">
                Sổ địa chỉ giao hàng
              </Title>
              <Text type="secondary" className="text-xs sm:text-sm">
                Quản lý các địa chỉ nhận hàng yêu thích để đặt món nhanh chóng
              </Text>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchAddresses}
            loading={isLoading}
            className="rounded-xl"
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreateModal}
            className="bg-orange-500 hover:bg-orange-600 shadow-sm font-bold rounded-xl"
          >
            Thêm địa chỉ mới
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          type="error"
          message="Lỗi tải dữ liệu"
          description={error}
          showIcon
          action={
            <Button size="small" type="primary" onClick={fetchAddresses}>
              Thử lại
            </Button>
          }
          className="rounded-xl"
        />
      )}

      {/* Content Body */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 flex flex-col items-center justify-center gap-3">
          <Spin size="large" />
          <Text type="secondary" className="text-sm">
            Đang tải danh sách địa chỉ nhận hàng...
          </Text>
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="space-y-1">
                <Paragraph className="font-bold text-gray-700 text-base !mb-0">
                  Bạn chưa có địa chỉ giao hàng nào
                </Paragraph>
                <Paragraph className="text-gray-400 text-xs">
                  Thêm địa chỉ nhà riêng hoặc văn phòng để việc giao đồ ăn diễn ra chính xác nhất
                </Paragraph>
              </div>
            }
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreateModal}
              className="bg-orange-500 hover:bg-orange-600 font-semibold rounded-xl"
            >
              Thêm địa chỉ đầu tiên
            </Button>
          </Empty>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {addresses.map((item) => (
            <Card
              key={item.id}
              className={`rounded-2xl transition-all border ${
                item.isDefault
                  ? 'border-orange-300 bg-orange-50/20 shadow-xs'
                  : 'border-gray-100 hover:border-gray-300 bg-white'
              }`}
              bodyStyle={{ padding: 20 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Left: Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {renderLabelTag(item.label)}
                    {item.isDefault && (
                      <Tag
                        color="orange"
                        className="font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 border-orange-300 bg-orange-100 text-orange-700"
                      >
                        <CheckCircleOutlined /> Mặc định
                      </Tag>
                    )}
                  </div>

                  {/* Address text */}
                  <div className="font-bold text-base text-gray-900 leading-snug">
                    {item.address}
                  </div>

                  {/* Lat / Lng badge */}
                  {(item.latitude || item.longitude) && (
                    <div className="text-xs text-gray-400 flex items-center gap-1.5">
                      <CompassOutlined />
                      <span>
                        Tọa độ: {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-end sm:self-center">
                  {!item.isDefault && (
                    <Button
                      size="middle"
                      onClick={() => handleSetDefault(item.id)}
                      className="text-xs font-semibold hover:border-orange-400 hover:text-orange-600 rounded-lg"
                    >
                      Đặt làm mặc định
                    </Button>
                  )}

                  <Button
                    icon={<EditOutlined />}
                    size="middle"
                    onClick={() => handleOpenEditModal(item)}
                    className="rounded-lg text-gray-600 hover:text-orange-600 hover:border-orange-400"
                  >
                    Sửa
                  </Button>

                  <Popconfirm
                    title="Xóa địa chỉ này?"
                    description="Bạn có chắc muốn xóa địa chỉ này khỏi danh bạ giao hàng không?"
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleDeleteAddress(item.id)}
                  >
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      size="middle"
                      className="rounded-lg"
                    >
                      Xóa
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Create & Edit Address */}
      <Modal
        title={
          <div className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
            <EnvironmentOutlined className="text-orange-500" />
            <span>
              {editingAddress ? 'Chỉnh sửa địa chỉ nhận hàng' : 'Thêm địa chỉ nhận hàng mới'}
            </span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        centered
        className="rounded-2xl overflow-hidden"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormFinish}
          requiredMark={false}
          className="pt-2 space-y-3"
        >
          {/* Label selector */}
          <Form.Item
            label={<span className="font-bold text-gray-700">Loại địa chỉ</span>}
            name="label"
            rules={[{ required: true, message: 'Vui lòng chọn loại địa chỉ!' }]}
          >
            <Radio.Group
              onChange={(e) => setLabelType(e.target.value)}
              className="w-full grid grid-cols-3 gap-2"
            >
              <Radio.Button value="Nhà riêng" className="text-center rounded-lg">
                <HomeOutlined className="mr-1" /> Nhà riêng
              </Radio.Button>
              <Radio.Button value="Văn phòng" className="text-center rounded-lg">
                <BankOutlined className="mr-1" /> Văn phòng
              </Radio.Button>
              <Radio.Button value="Khác" className="text-center rounded-lg">
                <EnvironmentOutlined className="mr-1" /> Khác
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          {labelType === 'Khác' && (
            <Form.Item
              label={<span className="font-semibold text-gray-700">Tên nhãn gợi nhớ</span>}
              name="customLabel"
              rules={[{ required: true, message: 'Vui lòng nhập tên nhãn gợi nhớ!' }]}
            >
              <Input placeholder="Ví dụ: Nhà bố mẹ, Ký túc xá, Phòng gym..." className="rounded-xl" />
            </Form.Item>
          )}

          {/* Full Address */}
          <Form.Item
            label={<span className="font-bold text-gray-700">Địa chỉ chi tiết</span>}
            name="address"
            rules={[
              { required: true, message: 'Vui lòng nhập địa chỉ nhận hàng!' },
              { min: 5, message: 'Địa chỉ quá ngắn. Vui lòng nhập chi tiết hơn!' },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Số nhà, tên đường, khu phố/tòa nhà, phường/xã, quận/huyện, tỉnh/thành phố..."
              className="rounded-xl"
            />
          </Form.Item>

          {/* Lat / Lng inputs & GPS Helper */}
          <div className="bg-gray-50 p-3.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-600 flex items-center gap-1">
                <CompassOutlined /> Tọa độ định vị bản đồ (Tùy chọn)
              </span>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="text-orange-600 font-bold hover:underline cursor-pointer"
              >
                📍 Lấy GPS hiện tại
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Form.Item
                label={<span className="text-xs font-semibold text-gray-500">Vĩ độ (Latitude)</span>}
                name="latitude"
                className="!mb-0"
              >
                <Input type="number" step="any" placeholder="10.7626" className="rounded-lg text-xs" />
              </Form.Item>
              <Form.Item
                label={<span className="text-xs font-semibold text-gray-500">Kinh độ (Longitude)</span>}
                name="longitude"
                className="!mb-0"
              >
                <Input type="number" step="any" placeholder="106.6601" className="rounded-lg text-xs" />
              </Form.Item>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-400">
              <span>Mẫu nhanh:</span>
              <button
                type="button"
                onClick={() => handleSetPresetLocation('HCM')}
                className="text-blue-600 hover:underline"
              >
                TP.HCM
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleSetPresetLocation('HANOI')}
                className="text-blue-600 hover:underline"
              >
                Hà Nội
              </button>
            </div>
          </div>

          {/* Default Switch */}
          <Form.Item
            name="isDefault"
            valuePropName="checked"
            className="!mb-4 pt-1"
          >
            <div className="flex items-center justify-between p-2 rounded-xl bg-orange-50/50 border border-orange-100">
              <span className="font-semibold text-gray-700 text-sm">
                Đặt làm địa chỉ nhận hàng mặc định
              </span>
              <Switch className="bg-gray-300" />
            </div>
          </Form.Item>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <Button onClick={() => setIsModalOpen(false)} className="rounded-xl">
              Hủy bỏ
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600 font-bold rounded-xl px-6"
            >
              {editingAddress ? 'Lưu thay đổi' : 'Thêm địa chỉ'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
