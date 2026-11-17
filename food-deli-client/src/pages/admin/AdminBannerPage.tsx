import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Tabs,
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
import type {
  BannerItem,
  BannerPayload,
  CampaignItem,
  CampaignPayload,
  CampaignStatus,
} from '@/services/modules/bannerApi';
import { bannerApi } from '@/services/modules/bannerApi';

const { Title, Text } = Typography;

interface BannerFormValues {
  title: string;
  description?: string;
  imageUrl: string;
  targetUrl: string;
  campaignId?: number;
  displayOrder: number;
  isActive: boolean;
}

interface CampaignFormValues {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
}

const defaultValues: BannerFormValues = {
  title: '',
  imageUrl: '',
  targetUrl: '',
  displayOrder: 1,
  isActive: true,
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const apiMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (apiMessage) return apiMessage;
  }
  return error instanceof Error ? error.message : fallback;
};

const asDateTimeLocal = (date: Date): string => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

const formatDateTimeForInput = (value: string): string => value.slice(0, 16);

export const AdminBannerPage: React.FC = () => {
  const [form] = Form.useForm<BannerFormValues>();
  const [campaignForm] = Form.useForm<CampaignFormValues>();
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [campaignsLoading, setCampaignsLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [campaignSaving, setCampaignSaving] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editingCampaignId, setEditingCampaignId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [campaignFilter, setCampaignFilter] = useState<number | undefined>();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [campaignLoadError, setCampaignLoadError] = useState<string | null>(null);

  const loadBanners = useCallback(async () => {
    try {
      const response = await bannerApi.getAll({
        page,
        size: pageSize,
        search,
        status: statusFilter,
        campaignId: campaignFilter,
      });
      setBanners(response.data?.content || []);
      setTotal(response.data?.totalElements || 0);
      setLoadError(null);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Không thể tải danh sách banner'));
    } finally {
      setLoading(false);
    }
  }, [campaignFilter, page, pageSize, search, statusFilter]);

  const loadCampaigns = useCallback(async () => {
    try {
      const response = await bannerApi.getCampaigns();
      setCampaigns(response.data || []);
      setCampaignLoadError(null);
    } catch (error) {
      setCampaignLoadError(getErrorMessage(error, 'Không thể tải danh sách chiến dịch'));
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBanners();
  }, [loadBanners]);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  const openCreateModal = () => {
    setEditingId(null);
    form.setFieldsValue({ ...defaultValues, displayOrder: total + 1 });
    setModalOpen(true);
  };

  const openEditModal = (banner: BannerItem) => {
    setEditingId(banner.id);
    form.setFieldsValue({
      title: banner.title,
      imageUrl: banner.imageUrl,
      targetUrl: banner.targetUrl || '',
      campaignId: banner.campaignId ?? undefined,
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
          description: values.description?.trim(),
        imageUrl: values.imageUrl,
        targetUrl: values.targetUrl?.trim() || '',
        campaignId: values.campaignId,
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
      setLoading(true);
      await loadBanners();
    } catch (error) {
      message.error(getErrorMessage(error, 'Không thể lưu banner'));
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
          setLoading(true);
          await loadBanners();
        } catch (error) {
          message.error(getErrorMessage(error, 'Xóa banner thất bại'));
        }
      },
    });
  };

  const handleToggleStatus = async (banner: BannerItem, checked: boolean) => {
    try {
      await bannerApi.updateStatus(banner.id, checked);
      setLoading(true);
      await loadBanners();
      message.success(checked ? 'Banner đã được bật hiển thị' : 'Banner đã được ẩn');
    } catch (error) {
      message.error(getErrorMessage(error, 'Cập nhật trạng thái banner thất bại'));
    }
  };

  const openCreateCampaignModal = () => {
    setEditingCampaignId(null);
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    campaignForm.setFieldsValue({
      name: '',
      description: '',
      startDate: asDateTimeLocal(now),
      endDate: asDateTimeLocal(tomorrow),
      status: 'DRAFT',
    });
    setCampaignModalOpen(true);
  };

  const openEditCampaignModal = (campaign: CampaignItem) => {
    setEditingCampaignId(campaign.id);
    campaignForm.setFieldsValue({
      name: campaign.name,
      description: campaign.description || '',
      startDate: formatDateTimeForInput(campaign.startDate),
      endDate: formatDateTimeForInput(campaign.endDate),
      status: campaign.status,
    });
    setCampaignModalOpen(true);
  };

  const handleCampaignSubmit = async () => {
    try {
      const values = await campaignForm.validateFields();
      setCampaignSaving(true);
      const payload: CampaignPayload = {
        ...values,
        name: values.name.trim(),
        description: values.description?.trim(),
      };
      if (editingCampaignId != null) {
        await bannerApi.updateCampaign(editingCampaignId, payload);
        message.success('Đã cập nhật chiến dịch');
      } else {
        await bannerApi.createCampaign(payload);
        message.success('Đã tạo chiến dịch');
      }
      setCampaignModalOpen(false);
      campaignForm.resetFields();
      setCampaignsLoading(true);
      setLoading(true);
      await loadCampaigns();
      await loadBanners();
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) return;
      message.error(getErrorMessage(error, 'Không thể lưu chiến dịch'));
    } finally {
      setCampaignSaving(false);
    }
  };

  const handleDeleteCampaign = (campaign: CampaignItem) => {
    Modal.confirm({
      title: 'Xác nhận xóa chiến dịch',
      content: `Banner liên kết sẽ được giữ lại và bỏ liên kết khỏi "${campaign.name}".`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await bannerApi.deleteCampaign(campaign.id);
          message.success('Đã xóa chiến dịch');
          setCampaignsLoading(true);
          setLoading(true);
          await loadCampaigns();
          await loadBanners();
        } catch (error) {
          message.error(getErrorMessage(error, 'Xóa chiến dịch thất bại'));
        }
      },
    });
  };

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
      title: 'Chiến dịch',
      render: (_: unknown, record: BannerItem) =>
        campaigns.find((campaign) => campaign.id === record.campaignId)?.name
          || <span className="text-slate-400">Không liên kết</span>,
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

  const campaignColumns = [
    {
      title: 'Tên chiến dịch',
      dataIndex: 'name',
      render: (name: string) => <span className="font-semibold text-slate-700">{name}</span>,
    },
    {
      title: 'Thời gian',
      render: (_: unknown, campaign: CampaignItem) =>
        `${new Date(campaign.startDate).toLocaleString('vi-VN')} - ${new Date(campaign.endDate).toLocaleString('vi-VN')}`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status: CampaignStatus) => (
        <Tag color={status === 'ACTIVE' ? 'green' : status === 'PAUSED' ? 'orange' : 'default'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      width: 150,
      render: (_: unknown, campaign: CampaignItem) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditCampaignModal(campaign)}>
            Sửa
          </Button>
          <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleDeleteCampaign(campaign)}>
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

        <Space wrap>
          <Button icon={<PlusOutlined />} onClick={openCreateCampaignModal}>
            Thêm chiến dịch
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
            className="bg-orange-500 hover:bg-orange-600 border-orange-500 shadow-sm"
          >
            Thêm Banner
          </Button>
        </Space>
      </div>

      <Tabs
        items={[
          {
            key: 'banners',
            label: 'Banner',
            children: (
              <Card className="border-0 shadow-sm">
                <div className="mb-4 flex flex-col gap-3 md:flex-row">
                  <Input.Search
                    allowClear
                    placeholder="Tìm theo tiêu đề banner"
                    onSearch={(value) => {
                      const nextSearch = value.trim();
                      if (page === 0 && search === nextSearch) {
                        setLoading(true);
                        void loadBanners();
                        return;
                      }
                      setLoading(true);
                      setPage(0);
                      setSearch(nextSearch);
                    }}
                    className="max-w-md"
                  />
                  <Select
                    value={statusFilter}
                    onChange={(value: 'ALL' | 'ACTIVE' | 'INACTIVE') => {
                      if (page === 0 && statusFilter === value) {
                        setLoading(true);
                        void loadBanners();
                        return;
                      }
                      setLoading(true);
                      setPage(0);
                      setStatusFilter(value);
                    }}
                    options={[
                      { value: 'ALL', label: 'Tất cả trạng thái' },
                      { value: 'ACTIVE', label: 'Đang hiển thị' },
                      { value: 'INACTIVE', label: 'Đã ẩn' },
                    ]}
                    className="w-full md:max-w-52"
                  />
                  <Select
                    allowClear
                    value={campaignFilter}
                    onChange={(value: number | undefined) => {
                      if (page === 0 && campaignFilter === value) {
                        setLoading(true);
                        void loadBanners();
                        return;
                      }
                      setLoading(true);
                      setPage(0);
                      setCampaignFilter(value);
                    }}
                    placeholder="Tất cả chiến dịch"
                    options={campaigns.map((campaign) => ({ value: campaign.id, label: campaign.name }))}
                    className="w-full md:max-w-60"
                  />
                </div>
                {loadError ? (
                  <Alert
                    type="error"
                    showIcon
                    message="Không thể tải danh sách banner"
                    description={loadError}
                    action={<Button onClick={() => {
                      setLoading(true);
                      void loadBanners();
                    }}>Thử lại</Button>}
                  />
                ) : loading ? (
                  <div className="flex min-h-64 items-center justify-center"><Spin size="large" /></div>
                ) : banners.length === 0 ? (
                  <div className="flex min-h-64 items-center justify-center">
                    <Empty description="Chưa có banner phù hợp. Hãy thêm banner đầu tiên." />
                  </div>
                ) : (
                  <Table
                    columns={columns}
                    dataSource={banners}
                    rowKey="id"
                    scroll={{ x: 1200 }}
                    pagination={{
                      current: page + 1,
                      pageSize,
                      total,
                      showSizeChanger: true,
                      onChange: (current, nextPageSize) => {
                        setLoading(true);
                        setPage(current - 1);
                        setPageSize(nextPageSize);
                      },
                    }}
                  />
                )}
              </Card>
            ),
          },
          {
            key: 'campaigns',
            label: 'Chiến dịch',
            children: (
              <Card className="border-0 shadow-sm">
                {campaignsLoading ? (
                  <div className="flex min-h-64 items-center justify-center"><Spin size="large" /></div>
                ) : campaignLoadError ? (
                  <Alert
                    type="error"
                    showIcon
                    message="Không thể tải danh sách chiến dịch"
                    description={campaignLoadError}
                    action={<Button onClick={() => {
                      setCampaignsLoading(true);
                      void loadCampaigns();
                    }}>Thử lại</Button>}
                  />
                ) : campaigns.length === 0 ? (
                  <div className="flex min-h-64 items-center justify-center">
                    <Empty description="Chưa có chiến dịch nào." />
                  </div>
                ) : (
                  <Table
                    columns={campaignColumns}
                    dataSource={campaigns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 800 }}
                  />
                )}
              </Card>
            ),
          },
        ]}
      />

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

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} maxLength={2000} />
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

          <Form.Item name="campaignId" label="Chiến dịch">
            <Select
              allowClear
              placeholder="Không liên kết chiến dịch"
              options={campaigns.map((campaign) => ({ value: campaign.id, label: campaign.name }))}
            />
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

      <Modal
        title={editingCampaignId != null ? 'Chỉnh sửa chiến dịch' : 'Thêm chiến dịch'}
        open={campaignModalOpen}
        onCancel={() => {
          setCampaignModalOpen(false);
          campaignForm.resetFields();
        }}
        onOk={handleCampaignSubmit}
        okText={editingCampaignId != null ? 'Lưu thay đổi' : 'Tạo chiến dịch'}
        confirmLoading={campaignSaving}
        destroyOnClose
        width={640}
      >
        <Form form={campaignForm} layout="vertical">
          <Form.Item
            name="name"
            label="Tên chiến dịch"
            rules={[{ required: true, message: 'Vui lòng nhập tên chiến dịch' }]}
          >
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} maxLength={2000} />
          </Form.Item>
          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item
              name="startDate"
              label="Bắt đầu"
              rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu' }]}
            >
              <Input type="datetime-local" />
            </Form.Item>
            <Form.Item
              name="endDate"
              label="Kết thúc"
              rules={[{ required: true, message: 'Vui lòng chọn thời gian kết thúc' }]}
            >
              <Input type="datetime-local" />
            </Form.Item>
          </div>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'DRAFT', label: 'Bản nháp' },
                { value: 'ACTIVE', label: 'Đang hoạt động' },
                { value: 'PAUSED', label: 'Tạm dừng' },
                { value: 'COMPLETED', label: 'Đã kết thúc' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminBannerPage;
