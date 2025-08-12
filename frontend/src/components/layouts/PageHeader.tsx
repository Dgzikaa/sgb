'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center text-sm mb-3 text-gray-600 dark:text-gray-400" aria-label="Breadcrumb">
          <ol className="inline-flex items-center gap-2">
            {breadcrumb.map((item, idx) => (
              <li key={`${item.label}-${idx}`} className="inline-flex items-center gap-2">
                {idx > 0 && <span className="text-gray-400">/</span>}
                {item.href ? (
                  <Link href={item.href} className="hover:text-gray-900 dark:hover:text-white transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-gray-900 dark:text-white">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {description && (
            <p className="text-gray-700 dark:text-gray-400">{description}</p>
          )}
          {children}
        </div>
        {actions && <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export default PageHeader;


