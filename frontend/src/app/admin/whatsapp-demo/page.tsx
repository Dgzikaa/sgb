'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import WhatsAppConfig from '@/components/whatsapp/WhatsAppConfig'
import { useWhatsApp } from '@/lib/whatsapp-service'
import { 
  MessageSquare, 
  Send, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Share2,
  Bell,
  Smartphone,
  TestTube,
  Settings,
  Zap
} from 'lucide-react'

// =====================================================
// 📱 PÁGINA DE DEMONSTRAÇÃO WHATSAPP
// =====================================================

export default function WhatsAppDemoPage() {
  
  const {
    sendMessage,
    sendReminder,
    sendAlert,
    sendCompletion,
    shareChecklist,
    testConnection,
    validatePhone,
    formatPhone
  } = useWhatsApp()

  const [testPhone, setTestPhone] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  // Dados de exemplo para demonstração
  const exampleAlert = {
    id: 'alert-demo',
    checklistId: 'checklist-demo',
    titulo: 'Checklist de Abertura - Manhã',
    categoria: 'Operacional',
    nivel: 'alto' as const,
    tempoAtraso: 120, // 2 horas
    horaEsperada: '08:00',
    responsavel: 'João Silva',
    setor: 'Cozinha'
  }

  const exampleExecution = {
    id: 'exec-demo',
    checklist_id: 'checklist-demo',
    titulo: 'Checklist de Abertura - Manhã',
    responsavel: 'João Silva',
    setor: 'Cozinha',
    tempo_execucao: 25,
    total_itens: 10,
    itens_ok: 8,
    itens_problema: 2,
    status: 'completed_with_issues',
    observacoes_gerais: 'Problema na temperatura do freezer, mas foi corrigido.',
    concluido_em: new Date().toISOString()
  }

  const handleTestMessage = async () => {
    if (!testPhone || !testMessage) {
      setLastResult('❌ Preencha o número e a mensagem')
      return
    }

    if (!validatePhone(testPhone)) {
      setLastResult('❌ Número de telefone inválido')
      return
    }

    setTesting(true)
    setLastResult('📤 Enviando mensagem...')

    try {
      const formattedPhone = formatPhone(testPhone)
      const success = await sendMessage(formattedPhone, testMessage)
      
      setLastResult(success 
        ? '✅ Mensagem enviada com sucesso!' 
        : '❌ Falha no envio da mensagem'
      )
    } catch (error) {
      setLastResult(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setTesting(false)
    }
  }

  const handleTestReminder = async () => {
    if (!testPhone) {
      setLastResult('❌ Preencha o número de telefone')
      return
    }

    setTesting(true)
    setLastResult('📤 Enviando lembrete...')

    try {
      const formattedPhone = formatPhone(testPhone)
      const success = await sendReminder(
        formattedPhone,
        'Checklist de Abertura - Manhã',
        '08:00',
        'Cozinha',
        'João Silva',
        'alta'
      )
      
      setLastResult(success 
        ? '✅ Lembrete enviado com sucesso!' 
        : '❌ Falha no envio do lembrete'
      )
    } catch (error) {
      setLastResult(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setTesting(false)
    }
  }

  const handleTestAlert = async () => {
    if (!testPhone) {
      setLastResult('❌ Preencha o número de telefone')
      return
    }

    setTesting(true)
    setLastResult('📤 Enviando alerta...')

    try {
      const formattedPhone = formatPhone(testPhone)
      const success = await sendAlert(formattedPhone, exampleAlert)
      
      setLastResult(success 
        ? '✅ Alerta enviado com sucesso!' 
        : '❌ Falha no envio do alerta'
      )
    } catch (error) {
      setLastResult(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setTesting(false)
    }
  }

  const handleTestCompletion = async () => {
    if (!testPhone) {
      setLastResult('❌ Preencha o número de telefone')
      return
    }

    setTesting(true)
    setLastResult('📤 Enviando confirmação...')

    try {
      const formattedPhone = formatPhone(testPhone)
      const success = await sendCompletion(formattedPhone, exampleExecution)
      
      setLastResult(success 
        ? '✅ Confirmação enviada com sucesso!' 
        : '❌ Falha no envio da confirmação'
      )
    } catch (error) {
      setLastResult(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setTesting(false)
    }
  }

  const handleTestShare = async () => {
    if (!testPhone) {
      setLastResult('❌ Preencha o número de telefone')
      return
    }

    setTesting(true)
    setLastResult('📤 Compartilhando checklist...')

    try {
      const formattedPhone = formatPhone(testPhone)
      const result = await shareChecklist([formattedPhone], exampleExecution)
      
      setLastResult(
        `✅ Compartilhamento concluído! Enviado: ${result.success}, Falhas: ${result.failed}`
      )
    } catch (error) {
      setLastResult(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setTesting(false)
    }
  }

  const handleTestConnection = async () => {
    if (!testPhone) {
      setLastResult('❌ Preencha o número de telefone')
      return
    }

    setTesting(true)
    setLastResult('🧪 Testando conexão...')

    try {
      const formattedPhone = formatPhone(testPhone)
      const success = await testConnection(formattedPhone)
      
      setLastResult(success 
        ? '✅ Conexão OK! Teste enviado com sucesso!' 
        : '❌ Falha na conexão ou configuração'
      )
    } catch (error) {
      setLastResult(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setTesting(false)
    }
  }

  const handleConfigSave = async (config: any) => {
    // Aqui você salvaria a configuração no banco
    console.log('Salvando configuração:', config)
    return true
  }

  const handleConfigTest = async (config: any) => {
    // Aqui você testaria a configuração
    console.log('Testando configuração:', config)
    return true
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Integração WhatsApp
                </h1>
                <p className="text-sm text-gray-600">
                  Configuração e testes da integração WhatsApp
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">
                📱 Multi-Provider
              </Badge>
              <Badge className="bg-blue-100 text-blue-800">
                🔄 Auto-Lembretes
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Introdução */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl">📱</div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Sistema WhatsApp Completo
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Integração WhatsApp com <strong>4 provedores diferentes</strong>, 
                    <strong>lembretes automáticos</strong>, <strong>alertas de atraso</strong> e 
                    <strong>compartilhamento de checklists</strong> via WhatsApp.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-white">
                      🚀 Evolution API
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      📞 Twilio
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      ✅ WhatsApp Business
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      🔧 Baileys
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resultado da Última Ação */}
        {lastResult && (
          <div className="mb-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-900 font-medium">
                    {lastResult}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="config" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config" className="flex items-center gap-2 touch-manipulation">
              <Settings className="w-4 h-4" />
              Configuração
            </TabsTrigger>
            <TabsTrigger value="tests" className="flex items-center gap-2 touch-manipulation">
              <TestTube className="w-4 h-4" />
              Testes
            </TabsTrigger>
          </TabsList>

          {/* Tab: Configuração */}
          <TabsContent value="config">
            <WhatsAppConfig
              onConfigSave={handleConfigSave}
              onTestConnection={handleConfigTest}
            />
          </TabsContent>

          {/* Tab: Testes */}
          <TabsContent value="tests" className="space-y-6">
            {/* Campo de Telefone para Testes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  Número para Testes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Número de Telefone (com DDD)
                    </label>
                    <Input
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="+5511999999999 ou 11999999999"
                      className="touch-manipulation"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      {testPhone && validatePhone(testPhone) 
                        ? `✅ Válido: ${formatPhone(testPhone)}`
                        : testPhone
                        ? '❌ Formato inválido'
                        : 'Formato: +55 11 99999-9999'
                      }
                    </p>
                  </div>

                  <Button
                    onClick={handleTestConnection}
                    disabled={testing || !testPhone || !validatePhone(testPhone)}
                    className="bg-purple-600 hover:bg-purple-700 touch-manipulation"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    {testing ? 'Testando...' : 'Teste de Conexão'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Testes de Tipos de Mensagem */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Teste de Mensagem Simples */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-blue-600" />
                    Mensagem Simples
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Mensagem</label>
                    <Input
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      placeholder="Digite sua mensagem de teste..."
                      className="touch-manipulation"
                    />
                  </div>
                  <Button
                    onClick={handleTestMessage}
                    disabled={testing || !testPhone || !testMessage}
                    className="w-full touch-manipulation"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {testing ? 'Enviando...' : 'Enviar Mensagem'}
                  </Button>
                </CardContent>
              </Card>

              {/* Teste de Lembrete */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-orange-600" />
                    Lembrete de Checklist
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <div>📋 Checklist: Abertura - Manhã</div>
                    <div>⏰ Horário: 08:00</div>
                    <div>📍 Setor: Cozinha</div>
                    <div>👤 Funcionário: João Silva</div>
                  </div>
                  <Button
                    onClick={handleTestReminder}
                    disabled={testing || !testPhone}
                    className="w-full bg-orange-600 hover:bg-orange-700 touch-manipulation"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    {testing ? 'Enviando...' : 'Enviar Lembrete'}
                  </Button>
                </CardContent>
              </Card>

              {/* Teste de Alerta */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Alerta de Atraso
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <div>🚨 Checklist atrasado</div>
                    <div>⏱️ Atraso: 2 horas</div>
                    <div>🎯 Nível: Alto</div>
                    <div>👤 Responsável: João Silva</div>
                  </div>
                  <Button
                    onClick={handleTestAlert}
                    disabled={testing || !testPhone}
                    className="w-full bg-red-600 hover:bg-red-700 touch-manipulation"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {testing ? 'Enviando...' : 'Enviar Alerta'}
                  </Button>
                </CardContent>
              </Card>

              {/* Teste de Confirmação */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Confirmação de Conclusão
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <div>✅ Checklist concluído</div>
                    <div>📊 8/10 itens OK</div>
                    <div>⏱️ Tempo: 25 min</div>
                    <div>⚠️ 2 problemas</div>
                  </div>
                  <Button
                    onClick={handleTestCompletion}
                    disabled={testing || !testPhone}
                    className="w-full bg-green-600 hover:bg-green-700 touch-manipulation"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {testing ? 'Enviando...' : 'Enviar Confirmação'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Teste de Compartilhamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-purple-600" />
                  Compartilhamento de Checklist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium mb-2">Dados do Checklist:</div>
                      <div>📋 Abertura - Manhã</div>
                      <div>👤 João Silva (Cozinha)</div>
                      <div>📅 {new Date().toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div>
                      <div className="font-medium mb-2">Resultados:</div>
                      <div>✅ 8 itens OK</div>
                      <div>❌ 2 problemas</div>
                      <div>⏱️ 25 minutos</div>
                    </div>
                  </div>
                  <Button
                    onClick={handleTestShare}
                    disabled={testing || !testPhone}
                    className="w-full bg-purple-600 hover:bg-purple-700 touch-manipulation"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    {testing ? 'Compartilhando...' : 'Compartilhar Checklist'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Guia de Setup Rápido */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  Setup Rápido Recomendado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">🚀 Evolution API (Recomendado)</h3>
                    <ol className="text-sm text-green-800 space-y-1">
                      <li>1. Acesse: <a href="https://evolution-api.com" target="_blank" className="underline">evolution-api.com</a></li>
                      <li>2. Crie uma conta gratuita</li>
                      <li>3. Crie uma instância</li>
                      <li>4. Copie a URL e API Key</li>
                      <li>5. Configure na aba "Configuração"</li>
                      <li>6. Teste aqui na aba "Testes"</li>
                    </ol>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p><strong>Vantagens:</strong> Gratuito, fácil setup, QR Code automático, webhook incluso</p>
                    <p><strong>Setup:</strong> ~10 minutos</p>
                    <p><strong>Custo:</strong> R$ 0,00</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 