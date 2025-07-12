'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import MetaAPIConfig from '@/components/configuracoes/MetaAPIConfig'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { useEffect } from 'react'

export default function MetaConfiguracaoPage() {
  const router = useRouter()
  const { setPageTitle } = usePageTitle()

  useEffect(() => {
    setPageTitle('Configuração Meta API')
    return () => setPageTitle('')
  }, [setPageTitle])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/configuracoes')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Configurações
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuração Meta API</h1>
              <p className="text-gray-600">Configure Facebook e Instagram para coleta de métricas</p>
            </div>
          </div>

          {/* Componente principal */}
          <MetaAPIConfig />
        </div>
      </div>
    </div>
  )
} 