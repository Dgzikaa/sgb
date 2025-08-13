import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxHeight?: string;
  scrollable?: boolean;
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

interface DialogDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
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
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  if (!open || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop que cobre TUDO */}
      <div
        className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-md transition-all duration-300 cursor-pointer"
        onClick={() => onOpenChange(false)}
        data-modal-backdrop="true"
        aria-hidden="true"
      />
      {/* Modal Container independente */}
      <div
        className="relative w-full h-full flex items-center justify-center p-6"
        data-modal-container="true"
      >
        {React.Children.map(children, child => {
          if (React.isValidElement(child) && child.type === DialogContent) {
            return React.cloneElement(child, {
              onClose: () => onOpenChange(false),
            } as any);
          }
          return child;
        })}
      </div>
    </div>
  );

  // Renderizar o modal diretamente no body usando portal
  return createPortal(modalContent, document.body);
};

const DialogContent: React.FC<
  DialogContentProps & { onClose?: () => void }
> = ({
  className,
  children,
  maxHeight,
  scrollable = true,
  onClose,
  ...props
}) => {
  return (
    <div
      className={cn(
        'modal-dark',
        'w-full max-w-6xl max-h-[90vh]',
        'flex flex-col',
        'animate-in fade-in-0 zoom-in-95 duration-300',
        'relative overflow-hidden',
        'backdrop-blur-xl',
        className
      )}
      onClick={e => e.stopPropagation()}
      data-modal-content="true"
      role="document"
      aria-labelledby="modal-title"
      {...props}
    >
      {/* Close button profissional */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-all duration-200 z-10 shadow-sm"
        title="Fechar"
        aria-label="Fechar modal"
        type="button"
      >
        <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      </button>

      {/* Content com scroll adequado */}
      <div className="w-full h-full flex flex-col max-h-[90vh]">
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child)) {
            // Header fica fixo no topo
            if (child.type === DialogHeader) {
              return (
                <div key={index} className="flex-shrink-0">
                  {child}
                </div>
              );
            }
            // Footer fica fixo na base
            if (child.type === DialogFooter) {
              return (
                <div key={index} className="flex-shrink-0 mt-auto">
                  {child}
                </div>
              );
            }
            // Content área com scroll
            return (
              <div
                key={index}
                className="flex-1 overflow-y-auto px-8 py-6 bg-white dark:bg-gray-800"
                style={{ maxHeight: 'calc(90vh - 200px)' }}
              >
                {child}
              </div>
            );
          }
          return child;
        })}
      </div>
    </div>
  );
};

const DialogHeader: React.FC<DialogHeaderProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col space-y-3 px-8 py-6',
        'border-b border-gray-200 dark:border-gray-700',
        'bg-white dark:bg-gray-800',
        'relative',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const DialogTitle: React.FC<DialogTitleProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <h2
      id="modal-title"
      className={cn(
        'text-2xl font-bold text-gray-900 dark:text-white',
        'flex items-center gap-3',
        'leading-tight',
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
};

const DialogDescription: React.FC<DialogDescriptionProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <p
      className={cn(
        'text-base text-gray-600 dark:text-gray-400',
        'leading-relaxed',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
};

const DialogFooter: React.FC<DialogFooterProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-4 px-8 py-6',
        'border-t border-gray-200 dark:border-gray-700',
        'bg-gray-50 dark:bg-gray-800/50',
        'backdrop-blur-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
