import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Radio, Checkbox, Spin, message } from 'antd';
import {
  MinusOutlined,
  PlusOutlined,
  CheckCircleFilled,
  CoffeeOutlined,
} from '@ant-design/icons';
import { restaurantApi } from '@/services/modules/restaurantApi';
import { getOptimizedCloudinaryUrl } from '@/services/modules/cloudinaryService';
import type { CartItemType } from '../../types';

interface CartEditToppingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CartItemType | null;
  onSave: (
    oldItemId: string,
    newItemId: string,
    toppings: Array<{ id: number; name: string; price: number }>,
    quantity: number
  ) => void;
}

interface ToppingOption {
  id: number;
  name: string;
  price: number;
}

interface ToppingGroup {
  id: number;
  name: string;
  required: boolean;
  multiple: boolean;
  options: ToppingOption[];
}

export const CartEditToppingsModal: React.FC<CartEditToppingsModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
}) => {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<ToppingGroup[]>([]);
  const [selected, setSelected] = useState<Record<string, number[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [basePrice, setBasePrice] = useState(0);
  const [dishDescription, setDishDescription] = useState('');

  // Fetch product topping groups and prefill with existing selections
  useEffect(() => {
    if (!isOpen || !item || !item.productId) return;

    setQuantity(item.quantity || 1);
    setBasePrice(item.price || 0);

    const loadProductToppings = async () => {
      setLoading(true);
      try {
        const res = await restaurantApi.getProductDetail(item.productId!);
        if (res && res.data) {
          const detail = res.data;
          setBasePrice(Number(detail.price || item.price || 0));
          setDishDescription(detail.description || '');

          const parsedGroups: ToppingGroup[] = (detail.toppingGroups || []).map(
            (g, idx) => ({
              id: idx + 1,
              name: g.groupName,
              required: g.required,
              multiple: g.maxSelection > 1,
              options: g.toppings.map((t) => ({
                id: t.id,
                name: t.name,
                price: Number(t.price || 0),
              })),
            })
          );
          setGroups(parsedGroups);

          // Pre-populate selections from item's current toppings
          const existingToppingIds = new Set((item.toppings || []).map((t) => t.id));
          const initialSelected: Record<string, number[]> = {};

          parsedGroups.forEach((g) => {
            const matchedIds = g.options
              .filter((opt) => existingToppingIds.has(opt.id))
              .map((opt) => opt.id);

            if (matchedIds.length > 0) {
              initialSelected[String(g.id)] = matchedIds;
            } else if (g.required && g.options.length > 0) {
              // Default to first option for required groups if none matched
              initialSelected[String(g.id)] = [g.options[0].id];
            }
          });

          setSelected(initialSelected);
        }
      } catch (err) {
        console.warn('Failed to load product toppings for cart editing:', err);
        message.warning('Không thể tải danh sách topping của món ăn này lúc này');
      } finally {
        setLoading(false);
      }
    };

    loadProductToppings();
  }, [isOpen, item]);

  // Handle single option selection (Radio)
  const handleSelectSingle = (groupId: number, optionId: number) => {
    setSelected((prev) => ({
      ...prev,
      [String(groupId)]: [optionId],
    }));
  };

  // Handle multiple options selection (Checkbox)
  const handleSelectMultiple = (groupId: number, optionIds: number[]) => {
    setSelected((prev) => ({
      ...prev,
      [String(groupId)]: optionIds,
    }));
  };

  // Calculate realtime selected toppings
  const currentSelectedToppings = useMemo(() => {
    return groups.flatMap((group) => {
      const selectedIds = selected[String(group.id)] || [];
      return group.options
        .filter((opt) => selectedIds.includes(opt.id))
        .map((opt) => ({
          id: opt.id,
          name: opt.name,
          price: opt.price,
        }));
    });
  }, [groups, selected]);

  const toppingsPriceSum = useMemo(() => {
    return currentSelectedToppings.reduce((sum, t) => sum + t.price, 0);
  }, [currentSelectedToppings]);

  const totalCalculatedPrice = useMemo(() => {
    return (basePrice + toppingsPriceSum) * quantity;
  }, [basePrice, toppingsPriceSum, quantity]);

  // Validation: Check if required groups are satisfied
  const missingRequired = useMemo(() => {
    return groups.some((g) => {
      if (!g.required) return false;
      const chosen = selected[String(g.id)] || [];
      return chosen.length === 0;
    });
  }, [groups, selected]);

  const handleConfirm = () => {
    if (!item) return;
    if (missingRequired) {
      message.error('Vui lòng chọn đầy đủ các tùy chọn bắt buộc!');
      return;
    }

    // Generate new item key
    const toppingKey = currentSelectedToppings
      .map((t) => t.id)
      .sort((a, b) => a - b)
      .join('-');
    const newItemId = `${item.productId}-${toppingKey || 'base'}`;

    onSave(item.id, newItemId, currentSelectedToppings, quantity);
    onClose();
  };

  if (!isOpen || !item) return null;

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      width={560}
      destroyOnClose
      className="rounded-3xl overflow-hidden p-0"
    >
      {/* Header Banner */}
      <div className="relative -mx-6 -mt-6 h-48 overflow-hidden rounded-t-2xl bg-gray-900">
        <img
          src={getOptimizedCloudinaryUrl(item.imageUrl, 560, 300)}
          alt={item.name}
          className="h-full w-full object-cover opacity-80"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
        <div className="absolute bottom-4 left-6 right-6 text-white">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Tùy chỉnh Topping
            </span>
            <span className="text-xs text-gray-300">Quán: {item.shopName || 'Nhà hàng'}</span>
          </div>
          <h2 className="text-xl font-extrabold text-white leading-tight !mb-0">{item.name}</h2>
          {dishDescription && (
            <p className="text-xs text-gray-300 line-clamp-1 mt-1 !mb-0">{dishDescription}</p>
          )}
          <div className="text-sm font-black text-orange-400 mt-1">
            Giá gốc: {basePrice.toLocaleString('vi-VN')}đ
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Spin size="large" />
          <span className="text-xs text-gray-400 font-semibold">Đang tải danh sách topping...</span>
        </div>
      ) : groups.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <CoffeeOutlined className="text-4xl text-gray-300 mb-2" />
          <p className="text-sm font-semibold">Món ăn này hiện chưa có tùy chọn topping nào khác.</p>
        </div>
      ) : (
        <div className="max-h-[50vh] overflow-y-auto px-1 py-4 space-y-5">
          {groups.map((group) => {
            const selectedIds = selected[String(group.id)] || [];
            return (
              <section
                key={group.id}
                className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-gray-800 text-sm">{group.name}</span>
                    {group.required ? (
                      <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                        Bắt buộc chọn 1
                      </span>
                    ) : (
                      <span className="text-[10px] bg-gray-200 text-gray-600 font-medium px-2 py-0.5 rounded-full">
                        Chọn nhiều
                      </span>
                    )}
                  </div>
                </div>

                {group.multiple ? (
                  <Checkbox.Group
                    className="grid w-full gap-2.5"
                    value={selectedIds}
                    onChange={(values) => handleSelectMultiple(group.id, values as number[])}
                  >
                    {group.options.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                          selectedIds.includes(option.id)
                            ? 'bg-orange-50/70 border-orange-300 shadow-2xs'
                            : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <Checkbox value={option.id} className="text-xs font-semibold text-gray-800">
                          {option.name}
                        </Checkbox>
                        <span className="text-xs font-bold text-orange-600">
                          +{option.price.toLocaleString('vi-VN')}đ
                        </span>
                      </label>
                    ))}
                  </Checkbox.Group>
                ) : (
                  <Radio.Group
                    className="grid w-full gap-2.5"
                    value={selectedIds[0]}
                    onChange={(e) => handleSelectSingle(group.id, e.target.value)}
                  >
                    {group.options.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                          selectedIds[0] === option.id
                            ? 'bg-orange-50/70 border-orange-300 shadow-2xs'
                            : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <Radio value={option.id} className="text-xs font-semibold text-gray-800">
                          {option.name}
                        </Radio>
                        <span className="text-xs font-bold text-orange-600">
                          {option.price > 0 ? `+${option.price.toLocaleString('vi-VN')}đ` : 'Miễn phí'}
                        </span>
                      </label>
                    ))}
                  </Radio.Group>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Footer Summary & Quantity Dock */}
      <div className="pt-4 mt-2 border-t border-gray-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-600">Số lượng phần:</span>
          <div className="flex items-center gap-3 bg-gray-100/80 px-3 py-1.5 rounded-full">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-6 h-6 rounded-full bg-white text-gray-700 flex items-center justify-center text-xs shadow-2xs hover:bg-gray-200 disabled:opacity-40 cursor-pointer"
            >
              <MinusOutlined />
            </button>
            <span className="font-extrabold text-sm text-gray-900 min-w-[20px] text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs shadow-2xs hover:bg-orange-600 active:scale-95 cursor-pointer"
            >
              <PlusOutlined />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between bg-orange-50/70 p-3 rounded-2xl border border-orange-200/80">
          <div>
            <div className="text-[11px] text-gray-500 font-medium">Tổng thanh toán sau khi đổi:</div>
            <div className="text-base font-extrabold text-orange-600">
              {totalCalculatedPrice.toLocaleString('vi-VN')}đ
            </div>
          </div>
          <Button
            type="primary"
            onClick={handleConfirm}
            disabled={missingRequired}
            icon={<CheckCircleFilled />}
            className="bg-orange-500 hover:bg-orange-600 h-11 px-6 rounded-xl font-bold shadow-md shadow-orange-500/20 border-none"
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CartEditToppingsModal;

