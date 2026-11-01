import React from 'react';

interface EcoCutlerySectionProps {
  includeCutlery: boolean;
  onToggleCutlery: (checked: boolean) => void;
}

export const EcoCutlerySection: React.FC<EcoCutlerySectionProps> = ({
  includeCutlery,
  onToggleCutlery,
}) => {
  return (
    <section className="px-gutter mt-space-md">
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center justify-between gap-space-md">
        <div className="flex items-start gap-space-sm min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary mt-0.5">
            <span className="material-symbols-outlined text-[20px]">eco</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-headline-sm text-headline-sm text-on-surface leading-tight font-bold">
              Dụng cụ ăn uống
            </span>
            <span className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">
              Muỗng, nĩa, đũa nhựa dùng 1 lần
            </span>
            <span className="text-label-sm font-label-sm text-primary mt-1 inline-flex items-center gap-1 font-semibold">
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
            onChange={(e) => onToggleCutlery(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-12 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container shadow-inner" />
        </label>
      </div>
    </section>
  );
};

export default EcoCutlerySection;

