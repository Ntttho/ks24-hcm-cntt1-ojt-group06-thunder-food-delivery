import React, { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

export interface CustomizableFood {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
}

interface Props {
  food: CustomizableFood;
  onClose: () => void;
  onAdd: (quantity: number, toppings: Array<{ id: number; name: string; price: number }>) => void;
}

const toppingGroups = [
  { id: 'pearls', name: 'Trân châu', required: false, options: [{ id: 1, name: 'Trân châu đen', price: 5000 }, { id: 2, name: 'Trân châu trắng', price: 6000 }, { id: 3, name: 'Thạch trái cây', price: 7000 }] },
  { id: 'cheese', name: 'Phô mai & kem', required: false, options: [{ id: 4, name: 'Mousse phô mai', price: 12000 }, { id: 5, name: 'Kem béo', price: 8000 }] },
  { id: 'size', name: 'Chọn size', required: true, options: [{ id: 6, name: 'Size vừa', price: 0 }, { id: 7, name: 'Size lớn', price: 15000 }] },
];

export const FoodCustomizationModal: React.FC<Props> = ({ food, onClose, onAdd }) => {
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, number[]>>({ size: [6] });

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const toppingTotal = useMemo(() => toppingGroups.flatMap((group) => group.options).filter((option) => Object.values(selected).flat().includes(option.id)).reduce((sum, option) => sum + option.price, 0), [selected]);
  const unitPrice = food.price + toppingTotal;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-slate-950/55 p-0 md:p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-label={`Tùy chỉnh ${food.name}`} className="w-full md:max-w-xl max-h-[92vh] bg-white rounded-t-[28px] md:rounded-[28px] overflow-hidden shadow-2xl animate-fade-in-up">
        <div className="relative h-44 md:h-52 bg-slate-100">
          <img src={food.image} alt={food.name} className="w-full h-full object-cover" />
          <button onClick={onClose} aria-label="Đóng" className="absolute right-4 top-4 w-10 h-10 rounded-full bg-white/95 grid place-items-center shadow"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto max-h-[calc(92vh-176px)] md:max-h-[70vh]">
          <div className="p-5 pb-3 border-b border-slate-100">
            <div className="flex justify-between gap-4"><div><h2 className="text-xl font-black text-slate-900">{food.name}</h2><p className="text-sm text-slate-500 mt-1 leading-relaxed">{food.description}</p></div><strong className="text-primary shrink-0">{formatCurrency(food.price)}</strong></div>
          </div>
          {toppingGroups.map((group) => (
            <fieldset key={group.id} className="p-5 border-b border-slate-100">
              <legend className="font-black text-slate-900 mb-1">{group.name} {group.required && <span className="ml-1 text-[10px] bg-slate-100 px-2 py-1 rounded-full text-slate-500">Bắt buộc</span>}</legend>
              <div className="mt-3 space-y-2">
                {group.options.map((option) => {
                  const checked = (selected[group.id] || []).includes(option.id);
                  return <label key={option.id} className="flex items-center gap-3 py-2 cursor-pointer"><input type={group.required ? 'radio' : 'checkbox'} name={group.id} checked={checked} onChange={() => setSelected((current) => ({ ...current, [group.id]: group.required ? [option.id] : checked ? (current[group.id] || []).filter((id) => id !== option.id) : [...(current[group.id] || []), option.id] }))} className="accent-primary w-4 h-4" /><span className="flex-1 text-sm font-semibold text-slate-700">{option.name}</span><span className="text-sm font-bold text-slate-500">{option.price ? `+${formatCurrency(option.price)}` : 'Miễn phí'}</span></label>;
                })}
              </div>
            </fieldset>
          ))}
          <div className="sticky bottom-0 bg-white p-4 border-t border-slate-100 shadow-[0_-8px_30px_rgba(15,23,42,.08)] flex items-center gap-3">
            <div className="flex items-center rounded-full border border-slate-200 h-11 shrink-0">
              <button aria-label="Giảm số lượng" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="w-10 h-full grid place-items-center disabled:text-slate-300"><Minus className="w-4 h-4" /></button>
              <span className="w-7 text-center font-black text-sm">{quantity}</span>
              <button aria-label="Tăng số lượng" onClick={() => setQuantity((value) => value + 1)} className="w-10 h-full grid place-items-center"><Plus className="w-4 h-4" /></button>
            </div>
            <button onClick={() => {
              const toppings = toppingGroups.flatMap((group) => group.options).filter((option) => Object.values(selected).flat().includes(option.id) && option.price > 0);
              onAdd(quantity, toppings);
            }} className="flex-1 h-11 bg-primary hover:bg-primary-hover text-white rounded-full font-black text-sm flex justify-between items-center px-5"><span>Thêm vào giỏ</span><span>{formatCurrency(unitPrice * quantity)}</span></button>
          </div>
        </div>
      </section>
    </div>
  );
};
