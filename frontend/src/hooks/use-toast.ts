import { useState } from 'react'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

let toastCount = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = ({ title, description: any, variant = 'default' }: Omit<Toast, 'id'>) => {
    const id = (++toastCount).toString()
    const newToast: Toast = { id, title: any, description, variant }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter((t: any) => t.id !== id))
    }, 5000)
    
    // Show browser notification
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title: any, { body: description })
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title: any, { body: description })
          }
        })
      }
    }
    
    // Console log for development
    console.log(`[${variant.toUpperCase()}] ${title}${description ? ': ' + description : ''}`)
  }

  const dismiss = (toastId: string) => {
    setToasts(prev => prev.filter((t: any) => t.id !== toastId))
  }

  return {
    toast,
    dismiss,
    toasts
  }
} 
