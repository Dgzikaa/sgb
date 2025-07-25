'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { safeNavigator, isClient } from '@/lib/client-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  WifiOff,
  RefreshCw,
  CheckSquare,
  Database,
  Smartphone,
  Signal,
  Home,
  Eye,
} from 'lucide-react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    if (!isClient) return;

    // Detectar mudanças de conectividade
    const handleOnline = () => {
      setIsOnline(true);
      window.location.reload();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar estado inicial
    setIsOnline(safeNavigator.isOnline());

    // Simular última atualização
    setLastUpdate(new Date().toLocaleString('pt-BR'));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);

    // Tentar recarregar a página
    if (safeNavigator.isOnline()) {
      window.location.href = '/';
    } else {
      // Feedback visual de tentativa
      setTimeout(() => {
        setRetryCount(prev => prev - 1);
      }, 2000);
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const offlineFeatures = [
    {
      title: 'Visualizar Dados em Cache',
      description: 'Consulte informações salvas localmente',
      icon: Eye,
      available: true,
    },
    {
      title: 'Checklists Offline',
      description: 'Continue trabalhando com checklists salvos',
      icon: CheckSquare,
      available: true,
    },
    {
      title: 'Cache Local',
      description: 'Dados importantes ficam disponíveis',
      icon: Database,
      available: true,
    },
    {
      title: 'Interface Completa',
      description: 'Navegação e visualizações funcionam',
      icon: Smartphone,
      available: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header principal */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <WifiOff className="w-10 h-10 text-gray-500 dark:text-gray-400" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Você está offline
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Sem conexão com a internet. Algumas funcionalidades ainda estão
              disponíveis.
            </p>
          </div>

          {/* Status da conexão */}
          <div className="flex justify-center">
            <Badge
              className={`px-4 py-2 text-sm font-medium ${
                isOnline
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
              }`}
            >
              <Signal className="w-4 h-4 mr-2" />
              {isOnline ? 'Conectado' : 'Desconectado'}
            </Badge>
          </div>
        </div>

        {/* Ações principais */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleRetry}
                disabled={retryCount > 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${retryCount > 0 ? 'animate-spin' : ''}`}
                />
                {retryCount > 0 ? 'Tentando...' : 'Tentar Novamente'}
              </Button>

              <Button
                onClick={handleGoHome}
                variant="outline"
                className="flex-1 border-gray-300 dark:border-gray-600"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir para Home
              </Button>
            </div>

            {retryCount > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
                Tentativa {retryCount} - Verificando conexão...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Funcionalidades disponíveis offline */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5" />
              Disponível Offline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {offlineFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Informações técnicas */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white text-lg">
              Informações da Sessão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Status da PWA:
              </span>
              <Badge className="badge-success">Ativa</Badge>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Cache Local:
              </span>
              <Badge className="badge-primary">Disponível</Badge>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Última Sincronização:
              </span>
              <span className="text-gray-900 dark:text-white text-xs">
                {lastUpdate}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Modo Offline:
              </span>
              <Badge className="badge-warning">Ativo</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Dicas para usuário */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              💡 Dicas para usar offline:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Dados em cache ficam disponíveis para consulta</li>
              <li>• Checklists podem ser visualizados offline</li>
              <li>• Configurações locais são mantidas</li>
              <li>• Dados serão sincronizados quando voltar online</li>
            </ul>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>SGB - Sistema de Gestão de Bares</p>
          <p>PWA Mode • Service Worker Ativo</p>
        </div>
      </div>
    </div>
  );
}
