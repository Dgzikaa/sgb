'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: React.ReactNode;
  trend?: { value: string; type: 'up' | 'down' | 'neutral' };
  className?: string;
}

const trendClasses: Record<'up' | 'down' | 'neutral', string> = {
  up: 'text-green-600 dark:text-green-400',
  down: 'text-red-600 dark:text-red-400',
  neutral: 'text-gray-600 dark:text-gray-400',
};

export function KpiCard({ label, value, sublabel, icon, trend, className }: KpiCardProps) {
  return (
    <div className={cn('card-dark p-4 sm:p-5', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
          {sublabel && (
            <div className="text-sm text-gray-500 dark:text-gray-500">{sublabel}</div>
          )}
        </div>
        {icon && <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">{icon}</div>}
      </div>
      {trend && (
        <div className={cn('mt-2 text-sm flex items-center gap-1', trendClasses[trend.type])}>{trend.value}</div>
      )}
    </div>
  );
}

export default KpiCard;


