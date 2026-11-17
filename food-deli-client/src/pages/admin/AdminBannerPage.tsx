import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { ImageUpload } from '@/components';
import type { BannerItem, BannerPayload } from '@/services/modules/bannerApi';
import { bannerApi } from '@/services/modules/bannerApi';

const { Title, Text } = Typography;

interface BannerFormValues {
  title: string;
  imageUrl: string;
  targetUrl: string;
  displayOrder: number;
  isActive: boolean;
}

const defaultValues: BannerFormValues = {
  title: '',
  imageUrl: '',
  targetUrl: '',
  displayOrder: 1,
  isActive: true,
};

export const AdminBannerPage: React.FC = () => {
  const [form] = Form.useForm<BannerFormValues>();
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const response = await bannerApi.getAll();
      setBanners(response.data || []);
    } catch (error: any) {
      message.error(error?.message || 'Không thể tải danh sách banner');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBanners();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    form.setFieldsValue({ ...defaultValues, displayOrder: banners.length + 1 });
    setModalOpen(true);
  };

  const openEditModal = (banner: BannerItem) => {
    setEditingId(banner.id);
    form.setFieldsValue({
      title: banner.title,
      imageUrl: banner.imageUrl,
      targetUrl: banner.targetUrl || '',
      displayOrder: Number(banner.displayOrder || 1),
      isActive: !!banner.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!values.imageUrl) {
        message.error('Vui lòng chọn hình ảnh cho banner');
        return;
      }

      setSaving(true);
      const payload: BannerPayload = {
        title: values.title.trim(),
        imageUrl: values.imageUrl,
        targetUrl: values.targetUrl?.trim() || '',
        displayOrder: Number(values.displayOrder || 1),
        isActive: values.isActive,
      };

      if (editingId) {
        await bannerApi.update(editingId, payload);
        message.success('Đã cập nhật banner thành công');
      } else {
        await bannerApi.create(payload);
        message.success('Đã thêm banner mới thành công');
      }

      setModalOpen(false);
      form.resetFields();
      await loadBanners();
    } catch (error: any) {
      message.error(error?.message || 'Không thể lưu banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (banner: BannerItem) => {
    Modal.confirm({
      title: 'Xác nhận xóa banner',
      content: `Bạn có chắc muốn xóa banner "${banner.title}" không?`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await bannerApi.delete(banner.id);
          message.success('Đã xóa banner');
          await loadBanners();
        } catch (error: any) {
          message.error(error?.message || 'Xóa banner thất bại');
        }
      },
    });
  };

  const handleToggleStatus = async (banner: BannerItem, checked: boolean) => {
    try {
      await bannerApi.updateStatus(banner.id, checked);
      const nextList = banners.map((item) =>
        String(item.id) === String(banner.id) ? { ...item, isActive: checked } : item
      );
      setBanners(nextList);
      message.success(checked ? 'Banner đã được bật hiển thị' : 'Banner đã được ẩn');
    } catch (error: any) {
      message.error(error?.message || 'Cập nhật trạng thái banner thất bại');
    }
  };

  const sortedBanners = useMemo(
    () => [...banners].sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0)),
    [banners]
  );

  const columns = [
    {
      title: 'STT',
      width: 70,
      render: (_: unknown, __: BannerItem, index: number) => index + 1,
    },
    {
      title: 'Hình ảnh',
      width: 140,
      render: (_: unknown, record: BannerItem) => (
        <img
          src={record.imageUrl}
          alt={record.title}
          className="h-16 w-24 rounded-xl object-cover border border-slate-200 bg-slate-100"
          onError={(event) => {
            event.currentTarget.src =
              'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80';
          }}
        />
      ),
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      render: (title: string) => <span className="font-semibold text-slate-700">{title}</span>,
    },
    {
      title: 'Liên kết',
      dataIndex: 'targetUrl',
      render: (targetUrl?: string) => {
        if (!targetUrl) return <span className="text-slate-400">Không điều hướng</span>;
        return (
          <a href={targetUrl} target="_blank" rel="noreferrer" className="text-orange-600 underline">
            {targetUrl}
          </a>
        );
      },
    },
    {
      title: 'Trạng thái',
      width: 130,
      render: (_: unknown, record: BannerItem) => (
        <Switch
          checked={record.isActive}
          onChange={(checked) => handleToggleStatus(record, checked)}
          checkedChildren="Đang hiển thị"
          unCheckedChildren="Đã ẩn"
        />
      ),
    },
    {
      title: 'Thứ tự',
      dataIndex: 'displayOrder',
      width: 90,
      render: (value: number) => <Tag color="processing">#{value}</Tag>,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      width: 140,
      render: (value?: string) =>
        value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có thông tin',
    },
    {
      title: 'Thao tác',
      width: 150,
      render: (_: unknown, record: BannerItem) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
            className="border-orange-200 text-orange-600 hover:border-orange-400 hover:text-orange-700"
          >
            Sửa
          </Button>
          <Button
            size="small"
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-sm">
            <PictureOutlined className="text-xl" />
          </div>
          <div>
            <Title level={3} className="!mb-0 text-slate-900">
              Quản lý Banner
            </Title>
            <Text className="text-sm text-slate-500">
              Quản lý hình ảnh quảng cáo và chương trình khuyến mãi hiển thị trên trang chủ.
            </Text>
          </div>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
          className="bg-orange-500 hover:bg-orange-600 border-orange-500 shadow-sm"
        >
          Thêm Banner
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Spin size="large" />
          </div>
        ) : sortedBanners.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center">
            <Empty description="Chưa có banner nào. Hãy thêm banner đầu tiên cho trang chủ." />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={sortedBanners}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1200 }}
          />
        )}
      </Card>

      <Modal
        title={editingId ? 'Chỉnh sửa banner' : 'Thêm banner mới'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={handleSubmit}
        okText={editingId ? 'Lưu thay đổi' : 'Tạo banner'}
        confirmLoading={saving}
        destroyOnClose
        width={760}
      >
        <Form form={form} layout="vertical" initialValues={defaultValues}>
          <Form.Item
            name="title"
            label="Tiêu đề banner"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề banner' }]}
          >
            <Input placeholder="VD: Flash Sale cuối tuần" />
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label="Hình ảnh banner"
            rules={[{ required: true, message: 'Vui lòng chọn hình ảnh banner' }]}
          >
            <ImageUpload
              value={form.getFieldValue('imageUrl')}
              onChange={(url) => form.setFieldsValue({ imageUrl: url })}
              folder="thunder-food/banners"
              aspectRatio="banner"
              maxSizeMB={4}
            />
          </Form.Item>

          <Form.Item name="targetUrl" label="Đường dẫn điều hướng">
            <Input placeholder="https://example.com/khuyen-mai" />
          </Form.Item>

          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item
              name="displayOrder"
              label="Thứ tự hiển thị"
              rules={[{ required: true, message: 'Vui lòng nhập thứ tự hiển thị' }]}
            >
              <InputNumber min={1} className="w-full" />
            </Form.Item>

            <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
              <Switch checkedChildren="Hiện" unCheckedChildren="Ẩn" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminBannerPage;
