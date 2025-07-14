'use client'

import { PWAStatus } from '@/components/PWAStatus'
import { PWAInstallBanner } from '@/components/PWAInstallBanner'
import { usePWA } from '@/hooks/usePWA'

export default function PWAPage() {
  const { isInstalled, isInstallable } = usePWA()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="card-dark p-6 mb-6">
          <h1 className="card-title-dark mb-4">
            Configurações PWA
          </h1>
          <p className="card-description-dark mb-6">
            Progressive Web App - Configurações e controles para instalação, notificações e modo offline.
          </p>

          <div className="space-y-6">
            {/* Banner de instalação se não estiver instalado */}
            {!isInstalled && isInstallable && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Instalação Disponível
                </h2>
                <PWAInstallBanner 
                  variant="inline"
                  autoShow={false}
                />
              </div>
            )}

            {/* Status da PWA */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Status do Sistema
              </h2>
              <PWAStatus showActions={true} />
            </div>

            {/* Informações técnicas */}
            <div className="card-dark">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Funcionalidades PWA
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    📱 App Nativo
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Experiência de app nativo com instalação na tela inicial
                  </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
                    🌐 Modo Offline
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Funciona sem internet com cache inteligente
                  </p>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                    🔔 Push Notifications
                  </h3>
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    Notificações em tempo real mesmo com app fechado
                  </p>
                </div>

                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <h3 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                    ⚡ Performance
                  </h3>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Carregamento instantâneo com Service Worker
                  </p>
                </div>
              </div>
            </div>

            {/* Guia de instalação */}
            <div className="card-dark">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Como Instalar
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    📱 Mobile (Android/iOS)
                  </h3>
                  <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Abra o menu do navegador (⋮)</li>
                    <li>Toque em "Adicionar à tela inicial"</li>
                    <li>Confirme a instalação</li>
                    <li>O app aparecerá na tela inicial</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    💻 Desktop (Chrome/Edge)
                  </h3>
                  <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Clique no ícone de instalação na barra de endereços</li>
                    <li>Ou use o menu → Instalar SGB</li>
                    <li>O app aparecerá como programa instalado</li>
                    <li>Funciona independentemente do navegador</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 