'use client'

import { useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'

export function PWAManager() {
  const pathname = usePathname()

  const registerGestaoPWA = useCallback(async () => {
    try {
      // Limpar service workers antigos se necessário
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        // Limpar registros antigos se necessário
        if (registration.scope !== '/') {
          await registration.unregister()
        }
      }

      // Registrar service worker de gestão
      const registration = await navigator.serviceWorker.register('/sw-zykor.js', {
        scope: '/'
      })

      // Atualizar manifest
      updateManifest('/manifest-zykor.json')

      console.log('PWA Zykor registrado:', registration)
    } catch (error) {
      console.error('Erro ao registrar PWA Zykor:', error)
    }
  }, [])

  useEffect(() => {
    // Verificar se service workers são suportados
    if ('serviceWorker' in navigator) {
      // Registrar PWA apenas para área de gestão
      const isGestaoArea = pathname.startsWith('/dashboard') || 
                          pathname.startsWith('/operacoes') || 
                          pathname.startsWith('/configuracoes') ||
                          pathname.startsWith('/relatorios') ||
                          pathname.startsWith('/visao-geral')

      if (isGestaoArea) {
        // Registrar PWA apenas para gestão
        registerGestaoPWA()
      }
    }
  }, [pathname, registerGestaoPWA])


  const updateManifest = (manifestPath: string) => {
    // Remover manifests anteriores
    const existingManifests = document.querySelectorAll('link[rel="manifest"]')
    existingManifests.forEach(manifest => manifest.remove())

    // Adicionar novo manifest
    const manifestLink = document.createElement('link')
    manifestLink.rel = 'manifest'
    manifestLink.href = manifestPath
    document.head.appendChild(manifestLink)
  }

  return null // Componente invisível
}

// Hook para instalação PWA
export function usePWAInstall() {
  const pathname = usePathname()

  const promptInstall = async () => {
    // Instruções para gestores
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)
    
    if (isIOS) {
      alert(`📱 Para instalar o SGB:\n\n1. Toque no botão compartilhar (⬆️)\n2. Selecione "Adicionar à Tela de Início"\n3. Toque em "Adicionar"\n\nO sistema ficará como um app para acesso rápido!`)
    } else if (isAndroid) {
      alert(`📱 Para instalar o SGB:\n\n1. Toque no menu do navegador (⋮)\n2. Selecione "Adicionar à tela inicial"\n3. Confirme "Adicionar"\n\nO sistema ficará como um app!`)
    } else {
      alert(`💻 Para acesso rápido:\n\nSalve esta página nos favoritos para acessar rapidamente o sistema de gestão.`)
    }
  }

  return { promptInstall }
}
