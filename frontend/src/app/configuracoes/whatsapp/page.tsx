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
  Share2,
  Bell,
  Smartphone,
  TestTube,
  Settings,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

// =====================================================
// 📱 CONFIGURAÇÃO WHATSAPP - VERSÃO INTEGRADA
// =====================================================

export default function WhatsAppConfigPage() {
  
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
    tempoAtraso: 120,
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

  const handleConfigSave = async (config: any) => {
    console.log('Salvando configuração:', config)
    return true
  }

  const handleConfigTest = async (config: any) => {
    console.log('Testando configuração:', config)
    return true
  }

  return (
    <div className="space-y-6">
      {/* Header com Breadcrumb */}
      <div className="flex items-center gap-4">
        <Link 
          href="/configuracoes" 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors touch-manipulation"
        >
          <ArrowLeft className="w-4 h-4" />
          Configurações
        </Link>
        <span className="text-gray-400">/</span>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-green-600" />
          <span className="font-medium text-gray-900">WhatsApp</span>
        </div>
      </div>

      {/* Introdução */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">📱</div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Integração WhatsApp
              </h1>
              <p className="text-gray-700 mb-4">
                Configure lembretes automáticos, alertas de atraso e compartilhamento 
                de checklists via WhatsApp. Suporte para Evolution API, Twilio, WhatsApp Business e Baileys.
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

      {/* Resultado da Última Ação */}
      {lastResult && (
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
          
          {/* Setup Rápido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-900">
                  🚀 Evolution API
                  <Badge className="bg-green-200 text-green-800 text-xs">Gratuito</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-green-800">
                  Setup em 10 minutos • QR Code automático • Webhook incluído
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full border-green-300 text-green-700 hover:bg-green-100 touch-manipulation"
                  onClick={() => window.open('https://evolution-api.com', '_blank')}
                >
                  Criar Conta Gratuita
                </Button>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  📞 Twilio
                  <Badge className="bg-blue-200 text-blue-800 text-xs">Recomendado</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-blue-800">
                  99.9% confiabilidade • $15 grátis • Suporte 24/7 • ~R$ 100/mês
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-100 touch-manipulation"
                  onClick={() => window.open('https://www.twilio.com/try-twilio', '_blank')}
                >
                  Criar Conta ($15 Grátis)
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Campo de Teste */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                Testes de Integração
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    onClick={handleTestConnection}
                    disabled={testing || !testPhone || !validatePhone(testPhone)}
                    className="bg-purple-600 hover:bg-purple-700 touch-manipulation"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    {testing ? 'Testando...' : 'Teste Conexão'}
                  </Button>

                  <Button
                    onClick={handleTestReminder}
                    disabled={testing || !testPhone}
                    className="bg-orange-600 hover:bg-orange-700 touch-manipulation"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    {testing ? 'Enviando...' : 'Teste Lembrete'}
                  </Button>

                  <Button
                    onClick={() => {
                      if (!testPhone) {
                        setLastResult('❌ Preencha o número de telefone')
                        return
                      }
                      setTesting(true)
                      setLastResult('📤 Compartilhando checklist...')
                      
                      setTimeout(async () => {
                        try {
                          const formattedPhone = formatPhone(testPhone)
                          const result = await shareChecklist([formattedPhone], exampleExecution)
                          setLastResult(`✅ Compartilhado! Enviado: ${result.success}, Falhas: ${result.failed}`)
                        } catch (error) {
                          setLastResult(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
                        } finally {
                          setTesting(false)
                        }
                      }, 1000)
                    }}
                    disabled={testing || !testPhone}
                    className="bg-green-600 hover:bg-green-700 touch-manipulation"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    {testing ? 'Enviando...' : 'Teste Checklist'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exemplos de Mensagens */}
          <Card>
            <CardHeader>
              <CardTitle>📱 Exemplos de Mensagens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-900 mb-2">🔔 Lembrete Automático</h4>
                  <div className="text-xs text-orange-800 whitespace-pre-line font-mono">
{`🔔 Lembrete SGB

Olá João! Checklist pendente:

📋 Checklist de Abertura - Manhã
⏰ Horário: 08:00
📍 Setor: Cozinha

Execute no prazo! 💪`}
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-2">📤 Relatório Compartilhado</h4>
                  <div className="text-xs text-green-800 whitespace-pre-line font-mono">
{`📋 Relatório de Checklist

✅ Checklist de Abertura - Manhã
👤 João Silva (Cozinha)
📊 Resultados: 8/10 itens OK
⏱️ Tempo: 25min

💬 Problema no freezer resolvido`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 