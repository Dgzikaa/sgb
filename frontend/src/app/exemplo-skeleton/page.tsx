'use client'

import { useState } from 'react'
import { PageLoadingWrapper } from '@/components/skeletons/PageLoadingWrapper'
import { usePageLoading, useApiLoading, useMultipleLoading, SkeletonType } from '@/hooks/usePageLoading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ExemploSkeletonPage() {
  // Exemplo de uso básico
  const { loading, error, skeletonType, startLoading, stopLoading, setError, withLoading } = usePageLoading('dashboard')
  
  // Exemplo de uso com API
  const { loading: apiLoading, fetchWithLoading } = useApiLoading('relatorio')
  
  // Exemplo de múltiplos loadings
  const multiLoading = useMultipleLoading()
  
  // Estado para demonstração
  const [selectedSkeleton, setSelectedSkeleton] = useState<SkeletonType>('dashboard')
  const [data, setData] = useState<any>(null)

  // Simular carregamento
  const simulateLoading = async (type: SkeletonType, duration: number = 2000) => {
    await withLoading(async () => {
      return new Promise(resolve => setTimeout(resolve, duration))
    }, type, `Simulando carregamento ${type}...`)
  }

  // Simular erro
  const simulateError = () => {
    setError('Erro simulado para demonstração')
  }

  // Simular fetch de API
  const simulateApiFetch = async () => {
    try {
      const result = await fetchWithLoading('/api/fake-endpoint')
      setData(result)
    } catch (error) {
      console.error('Erro na simulação de API:', error)
    }
  }

  // Simular múltiplos loadings
  const simulateMultipleLoadings = async () => {
    await Promise.all([
      multiLoading.withLoading('stats', async () => {
        await new Promise(resolve => setTimeout(resolve, 1500))
      }, 'dashboard', 'Carregando estatísticas...'),
      
      multiLoading.withLoading('charts', async () => {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }, 'relatorio', 'Carregando gráficos...'),
      
      multiLoading.withLoading('tables', async () => {
        await new Promise(resolve => setTimeout(resolve, 2500))
      }, 'configuracoes', 'Carregando tabelas...')
    ])
  }

  const skeletonTypes: SkeletonType[] = [
    'dashboard', 'checklist', 'relatorio', 'configuracoes', 
    'operacoes', 'visao-geral', 'marketing-360', 'funcionario', 'fullscreen'
  ]

  return (
    <PageLoadingWrapper
      loading={loading}
      skeletonType={skeletonType}
      error={error}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6 space-y-6">
          
          {/* Header */}
          <div className="card-dark p-6">
            <h1 className="card-title-dark mb-4">🎭 Sistema de Loading Skeletons</h1>
            <p className="card-description-dark">
              Demonstração do sistema unificado de loading skeletons para todas as páginas do SGB V2.
            </p>
          </div>

          {/* Controles de Demonstração */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Skeleton Types */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark">Tipos de Skeleton</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {skeletonTypes.map((type) => (
                    <Button
                      key={type}
                      variant={selectedSkeleton === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSkeleton(type)}
                      className="text-xs"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <Button 
                    onClick={() => simulateLoading(selectedSkeleton)} 
                    className="w-full btn-primary-dark"
                    disabled={loading}
                  >
                    {loading ? 'Carregando...' : `Testar ${selectedSkeleton}`}
                  </Button>
                  
                  <Button 
                    onClick={simulateError} 
                    variant="destructive" 
                    className="w-full"
                    disabled={loading}
                  >
                    Simular Erro
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* API Loading */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark">API Loading</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="card-description-dark">
                  Demonstração de loading automático para chamadas de API.
                </p>
                
                <Button 
                  onClick={simulateApiFetch} 
                  className="w-full btn-secondary-dark"
                  disabled={apiLoading}
                >
                  {apiLoading ? 'Carregando API...' : 'Fetch com Loading'}
                </Button>
                
                {data && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-green-700 dark:text-green-300 text-sm">
                      ✅ Dados carregados com sucesso!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Multiple Loadings */}
          <Card className="card-dark">
            <CardHeader>
              <CardTitle className="card-title-dark">Múltiplos Loadings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="card-description-dark">
                Demonstração de múltiplos estados de loading independentes.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['stats', 'charts', 'tables'].map((key) => (
                  <div key={key} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {key}
                      </span>
                      <Badge variant={multiLoading.isLoading(key) ? "default" : "secondary"}>
                        {multiLoading.isLoading(key) ? 'Loading' : 'Ready'}
                      </Badge>
                    </div>
                    
                    {multiLoading.isLoading(key) ? (
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Pronto para carregamento
                      </p>
                    )}
                    
                    {multiLoading.getError(key) && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                        {multiLoading.getError(key)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              
              <Button 
                onClick={simulateMultipleLoadings} 
                className="w-full btn-primary-dark"
                disabled={multiLoading.hasAnyLoading()}
              >
                {multiLoading.hasAnyLoading() ? 'Carregando múltiplos...' : 'Testar Múltiplos Loadings'}
              </Button>
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="card-dark">
            <CardHeader>
              <CardTitle className="card-title-dark">Status do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {skeletonTypes.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Tipos de Skeleton
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ✓
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Dark Mode
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    ✓
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Responsivo
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    ✓
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Acessível
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Como Usar */}
          <Card className="card-dark">
            <CardHeader>
              <CardTitle className="card-title-dark">Como Usar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">1. Hook básico</h4>
                  <code className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded block">
                    {`const { loading, error, startLoading, stopLoading } = usePageLoading('dashboard')`}
                  </code>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">2. Wrapper de página</h4>
                  <code className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded block">
                    {`<PageLoadingWrapper loading={loading} skeletonType="dashboard" error={error}>`}
                  </code>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">3. API com loading</h4>
                  <code className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded block">
                    {`const { fetchWithLoading } = useApiLoading('relatorio')`}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLoadingWrapper>
  )
} 