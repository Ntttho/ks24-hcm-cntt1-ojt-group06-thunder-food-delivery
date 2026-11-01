import React, { useState, useMemo } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { addToCart, updateQuantity, removeFromCart } from '@/store/slices/cartSlice';
import { RestaurantConflictModal } from './components/RestaurantConflictModal';
import { PaymentMethodModal } from './components/PaymentMethodModal';
import {
  CartHeader,
  CartRestaurantCard,
  CartConflictBanner,
  FreeshipProgressBar,
  CartItemList,
  EcoCutlerySection,
  CartUpsellRail,
  CartPriceSummary,
  CartBottomBar,
} from './components/cart';
import type { CartItemType, UpsellItemType } from './types';

const INITIAL_FALLBACK_ITEMS: CartItemType[] = [
  {
    id: 'item-1',
    name: 'Cơm Tấm Sườn Bì Chả Đặc Biệt',
    price: 87000,
    quantity: 1,
    options: 'Thêm ốp la chín lòng đào (+8.000đ), Ít mỡ hành',
    note: 'Để nước mắm riêng',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAIqfTI5s8Q8ASaoe0eenWqww4cUBT5Qndph9kSGOPYbs1F1lc3YSgyIp98tLIRpxAgVziH2jroEu4J3Lm7sSxvt_ZYhlJ-5cAO7yFUGC0B-zfUsVSOEQJgLrBcPS-2JM4UJWXfKrWnqYhSgqDZ0SKVb1PkH5MqQFKI-umi-MtJpVS2KNDAzQWnfvmP968_J5KRwMh_yLu3icf_iU7IHTDx3wnoXLLF2CLwt08eOsO6uO1-Vu4Km2lyEg',
    shopId: 1,
    shopName: 'Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi',
  },
  {
    id: 'item-2',
    name: 'Canh Khổ Qua Nhồi Thịt',
    price: 35000,
    quantity: 1,
    options: 'Nóng hổi, đậm vị thanh ngọt',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD5xddBWdavFNppRvgJfZ-98sSI-55_jOOTZ78Qypan6fiv63Malq-00eOk0ly36_G0fH7UuQbgBjaEijPgHIbCMNa57oRbWN8ELerPyOl-5ZtOn02rkIIaFPKLIuX-bbdIh51ICzw7yby5ewLv35H3_pFwpatAvydIXHcgyTtU3cn7vYgJsz2OOnAf7JbL8x-Irk3JkkVZOCF1TOL8TsCgRLcZG_WLb0ULMgL1dsj1Pqq9UiL5EfI59w',
    shopId: 1,
    shopName: 'Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi',
  },
  {
    id: 'item-3',
    name: 'Trà Tắc Xí Muội Khổng Lồ',
    price: 25000,
    quantity: 2,
    options: 'Size L, 50% đường, 70% đá',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCtdW3utsF1II3NyfRaQbJ4PCJ1N_IIX1n6T3Idti3hHUbMj8r9J8C0j1BHIlAwTtA8wZxkcjJBkTLUSHMJuEDUCC2VpLRfpL8-E_ljpLGxa9sPki6e8NjNHXkMvZdBNtXNdRmgAN0hKX_Ooo-1hZtBQBexu6fdcTEZQjG317qYrBr3M1oB_CwlCNtQ2UdMy1VtkPue4bj7_wl_WxJm0yFDSxErzlcXS5eJPaQL4FS5tBY5d10FjFdQYw',
    shopId: 1,
    shopName: 'Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi',
  },
];

