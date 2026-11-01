import React, { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subTitle?: string;
  extra?: ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subTitle, extra }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-6 border-b border-gray-100 gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        {subTitle && <p className="mt-1 text-sm text-gray-500">{subTitle}</p>}
      </div>
      {extra && <div className="flex items-center gap-3">{extra}</div>}
    </div>
  );
};
