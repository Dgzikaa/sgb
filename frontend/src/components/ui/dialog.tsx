import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  variant?: 'default' | 'centered' | 'fullscreen' | 'drawer' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  animated?: boolean;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxHeight?: string;
  scrollable?: boolean;
  resizable?: boolean;
  draggable?: boolean;
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  showMaximize?: boolean;
  onMaximize?: () => void;
  isMaximized?: boolean;
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  justify?: 'start' | 'center' | 'end' | 'between';
}

// Context para compartilhar props entre componentes
const DialogContext = React.createContext<{
  onOpenChange: (open: boolean) => void;
  variant: string;
  size: string;
  animated: boolean;
  showCloseButton: boolean;
} | null>(null);

const useDialogContext = () => {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog');
  }
  return context;
};

const Dialog: React.FC<DialogProps> = ({ 
  open, 
  onOpenChange, 
  children,
  variant = 'default',
  size = 'md',
  animated = true,
  closeOnOverlayClick = true,
  showCloseButton = true
}) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  if (!mounted) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'centered':
        return 'flex items-center justify-center p-4';
      case 'fullscreen':
        return 'flex items-center justify-center p-0';
      case 'drawer':
        return 'flex items-end justify-center p-0';
      case 'glass':
        return 'flex items-center justify-center p-4';
      default:
        return 'flex items-center justify-center p-4';
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.3,
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {createPortal(
            <motion.div
              variants={animated ? overlayVariants : undefined}
              initial={animated ? "hidden" : undefined}
              animate={animated ? "visible" : undefined}
              exit={animated ? "exit" : undefined}
              className={cn(
                "fixed inset-0 z-50 backdrop-blur-sm",
                variant === 'glass' 
                  ? 'bg-black/20' 
                  : 'bg-black/50'
              )}
              onClick={closeOnOverlayClick ? () => onOpenChange(false) : undefined}
            />,
            document.body
          )}
          {createPortal(
            <motion.div
              variants={animated ? containerVariants : undefined}
              initial={animated ? "hidden" : undefined}
              animate={animated ? "visible" : undefined}
              exit={animated ? "exit" : undefined}
              className={cn(
                "fixed inset-0 z-50",
                getVariantStyles()
              )}
            >
              <DialogContext.Provider value={{ 
                onOpenChange, 
                variant, 
                size, 
                animated, 
                showCloseButton 
              }}>
                {children}
              </DialogContext.Provider>
            </motion.div>,
            document.body
          )}
        </>
      )}
    </AnimatePresence>
  );
};

const DialogContent: React.FC<DialogContentProps> = ({
  children,
  className,
  maxHeight,
  scrollable = true,
  resizable = false,
  draggable = false,
  ...props
}) => {
  const { variant, size, animated } = useDialogContext();
  const [isMaximized, setIsMaximized] = React.useState(false);

  const getSizeStyles = () => {
    if (isMaximized || variant === 'fullscreen') {
      return 'w-full h-full max-w-none max-h-none';
    }
    
    switch (size) {
      case 'sm':
        return 'w-full max-w-md max-h-[80vh]';
      case 'md':
        return 'w-full max-w-lg max-h-[85vh]';
      case 'lg':
        return 'w-full max-w-2xl max-h-[90vh]';
      case 'xl':
        return 'w-full max-w-4xl max-h-[95vh]';
      case 'full':
        return 'w-full h-full max-w-none max-h-none';
      default:
        return 'w-full max-w-lg max-h-[85vh]';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'drawer':
        return 'rounded-t-2xl border-t border-l border-r';
      case 'fullscreen':
        return 'rounded-none border-0';
      case 'glass':
        return 'rounded-2xl border border-white/20 dark:border-gray-700/50 bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl';
      default:
        return 'rounded-2xl border border-gray-200 dark:border-gray-700';
    }
  };

  const contentVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95,
      y: variant === 'drawer' ? 100 : 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { 
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      y: variant === 'drawer' ? 100 : 20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      variants={animated ? contentVariants : undefined}
      className={cn(
        'relative bg-white dark:bg-gray-800 shadow-2xl',
        'flex flex-col overflow-hidden',
        getSizeStyles(),
        getVariantStyles(),
        resizable && 'resize',
        draggable && 'cursor-move',
        className
      )}
      style={{ maxHeight }}
      {...props}
    >
      {/* Resize handle */}
      {resizable && !isMaximized && (
        <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize">
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-400" />
        </div>
      )}
      
      <div className={cn(
        'flex-1 flex flex-col',
        scrollable && 'overflow-hidden'
      )}>
        {children}
      </div>
    </motion.div>
  );
};

const DialogHeader: React.FC<DialogHeaderProps> = ({
  children,
  className,
  showMaximize = false,
  onMaximize,
  isMaximized = false,
  ...props
}) => {
  const { onOpenChange, showCloseButton, animated } = useDialogContext();

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: -20 } : undefined}
      animate={animated ? { opacity: 1, y: 0 } : undefined}
      transition={animated ? { delay: 0.1 } : undefined}
      className={cn(
        'flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700',
        'bg-gray-50/50 dark:bg-gray-800/50',
        className
      )}
      {...props}
    >
      <div className="flex-1 min-w-0">
        {children}
      </div>
      
      <div className="flex items-center space-x-2 ml-4">
        {showMaximize && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onMaximize}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {isMaximized ? (
              <Minimize2 className="w-4 h-4 text-gray-500" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-500" />
            )}
          </motion.button>
        )}
        
        {showCloseButton && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

const DialogTitle: React.FC<DialogTitleProps> = ({
  children,
  className,
  ...props
}) => {
  const { animated } = useDialogContext();

  return (
    <motion.h2
      initial={animated ? { opacity: 0, x: -20 } : undefined}
      animate={animated ? { opacity: 1, x: 0 } : undefined}
      transition={animated ? { delay: 0.2 } : undefined}
      className={cn(
        'text-lg font-semibold text-gray-900 dark:text-gray-100 truncate',
        className
      )}
      {...props}
    >
      {children}
    </motion.h2>
  );
};

const DialogDescription: React.FC<DialogDescriptionProps> = ({
  children,
  className,
  ...props
}) => {
  const { animated } = useDialogContext();

  return (
    <motion.p
      initial={animated ? { opacity: 0, x: -20 } : undefined}
      animate={animated ? { opacity: 1, x: 0 } : undefined}
      transition={animated ? { delay: 0.3 } : undefined}
      className={cn(
        'text-sm text-gray-600 dark:text-gray-400 mt-1',
        className
      )}
      {...props}
    >
      {children}
    </motion.p>
  );
};

const DialogBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  const { animated } = useDialogContext();

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 20 } : undefined}
      animate={animated ? { opacity: 1, y: 0 } : undefined}
      transition={animated ? { delay: 0.2 } : undefined}
      className={cn(
        'flex-1 p-6 overflow-y-auto',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

const DialogFooter: React.FC<DialogFooterProps> = ({
  children,
  className,
  justify = 'end',
  ...props
}) => {
  const { animated } = useDialogContext();

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between'
  };

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 20 } : undefined}
      animate={animated ? { opacity: 1, y: 0 } : undefined}
      transition={animated ? { delay: 0.3 } : undefined}
      className={cn(
        'flex items-center gap-3 p-6 border-t border-gray-200 dark:border-gray-700',
        'bg-gray-50/50 dark:bg-gray-800/50',
        justifyClasses[justify],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
};