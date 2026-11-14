import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Phone, Send, X } from '../icons';
import { QUICK_CHAT_REPLIES } from '../deliveryHelpers';
import type { DriverOrder } from '@/services/modules/driverApi';
import type { ChatMessage } from '@/services/modules/chatApi';

interface DriverCustomerChatModalProps {
  open: boolean;
  order: DriverOrder;
  messages: ChatMessage[];
  onClose: () => void;
  onSendMessage: (text: string) => void;
}

const formatChatTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

export const DriverCustomerChatModal: React.FC<DriverCustomerChatModalProps> = ({
  open,
  order,
  messages,
  onClose,
  onSendMessage,
}) => {
  const [draft, setDraft] = useState<string>('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [open, messages.length]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setDraft('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-end justify-center sm:justify-end bg-slate-900/40 sm:bg-transparent backdrop-blur-[1px] sm:backdrop-blur-none sm:p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Chat với khách hàng đơn ${order.orderCode}`}
    >
      <div
        className="w-full sm:w-[380px] max-h-[84vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black truncate">{order.receiverName}</h3>
              <p className="text-[11px] text-emerald-100 truncate">
                Đơn #{order.orderCode} • Khách hàng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {order.receiverPhone && (
              <a
                href={`tel:${order.receiverPhone}`}
                className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all"
                title={`Gọi ${order.receiverPhone}`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Gọi</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng khung chat"
              className="p-1.5 rounded-xl bg-white/15 hover:bg-white/30 text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Note */}
        <div className="bg-emerald-50 border-b border-emerald-100 px-3.5 py-2 text-[11px] text-emerald-800 leading-snug flex items-center justify-between">
          <span>Kênh chat đơn <strong>#{order.orderCode}</strong></span>
          <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Realtime STOMP
          </span>
        </div>

        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-slate-50 min-h-[210px] max-h-[340px]">
          <div className="flex justify-center">
            <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full text-center">
              Giao tới: {order.receiverAddress}
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-8 px-4 space-y-1.5">
              <p className="text-xs font-bold text-slate-600">Chưa có tin nhắn nào</p>
              <p className="text-[11px] text-slate-400">
                Chọn câu trả lời nhanh bên dưới hoặc nhập lời nhắn gửi khách hàng.
              </p>
            </div>
          ) : (
            messages.map((msg: any) => {
              const isDriver = msg.senderRole === 'DRIVER' || msg.sender === 'DRIVER';
              const text = msg.message || msg.text;
              const time = msg.createdAt || msg.sentAtIso;
              const role = msg.senderRole || msg.sender || 'CUSTOMER';
              const label = isDriver ? 'Bạn' : role === 'MERCHANT' ? 'Quán ăn' : 'Khách hàng';

              return (
                <div key={msg.id} className={`flex flex-col ${isDriver ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`text-xs rounded-2xl px-3.5 py-2 max-w-[85%] shadow-xs leading-relaxed ${
                      isDriver
                        ? 'bg-emerald-600 text-white rounded-br-sm'
                        : role === 'MERCHANT'
                        ? 'bg-orange-50 border border-orange-200 text-orange-900 rounded-bl-sm'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                    }`}
                  >
                    {text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 px-1">
                    {label} • {formatChatTime(time)}
                  </span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Replies */}
        <div className="px-3.5 pt-2.5 pb-2 bg-white border-t border-slate-100 space-y-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
            Tin nhắn nhanh
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_CHAT_REPLIES.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => onSendMessage(reply)}
                className="text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full transition-all cursor-pointer text-left"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Nhập tin nhắn cho khách hàng..."
            className="flex-1 bg-slate-100 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Gửi tin nhắn"
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white p-2.5 rounded-xl transition-all cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

