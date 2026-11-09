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
    // <section className="px-4 mt-4">
    //   <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex items-center justify-between gap-3">
    //     <div className="flex items-start gap-3 min-w-0">
    //       <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-600 mt-0.5">
    //         <span className="material-symbols-outlined text-[20px]">eco</span>
    //       </div>
    //       <div className="flex flex-col min-w-0">
    //         <span className="text-sm text-gray-900 leading-tight font-bold">
    //           Dụng cụ ăn uống
    //         </span>
    //         <span className="text-xs text-gray-500 mt-0.5">
    //           Muỗng, nĩa, đũa nhựa dùng 1 lần
    //         </span>
    //         <span className="text-[11px] text-emerald-600 mt-1 inline-flex items-center gap-1 font-semibold">
    //           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
    //           Cùng chung tay giảm thiểu rác thải nhựa
    //         </span>
    //       </div>
    //     </div>

    //     {/* Interactive Modern Toggle Switch */}
    //     <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
    //       <input
    //         type="checkbox"
    //         checked={includeCutlery}
    //         onChange={(e) => onToggleCutlery(e.target.checked)}
    //         className="sr-only peer"
    //       />
    //       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 shadow-inner" />
    //     </label>
    //   </div>
    // </section>
    <></>
  );
};

export default EcoCutlerySection;
