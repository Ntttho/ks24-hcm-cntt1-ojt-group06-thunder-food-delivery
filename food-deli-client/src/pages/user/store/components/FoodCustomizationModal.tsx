import React, { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Modal, Radio } from 'antd';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import type { CustomizationOption, FoodItem } from '../types';

interface FoodCustomizationModalProps {
  food: FoodItem | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (food: FoodItem, quantity: number, toppings: Array<{ id: number; name: string; price: number }>) => void;
}

export const FoodCustomizationModal: React.FC<FoodCustomizationModalProps> = ({
  food,
  open,
  onClose,
  onConfirm,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, number[]>>({});

  useEffect(() => {
    if (open) {
      setQuantity(1);
      setSelected({});
    }
  }, [open, food?.id]);

  const totalPrice = useMemo(() => {
    if (!food) return 0;
    const optionPrice = (food.customizationGroups || []).reduce((sum, group) => {
      const selectedIds = selected[String(group.id)] || [];
      return sum + group.options
        .filter((option) => selectedIds.includes(option.id))
        .reduce((groupSum, option) => groupSum + option.price, 0);
    }, 0);
    return (food.price + optionPrice) * quantity;
  }, [food, quantity, selected]);

  if (!food) return null;

  const selectSingle = (groupId: number, optionId: number) => {
    setSelected((current) => ({ ...current, [String(groupId)]: [optionId] }));
  };

  const selectMultiple = (groupId: number, optionIds: number[]) => {
    setSelected((current) => ({ ...current, [String(groupId)]: optionIds }));
  };

  const selectedToppings = (food.customizationGroups || []).flatMap((group) =>
    (group.options as CustomizationOption[]).filter((option) =>
      (selected[String(group.id)] || []).includes(option.id)
    ).map((option) => ({ id: option.id, name: option.name, price: option.price }))
  );

  const missingRequiredGroup = (food.customizationGroups || []).some((group) => {
    if (!group.required) return false;
    return !(selected[String(group.id)] || []).length;
  });

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      title={null}
      centered
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      <div className="relative -mx-6 -mt-6 h-52 overflow-hidden rounded-t-lg bg-gray-100">
        <img src={food.imageUrl} alt={food.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-4 left-6 right-6 text-white">
          <h2 className="mb-1 text-xl font-bold text-white">{food.name}</h2>
          <p className="mb-0 text-sm text-white/90">{food.description}</p>
        </div>
      </div>

      <div className="space-y-5 py-5">
        {(food.customizationGroups || []).map((group) => (
          <section key={group.id} className="border-b border-gray-100 pb-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{group.name}</h3>
              {group.required && <span className="rounded bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-600">Bắt buộc</span>}
            </div>
            {group.multiple ? (
              <Checkbox.Group
                className="grid w-full gap-3"
                value={selected[String(group.id)] || []}
                onChange={(values) => selectMultiple(group.id, values)}
              >
                {group.options.map((option) => (
                  <Checkbox key={option.id} value={option.id} className="m-0 flex w-full justify-between">
                    <span>{option.name}</span>
                    <span className="ml-4 text-orange-600">+{option.price.toLocaleString('vi-VN')}đ</span>
                  </Checkbox>
                ))}
              </Checkbox.Group>
            ) : (
              <Radio.Group
                className="grid w-full gap-3"
                value={selected[String(group.id)]?.[0]}
                onChange={(event) => selectSingle(group.id, event.target.value)}
              >
                {group.options.map((option) => (
                  <Radio key={option.id} value={option.id} className="m-0 w-full">
                    <span>{option.name}</span>
                    <span className="ml-4 text-orange-600">+{option.price.toLocaleString('vi-VN')}đ</span>
                  </Radio>
                ))}
              </Radio.Group>
            )}
          </section>
        ))}

        {!(food.customizationGroups || []).length && (
          <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Món này hiện chưa có tùy chọn thêm.</div>
        )}
      </div>

      <div className="sticky bottom-0 -mx-6 flex items-center gap-4 border-t bg-white px-6 pb-1 pt-4">
        <div className="flex items-center rounded-full border border-gray-200 p-1">
          <Button shape="circle" type="text" icon={<MinusOutlined />} disabled={quantity <= 1} onClick={() => setQuantity((value) => value - 1)} />
          <span className="w-8 text-center font-bold">{quantity}</span>
          <Button shape="circle" type="text" icon={<PlusOutlined />} onClick={() => setQuantity((value) => value + 1)} />
        </div>
        <Button
          type="primary"
          size="large"
          disabled={missingRequiredGroup}
          className="flex-1 bg-orange-500 hover:bg-orange-600"
          onClick={() => onConfirm(food, quantity, selectedToppings)}
        >
          Thêm vào giỏ - {totalPrice.toLocaleString('vi-VN')}đ
        </Button>
      </div>
    </Modal>
  );
};
