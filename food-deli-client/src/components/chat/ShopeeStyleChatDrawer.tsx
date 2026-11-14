import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Tag, Spin } from 'antd';
import {
  MessageOutlined,
  CloseOutlined,
  SendOutlined,
  ShopOutlined,
  CarOutlined,
  ArrowLeftOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { orderApi } from '@/services/modules/orderApi';
import type { CustomerOrder } from '@/types';
import { chatApi, type ChatMessage } from '@/services/modules/chatApi';
import { orderLiveTrackingWs } from '@/services/modules/orderLiveTrackingWebSocket';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/formatters';

const QUICK_REPLIES = [
  'Đơn hàng của tôi đã chuẩn bị xong chưa ạ?',
  'Shipper giao đến cổng giúp mình nhé!',
  'Món ăn rất ngon, cảm ơn quán và tài xế!',
  'Đang xuống nhận món ngay ạ.',
];

export const ShopeeStyleChatDrawer: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [recentOrders, setRecentOrders] = useState<CustomerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);

  // Chat message state for active room
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch recent orders for conversation list
  useEffect(() => {
    if (!isAuthenticated || !isOpen) return;

    setLoadingOrders(true);
    orderApi
      .getMyOrders({ page: 0, size: 10 })
      .then((res) => {
        if (res && res.data && Array.isArray(res.data.content)) {
          setRecentOrders(res.data.content);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, [isAuthenticated, isOpen, user?.id]);

  // Connect to STOMP WebSocket for selected order
  useEffect(() => {
    if (!selectedOrder) return;

    const orderId = selectedOrder.id;
    setLoadingMessages(true);

    chatApi
      .getOrderChatHistory(orderId)
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setMessages(res.data);
        }
      })
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));

    orderLiveTrackingWs.connect(orderId);

    const unsubscribe = orderLiveTrackingWs.subscribeChatMessages((newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [selectedOrder]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isAuthenticated) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !selectedOrder || sending) return;

    setSending(true);
    const userRole = (user as any)?.role || 'CUSTOMER';

    const localMsg: ChatMessage = {
      id: Date.now(),
      orderId: Number(selectedOrder.id),
      senderId: user?.id ? Number(user.id) : 1,
      senderRole: userRole,
      message: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, localMsg]);
    if (!textToSend) setInputText('');

    try {
      await chatApi.sendMessage({
        orderId: Number(selectedOrder.id),
        senderId: user?.id ? Number(user.id) : 1,
        senderRole: userRole,
        message: text,
      });

      orderLiveTrackingWs.sendChatMessageViaWs({
        orderId: Number(selectedOrder.id),
        senderId: user?.id ? Number(user.id) : 1,
        senderRole: userRole,
        message: text,
      });
    } catch {
      // Local fallback already in state
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating Shopee-Style Chat Trigger Pill */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold px-5 py-3 rounded-full shadow-xl hover:shadow-2xl active:scale-95 transition-all cursor-pointer border-2 border-white/80"
          >
            <div className="relative">
              <MessageOutlined className="text-xl" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
            </div>
            <span className="text-sm">Chat Đơn Hàng</span>
          </button>
        </div>
      )}

      {/* Shopee Style Chat Box */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:right-6 z-50 w-[95vw] sm:w-[420px] h-[560px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-amber-500 text-white px-4 py-3.5 flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {selectedOrder ? (
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-xl hover:bg-white/20 transition-all cursor-pointer"
                  title="Quay lại danh sách hội thoại"
                >
                  <ArrowLeftOutlined className="text-base" />
                </button>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                  <ThunderboltFilled className="text-white text-base" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold truncate">
                  {selectedOrder ? selectedOrder.restaurantName || `Đơn ${selectedOrder.orderCode}` : 'Tin Nhắn Shopee Food'}
                </h3>
                <p className="text-[11px] text-orange-100 truncate">
                  {selectedOrder ? `Mã đơn #${selectedOrder.orderCode}` : 'Hội thoại trực tiếp với Quán & Tài xế'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                setSelectedOrder(null);
              }}
              className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-all cursor-pointer"
              title="Đóng chat"
            >
              <CloseOutlined className="text-sm" />
            </button>
          </div>

          {/* Body: Conversation List OR Active Chat Room */}
          {!selectedOrder ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
              <div className="px-2 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Đơn hàng gần đây ({recentOrders.length})</span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Sẵn sàng chat
                </span>
              </div>

              {loadingOrders ? (
                <div className="py-16 text-center">
                  <Spin size="default" />
                  <p className="text-xs text-slate-400 mt-2 font-medium">Đang tải danh sách đơn...</p>
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs px-4">
                  Chưa có đơn hàng nào để nhắn tin. Hãy đặt đơn để trò chuyện trực tiếp với Quán ăn và Tài xế nhé!
                </div>
              ) : (
                recentOrders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className="bg-white hover:bg-orange-50/60 p-3.5 rounded-2xl border border-slate-100 hover:border-orange-200 transition-all cursor-pointer shadow-2xs group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 truncate">
                        <ShopOutlined className="text-orange-500" />
                        <span className="truncate">{ord.restaurantName || `Quán #${ord.restaurantId}`}</span>
                      </div>
                      <Tag
                        color={
                          ord.statusCode === 'COMPLETED'
                            ? 'success'
                            : ord.statusCode === 'DELIVERING'
                            ? 'processing'
                            : 'gold'
                        }
                        className="text-[10px] font-bold px-1.5 py-0 border-none m-0"
                      >
                        {ord.statusCode}
                      </Tag>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Đơn #{ord.orderCode}</span>
                      <span>{formatDate(ord.createdAt)}</span>
                    </div>

                    {ord.driverName && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-50 text-[10px] text-emerald-700 flex items-center gap-1 font-semibold">
                        <CarOutlined />
                        <span>Tài xế: {ord.driverName}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Active Chat Room View */
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
                {loadingMessages ? (
                  <div className="py-16 text-center">
                    <Spin size="small" />
                    <p className="text-xs text-slate-400 mt-2">Đang tải tin nhắn...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 px-6">
                    <p className="font-bold text-slate-600 mb-1">Bắt đầu trò chuyện</p>
                    <p>Nhắn tin với Quán ăn hoặc Tài xế giao hàng để được hỗ trợ nhanh nhất.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderRole === ((user as any)?.role || 'CUSTOMER');
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`text-xs px-3.5 py-2 rounded-2xl max-w-[85%] shadow-xs leading-relaxed ${
                            isMe
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-xs'
                              : msg.senderRole === 'DRIVER'
                              ? 'bg-emerald-600 text-white rounded-bl-xs'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                          }`}
                        >
                          {msg.message}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 px-1">
                          {isMe ? 'Bạn' : msg.senderRole === 'DRIVER' ? 'Tài xế' : 'Quán ăn'}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies Rail */}
              <div className="px-3 pt-2 pb-1.5 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto no-scrollbar">
                {QUICK_REPLIES.map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(qr)}
                    className="text-[11px] font-medium bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-700 px-2.5 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer shrink-0"
                  >
                    {qr}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onPressEnter={() => handleSendMessage()}
                  placeholder="Nhập nội dung tin nhắn..."
                  className="rounded-xl bg-slate-100 border-none focus:bg-white text-xs h-9"
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => handleSendMessage()}
                  loading={sending}
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 font-bold h-9 px-3"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ShopeeStyleChatDrawer;
