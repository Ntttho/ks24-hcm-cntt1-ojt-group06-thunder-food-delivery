import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Checkbox, Tag, Spin, Empty, message, Space, Divider } from 'antd';
import { TagsOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import {
  restaurantApi,
  type ProductItem,
  type ToppingItem,
} from '@/services/modules/restaurantApi';
import { formatCurrency } from '@/utils/formatters';

interface AssignToppingModalProps {
  isOpen: boolean;
  product: ProductItem | null;
  restaurantId: number | string;
  onClose: () => void;
  onSuccess: (updatedProduct: ProductItem) => void;
}

export const AssignToppingModal: React.FC<AssignToppingModalProps> = ({
  isOpen,
  product,
  restaurantId,
  onClose,
  onSuccess,
}) => {
  const [toppings, setToppings] = useState<ToppingItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Load all toppings of the restaurant and already assigned toppings for the product
  useEffect(() => {
    if (!isOpen || !product) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch all toppings belonging to the restaurant
        const allRes = await restaurantApi.getToppingsByRestaurant(restaurantId);
        const allList = allRes.data || [];
        setToppings(allList);

        // 2. Fetch assigned toppings for this product
        try {
          const assignedRes = await restaurantApi.getProductToppings(product.id);
          if (assignedRes && assignedRes.data) {
            setSelectedIds(assignedRes.data.map((t) => t.id));
          } else if (product.toppingIds) {
            setSelectedIds(product.toppingIds);
          } else {
            setSelectedIds([]);
          }
        } catch {
          setSelectedIds(product.toppingIds || []);
        }
      } catch {
        message.error('Không thể tải danh sách topping của quán');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, product, restaurantId]);

  // Group toppings by groupName (Size ly, Độ ngọt, Mức đá, Topping thêm...)
  const groupedToppings = useMemo(() => {
    const map: Record<string, ToppingItem[]> = {};
    toppings.forEach((t) => {
      const g = t.groupName?.trim() || 'Topping thêm';
      if (!map[g]) map[g] = [];
      map[g].push(t);
    });
    return map;
  }, [toppings]);

  const handleToggle = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllGroup = (groupItems: ToppingItem[]) => {
    const groupIds = groupItems.map((t) => t.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...groupIds])));
  };

  const handleDeselectAllGroup = (groupItems: ToppingItem[]) => {
    const groupIds = new Set(groupItems.map((t) => t.id));
    setSelectedIds((prev) => prev.filter((id) => !groupIds.has(id)));
  };

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);
    try {
      await restaurantApi.assignToppingsToProduct(product.id, selectedIds);
      message.success(`Đã lưu cấu hình ${selectedIds.length} topping cho "${product.name}"`);
      onSuccess({
        ...product,
        toppingIds: selectedIds,
      });
      onClose();
    } catch {
      message.error('Lỗi khi lưu danh sách topping');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2 pr-4">
          <TagsOutlined className="text-orange-500 text-lg" />
          <div>
            <div className="text-base font-bold text-slate-800">
              Gán Topping cho món: <span className="text-orange-600">{product?.name}</span>
            </div>
            <div className="text-xs text-slate-500 font-normal">
              Tick chọn các nhóm topping và tùy chọn được phép áp dụng cho món ăn này
            </div>
          </div>
        </div>
      }
      width={680}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Đóng
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<CheckOutlined />}
          loading={saving}
          onClick={handleSave}
          style={{ backgroundColor: '#f97316', borderColor: '#f97316' }}
          className="font-bold shadow-sm"
        >
          Lưu cấu hình ({selectedIds.length} topping đã chọn)
        </Button>,
      ]}
      centered
      destroyOnClose
    >
      <div className="py-2">
        {loading ? (
          <div className="py-16 text-center">
            <Spin size="large" />
            <div className="mt-3 text-slate-500 text-sm">Đang tải danh sách topping...</div>
          </div>
        ) : toppings.length === 0 ? (
          <Empty
            description={
              <div className="text-slate-500 py-6">
                Quán chưa tạo topping nào. Vui lòng thêm topping trước khi gán cho món ăn.
              </div>
            }
          />
        ) : (
          <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
            <div className="bg-orange-50/70 border border-orange-200/60 p-3 rounded-xl flex items-center justify-between text-xs text-slate-700">
              <span>
                Đang chọn: <strong className="text-orange-600 font-bold">{selectedIds.length}</strong> / {toppings.length} topping khả dụng
              </span>
              <Space size="small">
                <Button
                  size="small"
                  type="link"
                  className="p-0 text-orange-600 font-semibold"
                  onClick={() => setSelectedIds(toppings.map((t) => t.id))}
                >
                  Chọn tất cả
                </Button>
                <span className="text-slate-300">|</span>
                <Button
                  size="small"
                  type="link"
                  className="p-0 text-slate-500"
                  onClick={() => setSelectedIds([])}
                >
                  Bỏ chọn tất cả
                </Button>
              </Space>
            </div>

            {Object.entries(groupedToppings).map(([groupName, groupItems]) => {
              const allSelected = groupItems.every((item) => selectedIds.includes(item.id));
              const someSelected = groupItems.some((item) => selectedIds.includes(item.id)) && !allSelected;

              return (
                <div key={groupName} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <Tag color="volcano" className="font-bold text-xs uppercase px-2 py-0.5 rounded-md">
                        {groupName}
                      </Tag>
                      <span className="text-xs text-slate-400">({groupItems.length} lựa chọn)</span>
                    </div>
                    <Space size="small">
                      <Button
                        size="small"
                        type="text"
                        className="text-xs text-orange-600 hover:bg-orange-50 font-medium"
                        onClick={() =>
                          allSelected
                            ? handleDeselectAllGroup(groupItems)
                            : handleSelectAllGroup(groupItems)
                        }
                      >
                        {allSelected ? 'Bỏ chọn nhóm' : 'Chọn cả nhóm'}
                      </Button>
                    </Space>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {groupItems.map((item) => {
                      const isChecked = selectedIds.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleToggle(item.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-400/50'
                              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <Checkbox checked={isChecked} onChange={() => handleToggle(item.id)} />
                            <span className="font-medium text-xs text-slate-800 truncate">
                              {item.name}
                            </span>
                          </div>
                          <span className={`text-xs font-bold whitespace-nowrap ${item.price === 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                            {item.price === 0 ? 'Miễn phí' : `+${formatCurrency(item.price)}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

