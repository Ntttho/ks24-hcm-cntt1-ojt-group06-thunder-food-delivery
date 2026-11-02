import React from 'react';
import { Button, Tooltip, Typography } from 'antd';
import {
  SyncOutlined,
  SoundOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface MerchantHeaderProps {
  wsStatus: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';
  soundEnabled: boolean;
  loading: boolean;
  onToggleSound: () => void;
  onTestSound: () => void;
  onSimulateOrder: () => void;
  onRefresh: () => void;
}

export const MerchantHeader: React.FC<MerchantHeaderProps> = ({
  wsStatus,
  soundEnabled,
  loading,
  onToggleSound,
  onTestSound,
  onSimulateOrder,
  onRefresh,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
      <div>
        <div className="flex items-center gap-3">
          <Title level={3} className="!mb-0 text-slate-800">
            Tiếp Nhận &amp; Xử Lý Đơn Hàng (Realtime)
          </Title>
          {/* Realtime WebSocket Badge */}
          {wsStatus === 'CONNECTED' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              WebSocket Realtime
            </span>
          ) : wsStatus === 'CONNECTING' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <SyncOutlined spin className="text-amber-500" />
              Đang kết nối WS...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              <span className="h-2 w-2 rounded-full bg-slate-400"></span>
              Auto-Polling (Bảo vệ)
            </span>
          )}
        </div>
        <Text className="text-slate-500 text-xs sm:text-sm mt-1 block">
          Hệ thống tự động phát chuông báo khi có đơn mới từ khách. Quán xác nhận để nhà bếp chuẩn bị món.
        </Text>
      </div>

      {/* Quick Action Controls: Sound Toggle, Sound Test, Simulation, Refresh */}
      <div className="flex flex-wrap items-center gap-2">
        <Tooltip title={soundEnabled ? 'Bấm để tắt chuông báo' : 'Bấm để bật chuông báo'}>
          <Button
            type={soundEnabled ? 'primary' : 'default'}
            icon={<SoundOutlined />}
            onClick={onToggleSound}
            style={soundEnabled ? { backgroundColor: '#10b981', borderColor: '#10b981' } : {}}
            className="rounded-lg font-medium"
          >
            {soundEnabled ? 'Chuông: BẬT' : 'Chuông: TẮT'}
          </Button>
        </Tooltip>

        <Tooltip title="Nghe thử tiếng chuông hai âm sắc (Web Audio API)">
          <Button
            type="default"
            icon={<SoundOutlined className="text-orange-500" />}
            onClick={onTestSound}
            className="rounded-lg font-medium hover:border-orange-400"
          >
            Thử chuông
          </Button>
        </Tooltip>

        <Tooltip title="Mô phỏng 1 đơn hàng mới đổ về để kiểm tra chuông reo & popup WebSocket">
          <Button
            type="default"
            icon={<ThunderboltOutlined className="text-amber-500" />}
            onClick={onSimulateOrder}
            className="rounded-lg font-medium border-amber-300 text-amber-700 bg-amber-50/50 hover:bg-amber-100"
          >
            Giả lập đơn mới
          </Button>
        </Tooltip>

        <Button
          type="default"
          icon={<SyncOutlined spin={loading} />}
          onClick={onRefresh}
          className="rounded-lg shadow-xs"
        >
          Làm mới
        </Button>
      </div>
    </div>
  );
};
