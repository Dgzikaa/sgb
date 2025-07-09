import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  maxHeight?: string
  scrollable?: boolean
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onOpenChange])

  if (!open || !mounted) return null

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop que cobre TUDO */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300 cursor-pointer"
        onClick={() => onOpenChange(false)}
        data-modal-backdrop="true"
        aria-hidden="true"
      />
      {/* Modal Container independente */}
      <div 
        className="relative w-full h-full flex items-center justify-center p-6"
        data-modal-container="true"
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === DialogContent) {
            return React.cloneElement(child, { onClose: () => onOpenChange(false) } as any)
          }
          return child
        })}
      </div>
    </div>
  )

  // Renderizar o modal diretamente no body usando portal
  return createPortal(modalContent, document.body)
}

const DialogContent: React.FC<DialogContentProps & { onClose?: () => void }> = ({ 
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
        "bg-white rounded-2xl shadow-2xl border border-gray-200",
        "w-full max-w-6xl max-h-[90vh]",
        "flex flex-col",
        "animate-in fade-in-0 zoom-in-95 duration-300",
        "relative overflow-hidden",
        className
      )}
      onClick={(e) => e.stopPropagation()}
      data-modal-content="true"
      role="document"
      aria-labelledby="modal-title"
      {...props}
    >
      {/* Close button igual ao de receitas */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200"
        title="Fechar"
        aria-label="Fechar modal"
        type="button"
      >
        <X className="w-4 h-4 text-gray-600" />
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
              )
            }
            // Footer fica fixo na base  
            if (child.type === DialogFooter) {
              return (
                <div key={index} className="flex-shrink-0 mt-auto">
                  {child}
                </div>
              )
            }
            // Content área com scroll
            return (
              <div key={index} className="flex-1 overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                {child}
              </div>
            )
          }
          return child
        })}
      </div>
    </div>
  )
}

const DialogHeader: React.FC<DialogHeaderProps> = ({ 
  className, 
  children, 
  ...props 
}) => {
  return (
    <div
      className={cn(
        "flex flex-col space-y-2 px-6 py-4",
        "border-b border-gray-100",
        "bg-white",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

const DialogTitle: React.FC<DialogTitleProps> = ({ 
  className, 
  children, 
  ...props 
}) => {
  return (
    <h2
      id="modal-title"
      className={cn(
        "text-xl font-semibold text-gray-900",
        "flex items-center gap-3",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  )
}

const DialogDescription: React.FC<DialogDescriptionProps> = ({ 
  className, 
  children, 
  ...props 
}) => {
  return (
    <p
      className={cn(
        "text-sm text-gray-600",
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
}

const DialogFooter: React.FC<DialogFooterProps> = ({ 
  className, 
  children, 
  ...props 
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 px-6 py-4",
        "border-t border-gray-100",
        "bg-gray-50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} 