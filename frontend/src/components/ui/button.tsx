import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'gradient'
    | 'neon'
    | 'glass'
    | 'premium';
  size?: 'default' | 'sm' | 'lg' | 'xl' | 'icon';
  loading?: boolean;
  success?: boolean;
  animated?: boolean;
  ripple?: boolean;
  glow?: boolean;
  sparkles?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'default',
    loading = false,
    success = false,
    animated = true,
    ripple = true,
    glow = false,
    sparkles = false,
    leftIcon,
    rightIcon,
    children,
    onClick,
    disabled,
    ...props 
  }, ref) => {
    const [isPressed, setIsPressed] = React.useState(false);
    const [rippleArray, setRippleArray] = React.useState<Array<{ x: number; y: number; id: number }>>([]);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    React.useImperativeHandle(ref, () => buttonRef.current!);

    const baseClasses =
      'inline-flex flex-row items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden';

    const variantClasses = {
      default:
        'bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl focus-visible:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600',
      destructive:
        'bg-red-600 text-white shadow-lg hover:bg-red-700 hover:shadow-xl focus-visible:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600',
      outline:
        'border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md focus-visible:ring-gray-500',
      secondary:
        'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 hover:shadow-md focus-visible:ring-gray-500',
      ghost:
        'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 focus-visible:ring-gray-500',
      link: 
        'text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline focus-visible:ring-blue-500',
      gradient:
        'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:from-blue-700 hover:to-purple-700 hover:shadow-xl focus-visible:ring-purple-500',
      neon:
        'bg-gray-900 dark:bg-gray-950 text-cyan-400 border-2 border-cyan-500 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/50 hover:shadow-xl focus-visible:ring-cyan-500',
      glass:
        'bg-white/10 dark:bg-gray-800/10 backdrop-blur-md border border-white/20 dark:border-gray-700/50 text-gray-900 dark:text-gray-100 shadow-xl hover:bg-white/20 dark:hover:bg-gray-700/20 focus-visible:ring-white/50',
      premium:
        'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white shadow-xl hover:shadow-2xl focus-visible:ring-purple-500 bg-size-200 hover:bg-pos-0',
    };

    const sizeClasses = {
      default: 'h-11 px-6 py-2.5',
      sm: 'h-9 px-4 py-2 text-xs',
      lg: 'h-12 px-8 py-3 text-base',
      xl: 'h-14 px-10 py-4 text-lg',
      icon: 'h-11 w-11 p-0',
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;

      // Ripple effect
      if (ripple && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const newRipple = { x, y, id: Date.now() };
        
        setRippleArray(prev => [...prev, newRipple]);
        
        setTimeout(() => {
          setRippleArray(prev => prev.filter(ripple => ripple.id !== newRipple.id));
        }, 600);
      }

      onClick?.(e);
    };

    const buttonVariants = {
      initial: { scale: 1 },
      hover: { 
        scale: animated ? 1.02 : 1,
        y: animated ? -1 : 0,
        transition: { duration: 0.2 }
      },
      tap: { 
        scale: animated ? 0.98 : 1,
        transition: { duration: 0.1 }
      }
    };

    return (
      <motion.button
        ref={buttonRef}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          glow && 'animate-pulse',
          className
        )}
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onClick={handleClick}
        disabled={disabled || loading}
        {...(props as any)}
      >
        {/* Glow effect */}
        {glow && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-xl blur-md"
            animate={{ 
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}

        {/* Sparkles effect */}
        <AnimatePresence>
          {sparkles && !loading && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, rotate: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    scale: [0, 1, 0],
                    rotate: [0, 180, 360],
                    x: Math.random() * 40 - 20,
                    y: Math.random() * 40 - 20
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: i * 0.2,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                  className="absolute top-1/2 left-1/2 pointer-events-none"
                >
                  <Sparkles className="w-3 h-3 text-yellow-400" />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Ripple effects */}
        <AnimatePresence>
          {rippleArray.map((ripple) => (
            <motion.div
              key={ripple.id}
              className="absolute bg-white/30 rounded-full pointer-events-none"
              style={{
                left: ripple.x - 10,
                top: ripple.y - 10,
                width: 20,
                height: 20,
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          ))}
        </AnimatePresence>

        {/* Content */}
        <div className="relative z-10 flex flex-row items-center justify-center gap-2">
          {/* Left Icon */}
          <AnimatePresence>
            {leftIcon && !loading && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {leftIcon}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading Spinner */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="flex items-center"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Icon */}
          <AnimatePresence>
            {success && !loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="text-green-500"
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 0.5 }}
                >
                  ✓
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Button Text */}
          <AnimatePresence>
            {children && (
              <motion.span
                initial={{ opacity: loading ? 0 : 1 }}
                animate={{ opacity: loading ? 0 : 1 }}
                transition={{ duration: 0.2 }}
                className="font-medium"
              >
                {children}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Right Icon */}
          <AnimatePresence>
            {rightIcon && !loading && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                {rightIcon}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Shimmer effect */}
        {variant === 'premium' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "linear"
            }}
          />
        )}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
