'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function PWAManager() {
  const pathname = usePathname()

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
      } else {
        // Para fidelidade, usar apenas web + wallet nativa
        // Sem PWA para clientes
        clearFidelidadePWA()
      }
    }
  }, [pathname])

  const clearFidelidadePWA = async () => {
    try {
      // Limpar qualquer service worker de fidelidade anterior
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        if (registration.scope.includes('fidelidade') || registration.scope.includes('ordinario')) {
          await registration.unregister()
        }
      }

      // Remover manifest de fidelidade se existir
      const existingManifests = document.querySelectorAll('link[rel="manifest"]')
      existingManifests.forEach(manifest => {
        if (manifest.getAttribute('href')?.includes('fidelidade')) {
          manifest.remove()
        }
      })

      console.log('PWA Fidelidade removido - usando apenas web + wallet nativa')
    } catch (error) {
      console.error('Erro ao limpar PWA Fidelidade:', error)
    }
  }

  const registerGestaoPWA = async () => {
    try {
      // Limpar service workers antigos
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        if (registration.scope.includes('fidelidade') || registration.scope.includes('ordinario')) {
          await registration.unregister()
        }
      }

      // Registrar service worker de gestão
      const registration = await navigator.serviceWorker.register('/sw-sgb.js', {
        scope: '/'
      })

      // Atualizar manifest
      updateManifest('/manifest-sgb.json')

      console.log('PWA SGB registrado:', registration)
    } catch (error) {
      console.error('Erro ao registrar PWA SGB:', error)
    }
  }

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
    const isFidelidadeArea = pathname.startsWith('/fidelidade') || pathname.startsWith('/cartao')
    
    if (isFidelidadeArea) {
      // Instruções específicas para clientes
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isAndroid = /Android/.test(navigator.userAgent)
      
      if (isIOS) {
        alert(`📱 Para instalar o Ordinário Card:\n\n1. Toque no botão compartilhar (⬆️)\n2. Selecione "Adicionar à Tela de Início"\n3. Toque em "Adicionar"\n\nSeu cartão ficará como um app!`)
      } else if (isAndroid) {
        alert(`📱 Para instalar o Ordinário Card:\n\n1. Toque no menu do Chrome (⋮)\n2. Selecione "Adicionar à tela inicial"\n3. Confirme "Adicionar"\n\nSeu cartão ficará como um app!`)
      } else {
        alert(`💻 Para acesso rápido:\n\nSalve esta página nos favoritos do seu navegador para acessar rapidamente seu cartão de fidelidade.`)
      }
    } else {
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
  }

  return { promptInstall }
}
