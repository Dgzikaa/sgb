'use client';

import { ReactNode } from 'react';

interface DashboardCardProps {
  title?: string;
  subtitle?: string;
  value?: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: string | ReactNode;
  iconBg?: string;
  children?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient' | 'glass' | 'minimal';
  onClick?: () => void;
  loading?: boolean;
}

export default function DashboardCard({
  title,
  subtitle,
  value,
  change,
  changeType,
  icon,
  iconBg = 'bg-blue-500',
  children,
  size = 'md',
  variant = 'default',
  className,
  onClick,
  loading = false,
}: DashboardCardProps) {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const variantClasses = {
    default:
      'bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl',
    gradient:
      'bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm border border-white/30 shadow-xl hover:shadow-2xl',
    glass:
      'bg-white/60 backdrop-blur-md border border-white/20 shadow-2xl hover:shadow-3xl',
    minimal: 'bg-white/90 border border-slate-200/50 shadow-sm hover:shadow-lg',
  };

  const changeColors = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-slate-600 bg-slate-50',
  };

  const changeIcons = {
    positive: '↗',
    negative: '↘',
    neutral: '→',
  };

  return (
    <div
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        rounded-2xl transition-all duration-300 ease-out
        ${onClick ? 'cursor-pointer hover:scale-105 hover:-translate-y-1 active:scale-95' : ''}
        ${className}
        relative overflow-hidden group
      `}
      onClick={onClick}
    >
      {/* Background decorativo */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative z-10">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          </div>
        ) : (
          <>
            {/* Header */}
            {(title || subtitle || icon) && (
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  {title && (
                    <h3 className="text-slate-700 font-semibold text-sm leading-tight mb-1 truncate">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-slate-500 text-xs leading-relaxed truncate">
                      {subtitle}
                    </p>
                  )}
                </div>

                {icon && (
                  <div
                    className={`
                    w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center shadow-lg 
                    group-hover:shadow-xl group-hover:scale-110 transition-all duration-300
                    ml-4 flex-shrink-0
                  `}
                  >
                    {typeof icon === 'string' ? (
                      <span className="text-white text-xl">{icon}</span>
                    ) : (
                      <div className="text-white">{icon}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Value */}
            {value && (
              <div className="mb-3">
                <div className="text-3xl font-bold text-slate-800 leading-none">
                  {value}
                </div>
              </div>
            )}

            {/* Change indicator */}
            {change && (
              <div className="mb-4">
                <span
                  className={`
                  inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium
                  ${changeColors[changeType]}
                `}
                >
                  <span className="mr-1">{changeIcons[changeType]}</span>
                  {change}
                </span>
              </div>
            )}

            {/* Custom content */}
            {children && <div className="mt-4">{children}</div>}
          </>
        )}
      </div>
    </div>
  );
}

// Componente de grid para organizar cards
interface DashboardGridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function DashboardGrid({
  children,
  cols = 3,
  gap = 'md',
  className = '',
}: DashboardGridProps) {
  const colsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  return (
    <div
      className={`grid ${colsClasses[cols]} ${gapClasses[gap]} ${className}`}
    >
      {children}
    </div>
  );
}

// Componente de métrica simples
interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

export function MetricCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  color = 'blue',
}: MetricCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-green-500 to-emerald-600',
    purple: 'from-purple-500 to-violet-600',
    orange: 'from-orange-500 to-red-600',
    red: 'from-red-500 to-pink-600',
  };

  return (
    <DashboardCard
      title={label}
      value={value}
      change={change}
      changeType={changeType}
      icon={icon}
      iconBg={`bg-gradient-to-br ${colorClasses[color]}`}
      variant="glass"
      size="md"
    />
  );
}

// Componente de estatística com gráfico simples
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  data?: number[];
}

export function StatCard({
  title,
  value,
  subtitle,
  trend = 'stable',
  data = [],
}: StatCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-slate-600',
  };

  const trendIcons = {
    up: '📈',
    down: '📉',
    stable: '📊',
  };

  return (
    <DashboardCard
      title={title}
      value={value}
      subtitle={subtitle}
      icon={trendIcons[trend]}
      variant="gradient"
    >
      {data.length > 0 && (
        <div className="mt-4">
          <div className="flex items-end space-x-1 h-16">
            {data.map((point, index) => (
              <div
                key={index}
                className="bg-gradient-to-t from-indigo-500 to-purple-600 rounded-sm flex-1 transition-all duration-300 hover:from-indigo-600 hover:to-purple-700"
                style={{ height: `${(point / Math.max(...data)) * 100}%` }}
              />
            ))}
          </div>
        </div>
      )}
    </DashboardCard>
  );
}
