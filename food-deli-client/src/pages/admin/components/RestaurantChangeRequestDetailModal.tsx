import React, { useState } from 'react';
import { Modal, Descriptions, Tag, Button, Image, Space, Divider, Alert } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import type { RestaurantChangeRequestItem } from '@/services/modules/adminApprovalApi';

interface RestaurantChangeRequestDetailModalProps {
  isOpen: boolean;
  request: RestaurantChangeRequestItem | null;
  onClose: () => void;
  onApprove: (id: number) => void;
  onReject: (request: RestaurantChangeRequestItem) => void;
}

export const RestaurantChangeRequestDetailModal: React.FC<RestaurantChangeRequestDetailModalProps> = ({
  isOpen,
  request,
  onClose,
  onApprove,
  onReject,
}) => {
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  if (!request) return null;

  let payloadData: Record<string, any> = {};
  if (request.payloadData) {
    payloadData = request.payloadData;
  } else if (request.payload) {
    try {
      payloadData = JSON.parse(request.payload);
    } catch {
      payloadData = {};
    }
  }

  const shopName = payloadData.name || request.restaurantName || `Quán ăn #${request.restaurantId}`;
  const address = payloadData.address || 'Chưa có thông tin địa chỉ';
  const openingTime = payloadData.openingTime || '07:00:00';
  const closingTime = payloadData.closingTime || '22:00:00';
  const imageUrl = payloadData.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500';
  const latitude = payloadData.latitude;
  const longitude = payloadData.longitude;

  const isPending = request.status === 'PENDING';

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
            <ShopOutlined className="text-base" />
          </div>
          <div>
            <span className="font-bold text-base">Hồ Sơ Yêu Cầu Quán Ăn</span>
            <span className="ml-2 text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              Yêu cầu #{request.id}
            </span>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full pt-2">
          <Button
            size="small"
            type="text"
            icon={<CodeOutlined />}
            onClick={() => setShowRawJson(!showRawJson)}
            className="text-slate-500 text-xs"
          >
            {showRawJson ? 'Ẩn JSON thô' : 'Xem JSON thô'}
          </Button>

          <Space>
            <Button onClick={onClose} className="rounded-lg">
              Đóng
            </Button>
            {isPending && (
              <>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => onReject(request)}
                  className="rounded-lg font-medium"
                >
                  Từ chối
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => onApprove(request.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 border-none rounded-lg font-medium shadow-sm"
                >
                  Phê duyệt
                </Button>
              </>
            )}
          </Space>
        </div>
      }
      destroyOnClose
      centered
      width={680}
    >
      <div className="space-y-4 pt-2">
        {/* Status Alert if Rejected */}
        {request.status === 'REJECTED' && (
          <Alert
            type="error"
            showIcon
            message="Hồ sơ đã bị từ chối"
            description={
              <div>
                <span className="font-semibold">Lý do: </span>
                {request.rejectReason || 'Không có lý do cụ thể'}
              </div>
            }
            className="rounded-xl"
          />
        )}

        {/* Status Alert if Approved */}
        {request.status === 'APPROVED' && (
          <Alert
            type="success"
            showIcon
            message="Hồ sơ đã được phê duyệt"
            description="Quán ăn này đã được xác thực và hiển thị hoạt động trên sàn Thunder Food."
            className="rounded-xl"
          />
        )}

        {/* Restaurant Card preview */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-orange-50/40 border border-slate-200/80">
          <div className="w-full sm:w-36 h-28 rounded-xl overflow-hidden bg-slate-200 shrink-0 shadow-sm">
            <Image
              src={imageUrl}
              alt={shopName}
              className="w-full h-full object-cover"
              fallback="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-lg leading-snug truncate">{shopName}</h3>
              {request.status === 'PENDING' && <Tag color="warning">Chờ duyệt</Tag>}
              {request.status === 'APPROVED' && <Tag color="success">Đã duyệt</Tag>}
              {request.status === 'REJECTED' && <Tag color="error">Đã từ chối</Tag>}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <EnvironmentOutlined className="text-orange-500 shrink-0" />
              <span className="truncate">{address}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <ClockCircleOutlined className="text-blue-500 shrink-0" />
              <span>
                Giờ hoạt động: <strong>{openingTime}</strong> - <strong>{closingTime}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-mono">
              <span>Tọa độ GPS: {latitude ?? 'Chưa rõ'}, {longitude ?? 'Chưa rõ'}</span>
            </div>
          </div>
        </div>

        {/* Detailed Metadata Descriptions */}
        <Descriptions
          bordered
          size="small"
          column={{ xs: 1, sm: 2 }}
          className="rounded-xl overflow-hidden border-slate-200"
        >
          <Descriptions.Item label="Mã yêu cầu (Request ID)">
            <span className="font-mono font-semibold">#{request.id}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Mã quán ăn (Shop ID)">
            <span className="font-mono font-semibold">#{request.restaurantId}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Người gửi yêu cầu (Owner ID)">
            <span className="font-mono">User #{request.requestedBy}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian gửi">
            <span className="text-xs text-slate-600">
              {request.createdAt ? new Date(request.createdAt).toLocaleString('vi-VN') : 'Không rõ'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Người xét duyệt">
            <span className="text-xs text-slate-600">
              {request.reviewedBy ? `Admin #${request.reviewedBy}` : 'Chưa có'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian duyệt">
            <span className="text-xs text-slate-600">
              {request.reviewedAt ? new Date(request.reviewedAt).toLocaleString('vi-VN') : 'Chưa có'}
            </span>
          </Descriptions.Item>
        </Descriptions>

        {/* Raw JSON Debugging Section */}
        {showRawJson && (
          <div className="bg-slate-900 rounded-xl p-3 text-slate-200 font-mono text-xs overflow-x-auto max-h-48">
            <pre>{JSON.stringify(payloadData, null, 2)}</pre>
          </div>
        )}
      </div>
    </Modal>
  );
};