const UPSELL_ITEMS: UpsellItemType[] = [
  {
    id: 'upsell-1',
    name: 'Chả trứng hấp thêm',
    price: 15000,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDiE6DtiK6elJx982NJFnl4-Qr1AvO2VT9kdfo9DDSTF99sswTRpIzud6brNhpbijnbmzvj9ndtgL50KytKZ8pdWOZ9vgtFh0NJNA-6daJ2hc8KKizP6wBTvlotae7G6mxkfbu3pIYKTvR-MA5lhHe8Wk8bkFJri1iNzXV2zNRY2ETiqWF-KYkYHWwDx052D2-f-LbbcBRHRoq45qEh_S10Mk7_4AcYSBa4Gc6tiH_IlW70ieTsdwWB7Q',
  },
  {
    id: 'upsell-2',
    name: 'Canh rong biển thịt bằm',
    price: 20000,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAiCUfFW0oIdlsdc6LxoZcF3edvStw0IbxcMFrWXOIGuBEFMWW1fjfOtgAIeO8amdHOF_Iqav19ci6H9bMDTgaRi-y6thcbrrdi8j576QmRBn6yEds_3fdwpxCNSGKIY9oLcgofaUVbTJ2h-JIZqb6ZVwHF6OvMxZdx7_8LqCesGMwoxR5Ls7OP4RqVwCciFVDsXVBw0nJCMmBq3VsuR6uCH13dSydqqrspPMgcz3YnuA9xSYtM8n4nJw',
  },
  {
    id: 'upsell-3',
    name: 'Trà đào cam sả',
    price: 28000,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCYTOCsQhWpehtSfIaVBg--khW253SrSOhmMUZ9XtiQrCxyE3ikSDxd6S0ssIdrg14C8QZ5hO-SfGCYyrNXoKjo5nlOf6w4gqefYMSdF8EJ3G_xclpZ0tCqyxizipN0QaEtIM2N6YrUXrRXqinCvoRLGI62-BUWnEunIMFDXQWo8MH6es4xtnr1tOkrQxSTMw9iv4ijB75wOCheTw4cBaX_yL0GEgQmdDkn1g2YY5RnYYU0L0hfOtEQug',
  },
  {
    id: 'upsell-4',
    name: 'Trứng ốp la lòng đào',
    price: 8000,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC9Q0wNnf-PiEQvQAIOHJ28yRQ_uj_eHz6LpBEz8l7tvprOBT-mzXDOr5pqFndvgWKuKSMi-oUsv_QqJBuB-A1dzL0Rjxd4gxMKSemll0zJnRjWDs6Ygf7R8sxa3Dx_r7DLc1v7oCQDAD48-JRINkYJS-wreV-jHyL6RqEBoccVmeAQrR1KpsvKcFfUaMvGW5en2c9zhCrQP83Jm60mgYk7BtJfm4SFzpnuPqosBmq7utSbJ6OKjU_Spw',
  },
];

