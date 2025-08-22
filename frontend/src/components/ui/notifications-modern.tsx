'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  XCircle, 
  X, 
  Bell,
  Volume2,
  VolumeX,
  Settings,
  Clock,
  Star,
  MessageSquare,
  Zap,
  Heart,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 🎯 TYPES
interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'premium' | 'custom';
  title: string;
  message?: string;
  icon?: React.ReactNode;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  timestamp: Date;
  read?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  metadata?: Record<string, any>;
}

interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: React.ReactNode;
}

interface ModernNotificationsProps {
  position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  maxNotifications?: number;
  autoClose?: boolean;
  autoCloseDelay?: number;
  showProgress?: boolean;
  showTimestamp?: boolean;
  showActions?: boolean;
  showDismiss?: boolean;
  variant?: 'default' | 'minimal' | 'glass' | 'premium';
  animated?: boolean;
  className?: string;
  onNotificationClick?: (notification: NotificationItem) => void;
  onNotificationDismiss?: (notificationId: string) => void;
  onNotificationAction?: (notificationId: string, actionIndex: number) => void;
}

// 🎨 COMPONENTE PRINCIPAL
export const ModernNotifications = React.forwardRef<HTMLDivElement, ModernNotificationsProps>(
  ({
    position = 'top-right',
    maxNotifications = 5,
    autoClose = true,
    autoCloseDelay = 5000,
    showProgress = true,
    showTimestamp = true,
    showActions = true,
    showDismiss = true,
    variant = 'default',
    animated = true,
    className,
    onNotificationClick,
    onNotificationDismiss,
    onNotificationAction,
    ...props
  }, ref) => {
    // 🎭 STATES
    const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
    const [isPaused, setIsPaused] = React.useState(false);
    const [showAll, setShowAll] = React.useState(false);
    const [filter, setFilter] = React.useState<'all' | 'unread' | 'read'>('all');

    // 🔍 REFS
    const containerRef = React.useRef<HTMLDivElement>(null);
    const progressRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());

    // 🎯 HELPER FUNCTIONS
    const getPositionClasses = () => {
      switch (position) {
        case 'top-left':
          return 'top-4 left-4';
        case 'top-right':
          return 'top-4 right-4';
        case 'top-center':
          return 'top-4 left-1/2 transform -translate-x-1/2';
        case 'bottom-left':
          return 'bottom-4 left-4';
        case 'bottom-right':
          return 'bottom-4 right-4';
        case 'bottom-center':
          return 'bottom-4 left-1/2 transform -translate-x-1/2';
        default:
          return 'top-4 right-4';
      }
    };

    const getTypeStyles = (type: NotificationItem['type']) => {
      switch (type) {
        case 'success':
          return {
            bg: 'bg-green-50 dark:bg-green-900/20',
            border: 'border-green-200 dark:border-green-700',
            text: 'text-green-800 dark:text-green-200',
            icon: 'text-green-500 dark:text-green-400',
            progress: 'bg-green-500'
          };
        case 'error':
          return {
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-200 dark:border-red-700',
            text: 'text-red-800 dark:text-red-200',
            icon: 'text-red-500 dark:text-red-400',
            progress: 'bg-red-500'
          };
        case 'warning':
          return {
            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
            border: 'border-yellow-200 dark:border-yellow-700',
            text: 'text-yellow-800 dark:text-yellow-200',
            icon: 'text-yellow-500 dark:text-yellow-400',
            progress: 'bg-yellow-500'
          };
        case 'info':
          return {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-700',
            text: 'text-blue-800 dark:text-blue-200',
            icon: 'text-blue-500 dark:text-blue-400',
            progress: 'bg-blue-500'
          };
        case 'premium':
          return {
            bg: 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
            border: 'border-purple-200 dark:border-purple-700',
            text: 'text-purple-800 dark:text-purple-200',
            icon: 'text-purple-500 dark:text-purple-400',
            progress: 'bg-gradient-to-r from-purple-500 to-pink-500'
          };
        default:
          return {
            bg: 'bg-gray-50 dark:bg-gray-900/20',
            border: 'border-gray-200 dark:border-gray-700',
            text: 'text-gray-800 dark:text-gray-200',
            icon: 'text-gray-500 dark:text-gray-400',
            progress: 'bg-gray-500'
          };
      }
    };

    const getTypeIcon = (type: NotificationItem['type']) => {
      switch (type) {
        case 'success':
          return <CheckCircle className="w-5 h-5" />;
        case 'error':
          return <XCircle className="w-5 h-5" />;
        case 'warning':
          return <AlertCircle className="w-5 h-5" />;
        case 'info':
          return <Info className="w-5 h-5" />;
        case 'premium':
          return <Star className="w-5 h-5" />;
        default:
          return <Bell className="w-5 h-5" />;
      }
    };

    const getPriorityStyles = (priority: NotificationItem['priority']) => {
      switch (priority) {
        case 'urgent':
          return 'ring-2 ring-red-500 animate-pulse';
        case 'high':
          return 'ring-2 ring-orange-500';
        case 'normal':
          return '';
        case 'low':
          return 'opacity-75';
        default:
          return '';
      }
    };

    const formatTimestamp = (timestamp: Date): string => {
      const now = new Date();
      const diff = now.getTime() - timestamp.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Agora';
      if (minutes < 60) return `${minutes}m atrás`;
      if (hours < 24) return `${hours}h atrás`;
      if (days < 7) return `${days}d atrás`;
      return timestamp.toLocaleDateString();
    };

    // 🎮 EVENT HANDLERS
    const addNotification = (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => {
      const newNotification: NotificationItem = {
        ...notification,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        read: false
      };

      setNotifications(prev => {
        const updated = [newNotification, ...prev];
        return updated.slice(0, maxNotifications);
      });

      // Auto-close if enabled
      if (autoClose && !notification.persistent && notification.duration !== 0) {
        const delay = notification.duration || autoCloseDelay;
        setTimeout(() => {
          removeNotification(newNotification.id);
        }, delay);
      }
    };

    const removeNotification = (id: string) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
      onNotificationDismiss?.(id);
    };

    const markAsRead = (id: string) => {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    };

    const handleNotificationClick = (notification: NotificationItem) => {
      if (!notification.read) {
        markAsRead(notification.id);
      }
      onNotificationClick?.(notification);
    };

    const handleActionClick = (notificationId: string, actionIndex: number) => {
      const notification = notifications.find(n => n.id === notificationId);
      if (notification?.actions?.[actionIndex]) {
        notification.actions[actionIndex].onClick();
        onNotificationAction?.(notificationId, actionIndex);
      }
    };

    const togglePause = () => {
      setIsPaused(!isPaused);
    };

    const clearAll = () => {
      setNotifications([]);
    };

    const getFilteredNotifications = () => {
      let filtered = notifications;
      
      if (filter === 'unread') {
        filtered = filtered.filter(n => !n.read);
      } else if (filter === 'read') {
        filtered = filtered.filter(n => n.read);
      }

      if (!showAll) {
        filtered = filtered.slice(0, maxNotifications);
      }

      return filtered;
    };

    // 🎬 EFFECTS
    React.useEffect(() => {
      if (!isPaused && showProgress) {
        const interval = setInterval(() => {
          setNotifications(prev => 
            prev.map(notification => {
              if (notification.persistent || notification.duration === 0) return notification;
              
              const elapsed = Date.now() - notification.timestamp.getTime();
              const duration = notification.duration || autoCloseDelay;
              const progress = Math.max(0, 100 - (elapsed / duration) * 100);
              
              if (progress <= 0) {
                removeNotification(notification.id);
                return notification;
              }
              
              return { ...notification, progress };
            })
          );
        }, 100);

        return () => clearInterval(interval);
      }
    }, [isPaused, showProgress, autoCloseDelay]);

    // 🎨 STYLES
    const getVariantStyles = () => {
      switch (variant) {
        case 'minimal':
          return 'bg-transparent border-0 shadow-none';
        case 'glass':
          return 'bg-white/10 dark:bg-gray-800/10 backdrop-blur-md border border-white/20 dark:border-gray-700/50';
        case 'premium':
          return 'bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl';
        default:
          return 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg';
      }
    };

    // 🎭 ANIMATIONS
    const notificationVariants = {
      hidden: { 
        opacity: 0, 
        x: position.includes('right') ? 100 : position.includes('left') ? -100 : 0,
        y: position.includes('top') ? -50 : 50,
        scale: 0.8
      },
      visible: { 
        opacity: 1, 
        x: 0, 
        y: 0, 
        scale: 1,
        transition: { 
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1] as any
        }
      },
      exit: { 
        opacity: 0, 
        x: position.includes('right') ? 100 : position.includes('left') ? -100 : 0,
        y: position.includes('top') ? -50 : 50,
        scale: 0.8,
        transition: { duration: 0.2 }
      }
    };

    const progressVariants = {
      initial: { width: '100%' },
      animate: (progress: number) => ({
        width: `${progress}%`,
        transition: { duration: 0.1 }
      })
    };

    // 🎨 RENDER NOTIFICATION
    const renderNotification = (notification: NotificationItem, index: number) => {
      const typeStyles = getTypeStyles(notification.type);
      const priorityStyles = getPriorityStyles(notification.priority);
      const isRead = notification.read;

      return (
        <motion.div
          key={notification.id}
          custom={index}
          variants={notificationVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          layout
          className={cn(
            'relative w-80 p-4 rounded-xl border transition-all duration-200 cursor-pointer group',
            getVariantStyles(),
            typeStyles.bg,
            typeStyles.border,
            priorityStyles,
            isRead && 'opacity-75',
            'hover:shadow-xl hover:scale-105'
          )}
          onClick={() => handleNotificationClick(notification)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Progress bar */}
          {showProgress && !notification.persistent && notification.duration !== 0 && (
            <motion.div
              ref={el => {
                if (el) progressRefs.current.set(notification.id, el);
              }}
              className="absolute top-0 left-0 h-1 rounded-t-xl"
              style={{ backgroundColor: typeStyles.progress }}
              variants={progressVariants}
              initial="initial"
              animate="animate"
              custom={(notification as any).progress || 100}
            />
          )}

          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className={cn('flex-shrink-0', typeStyles.icon)}>
                {notification.icon || getTypeIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={cn('text-sm font-semibold truncate', typeStyles.text)}>
                  {notification.title}
                </h4>
                
                {notification.category && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                    {notification.category}
                  </span>
                )}
              </div>
            </div>

            {/* Dismiss button */}
            {showDismiss && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notification.id);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </div>

          {/* Message */}
          {notification.message && (
            <p className={cn('text-sm mb-3', typeStyles.text)}>
              {notification.message}
            </p>
          )}

          {/* Actions */}
          {showActions && notification.actions && notification.actions.length > 0 && (
            <div className="flex items-center space-x-2 mb-3">
              {notification.actions.map((action, actionIndex) => (
                <motion.button
                  key={actionIndex}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActionClick(notification.id, actionIndex);
                  }}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                    action.variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
                    action.variant === 'secondary' && 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600',
                    action.variant === 'outline' && 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                    action.variant === 'ghost' && 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700',
                    !action.variant && 'bg-blue-600 text-white hover:bg-blue-700'
                  )}
                >
                  {action.icon && <span className="mr-1">{action.icon}</span>}
                  {action.label}
                </motion.button>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            {showTimestamp && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTimestamp(notification.timestamp)}
              </span>
            )}
            
            {!notification.read && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 bg-blue-500 rounded-full"
              />
            )}
          </div>

          {/* Shimmer effect for premium */}
          {notification.type === 'premium' && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-xl"
              animate={{ x: ['-100%', '100%'] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "linear"
              }}
            />
          )}
        </motion.div>
      );
    };

    // 🚀 RENDER PRINCIPAL
    return (
      <div ref={ref} className={cn('fixed z-50', getPositionClasses(), className)} {...props}>
        {/* Header controls */}
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3"
          >
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {notifications.length} notificação{notifications.length !== 1 ? 'es' : ''}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={togglePause}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                title={isPaused ? 'Retomar notificações' : 'Pausar notificações'}
              >
                {isPaused ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowAll(!showAll)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                title={showAll ? 'Mostrar menos' : 'Mostrar todas'}
              >
                {showAll ? <TrendingUp className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={clearAll}
                className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="Limpar todas"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Notifications list */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {getFilteredNotifications().map((notification, index) => 
              renderNotification(notification, index)
            )}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {notifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-80 p-8 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg"
          >
            <Bell className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhuma notificação
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Você está em dia com tudo!
            </p>
          </motion.div>
        )}
      </div>
    );
  }
);

ModernNotifications.displayName = 'ModernNotifications';

