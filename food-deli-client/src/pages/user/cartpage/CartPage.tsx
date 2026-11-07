import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { message, Button, Card, Tag } from 'antd';
import {
  ShoppingCartOutlined,
  ArrowLeftOutlined,
  RightOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAuth } from '@/hooks/useAuth';
import { APP_ROUTES } from '@/constants';
import {
  updateQuantity,
  updateItemToppings,
  removeFromCart,
  clearCart,
  toggleSelectItem,
  toggleSelectShop,
  fetchCartFromRedis,
} from '@/store/slices/cartSlice';
import { orderApi } from '@/services/modules/orderApi';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { PaymentMethodModal } from '../components/PaymentMethodModal';
import {
  CartHeader,
  CartRestaurantCard,
  FreeshipProgressBar,
  CartItemList,
  EcoCutlerySection,
  CartPriceSummary,
  CartBottomBar,
} from '../components/cart';
import { AwaitingPaymentOrdersCard } from './components/AwaitingPaymentOrdersCard';
import { CartEditToppingsModal } from './components/CartEditToppingsModal';
import type { CartItemType } from '../types';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAuth();
  const reduxCart = useAppSelector((state) => state.cart);

  // Synchronize cart with Redis on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCartFromRedis(user?.id ? Number(user.id) : undefined));
    }
  }, [isAuthenticated, user?.id, dispatch]);

  const [includeCutlery, setIncludeCutlery] = useState<boolean>(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('Chuyển khoản VietQR');
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<CartItemType | null>(null);
  const [isEditToppingsOpen, setIsEditToppingsOpen] = useState<boolean>(false);

  // Fetch recent active orders (including AWAITING_PAYMENT within 8 minutes)
  const fetchActiveOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingOrders(true);
    try {
      const res = await orderApi.getMyOrders({ page: 0, size: 10 });
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.content)
        ? res.data.content
        : [];
      const ongoing = list.filter((o: any) =>
        ['AWAITING_PAYMENT', 'PENDING', 'CONFIRMED', 'DELIVERING'].includes(o.statusCode)
      );
      setActiveOrders(ongoing);
    } catch {
      setActiveOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchActiveOrders();
  }, [fetchActiveOrders]);

  // Map items directly from Redux Cart
  const items: CartItemType[] = useMemo(() => {
    return (reduxCart.items || []).map((ri) => ({
      id: String(ri.id),
      productId: ri.productId,
      name: ri.productName,
      price: ri.price,
      quantity: ri.quantity,
      imageUrl: ri.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
      options: ri.toppings?.length
        ? ri.toppings.map((t) => `${t.name} (+${t.price.toLocaleString('vi-VN')}đ)`).join(', ')
        : undefined,
      toppings: ri.toppings,
      shopId: ri.shopId,
      shopName: ri.shopName,
      selected: ri.selected !== false,
    }));
  }, [reduxCart.items]);

  // Selected items calculations (Shopee style - only selected items are summed up)
  const selectedItems = useMemo(() => {
    return items.filter((it) => it.selected !== false);
  }, [items]);

  const selectedSubtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [selectedItems]);

  const selectedItemCount = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [selectedItems]);

  const totalItemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const shippingFee = selectedItems.length > 0 ? 18000 : 0;
  const freeshipThreshold = 200000;
  const remainingForFreeship = Math.max(0, freeshipThreshold - selectedSubtotal);
  const freeshipProgress = Math.min(100, Math.round((selectedSubtotal / freeshipThreshold) * 100));

  // Handlers
  const handleUpdateQuantity = (id: string, delta: number) => {
    const currentItem = items.find((i) => i.id === id);
    if (!currentItem) return;
    const nextQty = currentItem.quantity + delta;
    if (nextQty <= 0) {
      dispatch(removeFromCart(id));
      message.info('Đã xóa món khỏi giỏ hàng');
    } else {
      dispatch(updateQuantity({ id, quantity: nextQty }));
    }
  };

  const handleRemoveItem = (id: string) => {
    dispatch(removeFromCart(id));
    message.info('Đã xóa món khỏi giỏ hàng');
  };

  const handleOpenEditToppings = (item: CartItemType) => {
    setEditingItem(item);
    setIsEditToppingsOpen(true);
  };

  const handleSaveToppings = (
    oldItemId: string,
    newItemId: string,
    toppings: Array<{ id: number; name: string; price: number }>,
    quantity: number
  ) => {
    dispatch(
      updateItemToppings({
        oldItemId,
        newItemId,
        toppings,
        quantity,
      })
    );
    message.success('Đã cập nhật tùy chọn topping cho món ăn!');
    setIsEditToppingsOpen(false);
    setEditingItem(null);
  };

  const handleClearCart = () => {
    dispatch(clearCart());
    message.success('Đã làm trống giỏ hàng');
  };

  const handleCutleryToggle = (checked: boolean) => {
    setIncludeCutlery(checked);
    if (!checked) {
      message.info('Cảm ơn bạn đã bảo vệ môi trường: Không lấy dụng cụ ăn uống nhựa!');
    }
  };

  const handleProceedToCheckout = () => {
    if (selectedItems.length === 0) {
      message.warning('Vui lòng tích chọn ít nhất 1 món ăn để thanh toán!');
      return;
    }
    if (!isAuthenticated) {
      message.warning('Vui lòng đăng nhập để tiến hành thanh toán!');
      navigate(APP_ROUTES.LOGIN, { state: { from: APP_ROUTES.CHECKOUT } });
      return;
    }
    navigate(APP_ROUTES.CHECKOUT);
  };

  const activeShopName = useMemo(() => {
    if (selectedItems.length > 0) return selectedItems[0].shopName || 'Quán ăn đã chọn';
    return reduxCart.shopName || 'Thunder Food Delivery';
  }, [selectedItems, reduxCart.shopName]);

  const activeShopId = useMemo(() => {
    if (selectedItems.length > 0) return selectedItems[0].shopId || 1;
    return reduxCart.shopId || 1;
  }, [selectedItems, reduxCart.shopId]);

  // Separate non-awaiting ongoing orders
  const ongoingOrders = useMemo(() => {
    return activeOrders.filter((o) => o.statusCode !== 'AWAITING_PAYMENT');
  }, [activeOrders]);

  // Render Empty State
  if (items.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
        <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-xl mx-auto h-16 px-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-700 hover:bg-orange-50 hover:text-orange-600 cursor-pointer"
            >
              <ArrowLeftOutlined className="text-lg" />
            </button>
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2 cursor-pointer group hover:scale-105 transition-all"
              title="Quay về Trang chủ"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-sm">
                ⚡
              </div>
              <h1 className="text-base font-extrabold text-gray-900 group-hover:text-orange-600 transition-colors !mb-0">
                Giỏ hàng của bạn
              </h1>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs font-bold text-gray-500 hover:text-orange-600 cursor-pointer px-2 py-1 rounded-lg hover:bg-orange-50"
            >
              Trang chủ
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-xl mx-auto w-full pt-20 px-4 pb-12">
          {/* SePay Awaiting Payment Section with 8-min countdown */}
          <AwaitingPaymentOrdersCard
            orders={activeOrders}
            onRefresh={fetchActiveOrders}
          />

          {/* Ongoing Kitchen/Delivery Orders */}
          {ongoingOrders.length > 0 ? (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  ĐƠN HÀNG ĐANG ĐƯỢC XỬ LÝ ({ongoingOrders.length})
                </span>
                <Button
                  type="link"
                  size="small"
                  onClick={fetchActiveOrders}
                  icon={<SyncOutlined spin={loadingOrders} />}
                  className="text-xs text-orange-600 font-semibold"
                >
                  Cập nhật
                </Button>
              </div>

              {ongoingOrders.map((order) => {
                const isPending = order.statusCode === 'PENDING';
                const isConfirmed = order.statusCode === 'CONFIRMED';
                return (
                  <Card
                    key={order.id}
                    className="rounded-2xl border-orange-200/90 bg-gradient-to-br from-white to-orange-50/40 shadow-xs text-left overflow-hidden"
                  >
                    <div className="flex items-center justify-between border-b border-orange-100/80 pb-2 mb-3">
                      <div>
                        <span className="text-xs text-slate-400">Mã đơn:</span>
                        <span className="font-bold text-slate-800 ml-1.5 font-mono text-sm">
                          {order.orderCode}
                        </span>
                      </div>
                      <Tag
                        color={isPending ? 'gold' : isConfirmed ? 'blue' : 'green'}
                        className="font-bold px-2 py-0.5 rounded-full"
                      >
                        {isPending
                          ? '⏳ Chờ quán xác nhận'
                          : isConfirmed
                          ? '🍳 Quán đang nấu'
                          : '🛵 Đang giao hàng'}
                      </Tag>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 mb-4">
                      <div className="font-extrabold text-slate-800 text-sm">
                        {order.restaurantName || `Quán ăn #${order.restaurantId}`}
                      </div>
                      <div className="text-slate-500 line-clamp-1">{order.receiverAddress}</div>
                      <div className="flex justify-between items-center pt-2 font-semibold">
                        <span className="text-slate-500">
                          {order.createdAt ? formatDate(order.createdAt) : 'Vừa đặt'}
                        </span>
                        <div className="text-right">
                          <span className="text-slate-500 text-xs mr-1">Tổng thanh toán:</span>
                          <span className="text-orange-600 font-extrabold text-base">
                            {formatCurrency(Number(order.totalAmount || 0))}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="primary"
                      block
                      icon={<RightOutlined />}
                      className="bg-orange-500 hover:bg-orange-600 rounded-xl font-bold border-none h-10 shadow-xs"
                      onClick={() => navigate(APP_ROUTES.ORDERS)}
                    >
                      Xem chi tiết tiến độ đơn hàng
                    </Button>
                  </Card>
                );
              })}

              {/* Empty Cart Prompt */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs text-center mt-6">
                <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-2xl mx-auto mb-2">
                  <ShoppingCartOutlined />
                </div>
                <h3 className="font-bold text-gray-800 text-sm mb-1">Giỏ hàng món mới đang trống</h3>
                <p className="text-gray-400 text-xs mb-3">
                  Bạn có muốn chọn thêm món tráng miệng hoặc nước uống khác không?
                </p>
                <Button
                  onClick={() => navigate(APP_ROUTES.HOME)}
                  className="rounded-xl font-semibold border-orange-200 text-orange-600 hover:border-orange-400"
                >
                  Khám phá món ngon khác
                </Button>
              </div>
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="w-28 h-28 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-5xl mb-6 shadow-inner border border-orange-100">
                <ShoppingCartOutlined />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
                Giỏ hàng của bạn đang trống
              </h2>
              <p className="text-gray-500 text-sm max-w-xs mb-8">
                Bạn chưa chọn món nào vào giỏ. Hãy dạo quanh các quán ăn nổi bật và thêm món nhé!
              </p>
              <Button
                type="primary"
                size="large"
                onClick={() => navigate(APP_ROUTES.HOME)}
                className="bg-orange-500 hover:bg-orange-600 rounded-2xl font-bold h-12 px-8 shadow-md shadow-orange-500/20 text-base"
              >
                Khám phá món ngon ngay
              </Button>
            </div>
          ) : null}
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
      {/* 1. Header with Hover Animation & Click Home */}
      <CartHeader shopName={activeShopName} distance="1.8 km" />

      {/* Main Body */}
      <main className="flex-1 w-full pt-16 pb-36">
        <div className="max-w-xl mx-auto w-full flex flex-col gap-1">
          {/* SePay Awaiting Payment Alert if customer has pending VietQR orders */}
          <div className="px-4 pt-3">
            <AwaitingPaymentOrdersCard
              orders={activeOrders}
              onRefresh={fetchActiveOrders}
            />
          </div>

          {/* Active Orders Banner if any */}
          {ongoingOrders.length > 0 && (
            <div className="px-4 mb-2">
              <div
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-3 px-4 shadow-xs flex items-center justify-between cursor-pointer"
                onClick={() => navigate(APP_ROUTES.ORDERS)}
              >
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  <span>Bạn có {ongoingOrders.length} đơn hàng đang được chuẩn bị!</span>
                </div>
                <span className="text-xs font-extrabold flex items-center gap-1 hover:underline">
                  Theo dõi ngay <RightOutlined className="text-[10px]" />
                </span>
              </div>
            </div>
          )}

          {/* 2. Restaurant Header Card */}
          <CartRestaurantCard
            shopName={activeShopName}
            deliveryTime="20-25 phút"
            distance="1.8 km"
            shopId={activeShopId}
          />

          {/* 3. Freeship Milestone Bar */}
          <FreeshipProgressBar
            remainingForFreeship={remainingForFreeship}
            freeshipProgress={freeshipProgress}
          />

          {/* 4. Cart Items List (Shopee Multi-shop Grouping & Checkbox) */}
          <CartItemList
            items={items}
            totalItemCount={totalItemCount}
            onToggleSelectItem={(id) => dispatch(toggleSelectItem(id))}
            onToggleSelectShop={(shopId, selected) => dispatch(toggleSelectShop({ shopId, selected }))}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onEditOptions={handleOpenEditToppings}
            onClearCart={handleClearCart}
          />

          {/* 5. Eco Cutlery Section */}
          <EcoCutlerySection
            includeCutlery={includeCutlery}
            onToggleCutlery={handleCutleryToggle}
          />

          {/* 6. Pricing Summary (Calculated on selected items) */}
          <CartPriceSummary
            totalItemCount={selectedItemCount}
            subtotal={selectedSubtotal}
            shippingFee={shippingFee}
            onOpenPromoSelector={() => message.info('Mã giảm giá sẽ được áp dụng tại bước Thanh toán')}
          />
        </div>
      </main>

      {/* 7. Sticky Bottom Bar (Calculated on selected items) */}
      <CartBottomBar
        selectedPaymentMethod={selectedPaymentMethod}
        totalAmount={selectedSubtotal + (selectedItemCount > 0 ? shippingFee : 0)}
        itemCount={selectedItemCount}
        onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
        onProceedToCheckout={handleProceedToCheckout}
        disabled={selectedItemCount === 0}
      />

      {/* 8. Payment Method Selector Drawer/Modal */}
      <PaymentMethodModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedMethodId={selectedPaymentMethod.includes('VietQR') ? 'vietqr' : 'cod'}
        onSelectMethod={(_, name) => {
          setSelectedPaymentMethod(name);
          message.success(`Đã chọn phương thức: ${name}`);
        }}
        totalAmount={selectedSubtotal + (selectedItemCount > 0 ? shippingFee : 0)}
      />

      {/* 9. Edit Toppings Modal */}
      <CartEditToppingsModal
        isOpen={isEditToppingsOpen}
        onClose={() => {
          setIsEditToppingsOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
        onSave={handleSaveToppings}
      />
    </div>
  );
};

export default CartPage;