export const CartPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const reduxCart = useAppSelector((state) => state.cart);

  // Fallback to local sample items if Redux cart is initially empty for UI demo
  const [localItems, setLocalItems] = useState<CartItemType[]>(INITIAL_FALLBACK_ITEMS);
  const [includeCutlery, setIncludeCutlery] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isConflictOpen, setIsConflictOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('Tiền mặt khi nhận');

  // Use Redux items if present; otherwise fallback to local items
  const items: CartItemType[] = useMemo(() => {
    if (reduxCart.items.length > 0) {
      return reduxCart.items.map((ri) => ({
        id: String(ri.id),
        name: ri.productName,
        price: ri.price,
        quantity: ri.quantity,
        imageUrl: ri.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
        options: ri.toppings?.length
          ? ri.toppings.map((t) => t.name).join(', ')
          : undefined,
        shopId: ri.shopId,
        shopName: ri.shopName,
      }));
    }
    return localItems;
  }, [reduxCart.items, localItems]);

  // Calculations
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  const totalItemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const shippingFee = items.length > 0 ? 18000 : 0;
  const freeshipThreshold = 200000;
  const remainingForFreeship = Math.max(0, freeshipThreshold - subtotal);
  const freeshipProgress = Math.min(100, Math.round((subtotal / freeshipThreshold) * 100));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    const currentItem = items.find((i) => i.id === id);
    if (!currentItem) return;

    const nextQty = currentItem.quantity + delta;

    if (reduxCart.items.length > 0) {
      if (nextQty <= 0) {
        dispatch(removeFromCart(id));
      } else {
        dispatch(updateQuantity({ id, quantity: nextQty }));
      }
    } else {
      setLocalItems((prev) =>
        prev
          .map((item) => (item.id === id ? { ...item, quantity: nextQty } : item))
          .filter((item) => item.quantity > 0)
      );
    }
  };

  const handleRemoveItem = (id: string) => {
    if (reduxCart.items.length > 0) {
      dispatch(removeFromCart(id));
    } else {
      setLocalItems((prev) => prev.filter((item) => item.id !== id));
    }
    showToast('Đã xóa món khỏi giỏ hàng');
  };

  const handleAddUpsell = (upsell: UpsellItemType) => {
    const existing = items.find((i) => i.name === upsell.name);
    if (existing) {
      handleUpdateQuantity(existing.id, 1);
    } else {
      if (reduxCart.items.length > 0) {
        dispatch(
          addToCart({
            id: `upsell-${Date.now()}`,
            productId: Math.floor(Math.random() * 9000) + 1000,
            productName: upsell.name,
            price: upsell.price,
            quantity: 1,
            imageUrl: upsell.imageUrl,
            shopId: reduxCart.shopId || 1,
            shopName: reduxCart.shopName || 'Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi',
          })
        );
      } else {
        const newItem: CartItemType = {
          id: `upsell-${Date.now()}`,
          name: upsell.name,
          price: upsell.price,
          quantity: 1,
          imageUrl: upsell.imageUrl,
          options: 'Món gọi kèm',
        };
        setLocalItems((prev) => [...prev, newItem]);
      }
    }
    showToast(`Đã thêm "${upsell.name}" vào giỏ hàng!`);
  };

  const handleCutleryToggle = (checked: boolean) => {
    setIncludeCutlery(checked);
    if (!checked) {
      showToast('Cảm ơn bạn đã bảo vệ môi trường: Không lấy dụng cụ ăn uống nhựa!');
    } else {
      showToast('Đã chọn lấy muỗng, nĩa, đũa dùng 1 lần');
    }
  };

  const currentShopName = reduxCart.shopName || 'Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi';

  return (
    <div className="bg-surface font-body-md text-on-surface flex flex-col min-h-screen">
      {/* 1. Top Header */}
      <CartHeader shopName={currentShopName} distance="1.8 km" />

      {/* Main Body */}
      <main className="flex flex-col relative w-full pt-16 bg-surface min-h-screen pb-safe">
        <div className="max-w-xl mx-auto w-full flex flex-col pb-36">
          {/* 2. Restaurant Conflict Warning Demo Bar */}
          <CartConflictBanner onTriggerConflict={() => setIsConflictOpen(true)} />

          {/* 3. Restaurant Header Card */}
          <CartRestaurantCard shopName={currentShopName} deliveryTime="20-25 phút" distance="1.8 km" />

          {/* 4. Freeship Milestone Bar */}
          <FreeshipProgressBar
            remainingForFreeship={remainingForFreeship}
            freeshipProgress={freeshipProgress}
          />

          {/* 5. Cart Items List */}
          <CartItemList
            items={items}
            totalItemCount={totalItemCount}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onRestoreSampleItems={() => setLocalItems(INITIAL_FALLBACK_ITEMS)}
            onEditOptions={(item) => showToast(`Chỉnh sửa tùy chọn cho ${item.name}`)}
          />

          {/* 6. Eco Cutlery Toggle */}
          <EcoCutlerySection
            includeCutlery={includeCutlery}
            onToggleCutlery={handleCutleryToggle}
          />

          {/* 7. Upsell Carousel */}
          <CartUpsellRail upsellItems={UPSELL_ITEMS} onAddUpsell={handleAddUpsell} />

          {/* 8. Pricing & Voucher Summary */}
          <CartPriceSummary
            totalItemCount={totalItemCount}
            subtotal={subtotal}
            shippingFee={shippingFee}
            onOpenPromoSelector={() => showToast('Mã giảm giá đã được đồng bộ tự động')}
          />
        </div>
      </main>

      {/* 9. Sticky Bottom Checkout Bar */}
      <CartBottomBar
        selectedPaymentMethod={selectedPaymentMethod}
        totalAmount={subtotal + shippingFee}
        itemCount={items.length}
        onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
        disabled={items.length === 0}
      />

      {/* 10. Modals */}
      <RestaurantConflictModal
        isOpen={isConflictOpen}
        onClose={() => setIsConflictOpen(false)}
        onConfirmReplace={() => {
          setIsConflictOpen(false);
          setLocalItems([
            {
              id: 'phela-1',
              name: 'Ô Long Sữa Phê La',
              price: 55000,
              quantity: 1,
              options: 'Size L, 50% đường, Trân châu Ô Long',
              imageUrl:
                'https://lh3.googleusercontent.com/aida-public/AB6AXuDSWxqpTOjUNZH3ddU_vv3mZuORXEJT6pjyGrq-Wo3MaBeZELuDxDMJledJhZNRVw84R8nEmlJ8k6GPrELJjZPeNupoNLXz83ArrRnvy3AnPE7j4sAh542NlSka8caclPX9PiKBoAczJBvgVzl7DVPUQBeytlHRgcZJWe5HCWDyqi1UJUaspml0ryt2jgowa4bvP8FEqXcQPnFc4hi9cqRhOFm-u7U_3xQ1A4KyBz1MM6hP_-IjUP6Csg',
            },
          ]);
          showToast('Đã làm mới giỏ hàng với quán Phê La');
        }}
        currentShopName={currentShopName}
        currentItemsCount={items.length}
        currentTotal={subtotal}
        newShopName="Phê La - Trương Định"
      />

      <PaymentMethodModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedMethodId={selectedPaymentMethod.includes('VietQR') ? 'vietqr' : 'cod'}
        onSelectMethod={(_, name) => {
          setSelectedPaymentMethod(name);
          showToast(`Đã chọn phương thức: ${name}`);
        }}
        totalAmount={subtotal + shippingFee}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-4 right-4 z-50 pointer-events-none flex justify-center animate-bounce">
          <div className="bg-inverse-surface text-inverse-on-surface px-space-lg py-space-sm rounded-full shadow-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary-fixed">
              check_circle
            </span>
            <span className="font-body-sm text-body-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
