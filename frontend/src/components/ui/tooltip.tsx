import * as React from 'react';
import { createPortal } from 'react-dom';

interface TooltipContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
}
const TooltipContext = React.createContext<TooltipContextType | undefined>(undefined);

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

export const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement>(null);
  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </TooltipContext.Provider>
  );
};

export const TooltipTrigger: React.FC<{ asChild?: boolean; children: React.ReactNode }> = ({ asChild = false, children }) => {
  const ctx = React.useContext(TooltipContext);
  if (!ctx) throw new Error('TooltipTrigger must be used within Tooltip');
  const { setOpen, triggerRef } = ctx;
  const triggerProps = {
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
    tabIndex: 0,
    ref: triggerRef as any,
  };
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { ...triggerProps, ...children.props } as any);
  }
  return <span {...triggerProps}>{children}</span>;
};

export const TooltipContent: React.FC<{ children: React.ReactNode; side?: 'top' | 'right' | 'bottom' | 'left' }> = ({ children, side = 'top' }) => {
  const ctx = React.useContext(TooltipContext);
  if (!ctx) throw new Error('TooltipContent must be used within Tooltip');
  const { open, triggerRef } = ctx;
  const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null);

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let top = rect.top;
      let left = rect.left;
      if (side === 'top') {
        top = rect.top - 8;
        left = rect.left + rect.width / 2;
      } else if (side === 'bottom') {
        top = rect.bottom + 8;
        left = rect.left + rect.width / 2;
      } else if (side === 'right') {
        top = rect.top + rect.height / 2;
        left = rect.right + 8;
      } else if (side === 'left') {
        top = rect.top + rect.height / 2;
        left = rect.left - 8;
      }
      setCoords({ top, left });
    } else {
      setCoords(null);
    }
  }, [open, triggerRef, side]);

  if (!open || !coords) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        transform: 'translate(-50%, -100%)',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
      className="px-3 py-2 text-xs bg-gray-900 text-white rounded shadow-lg border-0 max-w-xs animate-fade-in"
    >
      {children}
    </div>,
    document.body
  );
}; 
