import * as React from "react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      {/* Modal */}
      <div className="relative z-50">
        {children}
      </div>
    </div>
  )
}

const DialogContent: React.FC<DialogContentProps> = ({ 
  className, 
  children, 
  ...props 
}) => {
  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-2xl border border-gray-200",
        "w-full max-w-lg mx-4 max-h-[85vh] overflow-hidden",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        className
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
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
        "flex flex-col space-y-1.5 p-6 pb-4",
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
      className={cn(
        "text-xl font-bold text-gray-900 leading-none tracking-tight",
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
        "flex items-center justify-end space-x-3 p-6 pt-4 border-t border-gray-100",
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