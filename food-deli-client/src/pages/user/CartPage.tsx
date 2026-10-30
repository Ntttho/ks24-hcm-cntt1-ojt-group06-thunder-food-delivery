import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/constants';
import { RestaurantConflictModal } from './components/RestaurantConflictModal';
import { PaymentMethodModal } from './components/PaymentMethodModal';
import type { CartItemType, UpsellItemType } from './types';

const INITIAL_CART_ITEMS: CartItemType[] = [
  {
    id: 'item-1',
    name: 'Cơm Tấm Sườn Bì Chả Đặc Biệt',
    price: 87000,
    quantity: 1,
    options: 'Thêm ốp la chín lòng đào (+8.000đ), Ít mỡ hành',
    note: 'Để nước mắm riêng',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAIqfTI5s8Q8ASaoe0eenWqww4cUBT5Qndph9kSGOPYbs1F1lc3YSgyIp98tLIRpxAgVziH2jroEu4J3Lm7sSxvt_ZYhlJ-5cAO7yFUGC0B-zfUsVSOEQJgLrBcPS-2JM4UJWXfKrWnqYhSgqDZ0SKVb1PkH5MqQFKI-umi-MtJpVS2KNDAzQWnfvmP968_J5KRwMh_yLu3icf_iU7IHTDx3wnoXLLF2CLwt08eOsO6uO1-Vu4Km2lyEg',
  },
  {
    id: 'item-2',
    name: 'Canh Khổ Qua Nhồi Thịt',
    price: 35000,
    quantity: 1,
    options: 'Nóng hổi, đậm vị thanh ngọt',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD5xddBWdavFNppRvgJfZ-98sSI-55_jOOTZ78Qypan6fiv63Malq-00eOk0ly36_G0fH7UuQbgBjaEijPgHIbCMNa57oRbWN8ELerPyOl-5ZtOn02rkIIaFPKLIuX-bbdIh51ICzw7yby5ewLv35H3_pFwpatAvydIXHcgyTtU3cn7vYgJsz2OOnAf7JbL8x-Irk3JkkVZOCF1TOL8TsCgRLcZG_WLb0ULMgL1dsj1Pqq9UiL5EfI59w',
  },
  {
    id: 'item-3',
    name: 'Trà Tắc Xí Muội Khổng Lồ',
    price: 25000,
    quantity: 2,
    options: 'Size L, 50% đường, 70% đá',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCtdW3utsF1II3NyfRaQbJ4PCJ1N_IIX1n6T3Idti3hHUbMj8r9J8C0j1BHIlAwTtA8wZxkcjJBkTLUSHMJuEDUCC2VpLRfpL8-E_ljpLGxa9sPki6e8NjNHXkMvZdBNtXNdRmgAN0hKX_Ooo-1hZtBQBexu6fdcTEZQjG317qYrBr3M1oB_CwlCNtQ2UdMy1VtkPue4bj7_wl_WxJm0yFDSxErzlcXS5eJPaQL4FS5tBY5d10FjFdQYw',
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
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItemType[]>(INITIAL_CART_ITEMS);
  const [includeCutlery, setIncludeCutlery] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isConflictOpen, setIsConflictOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('Tiền mặt khi nhận');

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const shippingFee = 18000;
  const freeshipThreshold = 200000;
  const remainingForFreeship = Math.max(0, freeshipThreshold - subtotal);
  const freeshipProgress = Math.min(100, Math.round((subtotal / freeshipThreshold) * 100));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItemType[]
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    showToast('Đã xóa món khỏi giỏ hàng');
  };

  const handleAddUpsell = (upsell: UpsellItemType) => {
    const existing = items.find((i) => i.name === upsell.name);
    if (existing) {
      handleUpdateQuantity(existing.id, 1);
    } else {
      const newItem: CartItemType = {
        id: `upsell-added-${Date.now()}`,
        name: upsell.name,
        price: upsell.price,
        quantity: 1,
        imageUrl: upsell.imageUrl,
        options: 'Món gọi kèm',
      };
      setItems((prev) => [...prev, newItem]);
    }
    showToast(`Đã thêm ${upsell.name} vào giỏ!`);
  };

  const handleCutleryToggle = (checked: boolean) => {
    setIncludeCutlery(checked);
    if (!checked) {
      showToast('Cảm ơn bạn đã bảo vệ môi trường: Không lấy dụng cụ ăn uống nhựa!');
    } else {
      showToast('Đã chọn lấy muỗng, nĩa, đũa dùng 1 lần');
    }
  };

  return (
    <div className="bg-surface font-body-md text-on-surface flex flex-col min-h-screen">
      {/* Top Header */}
      <header className="fixed top-0 w-full z-40 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-xl mx-auto h-16 px-gutter flex items-center justify-between gap-space-xs">
          <div className="flex items-center gap-space-xs min-w-0 flex-1">
            <button
              aria-label="Back"
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors flex-shrink-0 cursor-pointer"
              onClick={() => navigate(-1)}
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-primary to-primary-container flex items-center justify-center text-on-primary font-extrabold text-sm flex-shrink-0 shadow-sm">
              ⚡
            </div>
            <div className="flex flex-col min-w-0 ml-space-xs">
              <h1 className="font-headline-sm text-headline-sm text-on-surface truncate leading-tight">
                Giỏ hàng
              </h1>
              <div className="flex items-center gap-1 text-on-surface-variant truncate">
                <span className="material-symbols-outlined text-[14px] text-primary">storefront</span>
                <span className="font-label-sm text-label-sm truncate">
                  Cơm Tấm Sà Bì Chưởng • 1.8 km
                </span>
              </div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 ml-space-xs">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex flex-col relative w-full pt-16 bg-surface min-h-screen pb-safe">
        <div className="max-w-xl mx-auto w-full flex flex-col pb-36">
          {/* Demo Bar to trigger Restaurant Conflict Warning */}
          <div className="px-gutter pt-space-sm">
            <button
              type="button"
              className="w-full py-2 px-3 bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-semibold rounded-xl flex items-center justify-between hover:bg-amber-500/20 transition-all cursor-pointer"
              onClick={() => setIsConflictOpen(true)}
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-amber-600">warning</span>
                <span>Thử nghiệm: Bấm để xem UI Cảnh báo xung đột quán ăn</span>
              </span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          {/* Restaurant Header Card */}
          <section className="px-gutter pt-space-md">
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs">
              <div className="flex items-center justify-between gap-space-xs">
                <div className="flex items-center gap-space-xs min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      restaurant
                    </span>
                  </div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface truncate">
                    Cơm Tấm Sà Bì Chưởng - Nguyễn Trãi
                  </h2>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-container/15 text-primary text-label-sm font-label-sm whitespace-nowrap">
                  <span
                    className="material-symbols-outlined text-[14px] mr-1"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                  Đối tác ưu tiên
                </span>
              </div>
              <div className="flex items-center gap-space-md text-on-surface-variant text-body-sm font-body-sm pl-10">
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary">schedule</span>
                  20-25 phút (1.8 km)
                </span>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => navigate(APP_ROUTES.EXPLORE)}
                  className="text-primary font-label-md hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  Thêm món khác
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </button>
              </div>
            </div>
          </section>

          {/* Freeship Milestones Progress Banner */}
          <section className="px-gutter mt-space-md">
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-secondary-container/15 flex items-center justify-center text-secondary-container">
                    <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                  </div>
                  <p className="font-label-md text-label-md text-on-surface">
                    {remainingForFreeship > 0 ? (
                      <>
                        Thêm{' '}
                        <span className="text-secondary-container font-headline-sm font-bold">
                          {remainingForFreeship.toLocaleString('vi-VN')}đ
                        </span>{' '}
                        để nhận <span className="text-primary font-headline-sm font-bold">Freeship 15.000đ</span>
                      </>
                    ) : (
                      <span className="text-primary font-bold">
                        🎉 Chúc mừng! Bạn đã đạt điều kiện Freeship 15.000đ!
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-label-sm font-label-sm text-primary bg-primary/10 px-2 py-0.5 rounded-full font-semibold">
                  Tiết kiệm thêm
                </span>
              </div>
              {/* Progress Meter */}
              <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-primary-container h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${freeshipProgress}%` }}
                />
              </div>
            </div>
          </section>

          {/* Cart Items List */}
          <section className="px-gutter mt-space-md">
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/40">
                <span className="font-headline-sm text-headline-sm text-on-surface">Món đã chọn</span>
                <span className="text-label-sm font-label-sm text-on-surface-variant font-medium">
                  {items.length} món ({totalItemCount} phần)
                </span>
              </div>

              {items.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center justify-center text-on-surface-variant gap-2">
                  <span className="material-symbols-outlined text-4xl text-outline">shopping_basket</span>
                  <p className="font-body-md">Giỏ hàng của bạn đang trống</p>
                  <button
                    onClick={() => setItems(INITIAL_CART_ITEMS)}
                    className="mt-2 text-primary text-sm font-semibold hover:underline cursor-pointer"
                  >
                    Khôi phục món mẫu
                  </button>
                </div>
              ) : (
                items.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <div className="flex flex-col gap-space-xs pt-1">
                      <div className="flex gap-space-md justify-between items-start">
                        <div className="flex flex-col flex-1 min-w-0">
                          <h3 className="font-headline-sm text-headline-sm text-on-surface leading-snug">
                            {item.name}
                          </h3>
                          {item.options && (
                            <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">
                              {item.options}
                            </p>
                          )}
                          {item.note && (
                            <div className="inline-flex items-center gap-1.5 mt-1.5 text-on-surface-variant text-body-sm font-body-sm bg-surface-container-low px-2 py-1 rounded-lg w-fit">
                              <span className="material-symbols-outlined text-[14px] text-tertiary">
                                edit_note
                              </span>
                              <span className="italic">"{item.note}"</span>
                            </div>
                          )}
                          <div className="mt-2 text-headline-sm font-headline-sm text-on-surface font-bold">
                            {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                            {item.quantity > 1 && (
                              <span className="text-label-md font-label-md text-on-surface-variant font-normal ml-1">
                                ({item.price.toLocaleString('vi-VN')}đ/phần)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Dish Image */}
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container shadow-sm">
                          <img
                            className="w-full h-full object-cover"
                            src={item.imageUrl}
                            alt={item.name}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2">
                        {index === 1 ? (
                          <button
                            type="button"
                            className="text-error font-label-md text-label-md flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Xoá món
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="text-primary font-label-md text-label-md flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
                            onClick={() => showToast(`Chỉnh sửa tùy chọn cho ${item.name}`)}
                          >
                            <span className="material-symbols-outlined text-[16px]">tune</span>
                            Chỉnh sửa
                          </button>
                        )}

                        {/* Quantity Counter Pill */}
                        <div className="flex items-center gap-3 bg-surface-container-low rounded-full px-2 py-1 shadow-sm">
                          <button
                            aria-label="Giảm"
                            type="button"
                            className="w-6 h-6 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface shadow-sm active:scale-95 transition-transform cursor-pointer"
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                          >
                            <span className="material-symbols-outlined text-[14px]">remove</span>
                          </button>
                          <span className="font-headline-sm text-headline-sm text-on-surface min-w-[14px] text-center font-bold">
                            {item.quantity}
                          </span>
                          <button
                            aria-label="Tăng"
                            type="button"
                            className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-sm active:scale-95 transition-transform cursor-pointer"
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                          >
                            <span className="material-symbols-outlined text-[14px]">add</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {index < items.length - 1 && (
                      <div className="h-[1px] bg-surface-container-highest w-full my-1" />
                    )}
                  </React.Fragment>
                ))
              )}
            </div>
          </section>

          {/* Eco Cutlery Toggle Section */}
          <section className="px-gutter mt-space-md">
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between gap-space-md">
              <div className="flex items-start gap-space-sm min-w-0">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">eco</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-headline-sm text-headline-sm text-on-surface leading-tight font-semibold">
                    Dụng cụ ăn uống
                  </span>
                  <span className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">
                    Muỗng, nĩa, đũa nhựa dùng 1 lần
                  </span>
                  <span className="text-label-sm font-label-sm text-primary mt-1 inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Cùng chung tay giảm thiểu rác thải nhựa
                  </span>
                </div>
              </div>

              {/* Interactive Modern Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={includeCutlery}
                  onChange={(e) => handleCutleryToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container shadow-inner" />
              </label>
            </div>
          </section>

          {/* Frequently Bought Together / Upsell Rail */}
          <section className="mt-space-md flex flex-col">
            <div className="px-gutter flex items-center justify-between mb-space-xs">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[20px]">thumb_up</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Món ngon gợi ý thêm
                </h3>
              </div>
              <span className="text-label-sm font-label-sm text-on-surface-variant">
                Thường gọi kèm
              </span>
            </div>

            {/* Horizontal Scroll Carousel */}
            <div className="flex gap-space-md overflow-x-auto px-gutter py-2 scroll-smooth no-scrollbar">
              {UPSELL_ITEMS.map((upsell) => (
                <div
                  key={upsell.id}
                  className="flex-shrink-0 w-36 bg-surface-container-lowest rounded-xl p-2.5 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all"
                >
                  <div>
                    <div className="relative w-full h-24 rounded-lg overflow-hidden bg-surface-container mb-2 shadow-inner">
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        src={upsell.imageUrl}
                        alt={upsell.name}
                      />
                      <button
                        aria-label={`Thêm ${upsell.name}`}
                        type="button"
                        className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
                        onClick={() => handleAddUpsell(upsell)}
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                    </div>
                    <h4 className="font-label-md text-label-md text-on-surface line-clamp-1 font-semibold">
                      {upsell.name}
                    </h4>
                  </div>
                  <p className="font-headline-sm text-headline-sm text-primary mt-1 font-bold">
                    +{upsell.price.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Special Voucher & Payment Summary */}
          <section className="px-gutter mt-space-md">
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-3">
              {/* Promo code trigger row */}
              <div
                className="flex items-center justify-between bg-surface-container-low px-3 py-2.5 rounded-lg cursor-pointer hover:bg-surface-container transition-colors"
                onClick={() => showToast('Mã giảm giá đã được đồng bộ tự động')}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary-container text-[20px]">
                    confirmation_number
                  </span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Mã giảm giá ThunderFood
                  </span>
                </div>
                <div className="flex items-center gap-1 text-primary font-label-md text-label-md">
                  <span>Áp dụng</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </div>
              </div>

              {/* Price breakdown rows */}
              <div className="flex flex-col gap-2 pt-2 text-body-sm font-body-sm text-on-surface-variant">
                <div className="flex justify-between items-center">
                  <span>Tổng phụ món ăn ({totalItemCount} phần)</span>
                  <span className="text-on-surface font-headline-sm text-headline-sm font-semibold">
                    {subtotal.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Phí áp dụng theo khoảng cách</span>
                  <span>{shippingFee.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between items-center text-primary font-label-md">
                  <span>Giảm giá món (Flash Deal)</span>
                  <span>-0đ</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Sticky Bottom Checkout Bar */}
      <aside className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pb-safe border-t border-surface-container">
        <div className="max-w-xl mx-auto px-gutter py-3 flex flex-col gap-2">
          {/* Small order note preview */}
          <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-primary">payments</span>
              <span>Thanh toán: {selectedPaymentMethod}</span>
            </div>
            <button
              type="button"
              className="text-primary hover:underline font-semibold cursor-pointer"
              onClick={() => setIsPaymentModalOpen(true)}
            >
              Thay đổi
            </button>
          </div>

          {/* Action Button Row */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col min-w-0">
              <span className="text-label-sm font-label-sm text-on-surface-variant">Tổng tạm tính</span>
              <div className="flex items-baseline gap-1">
                <span className="font-headline-lg text-headline-lg text-primary font-extrabold">
                  {(subtotal + shippingFee).toLocaleString('vi-VN')}đ
                </span>
                <span className="text-label-sm font-label-sm text-on-surface-variant">
                  ({items.length} món)
                </span>
              </div>
            </div>
            <button
              type="button"
              className="flex-1 h-12 bg-primary-container hover:bg-primary-tint active:scale-[0.98] transition-transform text-on-primary rounded-xl font-headline-sm text-headline-sm flex items-center justify-center gap-2 shadow-md cursor-pointer font-bold"
              onClick={() => navigate(APP_ROUTES.CHECKOUT)}
            >
              <span>Tiến hành đặt hàng</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Restaurant Conflict Alert Modal */}
      <RestaurantConflictModal
        isOpen={isConflictOpen}
        onClose={() => setIsConflictOpen(false)}
        onConfirmReplace={() => {
          setIsConflictOpen(false);
          setItems([
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
        currentShopName="Cơm Tấm Sà Bì Chưởng - Q.1"
        currentItemsCount={items.length}
        currentTotal={subtotal}
        newShopName="Phê La - Trương Định"
      />

      {/* Payment Method Quick Modal */}
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

      {/* Floating Toast Notification */}
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
