'use client'

import { useState, useEffect } from 'react'
import { useBar } from '@/contexts/BarContext'
import { usePermissions } from '@/hooks/usePermissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Target, Users, Settings, Puzzle, BarChart3 } from 'lucide-react'

export default function ConfiguracoesPage() {
  const { selectedBar } = useBar()
  const { hasPermission, isRole } = usePermissions()
  const [activeTab, setActiveTab] = useState('metas')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  // Estados para Metas
  const [metas, setMetas] = useState({
    faturamentoDiario: 37000,
    clientesDiario: 500,
    ticketMedioTarget: 93,
    reservasDiarias: 133,
  })

  const updateMeta = (field: string, value: number) => {
    setMetas(prev => ({ ...prev, [field]: value }))
  }

  const salvarMetas = async () => {
    if (!selectedBar?.id) return
    setLoading(true)
    try {
      const response = await fetch('/api/admin/metas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bar_id: selectedBar.id, ...metas })
      })
      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Erro ao salvar metas:', error)
    } finally {
      setLoading(false)
    }
  }

  // Verificar quais abas mostrar baseado nas permissões
  const showUsersTab = isRole('admin')
  const showIntegracoesTab = isRole('admin')
  const showMarketingTab = hasPermission('marketing_360')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Configurações</h1>
          <p className="text-gray-600">
            Gerencie todas as configurações do {selectedBar?.nome || 'bar selecionado'}
          </p>
        </div>
        
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 bg-white border border-gray-200 p-1 rounded-lg shadow-sm">
              <TabsTrigger value="metas" className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Metas & KPIs</span>
                <span className="sm:hidden">Metas</span>
              </TabsTrigger>

              {showUsersTab && (
                <TabsTrigger value="usuarios" className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Usuários</span>
                  <span className="sm:hidden">Users</span>
                </TabsTrigger>
              )}

              {showIntegracoesTab && (
                <TabsTrigger value="integracoes" className="flex items-center space-x-2">
                  <Puzzle className="w-4 h-4" />
                  <span className="hidden sm:inline">Integrações</span>
                  <span className="sm:hidden">API</span>
                </TabsTrigger>
              )}

              {showMarketingTab && (
                <TabsTrigger value="marketing" className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Marketing</span>
                  <span className="sm:hidden">Social</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="metas">
              <Card>
                <CardHeader>
                  <CardTitle>Configuração de Metas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-6">
                    <Button 
                      onClick={salvarMetas} 
                      disabled={loading} 
                      className={`${saved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                    >
                      {loading ? 'Salvando...' : saved ? '✓ Salvo' : 'Salvar Metas'}
                    </Button>
                  </div>

                  <div className="space-y-8">
                    {/* Metas Diárias */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                      <h3 className="text-blue-700 border-b border-blue-300 pb-3 mb-6 font-bold text-lg">
                        📅 Metas Diárias
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-3">
                          <Label htmlFor="faturamentoDiario" className="text-gray-700 font-medium">
                            Faturamento Diário (R$)
                          </Label>
                          <Input
                            id="faturamentoDiario"
                            type="number"
                            value={metas.faturamentoDiario}
                            onChange={(e) => updateMeta('faturamentoDiario', Number(e.target.value))}
                            placeholder="37000"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="clientesDiario" className="text-gray-700 font-medium">
                            Clientes por Dia
                          </Label>
                          <Input
                            id="clientesDiario"
                            type="number"
                            value={metas.clientesDiario}
                            onChange={(e) => updateMeta('clientesDiario', Number(e.target.value))}
                            placeholder="500"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="ticketMedioTarget" className="text-gray-700 font-medium">
                            Ticket Médio Alvo (R$)
                          </Label>
                          <Input
                            id="ticketMedioTarget"
                            type="number"
                            value={metas.ticketMedioTarget}
                            onChange={(e) => updateMeta('ticketMedioTarget', Number(e.target.value))}
                            placeholder="93"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="reservasDiarias" className="text-gray-700 font-medium">
                            Reservas Diárias
                          </Label>
                          <Input
                            id="reservasDiarias"
                            type="number"
                            value={metas.reservasDiarias}
                            onChange={(e) => updateMeta('reservasDiarias', Number(e.target.value))}
                            placeholder="133"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {showUsersTab && (
              <TabsContent value="usuarios">
                <Card>
                  <CardHeader>
                    <CardTitle>Gerenciar Usuários & Permissões</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Configure os módulos que cada usuário pode acessar no sistema
                    </p>
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-blue-700 font-medium">
                        Funcionalidade em desenvolvimento...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {showIntegracoesTab && (
              <TabsContent value="integracoes">
                <Card>
                  <CardHeader>
                    <CardTitle>Integrações Externas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Configure suas integrações com sistemas externos como ContaAzul, sistemas de pagamento e outras APIs
                    </p>
                    <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                      <p className="text-orange-700 font-medium">
                        Funcionalidade em desenvolvimento...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {showMarketingTab && (
              <TabsContent value="marketing">
                <Card>
                  <CardHeader>
                    <CardTitle>Marketing & Redes Sociais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Configure suas integrações Facebook/Instagram para coleta automática de métricas de marketing
                    </p>
                    <div className="mt-4 p-4 bg-pink-50 rounded-lg">
                      <p className="text-pink-700 font-medium">
                        Funcionalidade em desenvolvimento...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
} 