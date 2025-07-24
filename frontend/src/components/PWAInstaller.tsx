'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWAInstallerProps {
  showButton?: boolean
  onInstall?: () => void
  onDismiss?: () => void
  className?: string
  buttonText?: string
  buttonIcon?: string
}

export function PWAInstaller({ 
  showButton = false, 
  onInstall,
  onDismiss,
  className = '',
  buttonText = 'Instalar App',
  buttonIcon = '📱'
}: PWAInstallerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppiOS = (window.navigator as (unknown)).standalone === true
    
    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true)
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setCanInstall(true)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
      setDeferredPrompt(null)
      console.log('✅ PWA: App installed successfully')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('✅ PWA: User accepted installation')
        onInstall?.()
      } else {
        console.log('❌ PWA: User dismissed installation')
        onDismiss?.()
      }
      
      setDeferredPrompt(null)
      setCanInstall(false)
    } catch (error) {
      console.error('❌ PWA: Installation error:', error)
    }
  }

  // Return null if already installed or can't install
  if (isInstalled || !canInstall) {
    return null
  }

  // Only show if explicitly requested
  if (!showButton) {
    return null
  }

  return (
    <button
      onClick={handleInstallClick}
      className={`
        inline-flex items-center space-x-2 px-4 py-2 
        bg-indigo-600 hover:bg-indigo-700 
        text-white text-sm font-medium 
        rounded-lg transition-colors 
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        ${className}
      `}
    >
      <span>{buttonIcon}</span>
      <span>{buttonText}</span>
    </button>
  )
}

// Hook para usar a funcionalidade PWA
export function usePWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppiOS = (window.navigator as (unknown)).standalone === true
    
    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true)
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setCanInstall(true)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
      setDeferredPrompt(null)
      console.log('✅ PWA: App installed successfully')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return false

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('✅ PWA: User accepted installation')
        setDeferredPrompt(null)
        setCanInstall(false)
        return true
      } else {
        console.log('❌ PWA: User dismissed installation')
        return false
      }
    } catch (error) {
      console.error('❌ PWA: Installation error:', error)
      return false
    }
  }

  return {
    canInstall,
    isInstalled,
    install
  }
} 
