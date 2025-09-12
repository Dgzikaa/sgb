'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function EnvironmentDebug() {
  const isClient = typeof window !== 'undefined';
  
  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">🌍 Debug Ambiente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Informações do Ambiente:</h3>
          <div className="space-y-2 text-sm">
            <p><strong>NODE_ENV:</strong> <Badge variant="outline">{process.env.NODE_ENV}</Badge></p>
            <p><strong>Client Side:</strong> {isClient ? '✅ Sim' : '❌ Não'}</p>
            {isClient && (
              <>
                <p><strong>URL:</strong> {window.location.href}</p>
                <p><strong>Hostname:</strong> {window.location.hostname}</p>
                <p><strong>Protocol:</strong> {window.location.protocol}</p>
                <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 100)}...</p>
                <p><strong>Cookies Habilitados:</strong> {navigator.cookieEnabled ? '✅ Sim' : '❌ Não'}</p>
                <p><strong>LocalStorage Disponível:</strong> {typeof Storage !== 'undefined' ? '✅ Sim' : '❌ Não'}</p>
              </>
            )}
          </div>
        </div>

        {isClient && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">LocalStorage Keys:</h3>
            <div className="space-y-1 text-xs">
              {Object.keys(localStorage).length > 0 ? (
                Object.keys(localStorage).map(key => (
                  <div key={key} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="font-medium">{key}</span>
                    <Badge variant="secondary" className="text-xs">
                      {localStorage.getItem(key)?.length || 0} chars
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Nenhuma chave encontrada</p>
              )}
            </div>
          </div>
        )}

        {isClient && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Build Info:</h3>
            <div className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded">
              <p><strong>Build Time:</strong> {new Date().toISOString()}</p>
              <p><strong>React Version:</strong> {typeof React !== 'undefined' ? React.version : 'N/A'}</p>
              <p><strong>Timestamp:</strong> {Date.now()}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
