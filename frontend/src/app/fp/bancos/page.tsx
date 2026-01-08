'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Search, Building2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface Connector {
  id: number
  name: string
  institutionUrl: string
  imageUrl: string
  primaryColor: string
  type: string
  country: string
  credentials: any[]
  hasMFA: boolean
  products: string[]
  health: {
    status: string
    stage: string
  }
}

export default function BancosPage() {
  const [connectors, setConnectors] = useState<Connector[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchConnectors()
  }, [])

  const fetchConnectors = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/fp/pluggy/connectors')
      const result = await response.json()
      
      if (result.success) {
        setConnectors(result.data)
      } else {
        toast.error('Erro ao carregar bancos')
      }
    } catch (error) {
      toast.error('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const filteredConnectors = connectors.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'OFFLINE':
      case 'UNSTABLE':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'OFFLINE':
      case 'UNSTABLE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/fp" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-lg">Voltar</span>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bancos Disponíveis</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {connectors.length} bancos suportados via Open Finance
            </p>
          </div>
          <div className="w-20" /> {/* Spacer */}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar banco..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Grid de Bancos */}
        {loading ? (
          <div className="card-dark p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">Carregando bancos...</p>
          </div>
        ) : filteredConnectors.length === 0 ? (
          <div className="card-dark p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum banco encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Tente buscar por outro nome
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredConnectors.map((connector) => (
              <Card key={connector.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {connector.imageUrl ? (
                        <img
                          src={connector.imageUrl}
                          alt={connector.name}
                          className="w-12 h-12 rounded-lg object-contain"
                          style={{ backgroundColor: connector.primaryColor || '#E5E7EB' }}
                        />
                      ) : (
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: connector.primaryColor || '#3B82F6' }}
                        >
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base text-gray-900 dark:text-white">
                          {connector.name}
                        </CardTitle>
                        <CardDescription className="text-xs flex items-center gap-1 mt-1">
                          {getStatusIcon(connector.health?.status)}
                          {connector.health?.status || 'UNKNOWN'}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Status */}
                    <div>
                      <Badge className={getStatusColor(connector.health?.status)}>
                        {connector.health?.status === 'ONLINE' ? 'Disponível' : connector.health?.status || 'Status desconhecido'}
                      </Badge>
                    </div>

                    {/* Produtos */}
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Produtos:</p>
                      <div className="flex flex-wrap gap-1">
                        {connector.products.map((product) => (
                          <Badge key={product} variant="outline" className="text-xs">
                            {product.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* MFA */}
                    {connector.hasMFA && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        🔐 Requer autenticação em dois fatores
                      </div>
                    )}

                    {/* Ações */}
                    <div className="pt-2">
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          window.location.href = `/fp/pluggy?connector=${connector.id}`
                        }}
                        disabled={connector.health?.status !== 'ONLINE'}
                      >
                        <Building2 className="w-3 h-3 mr-1" />
                        Conectar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 card-dark p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            ℹ️ Sobre os Bancos
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <li>• <strong>Online:</strong> Banco disponível para conexão</li>
            <li>• <strong>Offline/Unstable:</strong> Banco temporariamente indisponível</li>
            <li>• <strong>MFA:</strong> Banco requer autenticação em dois fatores (código SMS, token, etc)</li>
            <li>• <strong>Produtos:</strong> Dados que podem ser sincronizados (contas, transações, investimentos, etc)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
