'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Phone, Users, TrendingUp } from 'lucide-react'

interface Cliente {
  cli_nome: string
  cli_fone: string
  total_visitas: number
  valor_total: number
  ultima_visita: string
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analitico/clientes')
      if (!response.ok) {
        throw new Error('Erro ao carregar dados dos clientes')
      }
      const data = await response.json()
      setClientes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="card-dark p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="card-dark p-6">
            <div className="text-center">
              <h1 className="card-title-dark mb-4">Erro ao carregar clientes</h1>
              <p className="card-description-dark">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="card-dark p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="card-title-dark">Clientes Mais Recorrentes</h1>
              <p className="card-description-dark">
                Top 100 clientes com maior número de visitas desde a abertura
              </p>
            </div>
          </div>

          {/* Estatísticas Resumidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total de Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {clientes.length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Mais Visitas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {clientes[0]?.total_visitas || 0}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {clientes[0]?.cli_nome || 'N/A'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total de Visitas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {clientes.reduce((sum, cliente) => sum + cliente.total_visitas, 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Clientes */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-800">
                <TableRow className="border-b border-gray-200 dark:border-gray-700">
                  <TableHead className="text-gray-900 dark:text-white font-semibold">
                    Posição
                  </TableHead>
                  <TableHead className="text-gray-900 dark:text-white font-semibold">
                    Nome
                  </TableHead>
                  <TableHead className="text-gray-900 dark:text-white font-semibold">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Celular
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-900 dark:text-white font-semibold text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <TrendingUp className="h-4 w-4" />
                      Visitas
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-900 dark:text-white font-semibold text-right">
                    Valor Total
                  </TableHead>
                  <TableHead className="text-gray-900 dark:text-white font-semibold text-center">
                    Última Visita
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((cliente, index) => (
                  <TableRow 
                    key={`${cliente.cli_nome}-${cliente.cli_fone}`}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      <Badge 
                        variant={index < 3 ? "default" : "secondary"}
                        className={`
                          ${index === 0 ? 'bg-yellow-500 text-white' : ''}
                          ${index === 1 ? 'bg-gray-400 text-white' : ''}
                          ${index === 2 ? 'bg-amber-600 text-white' : ''}
                        `}
                      >
                        #{index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-900 dark:text-white font-medium">
                      {cliente.cli_nome}
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-300">
                      {cliente.cli_fone}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                        {cliente.total_visitas}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-gray-900 dark:text-white font-medium">
                      {formatCurrency(cliente.valor_total)}
                    </TableCell>
                    <TableCell className="text-center text-gray-600 dark:text-gray-400">
                      {formatDate(cliente.ultima_visita)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {clientes.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhum cliente encontrado
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                Não há dados de clientes disponíveis no momento.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
