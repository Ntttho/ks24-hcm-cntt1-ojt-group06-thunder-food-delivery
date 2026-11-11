import React, { useState, useEffect, useRef } from 'react';
import {
  Drawer,
  Input,
  Button,
  Avatar,
  Tag,
  Spin,
  Space,
  message,
} from 'antd';
import {
  SendOutlined,
  UserOutlined,
  CarOutlined,
  ShopOutlined,
  MessageOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { chatApi, type ChatMessage } from '@/services/modules/chatApi';
import { orderLiveTrackingWs } from '@/services/modules/orderLiveTrackingWebSocket';
import { useAuth } from '@/hooks/useAuth';

interface OrderChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  orderCode?: string;
  driverName?: string;
  driverPhone?: string;
  restaurantName?: string;
}

const QUICK_REPLIES = [
  'Tôi đang đợi ở sảnh chung cư/tòa nhà',
  'Giao lên tận cửa phòng giúp tôi nhé',
  'Khi đến nơi vui lòng gọi hoặc nháy máy nhé',
  'Tôi đang xuống lấy, đợi tôi 1-2 phút nha',
  'Món ăn có nước súp, shipper đi cẩn thận giúp mình nhé',
];

export const OrderChatDrawer: React.FC<OrderChatDrawerProps> = ({
  isOpen,
  onClose,
  orderId,
  orderCode,
  driverName = 'Tài xế giao hàng',
  driverPhone,
  restaurantName,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [inputVal, setInputVal] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch initial chat history
  useEffect(() => {
    if (!isOpen || !orderId) return;

    let isMounted = true;
    setLoading(true);

    chatApi
      .getOrderChatHistory(orderId)
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res.data) ? res.data : [];
          setMessages(list);
          setTimeout(scrollToBottom, 150);
        }
      })
      .catch(() => {
        if (isMounted) setMessages([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // 2. Subscribe to STOMP WebSocket incoming messages
    const unsubscribe = orderLiveTrackingWs.subscribeChatMessages((incoming) => {
      if (Number(incoming.orderId) === Number(orderId)) {
        setMessages((prev) => {
          // Avoid duplicate by id
          if (incoming.id && prev.some((m) => m.id === incoming.id)) {
            return prev;
          }
          return [...prev, incoming];
        });
        setTimeout(scrollToBottom, 100);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isOpen, orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || sending) return;

    setSending(true);
    const senderId = Number(user?.id) || 1;
    const currentRole = user?.role || 'CUSTOMER';

    const payload = {
      orderId,
      senderId,
      senderRole: currentRole,
      message: text,
    };

    // Broadcast immediately via WS frame if connected
    orderLiveTrackingWs.sendChatMessageViaWs(payload);

    try {
      const res = await chatApi.sendMessage(payload);
      if (res && res.data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.data.id)) return prev;
          return [...prev, res.data];
        });
      }
      setInputVal('');
      setTimeout(scrollToBottom, 80);
    } catch {
      message.error('Không thể gửi tin nhắn. Vui lòng thử lại!');
    } finally {
      setSending(false);
    }
  };

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      width={440}
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-orange-100 text-orange-600 font-bold text-xs">
              <ThunderboltFilled />
            </span>
            <div>
              <div className="font-extrabold text-sm text-gray-900">
                Trao đổi đơn {orderCode ? `#${orderCode}` : `#${orderId}`}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                Khách hàng &bull; Tài xế {driverName}
              </div>
            </div>
          </div>
          {driverPhone && (
            <a
              href={`tel:${driverPhone}`}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100"
            >
              Gọi xế
            </a>
          )}
        </div>
      }
      footer={
        <div className="space-y-3 p-1">
          {/* Quick Replies Rail */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {QUICK_REPLIES.map((reply, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(reply)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-800 hover:bg-orange-100 text-[11px] font-medium transition cursor-pointer shrink-0"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Chat input form */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Nhắn tin dặn dò tài xế, ghi chú điểm hẹn..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onPressEnter={() => handleSend()}
              className="rounded-xl py-2"
              maxLength={500}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleSend()}
              loading={sending}
              className="bg-orange-500 hover:bg-orange-600 rounded-xl px-4 font-bold shadow-2xs"
            />
          </div>
        </div>
      }
      className="chat-drawer"
    >
      {loading ? (
        <div className="py-24 text-center space-y-2">
          <Spin size="default" />
          <div className="text-xs text-gray-400">Đang tải đoạn hội thoại...</div>
        </div>
      ) : messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-2xl">
            <MessageOutlined />
          </div>
          <div>
            <h4 className="font-extrabold text-gray-800 text-sm mb-1">
              Bắt đầu trò chuyện với tài xế
            </h4>
            <p className="text-xs text-gray-500 max-w-xs">
              Bạn có thể dặn dò điểm hẹn nhận món, thông báo vị trí chính xác hoặc chọn nhanh các câu trả lời bên dưới.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 pb-2">
          {messages.map((m, idx) => {
            const isMe =
              m.senderRole === 'CUSTOMER' ||
              (user?.id && Number(m.senderId) === Number(user.id));

            return (
              <div
                key={m.id || idx}
                className={`flex gap-2.5 items-end ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <Avatar
                    size={30}
                    className={
                      m.senderRole === 'DRIVER'
                        ? 'bg-blue-600 shrink-0'
                        : 'bg-orange-500 shrink-0'
                    }
                    icon={
                      m.senderRole === 'DRIVER' ? (
                        <CarOutlined />
                      ) : (
                        <ShopOutlined />
                      )
                    }
                  />
                )}

                <div
                  className={`max-w-[75%] rounded-2xl p-3 text-xs shadow-2xs ${
                    isMe
                      ? 'bg-orange-500 text-white rounded-br-xs'
                      : 'bg-gray-100 text-gray-900 rounded-bl-xs'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] opacity-80">
                    <span className="font-bold">
                      {isMe
                        ? 'Bạn (Khách hàng)'
                        : m.senderRole === 'DRIVER'
                        ? driverName
                        : restaurantName || 'Quán ăn'}
                    </span>
                    <span>&bull;</span>
                    <span>
                      {m.createdAt
                        ? new Date(m.createdAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Vừa xong'}
                    </span>
                  </div>

                  <div className="leading-relaxed whitespace-pre-wrap font-medium">
                    {m.message}
                  </div>
                </div>

                {isMe && (
                  <Avatar
                    size={30}
                    className="bg-orange-600 shrink-0"
                    icon={<UserOutlined />}
                  />
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}
    </Drawer>
  );
};

export default OrderChatDrawer;
