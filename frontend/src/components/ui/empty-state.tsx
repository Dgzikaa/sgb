'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('card-dark p-8 text-center', className)}>
      <div className="mx-auto w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="card-title-dark mb-2">{title}</h3>
      {description && (
        <p className="card-description-dark mb-4 max-w-md mx-auto">{description}</p>
      )}
      {action}
    </div>
  );
}

export default EmptyState;


