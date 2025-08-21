import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: boolean;
  variant?: 'default' | 'floating' | 'minimal' | 'glass';
  animated?: boolean;
  autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, ModernTextareaProps>(
  ({ 
    className, 
    label, 
    error, 
    success, 
    variant = 'default',
    animated = true,
    autoResize = false,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useImperativeHandle(ref, () => textareaRef.current!);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setHasValue(e.target.value.length > 0);
      
      // Auto resize
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
      
      props.onChange?.(e);
    };

    const getVariantStyles = () => {
      switch (variant) {
        case 'floating':
          return 'border-gray-300 dark:border-gray-600 bg-transparent focus:border-blue-500 dark:focus:border-blue-400';
        case 'minimal':
          return 'border-0 border-b-2 border-gray-200 dark:border-gray-700 bg-transparent rounded-none focus:border-blue-500 dark:focus:border-blue-400';
        case 'glass':
          return 'border-white/20 dark:border-gray-700/50 bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm focus:border-blue-500/50 dark:focus:border-blue-400/50';
        default:
          return 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-400';
      }
    };

    const getStatusColor = () => {
      if (error) return 'border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400';
      if (success) return 'border-green-500 dark:border-green-400 focus:border-green-500 dark:focus:border-green-400';
      return '';
    };

    return (
      <div className="relative w-full">
        {/* Floating Label */}
        {label && variant === 'floating' && (
          <motion.label
            animate={{
              y: isFocused || hasValue ? -20 : 12,
              scale: isFocused || hasValue ? 0.85 : 1,
              color: isFocused ? '#3b82f6' : error ? '#ef4444' : success ? '#10b981' : '#6b7280'
            }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute left-3 top-3 pointer-events-none origin-left text-sm font-medium z-10"
          >
            {label}
          </motion.label>
        )}

        {/* Regular Label */}
        {label && variant !== 'floating' && (
          <motion.label
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {label}
          </motion.label>
        )}

        <div className="relative">
          <motion.textarea
            ref={textareaRef}
            className={cn(
              'flex min-h-[100px] w-full rounded-xl border px-4 py-3 text-sm transition-all duration-200 resize-none',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'text-gray-900 dark:text-gray-100',
              getVariantStyles(),
              getStatusColor(),
              (success || error) && 'pr-10',
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={handleInputChange}
            whileFocus={animated ? { scale: 1.01 } : undefined}
            transition={{ duration: 0.2 }}
            {...props}
          />

          {/* Focus Ring Animation */}
          {animated && isFocused && (
            <motion.div
              layoutId="textareaFocusRing"
              className="absolute inset-0 rounded-xl border-2 border-blue-500 dark:border-blue-400 pointer-events-none"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            />
          )}

          {/* Status Icons */}
          <div className="absolute right-3 top-3">
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  whileHover={{ scale: 1.1 }}
                  className="text-green-500 dark:text-green-400"
                >
                  <Check className="w-4 h-4" />
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  whileHover={{ scale: 1.1 }}
                  className="text-red-500 dark:text-red-400"
                >
                  <AlertCircle className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 flex items-center space-x-1 text-red-500 dark:text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {success && !error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 flex items-center space-x-1 text-green-500 dark:text-green-400 text-sm"
            >
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>Campo válido</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
