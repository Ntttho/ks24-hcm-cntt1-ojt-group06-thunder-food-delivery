import React from 'react';

interface PasswordStrengthMeterProps {
  password?: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = '' }) => {
  const calculateScore = (pwd: string) => {
    let score = 0;
    if (!pwd) return 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score;
  };

  const score = calculateScore(password);
  const levels = [
    { label: 'Rất yếu', color: 'bg-red-500', width: 'w-1/5' },
    { label: 'Yếu', color: 'bg-orange-500', width: 'w-2/5' },
    { label: 'Trung bình', color: 'bg-amber-500', width: 'w-3/5' },
    { label: 'Tốt', color: 'bg-emerald-500', width: 'w-4/5' },
    { label: 'Tuyệt đối an toàn', color: 'bg-teal-600', width: 'w-full' },
  ];

  if (!password) return null;

  const currentLevel = levels[Math.min(score - 1, 4)] || levels[0];

  return (
    <div className="mt-1.5 space-y-1 transition-all duration-300">
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
        <div
          className={`h-full transition-all duration-500 rounded-full ${currentLevel.color} ${currentLevel.width}`}
        />
      </div>
      <div className="flex justify-between items-center text-[11px]">
        <span className="text-slate-400">Độ mạnh mật khẩu:</span>
        <span className="font-semibold text-slate-700">{currentLevel.label}</span>
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;

