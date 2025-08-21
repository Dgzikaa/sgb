'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePWA } from '@/hooks/usePWA';
import {
  Download,
  X,
  Smartphone,
  Zap,
  Wifi,
  Bell,
  Star,
  Sparkles,
} from 'lucide-react';

interface ZykorPWABannerProps {
  className?: string;
  variant?: 'floating' | 'inline' | 'modal';
  autoShow?: boolean;
  showDelay?: number;
}

export function ZykorPWABanner({
  className = '',
  variant = 'floating',
  autoShow = true,
  showDelay = 5000,
}: ZykorPWABannerProps) {
  const {
    isInstallable,
    isInstalled,
    isLoading,
    install,
    enableNotifications,
    notificationPermission,
  } = usePWA();

  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  // Controlar visibilidade do banner
  useEffect(() => {
    if (!autoShow || isInstalled || isDismissed || !isInstallable) {
      return;
    }

    // Verificar se o usuário já dismissou antes
    const dismissed = localStorage.getItem('zykor-pwa-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
      // Mostrar features após 2 segundos
      setTimeout(() => setShowFeatures(true), 2000);
    }, showDelay);

    return () => clearTimeout(timer);
  }, [autoShow, isInstalled, isDismissed, isInstallable, showDelay]);

  const handleInstall = async () => {
    if (!install) return;

    setIsInstalling(true);
    try {
      const result = await install();
      if (result) {
        setIsVisible(false);
        // Opcional: habilitar notificações após instalação
        if (notificationPermission === 'default') {
          setTimeout(() => {
            enableNotifications?.();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Erro ao instalar PWA:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('zykor-pwa-dismissed', 'true');
  };

  if (!isVisible || isInstalled || isLoading) {
    return null;
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'floating':
        return `fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm md:max-w-md ${className}`;
      case 'modal':
        return `fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 ${className}`;
      case 'inline':
      default:
        return `w-full ${className}`;
    }
  };

  return (
    <div className={getVariantStyles()}>
      <Card className="bg-gradient-to-br from-gray-900 via-purple-900/90 to-indigo-900 border-purple-500/30 shadow-2xl shadow-purple-500/25 backdrop-blur-sm">
        <CardContent className="p-0 overflow-hidden">
          {/* Header com gradiente e partículas */}
          <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 p-4">
            {/* Partículas animadas */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-2 left-4 w-1 h-1 bg-white rounded-full animate-pulse opacity-60"></div>
              <div className="absolute top-6 right-8 w-1.5 h-1.5 bg-purple-200 rounded-full animate-bounce opacity-40"></div>
              <div className="absolute bottom-3 left-12 w-1 h-1 bg-indigo-200 rounded-full animate-ping opacity-50"></div>
              <div className="absolute bottom-2 right-4 w-0.5 h-0.5 bg-white rounded-full animate-pulse opacity-70"></div>
            </div>

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Logo Z com efeito glow */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-white to-purple-100 rounded-xl flex items-center justify-center shadow-lg">
                    <div className="text-purple-600 font-black text-xl">Z</div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-xl blur-md opacity-30 -z-10"></div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-lg">Zykor</h3>
                    <Badge className="bg-white/20 text-white text-xs border-0 backdrop-blur-sm">
                      <Sparkles className="w-3 h-3 mr-1" />
                      PWA
                    </Badge>
                  </div>
                  <p className="text-purple-100 text-sm font-medium">
                    Gestão de Bares
                  </p>
                </div>
              </div>

              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10 p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="p-4 space-y-4">
            <div className="text-center">
              <p className="text-purple-100 text-sm leading-relaxed mb-3">
                Instale o app para uma experiência completa com acesso rápido, 
                notificações e funcionamento offline!
              </p>

              {/* Features com animação */}
              {showFeatures && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center animate-fadeInUp">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-1">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs text-purple-200">Rápido</span>
                  </div>
                  <div className="text-center animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-1">
                      <Wifi className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs text-purple-200">Offline</span>
                  </div>
                  <div className="text-center animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center mx-auto mb-1">
                      <Bell className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs text-purple-200">Avisos</span>
                  </div>
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3">
              <Button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {isInstalling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Instalando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Instalar App
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleDismiss}
                variant="ghost"
                className="text-purple-200 hover:text-white hover:bg-white/10 px-4"
              >
                Depois
              </Button>
            </div>

            {/* Indicador de qualidade */}
            <div className="flex items-center justify-center gap-1 pt-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="text-xs text-purple-200 ml-2">App Premium</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default ZykorPWABanner;
