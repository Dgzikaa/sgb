'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, AlertTriangle, Info } from 'lucide-react';

export default function CachePage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Cache Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Sistema de cache não configurado
              </p>
            </div>
          </div>

          {/* Alert de Cache Não Configurado */}
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              O sistema de cache Redis não está configurado. Para ativar o cache
              e melhorar a performance, configure as variáveis de ambiente
              REDIS_URL e instale a dependência ioredis.
            </AlertDescription>
          </Alert>

          {/* Status Atual */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Status
                    </p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      Desabilitado
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Performance
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      Padrão
                    </p>
                  </div>
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <Info className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Configuração
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      Necessária
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                    <Info className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações de Configuração */}
          <Card>
            <CardHeader>
              <CardTitle>Como Configurar o Cache</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    1. Instalar dependência
                  </span>
                  <Badge variant="outline">npm install ioredis</Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    2. Configurar REDIS_URL
                  </span>
                  <Badge variant="outline">Variável de ambiente</Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    3. Reiniciar aplicação
                  </span>
                  <Badge variant="outline">Necessário</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
