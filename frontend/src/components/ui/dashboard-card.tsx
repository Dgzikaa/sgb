'use client';

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Sparkles, Zap, Activity } from 'lucide-react';

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
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'gradient' | 'glass' | 'minimal' | 'neon' | 'premium';
  onClick?: () => void;
  loading?: boolean;
  animated?: boolean;
  showSparkles?: boolean;
  pulse?: boolean;
  glow?: boolean;
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
  animated = true,
  showSparkles = false,
  pulse = false,
  glow = false,
}: DashboardCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  const variantClasses = {
    default:
      'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl',
    gradient:
      'bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-700/70 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 shadow-xl hover:shadow-2xl',
    glass:
      'bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/20 dark:border-gray-700/20 shadow-2xl hover:shadow-3xl',
    minimal:
      'bg-white/90 dark:bg-gray-800/90 border border-slate-200/50 dark:border-gray-600/50 shadow-sm hover:shadow-lg',
    neon:
      'bg-gray-900/95 dark:bg-gray-950/95 backdrop-blur-md border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-500/40',
    premium:
      'bg-gradient-to-br from-purple-50/90 via-white/90 to-blue-50/90 dark:from-purple-900/20 dark:via-gray-800/90 dark:to-blue-900/20 backdrop-blur-md border border-purple-200/50 dark:border-purple-700/30 shadow-2xl hover:shadow-purple-500/20',
  };

  const changeColors = {
    positive:
      'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    negative: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    neutral:
      'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50',
  };

  const changeIcons = {
    positive: <TrendingUp className="w-3 h-3" />,
    negative: <TrendingDown className="w-3 h-3" />,
    neutral: <Minus className="w-3 h-3" />,
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1
      }
    }
  };

  const glowVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: glow ? [0.5, 1, 0.5] : 0,
      transition: {
        duration: 2,
        repeat: glow ? Infinity : 0,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      variants={animated ? cardVariants : undefined}
      initial={animated ? "initial" : undefined}
      animate={animated ? "animate" : undefined}
      whileHover={animated && onClick ? "hover" : undefined}
      whileTap={animated && onClick ? "tap" : undefined}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        rounded-2xl transition-all duration-300 ease-out
        ${onClick ? 'cursor-pointer' : ''}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
        relative overflow-hidden group
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Background decorativo avançado */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Glow effect */}
      {glow && (
        <motion.div
          variants={glowVariants}
          initial="initial"
          animate="animate"
          className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl"
        />
      )}

      {/* Sparkles effect */}
      <AnimatePresence>
        {showSparkles && isHovered && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0, rotate: 0 }}
                animate={{ 
                  opacity: [0, 1, 0], 
                  scale: [0, 1, 0],
                  rotate: [0, 180, 360],
                  x: Math.random() * 200 - 100,
                  y: Math.random() * 200 - 100
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ 
                  duration: 2,
                  delay: i * 0.2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
                className="absolute top-1/2 left-1/2 pointer-events-none"
              >
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      <div className="relative z-10">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center space-x-4">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-12 h-12 bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded-xl flex items-center justify-center"
              >
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </motion.div>
              <div className="flex-1 space-y-2">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg"
                  style={{ width: '75%' }}
                />
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg"
                  style={{ width: '50%' }}
                />
              </div>
            </div>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
              className="h-8 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg"
              style={{ width: '33%' }}
            />
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
              className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-lg"
              style={{ width: '25%' }}
            />
          </motion.div>
        ) : (
          <>
            {/* Header */}
            {(title || subtitle || icon) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-start justify-between mb-4"
              >
                <div className="flex-1 min-w-0">
                  {title && (
                    <motion.h3
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-slate-700 dark:text-slate-300 font-semibold text-sm leading-tight mb-1 truncate"
                    >
                      {title}
                    </motion.h3>
                  )}
                  {subtitle && (
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed truncate"
                    >
                      {subtitle}
                    </motion.p>
                  )}
                </div>

                {icon && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0, rotate: -180 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    whileHover={{ 
                      scale: 1.1, 
                      rotate: [0, -10, 10, 0],
                      transition: { duration: 0.3 }
                    }}
                    className={`
                      w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center shadow-lg 
                      hover:shadow-xl transition-all duration-300
                      ml-4 flex-shrink-0 relative overflow-hidden
                    `}
                  >
                    {/* Icon glow effect */}
                    <motion.div
                      animate={{ 
                        scale: isHovered ? [1, 1.2, 1] : 1,
                        opacity: isHovered ? [0.5, 1, 0.5] : 0
                      }}
                      transition={{ duration: 1, repeat: isHovered ? Infinity : 0 }}
                      className="absolute inset-0 bg-white/20 rounded-xl"
                    />
                    
                    {typeof icon === 'string' ? (
                      <span className="text-white text-xl relative z-10">{icon}</span>
                    ) : (
                      <div className="text-white relative z-10">{icon}</div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Value */}
            {value && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                className="mb-3"
              >
                <motion.div
                  key={value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-3xl font-bold text-slate-800 dark:text-slate-100 leading-none bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent"
                >
                  {value}
                </motion.div>
              </motion.div>
            )}

            {/* Change indicator */}
            {change && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-4"
              >
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium
                    ${changeColors[changeType || 'neutral']}
                    shadow-sm hover:shadow-md transition-all duration-200
                    border border-current/20
                  `}
                >
                  <motion.span
                    animate={{ 
                      rotate: changeType === 'positive' ? [0, 10, 0] : 
                              changeType === 'negative' ? [0, -10, 0] : 0
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mr-2"
                  >
                    {changeIcons[changeType || 'neutral']}
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    {change}
                  </motion.span>
                </motion.span>
              </motion.div>
            )}

            {/* Custom content */}
            {children && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-4"
              >
                {children}
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, staggerChildren: 0.1 }}
      className={`grid ${colsClasses[cols]} ${gapClasses[gap]} ${className}`}
    >
      {children}
    </motion.div>
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
      variant="premium"
      size="md"
      animated={true}
      showSparkles={changeType === 'positive'}
      glow={changeType === 'positive'}
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
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    stable: 'text-slate-600 dark:text-slate-400',
  };

  const trendIcons = {
    up: <TrendingUp className="w-5 h-5" />,
    down: <TrendingDown className="w-5 h-5" />,
    stable: <Activity className="w-5 h-5" />,
  };

  const maxValue = Math.max(...data);

  return (
    <DashboardCard
      title={title}
      value={value}
      subtitle={subtitle}
      icon={trendIcons[trend]}
      variant="gradient"
      animated={true}
      glow={trend === 'up'}
    >
      {data.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4"
        >
          <div className="flex items-end space-x-1 h-16 bg-gradient-to-t from-slate-100/50 to-transparent dark:from-slate-800/50 rounded-lg p-2">
            {data.map((point, index) => (
              <motion.div
                key={index}
                initial={{ height: 0, opacity: 0 }}
                animate={{ 
                  height: `${(point / maxValue) * 100}%`,
                  opacity: 1
                }}
                transition={{ 
                  delay: 0.7 + (index * 0.1),
                  duration: 0.6,
                  ease: [0.4, 0, 0.2, 1]
                }}
                whileHover={{ 
                  scale: 1.1,
                  transition: { duration: 0.2 }
                }}
                className="bg-gradient-to-t from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-sm flex-1 transition-all duration-300 relative overflow-hidden group cursor-pointer"
              >
                {/* Shimmer effect */}
                <motion.div
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "linear"
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
                />
                
                {/* Value tooltip */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap"
                >
                  {point}
                </motion.div>
              </motion.div>
            ))}
          </div>
          
          {/* Chart legend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex justify-between items-center mt-2 text-xs text-slate-500 dark:text-slate-400"
          >
            <span>Min: {Math.min(...data)}</span>
            <span className={trendColors[trend]}>
              Tendência: {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
            </span>
            <span>Max: {maxValue}</span>
          </motion.div>
        </motion.div>
      )}
    </DashboardCard>
  );
}

