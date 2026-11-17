import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Table, Modal, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Wallet,
  TrendingUp,
  ChevronLeft,
  Search,
  DollarSign,
  RotateCcw,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
} from './icons';
import { useAuth } from '@/hooks/useAuth';
import {
  driverApi,
  DriverWalletDetails,
  DriverWalletTransaction,
} from '@/services/modules/driverApi';
import { APP_ROUTES } from '@/constants';

export const ShipperWalletPage: React.FC = () => {
  const { user } = useAuth();

  // Wallet data state
  const [wallet, setWallet] = useState<DriverWalletDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters state
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week'>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedTx, setSelectedTx] = useState<DriverWalletTransaction | null>(null);

  // Modals state
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [bankName, setBankName] = useState<string>('MB Bank (Ngân hàng Quân đội)');
  const [bankAccount, setBankAccount] = useState<string>('0987654321');
  const [accountHolder, setAccountHolder] = useState<string>(
    user?.fullName ? user.fullName.toUpperCase() : 'TRAN THI B'
  );
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState<boolean>(false);

  const [isCodSettlementModalOpen, setIsCodSettlementModalOpen] = useState<boolean>(false);
  const [isSettlingCod, setIsSettlingCod] = useState<boolean>(false);

  // Fetch wallet details
  const loadWallet = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await driverApi.getDriverWallet(user?.id);
      setWallet(data);
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu ví tài xế.';
      console.error('Lỗi tải dữ liệu ví:', err);
      setLoadError(errMsg);
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const driverDisplayName = user?.fullName || 'Tài xế đối tác';

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!wallet || !wallet.transactionHistory) return [];

    let list = [...wallet.transactionHistory];

    // Filter by type
    if (filterType !== 'ALL') {
      if (filterType === 'DELIVERY_FEE') {
        list = list.filter((tx) => tx.type === 'DELIVERY_FEE' || tx.direction === 'IN');
      } else if (filterType === 'COD_COLLECTED') {
        list = list.filter((tx) => tx.type === 'COD_COLLECTED' || tx.direction === 'HOLDING');
      } else if (filterType === 'WITHDRAWAL') {
        list = list.filter((tx) => tx.type === 'WITHDRAWAL' || tx.direction === 'OUT');
      }
    }

    // Filter by period
    if (filterPeriod !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfWeek = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - ((now.getDay() + 6) % 7)
      ).getTime();

      list = list.filter((tx) => {
        const txTime = new Date(tx.createdAt).getTime();
        if (filterPeriod === 'today') return txTime >= startOfToday;
        if (filterPeriod === 'week') return txTime >= startOfWeek;
        return true;
      });
    }

    // Filter by keyword
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      list = list.filter(
        (tx) =>
          tx.orderCode?.toLowerCase().includes(kw) ||
          tx.description?.toLowerCase().includes(kw) ||
          tx.id?.toLowerCase().includes(kw)
      );
    }

    return list;
  }, [wallet, filterType, filterPeriod, searchKeyword]);

  // Handle withdraw submission
  const handleConfirmWithdraw = async () => {
    const num = Number(withdrawAmount.replace(/\D/g, ''));
    if (!num || num <= 0) {
      message.warning('Vui lòng nhập số tiền rút hợp lệ!');
      return;
    }
    if (wallet && num > wallet.availableBalance) {
      message.error('Số tiền rút vượt quá số dư khả dụng!');
      return;
    }
    if (num < 50000) {
      message.warning('Số tiền rút tối thiểu là 50.000 đ!');
      return;
    }

    setIsSubmittingWithdraw(true);
    try {
      // Simulate API withdrawal request
      await new Promise((resolve) => setTimeout(resolve, 800));

      message.success(`Đã tạo lệnh rút ${num.toLocaleString('vi-VN')} đ về tài khoản ${bankName}! Tiền sẽ vào tài khoản trong 5-15 phút.`);
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');

      // Optimistically update wallet or reload
      if (wallet) {
        const newBal = wallet.availableBalance - num;
        const newTx: DriverWalletTransaction = {
          id: `TX-WDR-${Date.now()}`,
          type: 'WITHDRAWAL',
          typeLabel: 'Rút tiền về ngân hàng',
          direction: 'OUT',
          amount: num,
          balanceAfter: newBal,
          description: `Rút tiền về STK ${bankAccount} (${bankName})`,
          createdAt: new Date().toISOString(),
        };
        setWallet({
          ...wallet,
          availableBalance: newBal,
          transactionHistory: [newTx, ...wallet.transactionHistory],
        });
      }
    } catch (err: any) {
      message.error('Rút tiền thất bại. Vui lòng thử lại!');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  // Handle COD settlement submission
  const handleConfirmCodSettlement = async () => {
    setIsSettlingCod(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      message.success('Đã gửi thông tin quyết toán COD thành công! Ban quản trị sẽ đối soát và xác nhận giao dịch.');
      setIsCodSettlementModalOpen(false);
    } catch (err) {
      message.error('Có lỗi xảy ra khi gửi thông tin quyết toán.');
    } finally {
      setIsSettlingCod(false);
    }
  };

  // Format date helper
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    try {
      const d = new Date(isoString);
      return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    } catch {
      return isoString;
    }
  };

  // Desktop Table Columns
  const columns: ColumnsType<DriverWalletTransaction> = [
    {
      title: 'Mã GD / Đơn hàng',
      key: 'code',
      width: 190,
      render: (_, tx) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-slate-800">{tx.orderCode || tx.id}</span>
            {tx.orderCode && (
              <Link
                to={`/orders/${tx.orderCode}`}
                className="text-emerald-600 hover:text-emerald-700"
                title="Xem chi tiết đơn hàng"
              >
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">{tx.id}</span>
        </div>
      ),
    },
    {
      title: 'Loại biến động',
      key: 'type',
      width: 170,
      render: (_, tx) => {
        if (tx.direction === 'IN') {
          return (
            <Tag color="success" className="font-semibold text-xs px-2 py-0.5 rounded-md flex items-center gap-1 w-fit">
              <ArrowDownLeft className="w-3 h-3" />
              <span>{tx.typeLabel || 'Tiền công ship'}</span>
            </Tag>
          );
        }
        if (tx.direction === 'HOLDING') {
          return (
            <Tag color="warning" className="font-semibold text-xs px-2 py-0.5 rounded-md flex items-center gap-1 w-fit">
              <DollarSign className="w-3 h-3" />
              <span>{tx.typeLabel || 'Thu COD hộ'}</span>
            </Tag>
          );
        }
        return (
          <Tag color="error" className="font-semibold text-xs px-2 py-0.5 rounded-md flex items-center gap-1 w-fit">
            <ArrowUpRight className="w-3 h-3" />
            <span>{tx.typeLabel || 'Rút tiền'}</span>
          </Tag>
        );
      },
    },
    {
      title: 'Chi tiết nội dung',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => <span className="text-xs text-slate-700">{text}</span>,
    },
    {
      title: 'Thời gian',
      key: 'createdAt',
      width: 170,
      render: (_, tx) => (
        <span className="text-xs text-slate-500 font-medium">
          {formatDateTime(tx.createdAt)}
        </span>
      ),
    },
    {
      title: 'Số tiền biến động',
      key: 'amount',
      width: 160,
      align: 'right',
      render: (_, tx) => {
        if (tx.direction === 'IN') {
          return (
            <span className="font-black text-emerald-600 text-sm">
              +{tx.amount.toLocaleString('vi-VN')} đ
            </span>
          );
        }
        if (tx.direction === 'HOLDING') {
          return (
            <div className="text-right">
              <span className="font-black text-amber-600 text-sm">
                {tx.amount.toLocaleString('vi-VN')} đ
              </span>
              <span className="text-[10px] text-amber-500 block font-semibold">(Thu tiền mặt COD)</span>
            </div>
          );
        }
        return (
          <span className="font-black text-rose-600 text-sm">
            -{tx.amount.toLocaleString('vi-VN')} đ
          </span>
        );
      },
    },
    {
      title: 'Số dư khả dụng sau GD',
      key: 'balanceAfter',
      width: 170,
      align: 'right',
      render: (_, tx) => (
        <span className="font-bold text-slate-900 text-xs font-mono">
          {tx.balanceAfter ? `${tx.balanceAfter.toLocaleString('vi-VN')} đ` : '--'}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 py-6 px-3 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header & Navigation */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to={APP_ROUTES.SHIPPER_DASHBOARD}
              className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors shadow-sm"
              title="Quay lại Hub trực tuyến"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  Ví Thu Nhập Của Tôi
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Driver Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Quản lý dòng tiền chi tiết, tiền cước ship, tiền mặt COD đang giữ &amp; lịch sử giao dịch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Link
              to={APP_ROUTES.SHIPPER_HISTORY}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>Xem lịch sử chuyến xe</span>
            </Link>
            <button
              onClick={loadWallet}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            3 CARDS OVERVIEW: Available Balance | Holding COD | Today's Earnings
           ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">

          {/* Card 1: Số dư khả dụng (Tiền ship nhận được) */}
          <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white p-6 shadow-xl shadow-emerald-700/20 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between text-emerald-100 text-xs font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-200" />
                  Số Dư Thu Nhập Khả Dụng
                </span>
                <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">
                  Tiền ship
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-black mt-3 tracking-tight">
                {wallet ? `${wallet.availableBalance.toLocaleString('vi-VN')} đ` : '-- đ'}
              </div>
              <p className="text-emerald-100/80 text-[11px] mt-2 leading-relaxed">
                Tiền cước tích lũy từ các đơn hoàn thành (COMPLETED). Có thể rút về ngân hàng bất kỳ lúc nào.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between gap-3">
              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={!wallet || wallet.availableBalance <= 0}
                className="w-full bg-white hover:bg-emerald-50 text-emerald-800 font-black text-xs py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-700" />
                <span>Rút tiền về ngân hàng</span>
              </button>
            </div>
          </div>

          {/* Card 2: Tiền mặt COD đang giữ của quán */}
          <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white p-6 shadow-xl shadow-amber-500/20 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between text-amber-100 text-xs font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-200" />
                  Tiền Mặt COD Đang Giữ
                </span>
                <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">
                  Cần nộp lại
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-black mt-3 tracking-tight">
                {wallet ? `${wallet.holdingCodAmount.toLocaleString('vi-VN')} đ` : '-- đ'}
              </div>
              <p className="text-amber-100/90 text-[11px] mt-2 leading-relaxed">
                Tổng tiền mặt shipper đã thu từ khách của các đơn COD, đang tạm giữ và cần quyết toán về hệ thống.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between gap-3">
              <button
                onClick={() => setIsCodSettlementModalOpen(true)}
                disabled={!wallet || wallet.holdingCodAmount <= 0}
                className="w-full bg-white hover:bg-amber-50 text-amber-800 font-black text-xs py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-4 h-4 text-amber-700" />
                <span>Quyết toán nộp tiền COD</span>
              </button>
            </div>
          </div>

          {/* Card 3: Thu nhập hôm nay & Thống kê chuyến */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Thu Nhập Hôm Nay
                </span>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                  Hôm nay
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-black mt-3 tracking-tight text-slate-900">
                {wallet ? `${wallet.todayEarnings.toLocaleString('vi-VN')} đ` : '-- đ'}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Cuốc đã hoàn tất</span>
                  <span className="font-black text-sm text-slate-800">
                    {wallet ? `${wallet.completedTripsCount} cuốc` : '--'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Đối tác</span>
                  <span className="font-bold text-xs text-slate-800 truncate block">
                    {driverDisplayName}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Ví được liên kết xác thực qua API <code>/deliveries/driver/wallet</code></span>
              </div>
            </div>
          </div>

        </div>

        {/* =========================================================================
            TRANSACTION HISTORY SECTION
           ========================================================================= */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>Lịch Sử Biến Động Số Dư &amp; Dòng Tiền</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Chi tiết từng cuốc xe nhận cước ship, thu tiền COD hoặc giao dịch rút tiền.
              </p>
            </div>

            {/* Period selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl self-start md:self-auto text-xs font-bold">
              <button
                onClick={() => setFilterPeriod('all')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  filterPeriod === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tất cả thời gian
              </button>
              <button
                onClick={() => setFilterPeriod('today')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  filterPeriod === 'today' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Hôm nay
              </button>
              <button
                onClick={() => setFilterPeriod('week')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  filterPeriod === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tuần này
              </button>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter Tabs by Transaction Type */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterType === 'ALL'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({wallet?.transactionHistory.length || 0})
              </button>
              <button
                onClick={() => setFilterType('DELIVERY_FEE')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  filterType === 'DELIVERY_FEE'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Tiền công ship (+)</span>
              </button>
              <button
                onClick={() => setFilterType('COD_COLLECTED')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  filterType === 'COD_COLLECTED'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Thu tiền COD</span>
              </button>
              <button
                onClick={() => setFilterType('WITHDRAWAL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  filterType === 'WITHDRAWAL'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Rút tiền (-)</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm mã đơn, diễn giải..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-1.5 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Error notice if any */}
          {loadError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loadError}</span>
            </div>
          )}

          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <Table
              columns={columns}
              dataSource={filteredTransactions}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showTotal: (total) => `Tổng cộng ${total} giao dịch`,
              }}
              className="wallet-transaction-table"
              onRow={(record) => ({
                onClick: () => setSelectedTx(record),
                className: 'cursor-pointer hover:bg-slate-50 transition-colors',
              })}
            />
          </div>

          {/* Mobile Card List View */}
          <div className="sm:hidden space-y-3">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Đang tải biến động số dư...
              </div>
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx) => (
                <article
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer space-y-2 active:scale-98"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          tx.direction === 'IN'
                            ? 'bg-emerald-100 text-emerald-700'
                            : tx.direction === 'HOLDING'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {tx.direction === 'IN' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : tx.direction === 'HOLDING' ? (
                          <DollarSign className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-black text-slate-900 text-xs block truncate">
                          {tx.orderCode ? `#${tx.orderCode}` : tx.id}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {formatDateTime(tx.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {tx.direction === 'IN' ? (
                        <span className="font-black text-emerald-600 text-sm block">
                          +{tx.amount.toLocaleString('vi-VN')} đ
                        </span>
                      ) : tx.direction === 'HOLDING' ? (
                        <span className="font-black text-amber-600 text-sm block">
                          {tx.amount.toLocaleString('vi-VN')} đ
                        </span>
                      ) : (
                        <span className="font-black text-rose-600 text-sm block">
                          -{tx.amount.toLocaleString('vi-VN')} đ
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Dư: {tx.balanceAfter ? `${tx.balanceAfter.toLocaleString('vi-VN')} đ` : '--'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-2 pt-1 border-t border-slate-100">
                    {tx.description}
                  </p>
                </article>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Không tìm thấy biến động số dư nào phù hợp.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* =========================================================================
          MODAL 1: RÚT TIỀN VỀ NGÂN HÀNG
         ========================================================================= */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-black text-base">
            <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            <span>Rút Tiền Về Tài Khoản Ngân Hàng</span>
          </div>
        }
        open={isWithdrawModalOpen}
        onCancel={() => setIsWithdrawModalOpen(false)}
        footer={null}
        destroyOnClose
        centered
      >
        <div className="space-y-4 pt-3">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            <span className="block font-semibold">Số dư khả dụng hiện tại:</span>
            <span className="text-2xl font-black text-emerald-700 block mt-1">
              {wallet ? `${wallet.availableBalance.toLocaleString('vi-VN')} đ` : '0 đ'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Số tiền muốn rút (VNĐ)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nhập số tiền (tối thiểu 50.000 đ)"
                value={withdrawAmount}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setWithdrawAmount(val ? Number(val).toLocaleString('vi-VN') : '');
                }}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                VNĐ
              </span>
            </div>
            {/* Quick amount chips */}
            {wallet && wallet.availableBalance > 0 && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap text-xs">
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(Math.min(100000, wallet.availableBalance).toLocaleString('vi-VN'))}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  100.000 đ
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(Math.min(200000, wallet.availableBalance).toLocaleString('vi-VN'))}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  200.000 đ
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(wallet.availableBalance.toLocaleString('vi-VN'))}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-black cursor-pointer"
                >
                  Rút tất cả
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ngân hàng nhận tiền
            </label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="MB Bank (Ngân hàng Quân đội)">MB Bank (Ngân hàng Quân đội)</option>
              <option value="Vietcombank (Ngân hàng Ngoại Thương VN)">Vietcombank (Ngân hàng Ngoại Thương VN)</option>
              <option value="Techcombank (Ngân hàng Kỹ Thương)">Techcombank (Ngân hàng Kỹ Thương)</option>
              <option value="VPBank (Ngân hàng Việt Nam Thịnh Vượng)">VPBank (Ngân hàng Việt Nam Thịnh Vượng)</option>
              <option value="ACB (Ngân hàng Á Châu)">ACB (Ngân hàng Á Châu)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số tài khoản
              </label>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên chủ tài khoản
              </label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex gap-2">
            <button
              type="button"
              onClick={() => setIsWithdrawModalOpen(false)}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmWithdraw}
              disabled={isSubmittingWithdraw}
              className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmittingWithdraw ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Xác nhận rút tiền</span>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* =========================================================================
          MODAL 2: QUYẾT TOÁN / NỘP TIỀN COD
         ========================================================================= */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-black text-base">
            <DollarSign className="w-5 h-5 text-amber-600" />
            <span>Quyết Toán Nộp Tiền Mặt COD</span>
          </div>
        }
        open={isCodSettlementModalOpen}
        onCancel={() => setIsCodSettlementModalOpen(false)}
        footer={null}
        destroyOnClose
        centered
      >
        <div className="space-y-4 pt-3">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <span className="block font-semibold">Tổng tiền COD đang giữ cần quyết toán:</span>
            <span className="text-2xl font-black text-amber-700 block mt-1">
              {wallet ? `${wallet.holdingCodAmount.toLocaleString('vi-VN')} đ` : '0 đ'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="font-bold text-slate-800">Thông tin chuyển khoản công ty:</div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ngân hàng:</span>
              <span className="font-bold text-slate-800">MB Bank (Hội sở)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Số tài khoản:</span>
              <span className="font-mono font-bold text-emerald-700">999988887777</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Chủ tài khoản:</span>
              <span className="font-bold text-slate-800">CONG TY CONG NGHE THUNDER DELIVERY</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Nội dung chuyển khoản:</span>
              <span className="font-mono font-bold text-amber-700">
                NOPCOD SHIPPER {user?.id || '2'}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex gap-2">
            <button
              type="button"
              onClick={() => setIsCodSettlementModalOpen(false)}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleConfirmCodSettlement}
              disabled={isSettlingCod}
              className="flex-[2] py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSettlingCod ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Tôi đã chuyển khoản quyết toán</span>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* =========================================================================
          MODAL 3: CHI TIẾT GIAO DỊCH
         ========================================================================= */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-black text-base">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <span>Chi Tiết Giao Dịch Ví</span>
          </div>
        }
        open={Boolean(selectedTx)}
        onCancel={() => setSelectedTx(null)}
        footer={null}
        destroyOnClose
        centered
      >
        {selectedTx && (
          <div className="space-y-4 pt-3 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mã giao dịch:</span>
                <span className="font-mono font-bold text-slate-800">{selectedTx.id}</span>
              </div>
              {selectedTx.orderCode && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Mã đơn hàng:</span>
                  <Link
                    to={`/orders/${selectedTx.orderCode}`}
                    className="font-mono font-black text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <span>#{selectedTx.orderCode}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Phân loại:</span>
                <span className="font-bold text-slate-800">{selectedTx.typeLabel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Thời gian ghi nhận:</span>
                <span className="font-medium text-slate-700">{formatDateTime(selectedTx.createdAt)}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Số tiền biến động:</span>
                <span className={`text-base font-black ${
                  selectedTx.direction === 'IN'
                    ? 'text-emerald-700'
                    : selectedTx.direction === 'HOLDING'
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}>
                  {selectedTx.direction === 'IN' ? '+' : selectedTx.direction === 'OUT' ? '-' : ''}
                  {selectedTx.amount.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-emerald-100">
                <span className="text-slate-600">Số dư khả dụng sau GD:</span>
                <span className="font-black text-slate-900 text-sm">
                  {selectedTx.balanceAfter ? `${selectedTx.balanceAfter.toLocaleString('vi-VN')} đ` : '--'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[11px] mb-1">Diễn giải nội dung:</span>
              <p className="text-slate-700 font-medium leading-relaxed">
                {selectedTx.description}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

