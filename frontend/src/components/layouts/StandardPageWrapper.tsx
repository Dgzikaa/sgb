'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import StandardPageLayout from './StandardPageLayout';

interface StandardPageWrapperProps {
  children: ReactNode;
  className?: string;
  spacing?: 'normal' | 'tight' | 'loose';
  showBackground?: boolean;
}

export function StandardPageWrapper({
  children,
  className,
  spacing = 'normal',
  showBackground = true,
}: StandardPageWrapperProps) {
  return (
    <div
      className={cn(
        'min-h-screen relative overflow-hidden',
        showBackground &&
          'bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/50',
        className
      )}
    >
      {/* Background decorativo - igual ao da tabela de desempenho */}
      {showBackground && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-cyan-600/20 rounded-full blur-3xl"></div>
        </div>
      )}

      {/* Content com z-index para ficar acima do background */}
      <div className="relative z-10">
        <StandardPageLayout spacing={spacing}>{children}</StandardPageLayout>
      </div>
    </div>
  );
}

export default StandardPageWrapper;
