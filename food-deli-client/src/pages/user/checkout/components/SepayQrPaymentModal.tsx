import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Spin, message } from 'antd';
import {
  CopyOutlined,
  CheckCircleFilled,
  SyncOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { paymentApi, type SepayGenerateResponse } from '@/services/modules/paymentApi';
import { orderApi } from '@/services/modules/orderApi';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { clearPurchasedItems } from '@/store/slices/cartSlice';

interface SepayQrPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrData: SepayGenerateResponse | null;
  orderId: number;
  totalAmount: number;
}

export const SepayQrPaymentModal: React.FC<SepayQrPaymentModalProps> = ({
  isOpen,
  onClose,
  qrData,
  orderId,
  totalAmount,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);

  // 8-minute Countdown timer (480 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(480);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper formatting mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    message.success(`Đã sao chép ${label}!`);
  };

  // Countdown timer effect
  useEffect(() => {
    if (!isOpen || isPaidSuccess) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(480);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPaidSuccess]);

  const handleTimeout = async () => {
    try {
      await orderApi.cancelOrder(orderId, 'Quá thời hạn thanh toán 8 phút');
      message.error('Đơn hàng đã hết hạn thanh toán 8 phút và tự động hủy.');
      onClose();
      navigate('/');
    } catch {
      onClose();
      navigate('/');
    }
  };

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      await orderApi.cancelOrder(orderId, 'Khách hàng hủy đơn trong thời gian chờ thanh toán');
      message.info('Đã hủy đơn hàng');
      onClose();
      navigate('/');
    } catch {
      message.error('Không thể hủy đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  // Poll payment status every 3 seconds
  useEffect(() => {
    if (!isOpen || !orderId || isPaidSuccess) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await paymentApi.getPaymentStatus(orderId);
        const st = res.data?.status;
        if (st === 'SUCCESS' || st === 'PAID') {
          handleSuccess();
        }
      } catch {
        // Silent poll error
      }
    };

    pollingRef.current = setInterval(checkStatus, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, orderId, isPaidSuccess]);

  const handleSuccess = async () => {
    setIsPaidSuccess(true);
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    // Call backend to update order to PENDING and notify merchant
    try {
      await orderApi.confirmPaymentSuccess(orderId);
    } catch {
      // Ignored if already handled
    }

    dispatch(clearPurchasedItems());
    message.success('Thanh toán đơn hàng thành công qua SePay VietQR! Đang chuyển về Trang chủ...');

    setTimeout(() => {
      onClose();
      navigate('/');
    }, 2000);
  };

  // Manual check button
  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      const res = await paymentApi.getPaymentStatus(orderId);
      const st = res.data?.status;
      if (st === 'SUCCESS' || st === 'PAID') {
        await handleSuccess();
      } else {
        message.info('Hệ thống đang chờ ngân hàng đối soát. Nếu bạn đã chuyển khoản, vui lòng đợi trong giây lát!');
      }
    } catch {
      message.warning('Chưa thể kiểm tra trạng thái lúc này. Đơn hàng vẫn được lưu lại.');
    } finally {
      setIsChecking(false);
    }
  };

  if (!isOpen) return null;

  const bankName = qrData?.bankName || 'ACB';
  const accountNo = qrData?.accountNo || '17532841';
  const accountName = qrData?.accountName || 'NGUYEN TA THO';
  const paymentContent = qrData?.paymentContent || `FOODDELI ORD${orderId}`;
  const amountToPay = qrData?.amount || totalAmount;
  const qrUrl =
    qrData?.qrCodeUrl ||
    `https://qr.sepay.vn/img?acc=${accountNo}&bank=${bankName}&amount=${amountToPay}&des=${encodeURIComponent(
      paymentContent
    )}`;

  return (
    <Modal
      open={isOpen}
      onCancel={() => {
        message.info('Đơn hàng của bạn đang ở trạng thái Chờ thanh toán trong 8 phút. Bạn có thể thanh toán sau trong Giỏ hàng!');
        onClose();
        navigate('/');
      }}
      footer={null}
      centered
      width={480}
      className="rounded-3xl overflow-hidden p-0"
    >
      <div className="p-4 sm:p-6 text-center">
        {/* Success State */}
        {isPaidSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center gap-4 animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-5xl shadow-md">
              <CheckCircleFilled />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-gray-900">Thanh toán thành công!</h3>
              <p className="text-gray-500 text-sm mt-1">
                Đơn hàng #{orderId} đã được thanh toán. Quán ăn đã nhận đơn và chuẩn bị món cho bạn!
              </p>
            </div>
            <Spin size="small" />
            <span className="text-xs text-gray-400">Đang tự động chuyển về Trang chủ...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header & 8-min countdown badge */}
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold">
                  <SafetyCertificateOutlined />
                  <span>Cổng VietQR Napas 247 • SePay</span>
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-extrabold border border-red-200">
                  <ClockCircleOutlined />
                  <span>Thời gian thanh toán: {formatTime(timeLeft)}</span>
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900">Quét mã QR để thanh toán</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Đơn hàng được giữ trong <strong>8 phút</strong>. Quán sẽ nhận đơn ngay khi thanh toán hoàn tất!
              </p>
            </div>

            {/* QR Code Canvas */}
            <div className="relative mx-auto w-64 h-64 bg-white p-3 rounded-2xl border-2 border-orange-500/30 shadow-md flex items-center justify-center">
              <img
                src={qrUrl}
                alt="SePay VietQR Code"
                className="w-full h-full object-contain rounded-xl"
              />
              <div className="absolute -bottom-2 bg-orange-500 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-sm">
                Tự động nhận diện thanh toán
              </div>
            </div>

            {/* Transfer Details Card */}
            <div className="bg-gray-50 rounded-2xl p-4 text-left text-xs space-y-2.5 border border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Ngân hàng thụ hưởng:</span>
                <span className="font-bold text-gray-800">{bankName} - Ngân hàng Á Châu</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Số tài khoản:</span>
                <div className="flex items-center gap-1.5 font-bold font-mono text-gray-900 text-sm">
                  <span>{accountNo}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(accountNo, 'Số tài khoản')}
                    className="text-orange-500 hover:text-orange-600 cursor-pointer p-0.5"
                    title="Sao chép số tài khoản"
                  >
                    <CopyOutlined />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Chủ tài khoản:</span>
                <span className="font-bold text-gray-800 uppercase">{accountName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Số tiền:</span>
                <div className="flex items-center gap-1.5 font-extrabold text-orange-600 text-base">
                  <span>{Number(amountToPay).toLocaleString('vi-VN')}đ</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(String(amountToPay), 'Số tiền')}
                    className="text-orange-500 hover:text-orange-600 cursor-pointer p-0.5"
                    title="Sao chép số tiền"
                  >
                    <CopyOutlined />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                <span className="text-gray-500">Nội dung chuyển khoản:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold font-mono text-orange-600 bg-orange-100/80 px-2 py-0.5 rounded-md text-xs">
                    {paymentContent}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(paymentContent, 'Nội dung chuyển khoản')}
                    className="text-orange-600 hover:text-orange-700 cursor-pointer p-0.5"
                    title="Sao chép nội dung"
                  >
                    <CopyOutlined />
                  </button>
                </div>
              </div>
            </div>

            {/* Note alert */}
            <div className="flex items-start gap-2 bg-amber-50 text-amber-800 p-2.5 rounded-xl text-left text-xs">
              <InfoCircleOutlined className="text-amber-600 mt-0.5" />
              <span>
                Vui lòng nhập <strong>chính xác nội dung</strong> và <strong>số tiền</strong> để hệ thống tự động xác nhận đơn hàng sau 1-3 giây!
              </span>
            </div>

            {/* Live polling status */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <SyncOutlined spin className="text-orange-500" />
              <span>Đang chờ chuyển khoản... Tự động gửi đơn cho quán khi nhận tiền</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="primary"
                  loading={isChecking}
                  onClick={handleManualCheck}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 rounded-xl font-bold h-11"
                >
                  Tôi đã chuyển khoản xong
                </Button>
                <Button
                  onClick={() => {
                    message.info('Đơn hàng được lưu ở trạng thái Chờ thanh toán trong 8 phút.');
                    onClose();
                    navigate('/');
                  }}
                  className="rounded-xl font-semibold h-11 border-gray-200"
                >
                  Về Trang chủ
                </Button>
              </div>

              <Button
                type="text"
                danger
                loading={cancelling}
                onClick={handleCancelOrder}
                icon={<CloseCircleOutlined />}
                className="text-xs font-semibold text-red-500 hover:text-red-600"
              >
                Hủy đơn hàng này
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SepayQrPaymentModal;
