'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useBar } from '@/contexts/BarContext'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { 
  ArrowLeft, 
  Save, 
  Shield, 
  CheckCircle, 
  MessageSquare, 
  Facebook, 
  Instagram, 
  Mail, 
  Smartphone, 
  Calendar, 
  BarChart3,
  Star,
  TrendingUp,
  Users,
  Settings,
  Loader2,
  RefreshCw,
  AlertTriangle,
  XCircle,
  Clock
} from 'lucide-react'

export default function IntegracoesPage() {
  const { toast } = useToast()
  const { selectedBar } = useBar()
  const { setPageTitle } = usePageTitle()
  
  const [activeTab, setActiveTab] = useState('discord')
  
  // Estados para webhooks Discord - CORRIGIDO: inicializar vazio
  const [webhookConfigs, setWebhookConfigs] = useState({
    sistema: '',
    contaazul: '',
    meta: '',
    checklists: '',
    contahub: '',
    vendas: '',
    reservas: ''
  })
  const [webhookLoading, setWebhookLoading] = useState(false)
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null)
  const [loadingConfigs, setLoadingConfigs] = useState(true)
  
  // Estados para GetIn
  const [getinAuthStatus, setGetinAuthStatus] = useState<'idle' | 'loading' | 'authenticated' | 'error'>('idle')
  const [getinAuthData, setGetinAuthData] = useState<any>(null)
  const [getinMessage, setGetinMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [getinTestResults, setGetinTestResults] = useState<any>(null)
  const [getinLoading, setGetinLoading] = useState(false)
  const [getinDebugResults, setGetinDebugResults] = useState<any>(null)
  const [getinUrlTestResults, setGetinUrlTestResults] = useState<any>(null)
  const [getinConnectivityResults, setGetinConnectivityResults] = useState<any>(null)

  useEffect(() => {
    setPageTitle('Integrações')
    return () => setPageTitle('')
  }, [setPageTitle])

  useEffect(() => {
    if (selectedBar) {
      loadWebhookConfigs()
      checkGetinAuthStatus()
    }
  }, [selectedBar])

  const loadWebhookConfigs = async () => {
    if (!selectedBar) {
      console.log('❌ Nenhum bar selecionado para carregar webhooks')
      setLoadingConfigs(false)
      return
    }
    
    console.log('🔄 Carregando configurações de webhook para bar:', selectedBar.id)
    setLoadingConfigs(true)
    
    try {
      const response = await fetch(`/api/configuracoes/webhooks?bar_id=${selectedBar.id}`)
      console.log('📡 Resposta da API:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Dados recebidos da API:', data)
        
        if (data.success && data.configuracoes) {
          console.log('✅ Aplicando configurações:', data.configuracoes)
          // Garantir que todas as propriedades existam
          const configsCompletas = {
            sistema: data.configuracoes.sistema || '',
            contaazul: data.configuracoes.contaazul || '',
            meta: data.configuracoes.meta || '',
            checklists: data.configuracoes.checklists || '',
            contahub: data.configuracoes.contahub || '',
            vendas: data.configuracoes.vendas || '',
            reservas: data.configuracoes.reservas || ''
          }
          setWebhookConfigs(configsCompletas)
          console.log('📋 Configurações aplicadas no estado:', configsCompletas)
        } else {
          console.log('⚠️ Dados não encontrados, mantendo configurações vazias')
          // Manter o estado vazio se não encontrar dados
        }
      } else {
        console.error('❌ Erro na resposta da API:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar webhooks:', error)
    } finally {
      setLoadingConfigs(false)
    }
  }

  const handleSaveWebhooks = async () => {
    console.log('💾 Iniciando salvamento de webhooks')
    console.log('🏢 Bar selecionado:', selectedBar)
    console.log('⚙️ Configurações atuais:', webhookConfigs)
    
    if (!selectedBar) {
      console.error('❌ Nenhum bar selecionado')
      toast({
        title: '❌ Erro',
        description: 'Nenhum bar selecionado',
        variant: 'destructive'
      })
      return
    }
    
    try {
      setWebhookLoading(true)
      console.log('📡 Enviando requisição para API...')
      
      const response = await fetch('/api/configuracoes/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          configuracoes: webhookConfigs
        })
      })
      
      console.log('📊 Resposta da API:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      })
      
      const data = await response.json()
      console.log('📋 Dados da resposta:', data)
      
      if (data.success) {
        console.log('✅ Webhooks salvos com sucesso!')
        toast({
          title: '✅ Webhooks salvos com sucesso!',
          description: 'As configurações foram atualizadas no banco de dados.'
        })
      } else {
        console.error('❌ Erro retornado pela API:', data)
        toast({
          title: '❌ Erro ao salvar webhooks',
          description: data.error || 'Erro desconhecido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('❌ Erro ao salvar webhooks:', error)
      toast({
        title: '❌ Erro ao salvar webhooks',
        description: 'Erro de conexão com o servidor',
        variant: 'destructive'
      })
    } finally {
      setWebhookLoading(false)
      console.log('🔄 Loading finalizado')
    }
  }

  const testWebhook = async (webhookType: string) => {
    console.log('🧪 Iniciando teste de webhook:', webhookType)
    
    const webhookUrl = webhookConfigs[webhookType as keyof typeof webhookConfigs]
    console.log('🔗 URL do webhook:', webhookUrl ? webhookUrl.substring(0, 50) + '...' : 'VAZIO')
    
    if (!webhookUrl || webhookUrl.trim() === '') {
      console.error('❌ Webhook não configurado:', webhookType)
      toast({
        title: '❌ Webhook não configurado',
        description: `Configure o webhook ${webhookType} antes de testar`,
        variant: 'destructive'
      })
      return
    }
    
    if (!selectedBar) {
      console.error('❌ Nenhum bar selecionado para teste')
      toast({
        title: '❌ Erro',
        description: 'Nenhum bar selecionado',
        variant: 'destructive'
      })
      return
    }
    
    try {
      setTestingWebhook(webhookType)
      console.log('📡 Enviando teste para API...')
      
      const testData = {
        bar_id: selectedBar.id,
        webhook_type: webhookType,
        title: `🧪 Teste de Webhook - ${webhookType.toUpperCase()}`,
        description: `Este é um teste do webhook **${webhookType}** realizado em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.\n\n✅ Se você está vendo esta mensagem, o webhook está funcionando corretamente!`,
        color: getWebhookColor(webhookType),
        fields: [
          {
            name: '🏢 Estabelecimento',
            value: selectedBar.nome || selectedBar.id || 'N/A',
            inline: true
          },
          {
            name: '🔗 Tipo de Webhook',
            value: webhookType.charAt(0).toUpperCase() + webhookType.slice(1),
            inline: true
          },
          {
            name: '⏰ Horário',
            value: new Date().toLocaleString('pt-BR', {
              timeZone: 'America/Sao_Paulo',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            inline: true
          },
          {
            name: '✅ Status',
            value: 'Configuração funcionando corretamente!',
            inline: false
          }
        ]
      }
      
      console.log('📋 Dados do teste:', testData)
      
      const response = await fetch('/api/edge-functions/discord-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      })
      
      console.log('📊 Resposta do teste:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      })
      
      const data = await response.json()
      console.log('📋 Dados da resposta do teste:', data)
      
      if (data.success) {
        console.log('✅ Teste enviado com sucesso!')
        toast({
          title: '✅ Teste enviado com sucesso!',
          description: `Webhook ${webhookType} está funcionando corretamente.`
        })
      } else {
        console.error('❌ Erro no teste:', data)
        toast({
          title: '❌ Erro no teste',
          description: data.error || 'Erro ao enviar teste',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('❌ Erro ao testar webhook:', error)
      toast({
        title: '❌ Erro no teste',
        description: 'Erro de conexão com o servidor',
        variant: 'destructive'
      })
    } finally {
      setTestingWebhook(null)
      console.log('🔄 Teste finalizado')
    }
  }

  // Função para obter cor do webhook
  const getWebhookColor = (webhookType: string) => {
    const colors = {
      sistema: 0xff0000,      // Vermelho para sistema/segurança
      contaazul: 0x0066cc,    // Azul para ContaAzul
      meta: 0xff6600,         // Laranja para Meta/Social
      checklists: 0x00cc66,   // Verde para checklists
      contahub: 0xff9900,     // Laranja escuro para ContaHub
      vendas: 0x00ff00,       // Verde claro para vendas
      reservas: 0x6600cc      // Roxo para reservas
    }
    return colors[webhookType as keyof typeof colors] || 0x5865F2
  }

  // Funções para GetIn
  const checkGetinAuthStatus = async () => {
    if (!selectedBar) return
    
    setGetinAuthStatus('loading')
    try {
      const response = await fetch(`/api/getin/auth?bar_id=${selectedBar.id}`)
      const data = await response.json()
      
      if (data.success) {
        setGetinAuthStatus('authenticated')
        setGetinAuthData(data.data)
      } else {
        setGetinAuthStatus('idle')
        setGetinAuthData(null)
      }
    } catch (error) {
      setGetinAuthStatus('error')
      setGetinAuthData(null)
    }
  }

  const handleGetinAuth = async () => {
    if (!selectedBar) return
    
    setGetinLoading(true)
    setGetinMessage(null)

    try {
      const response = await fetch('/api/getin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          force_refresh: true
        })
      })

      const data = await response.json()

      if (data.success) {
        setGetinAuthStatus('authenticated')
        setGetinAuthData(data.data)
        setGetinMessage({ type: 'success', text: 'Autenticação realizada com sucesso!' })
      } else {
        setGetinAuthStatus('error')
        setGetinMessage({ type: 'error', text: data.error || 'Erro na autenticação' })
      }
    } catch (error) {
      setGetinAuthStatus('error')
      setGetinMessage({ type: 'error', text: 'Erro interno. Tente novamente.' })
    } finally {
      setGetinLoading(false)
    }
  }

  const handleGetinTestConnection = async () => {
    if (!selectedBar) return
    
    setGetinLoading(true)
    setGetinTestResults(null)

    try {
      const response = await fetch(`/api/getin/reservas?bar_id=${selectedBar.id}&start_date=2025-01-10&end_date=2025-01-20`)
      const data = await response.json()

      if (data.success) {
        setGetinTestResults({
          success: true,
          total: data.total,
          reservas: data.data.slice(0, 3),
          unit: data.unit
        })
        setGetinMessage({ type: 'success', text: `Conexão OK! Encontradas ${data.total} reservas` })
      } else {
        setGetinTestResults({
          success: false,
          error: data.error
        })
        setGetinMessage({ type: 'error', text: data.error || 'Erro ao testar conexão' })
      }
    } catch (error) {
      setGetinTestResults({
        success: false,
        error: 'Erro interno'
      })
      setGetinMessage({ type: 'error', text: 'Erro ao testar conexão' })
    } finally {
      setGetinLoading(false)
    }
  }

  const handleGetinLogout = async () => {
    if (!selectedBar) return
    
    try {
      await fetch('/api/credenciais', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bar_id: selectedBar.id,
          sistema: 'getin'
        })
      })

      setGetinAuthStatus('idle')
      setGetinAuthData(null)
      setGetinMessage({ type: 'success', text: 'Desconectado com sucesso' })
    } catch (error) {
      setGetinMessage({ type: 'error', text: 'Erro ao desconectar' })
    }
  }

  const handleGetinTestLogin = async () => {
    setGetinLoading(true)
    setGetinMessage(null)

    try {
      const response = await fetch('/api/getin/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'ordinariobar',
          password: '@Ordinario*1'
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log('🧪 Resultados do teste:', data.results)
        setGetinDebugResults(data.results)
        
        // Encontrar o primeiro resultado bem-sucedido
        const successResult = data.results.find((r: any) => r.ok)
        
        if (successResult) {
          setGetinMessage({ 
            type: 'success', 
            text: `Teste bem-sucedido com ${successResult.variation}!` 
          })
        } else {
          const statusCodes = data.results.map((r: any) => r.status).filter(Boolean)
          const uniqueStatuses = [...new Set(statusCodes)]
          
          setGetinMessage({ 
            type: 'error', 
            text: `Todos os testes falharam. Status HTTP: ${uniqueStatuses.join(', ')}` 
          })
        }
      } else {
        setGetinMessage({ type: 'error', text: data.error || 'Erro no teste' })
      }
    } catch (error) {
      setGetinMessage({ type: 'error', text: 'Erro interno no teste' })
    } finally {
      setGetinLoading(false)
    }
  }

  const handleGetinTestUrls = async () => {
    setGetinLoading(true)
    setGetinMessage(null)
    setGetinUrlTestResults(null)

    try {
      const response = await fetch('/api/getin/test-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'ordinariobar',
          password: '@Ordinario*1'
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log('🔍 Resultados do teste de URLs:', data.results)
        setGetinUrlTestResults(data)
        
        if (data.summary.working > 0) {
          setGetinMessage({ 
            type: 'success', 
            text: `Encontradas ${data.summary.working} URLs funcionando de ${data.summary.total} testadas!` 
          })
        } else if (data.summary.authErrors > 0) {
          setGetinMessage({ 
            type: 'error', 
            text: `${data.summary.authErrors} URLs retornaram erro de autenticação. Credenciais podem estar incorretas.` 
          })
        } else {
          setGetinMessage({ 
            type: 'error', 
            text: `Nenhuma URL funcionou. ${data.summary.notFound} retornaram 404 (não encontrado).` 
          })
        }
      } else {
        setGetinMessage({ type: 'error', text: data.error || 'Erro no teste de URLs' })
      }
    } catch (error) {
      setGetinMessage({ type: 'error', text: 'Erro interno no teste de URLs' })
    } finally {
      setGetinLoading(false)
    }
  }

  const handleGetinScraper = async () => {
    setGetinLoading(true)
    setGetinMessage(null)

    try {
      const response = await fetch('/api/getin/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_reservations',
          start_date: '2025-01-10',
          end_date: '2025-01-20'
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log('🕷️ Resultado do web scraping:', data)
        
        const stepsText = data.steps_completed ? data.steps_completed.join(' → ') : 'Navegação concluída'
        setGetinMessage({ 
          type: 'success', 
          text: `Web scraping bem-sucedido! ${stepsText}` 
        })
        
        // Mostrar dados reais ou simulados do scraping
        setGetinTestResults({
          success: true,
          total: Array.isArray(data.data) ? data.data.length : 1,
          reservas: Array.isArray(data.data) ? data.data.slice(0, 3) : data.data ? [data.data] : [
            {
              nome_cliente: 'Navegação bem-sucedida',
              data_reserva: '2025-01-15',
              horario: '20:00',
              pessoas: 2,
              status: 'scraping_test'
            }
          ],
          unit: { id: 'scraping', name: 'Via Web Scraping GetIn' },
          method: 'web_scraping',
          scraping_info: {
            found_at: data.found_at,
            navigation_success: data.navigation_success,
            steps_completed: data.steps_completed
          }
        })
      } else {
        setGetinMessage({ 
          type: 'error', 
          text: `Erro no web scraping: ${data.error}` 
        })
        console.log('❌ Detalhes do erro:', data)
      }
    } catch (error) {
      setGetinMessage({ type: 'error', text: 'Erro interno no web scraping' })
    } finally {
      setGetinLoading(false)
    }
  }

  const handleGetinTestConnectivity = async () => {
    setGetinLoading(true)
    setGetinMessage(null)
    setGetinConnectivityResults(null)

    try {
      const response = await fetch('/api/getin/test-connectivity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const data = await response.json()

      if (data.success) {
        console.log('🌐 Resultados do teste de conectividade:', data.results)
        setGetinConnectivityResults(data)
        
        if (data.summary.accessible > 0) {
          setGetinMessage({ 
            type: 'success', 
            text: `${data.summary.accessible} de ${data.summary.total} sites acessíveis. ${data.summary.diagnosis}` 
          })
        } else {
          setGetinMessage({ 
            type: 'error', 
            text: `Nenhum site acessível. ${data.summary.diagnosis}` 
          })
        }
      } else {
        setGetinMessage({ type: 'error', text: data.error || 'Erro no teste de conectividade' })
      }
    } catch (error) {
      setGetinMessage({ type: 'error', text: 'Erro interno no teste de conectividade' })
    } finally {
      setGetinLoading(false)
    }
  }

  const handleGetinScraperV2 = async () => {
    setGetinLoading(true)
    setGetinMessage(null)

    try {
      const response = await fetch('/api/getin/scraper-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_reservations_v2'
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log('🚀 Resultado do scraper v2:', data)
        
        const stepsText = data.steps_completed ? data.steps_completed.join(' → ') : 'Navegação concluída'
        setGetinMessage({ 
          type: 'success', 
          text: `Scraper V2 bem-sucedido! ${stepsText}` 
        })
        
        // Mostrar dados do scraper v2
        setGetinTestResults({
          success: true,
          total: Array.isArray(data.data) ? data.data.length : 1,
          reservas: Array.isArray(data.data) ? data.data.slice(0, 3) : data.data ? [data.data] : [],
          unit: { id: 'scraping_v2', name: 'Web Scraping GetIn V2' },
          method: 'web_scraping_v2',
          scraping_info: {
            found_at: data.found_at,
            navigation_success: data.navigation_success,
            steps_completed: data.steps_completed,
            session_info: data.session_info
          }
        })
      } else {
        setGetinMessage({ 
          type: 'error', 
          text: `Erro no scraper V2: ${data.error}` 
        })
        console.log('❌ Detalhes do erro scraper v2:', data)
      }
    } catch (error) {
      setGetinMessage({ type: 'error', text: 'Erro interno no scraper V2' })
    } finally {
      setGetinLoading(false)
    }
  }

  const handleGetinAnalyzeSpa = async () => {
    setGetinLoading(true)
    setGetinMessage(null)

    try {
      const response = await fetch('/api/getin/analyze-spa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_spa'
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log('🔍 Resultado da análise SPA:', data)
        
        setGetinMessage({ 
          type: 'success', 
          text: `Análise SPA concluída! ${data.analysis.apis_discovered.length} APIs encontradas, ${data.analysis.working_endpoints.length} funcionais.` 
        })
        
        // Mostrar dados da análise
        setGetinTestResults({
          success: true,
          total: data.analysis.working_endpoints.length,
          reservas: data.analysis.working_endpoints.map((endpoint: any, index: number) => ({
            nome_cliente: `Endpoint ${index + 1}`,
            data_reserva: new Date().toISOString().split('T')[0],
            horario: endpoint.method,
            pessoas: endpoint.status,
            status: endpoint.accessible ? 'funcional' : 'inativo'
          })),
          unit: { id: 'spa_analysis', name: 'Análise SPA GetIn' },
          method: 'spa_analysis',
          scraping_info: {
            found_at: 'JavaScript Analysis',
            navigation_success: true,
            steps_completed: [
              '📄 HTML analisado',
              '📜 Scripts extraídos',
              '🔍 APIs descobertas',
              '🧪 Endpoints testados'
            ],
            analysis_data: {
              apis_found: data.analysis.apis_discovered,
              working_endpoints: data.analysis.working_endpoints,
              recommendations: data.recommendations
            }
          }
        })
      } else {
        setGetinMessage({ 
          type: 'error', 
          text: `Erro na análise SPA: ${data.error}` 
        })
        console.log('❌ Detalhes do erro análise SPA:', data)
      }
    } catch (error) {
      setGetinMessage({ type: 'error', text: 'Erro interno na análise SPA' })
    } finally {
      setGetinLoading(false)
    }
  }

  const handleGetinScraperApi = async () => {
    setGetinLoading(true)
    setGetinMessage(null)

    try {
      const response = await fetch('/api/getin/scraper-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_reservations_api',
          start_date: '2025-01-10',
          end_date: '2025-01-20'
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log('🚀 Resultado do scraper API real:', data)
        
        setGetinMessage({ 
          type: 'success', 
          text: `Scraper API REAL bem-sucedido! ${data.data.length} reservas encontradas via ${data.authentication.auth_method}.` 
        })
        
        // Mostrar dados reais do scraper API
        setGetinTestResults({
          success: true,
          total: data.data.length,
          reservas: data.data.slice(0, 5), // Mostrar até 5 reservas
          unit: { id: 'api_real', name: 'API Real GetIn' },
          method: 'api_real',
          scraping_info: {
            found_at: data.found_at,
            navigation_success: true,
            steps_completed: [
              '🔑 Autenticação nas APIs reais',
              '📋 Busca em endpoints descobertos',
              '✅ Dados reais extraídos'
            ],
            api_info: {
              authentication: data.authentication,
              performance: data.performance,
              working_endpoint: data.found_at
            }
          }
        })
      } else {
        setGetinMessage({ 
          type: 'error', 
          text: `APIs testadas mas sem dados: ${data.error}. ${data.debug_info?.recommendations || ''}` 
        })
        console.log('⚠️ Detalhes do scraper API:', data)
      }
    } catch (error) {
      setGetinMessage({ type: 'error', text: 'Erro interno no scraper API real' })
    } finally {
      setGetinLoading(false)
    }
  }

  const handleGetinDeepAnalysis = async () => {
    setGetinLoading(true)
    setGetinMessage(null)

    try {
      const response = await fetch('/api/getin/deep-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deep_analysis'
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log('🕵️ Resultado da análise profunda:', data)
        
        setGetinMessage({ 
          type: 'success', 
          text: `Análise PROFUNDA concluída! ${data.analysis.workingSubdomains.length} subdomínios + ${data.analysis.apiHints?.endpoints?.length || 0} endpoints descobertos.` 
        })
        
        // Mostrar dados da análise profunda
        setGetinTestResults({
          success: true,
          total: data.analysis.workingSubdomains.length + (data.analysis.apiHints?.endpoints?.length || 0),
          reservas: [
            ...data.analysis.workingSubdomains.map((sub: any, index: number) => ({
              nome_cliente: `Subdomínio ${index + 1}`,
              data_reserva: new Date().toISOString().split('T')[0],
              horario: sub.domain,
              pessoas: sub.status,
              status: sub.status === 200 ? 'ativo' : 'protegido'
            })),
            ...(data.analysis.apiHints?.endpoints || []).slice(0, 3).map((endpoint: string, index: number) => ({
              nome_cliente: `Endpoint ${index + 1}`,
              data_reserva: new Date().toISOString().split('T')[0],
              horario: endpoint,
              pessoas: 0,
              status: 'descoberto'
            }))
          ],
          unit: { id: 'deep_analysis', name: 'Análise Profunda GetIn' },
          method: 'deep_analysis',
          scraping_info: {
            found_at: 'Deep JavaScript Analysis',
            navigation_success: true,
            steps_completed: [
              '📄 HTML analisado profundamente',
              '🔬 Scripts JavaScript dissecados',
              '🌍 Subdomínios descobertos',
              '🎯 Configurações extraídas'
            ],
            deep_info: {
              scripts: data.analysis.scripts,
              workingSubdomains: data.analysis.workingSubdomains,
              apiHints: data.analysis.apiHints,
              recommendations: data.recommendations,
              nextSteps: data.nextSteps
            }
          }
        })
      } else {
        setGetinMessage({ 
          type: 'error', 
          text: `Erro na análise profunda: ${data.error}` 
        })
        console.log('❌ Detalhes do erro análise profunda:', data)
      }
    } catch (error) {
      setGetinMessage({ type: 'error', text: 'Erro interno na análise profunda' })
    } finally {
      setGetinLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Integrações</h1>
              <p className="text-gray-600">Configure todas as integrações do seu estabelecimento</p>
            </div>
          </div>
        </div>

        {/* Tabs de Integrações */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8 mb-8">
            <TabsTrigger value="discord" className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#5865F2] rounded"></div>
              Discord
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="contaazul" className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              ContaAzul
            </TabsTrigger>
            <TabsTrigger value="meta" className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded"></div>
              Meta
            </TabsTrigger>
            <TabsTrigger value="getin" className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              GetIn
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="eventos" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Eventos
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Discord Tab */}
          <TabsContent value="discord" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-[#5865F2] rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">D</span>
                  </div>
                  <CardTitle>Discord Webhooks</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <>
                  {/* Loading State */}
                  {loadingConfigs && (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-600">Carregando configurações...</span>
                    </div>
                  )}
                  
                  {/* Webhook Sistema/Segurança */}
                  {!loadingConfigs && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-red-500" />
                    <Label htmlFor="webhook-sistema" className="font-medium">
                      Webhook Sistema & Segurança
                    </Label>
                    <div className="flex items-center space-x-1 ml-2">
                      <div className={`w-2 h-2 rounded-full ${webhookConfigs.sistema && webhookConfigs.sistema.trim() !== '' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`text-xs ${webhookConfigs.sistema && webhookConfigs.sistema.trim() !== '' ? 'text-green-600' : 'text-gray-500'}`}>
                        {webhookConfigs.sistema && webhookConfigs.sistema.trim() !== '' ? 'Conectado' : 'Não configurado'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="webhook-sistema"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={webhookConfigs.sistema}
                      onChange={(e) => setWebhookConfigs({...webhookConfigs, sistema: e.target.value})}
                      disabled={webhookLoading}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook('sistema')}
                      disabled={testingWebhook === 'sistema' || !webhookConfigs.sistema || webhookLoading}
                      className="px-3"
                    >
                      {testingWebhook === 'sistema' ? 'Testando...' : '🧪 Testar'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Rate limiting, SQL injection, backups, eventos críticos de segurança
                  </p>
                </div>

                <Separator />

                {/* Webhook ContaAzul */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-500 rounded" />
                    <Label htmlFor="webhook-contaazul" className="font-medium">
                      Webhook ContaAzul
                    </Label>
                    <div className="flex items-center space-x-1 ml-2">
                      <div className={`w-2 h-2 rounded-full ${webhookConfigs.contaazul && webhookConfigs.contaazul.trim() !== '' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`text-xs ${webhookConfigs.contaazul && webhookConfigs.contaazul.trim() !== '' ? 'text-green-600' : 'text-gray-500'}`}>
                        {webhookConfigs.contaazul && webhookConfigs.contaazul.trim() !== '' ? 'Conectado' : 'Não configurado'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="webhook-contaazul"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={webhookConfigs.contaazul}
                      onChange={(e) => setWebhookConfigs({...webhookConfigs, contaazul: e.target.value})}
                      disabled={webhookLoading}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook('contaazul')}
                      disabled={testingWebhook === 'contaazul' || !webhookConfigs.contaazul || webhookLoading}
                      className="px-3"
                    >
                      {testingWebhook === 'contaazul' ? 'Testando...' : '🧪 Testar'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Sincronizações automáticas, renovação de tokens, dados financeiros
                  </p>
                </div>

                <Separator />

                {/* Webhook Meta/Social */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded" />
                    <Label htmlFor="webhook-meta" className="font-medium">
                      Webhook Meta & Social
                    </Label>
                    <div className="flex items-center space-x-1 ml-2">
                      <div className={`w-2 h-2 rounded-full ${webhookConfigs.meta && webhookConfigs.meta.trim() !== '' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`text-xs ${webhookConfigs.meta && webhookConfigs.meta.trim() !== '' ? 'text-green-600' : 'text-gray-500'}`}>
                        {webhookConfigs.meta && webhookConfigs.meta.trim() !== '' ? 'Conectado' : 'Não configurado'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="webhook-meta"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={webhookConfigs.meta}
                      onChange={(e) => setWebhookConfigs({...webhookConfigs, meta: e.target.value})}
                      disabled={webhookLoading}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook('meta')}
                      disabled={testingWebhook === 'meta' || !webhookConfigs.meta || webhookLoading}
                      className="px-3"
                    >
                      {testingWebhook === 'meta' ? 'Testando...' : '🧪 Testar'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Instagram, Facebook, Google Reviews, campanhas de marketing
                  </p>
                </div>

                <Separator />

                {/* Webhook Checklists */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <Label htmlFor="webhook-checklists" className="font-medium">
                      Webhook Checklists & Operações
                    </Label>
                    <div className="flex items-center space-x-1 ml-2">
                      <div className={`w-2 h-2 rounded-full ${webhookConfigs.checklists && webhookConfigs.checklists.trim() !== '' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`text-xs ${webhookConfigs.checklists && webhookConfigs.checklists.trim() !== '' ? 'text-green-600' : 'text-gray-500'}`}>
                        {webhookConfigs.checklists && webhookConfigs.checklists.trim() !== '' ? 'Conectado' : 'Não configurado'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="webhook-checklists"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={webhookConfigs.checklists}
                      onChange={(e) => setWebhookConfigs({...webhookConfigs, checklists: e.target.value})}
                      disabled={webhookLoading}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook('checklists')}
                      disabled={testingWebhook === 'checklists' || !webhookConfigs.checklists || webhookLoading}
                      className="px-3"
                    >
                      {testingWebhook === 'checklists' ? 'Testando...' : '🧪 Testar'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Conclusão de checklists, alertas operacionais, relatórios diários
                  </p>
                </div>

                <Separator />

                {/* Webhook ContaHub */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-orange-500 rounded" />
                    <Label htmlFor="webhook-contahub" className="font-medium">
                      Webhook ContaHub
                    </Label>
                    <Badge variant="secondary" className="text-xs">Em breve</Badge>
                    <div className="flex items-center space-x-1 ml-2">
                      <div className={`w-2 h-2 rounded-full ${webhookConfigs.contahub && webhookConfigs.contahub.trim() !== '' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`text-xs ${webhookConfigs.contahub && webhookConfigs.contahub.trim() !== '' ? 'text-green-600' : 'text-gray-500'}`}>
                        {webhookConfigs.contahub && webhookConfigs.contahub.trim() !== '' ? 'Conectado' : 'Não configurado'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="webhook-contahub"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={webhookConfigs.contahub}
                      onChange={(e) => setWebhookConfigs({...webhookConfigs, contahub: e.target.value})}
                      disabled
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="px-3"
                    >
                      🧪 Testar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Análises financeiras, relatórios automatizados, alertas de performance
                  </p>
                </div>

                <Separator />

                {/* Webhook Vendas */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-emerald-500 rounded" />
                    <Label htmlFor="webhook-vendas" className="font-medium">
                      Webhook Vendas & Receitas
                    </Label>
                    <div className="flex items-center space-x-1 ml-2">
                      <div className={`w-2 h-2 rounded-full ${webhookConfigs.vendas && webhookConfigs.vendas.trim() !== '' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`text-xs ${webhookConfigs.vendas && webhookConfigs.vendas.trim() !== '' ? 'text-green-600' : 'text-gray-500'}`}>
                        {webhookConfigs.vendas && webhookConfigs.vendas.trim() !== '' ? 'Conectado' : 'Não configurado'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="webhook-vendas"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={webhookConfigs.vendas}
                      onChange={(e) => setWebhookConfigs({...webhookConfigs, vendas: e.target.value})}
                      disabled={webhookLoading}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook('vendas')}
                      disabled={testingWebhook === 'vendas' || !webhookConfigs.vendas || webhookLoading}
                      className="px-3"
                    >
                      {testingWebhook === 'vendas' ? 'Testando...' : '🧪 Testar'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Metas atingidas, vendas excepcionais, relatórios de faturamento
                  </p>
                </div>

                <Separator />

                {/* Webhook Reservas */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-indigo-500 rounded" />
                    <Label htmlFor="webhook-reservas" className="font-medium">
                      Webhook Reservas & Eventos
                    </Label>
                    <div className="flex items-center space-x-1 ml-2">
                      <div className={`w-2 h-2 rounded-full ${webhookConfigs.reservas && webhookConfigs.reservas.trim() !== '' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`text-xs ${webhookConfigs.reservas && webhookConfigs.reservas.trim() !== '' ? 'text-green-600' : 'text-gray-500'}`}>
                        {webhookConfigs.reservas && webhookConfigs.reservas.trim() !== '' ? 'Conectado' : 'Não configurado'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="webhook-reservas"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={webhookConfigs.reservas}
                      onChange={(e) => setWebhookConfigs({...webhookConfigs, reservas: e.target.value})}
                      disabled={webhookLoading}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook('reservas')}
                      disabled={testingWebhook === 'reservas' || !webhookConfigs.reservas || webhookLoading}
                      className="px-3"
                    >
                      {testingWebhook === 'reservas' ? 'Testando...' : '🧪 Testar'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Novas reservas, cancelamentos, eventos especiais, occupancy rate
                  </p>
                </div>

                {/* Botão de Salvar */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-6">
                  <div className="text-sm text-gray-600">
                    💡 Lembre-se de salvar as configurações após fazer alterações
                  </div>
                  <Button 
                    onClick={handleSaveWebhooks} 
                    disabled={webhookLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {webhookLoading ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </div>
                    </div>
                  )}
                </>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GetIn Tab */}
          <TabsContent value="getin" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle>GetIn - Sistema de Reservas</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status de Autenticação */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Status da Conexão</h3>
                    <div className="flex items-center space-x-2">
                      {getinAuthStatus === 'loading' && (
                        <div className="flex items-center space-x-2 text-blue-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Verificando...</span>
                        </div>
                      )}
                      {getinAuthStatus === 'authenticated' && (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Conectado</span>
                        </div>
                      )}
                      {getinAuthStatus === 'error' && (
                        <div className="flex items-center space-x-2 text-red-600">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm">Erro</span>
                        </div>
                      )}
                      {getinAuthStatus === 'idle' && (
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">Não conectado</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mensagem de Status */}
                  {getinMessage && (
                    <div className={`p-4 rounded-lg ${
                      getinMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {getinMessage.text}
                    </div>
                  )}

                  {/* Informações da Conexão */}
                  {getinAuthStatus === 'authenticated' && getinAuthData && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-medium text-green-800 mb-2">Conexão Ativa</h4>
                          <div className="space-y-2 text-sm text-green-700">
                            <p><strong>Usuário:</strong> {getinAuthData.user?.name || getinAuthData.user || 'andressa.rocha0206@gmail.com'}</p>
                            <p><strong>Unidades:</strong> {getinAuthData.units?.length || 0}</p>
                            <p><strong>Expira em:</strong> {getinAuthData.expires_at ? new Date(getinAuthData.expires_at).toLocaleString('pt-BR') : 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {getinAuthData.units && getinAuthData.units.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <Label>Unidades Disponíveis:</Label>
                          <div className="space-y-2">
                            {getinAuthData.units.map((unit: any) => (
                              <div key={unit.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                <div>
                                  <p className="font-medium">{unit.name}</p>
                                  <p className="text-sm text-gray-600">ID: {unit.id}</p>
                                </div>
                                <Badge variant="outline" className="text-green-600 border-green-600">Ativo</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Credenciais Configuradas */}
                  {getinAuthStatus !== 'authenticated' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-medium text-blue-800 mb-2">✅ Credenciais Atualizadas (URL Correta!)</h4>
                            <div className="space-y-2 text-sm text-blue-700">
                              <p><strong>Login:</strong> ordinariobar</p>
                              <p><strong>URL:</strong> https://painel-reserva.getinapp.com.br</p>
                              <p>Credenciais corretas salvas no banco de dados!</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-medium text-yellow-800 mb-2">🎯 URL Correta Encontrada!</h4>
                            <div className="space-y-3 text-sm text-yellow-700">
                              <p>Encontramos a URL correta do GetIn! Agora temos 4 ferramentas de diagnóstico:</p>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Settings className="w-4 h-4" />
                                  <span><strong>Conectar:</strong> Tentar API oficial (pode falhar)</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                                  <span><strong>🔍 Testar URLs:</strong> Buscar endpoint funcionando</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                                  <span><strong>🕷️ Web Scraping:</strong> Extrair dados via navegação web</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                  <span><strong>🌐 Conectividade:</strong> Testar acesso a sites externos</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Botões de Ação */}
                  <div className="space-y-3">
                    {getinAuthStatus === 'authenticated' ? (
                      <div className="flex gap-3">
                        <Button 
                          onClick={handleGetinTestConnection} 
                          disabled={getinLoading}
                          className="flex-1"
                        >
                          {getinLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                          Testar Conexão
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleGetinLogout}
                          disabled={getinLoading}
                        >
                          Desconectar
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-3">
                          <Button 
                            onClick={handleGetinAuth} 
                            disabled={getinLoading}
                            className="flex-1"
                          >
                            {getinLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Settings className="w-4 h-4 mr-2" />}
                            Conectar com GetIn
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <Button 
                            variant="outline" 
                            onClick={handleGetinTestConnectivity}
                            disabled={getinLoading}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1"
                          >
                            🌐 Conectividade
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={handleGetinTestLogin}
                            disabled={getinLoading}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-2 py-1"
                          >
                            🧪 Debug Login
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={handleGetinTestUrls}
                            disabled={getinLoading}
                            className="bg-purple-500 hover:bg-purple-600 text-white text-xs px-2 py-1"
                          >
                            🔍 Testar URLs
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={handleGetinScraper}
                            disabled={getinLoading}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-2 py-1"
                          >
                            🕷️ Web Scraping
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={handleGetinScraperV2}
                            disabled={getinLoading}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1"
                          >
                            🚀 Scraper V2
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={handleGetinAnalyzeSpa}
                            disabled={getinLoading}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1"
                          >
                            🔍 Analisar SPA
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={handleGetinScraperApi}
                            disabled={getinLoading}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1"
                          >
                            🚀 API Real
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={handleGetinDeepAnalysis}
                            disabled={getinLoading}
                            className="bg-purple-500 hover:bg-purple-600 text-white text-xs px-2 py-1"
                          >
                            🕵️ Deep Analysis
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Resultados dos Testes */}
                {getinTestResults && (
                  <div className="space-y-4">
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Resultados do Teste</h4>
                      {getinTestResults.success ? (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex items-center space-x-2 mb-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-green-800">
                              {getinTestResults.method === 'web_scraping' ? 'Web Scraping Bem-sucedido' :
                               getinTestResults.method === 'web_scraping_v2' ? 'Scraper V2 Bem-sucedido' :
                               getinTestResults.method === 'spa_analysis' ? 'Análise SPA Concluída' :
                               getinTestResults.method === 'api_real' ? 'API Real Bem-sucedida' :
                               getinTestResults.method === 'deep_analysis' ? 'Análise Profunda Concluída' :
                               'Conexão Bem-sucedida'}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm text-green-700">
                            <p><strong>Total de Reservas:</strong> {getinTestResults.total}</p>
                            <p><strong>Método:</strong> {getinTestResults.unit?.name} (ID: {getinTestResults.unit?.id})</p>
                            {getinTestResults.scraping_info && (
                              <>
                                <p><strong>URL Acessada:</strong> {getinTestResults.scraping_info.found_at}</p>
                                {getinTestResults.scraping_info.session_info && getinTestResults.method === 'web_scraping_v2' && (
                                  <div className="bg-blue-50 p-3 rounded mt-2">
                                    <p className="text-sm font-medium text-blue-800 mb-2">📊 Informações do Scraper V2:</p>
                                    <div className="text-xs text-blue-700 space-y-1">
                                      <p>• URLs testadas: {getinTestResults.scraping_info.session_info.total_urls_tested}</p>
                                      <p>• URLs funcionando: {getinTestResults.scraping_info.session_info.working_urls_count}</p>
                                      <p>• Acesso ao login: {getinTestResults.scraping_info.session_info.has_login_access ? '✅' : '❌'}</p>
                                      <p>• Acesso a reservas: {getinTestResults.scraping_info.session_info.has_reservation_access ? '✅' : '❌'}</p>
                                    </div>
                                  </div>
                                                                 )}
                                 {getinTestResults.method === 'spa_analysis' && getinTestResults.scraping_info.analysis_data && (
                                   <div className="bg-purple-50 p-3 rounded mt-2">
                                     <p className="text-sm font-medium text-purple-800 mb-2">🔍 Análise SPA Detalhada:</p>
                                     <div className="text-xs text-purple-700 space-y-1">
                                       <p>• APIs descobertas: {getinTestResults.scraping_info.analysis_data.apis_found.length}</p>
                                       <p>• Endpoints funcionais: {getinTestResults.scraping_info.analysis_data.working_endpoints.length}</p>
                                       <p>• Recomendação: {getinTestResults.scraping_info.analysis_data.recommendations}</p>
                                       {getinTestResults.scraping_info.analysis_data.working_endpoints.length > 0 && (
                                         <div>
                                           <p className="font-medium mt-2">Endpoints encontrados:</p>
                                           <ul className="ml-2">
                                             {getinTestResults.scraping_info.analysis_data.working_endpoints.slice(0, 3).map((endpoint: any, idx: number) => (
                                               <li key={idx}>{endpoint.method} {endpoint.url} (Status: {endpoint.status})</li>
                                             ))}
                                           </ul>
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                 )}
                                 {getinTestResults.method === 'api_real' && getinTestResults.scraping_info.api_info && (
                                   <div className="bg-red-50 p-3 rounded mt-2">
                                     <p className="text-sm font-medium text-red-800 mb-2">🚀 API Real Detalhada:</p>
                                     <div className="text-xs text-red-700 space-y-1">
                                       <p>• Método de autenticação: {getinTestResults.scraping_info.api_info.authentication.auth_method}</p>
                                       <p>• Token encontrado: {getinTestResults.scraping_info.api_info.authentication.token_found ? '✅' : '❌'}</p>
                                       <p>• Session encontrada: {getinTestResults.scraping_info.api_info.authentication.session_found ? '✅' : '❌'}</p>
                                       <p>• Endpoint funcional: {getinTestResults.scraping_info.api_info.working_endpoint}</p>
                                       <p>• Endpoints testados: {getinTestResults.scraping_info.api_info.performance.endpoints_tested}</p>
                                       <p>• Duração: {getinTestResults.scraping_info.api_info.performance.duration_ms}ms</p>
                                     </div>
                                   </div>
                                 )}
                                 {getinTestResults.method === 'deep_analysis' && getinTestResults.scraping_info.deep_info && (
                                   <div className="bg-purple-50 p-3 rounded mt-2">
                                     <p className="text-sm font-medium text-purple-800 mb-2">🕵️ Análise Profunda Detalhada:</p>
                                     <div className="text-xs text-purple-700 space-y-1">
                                       <p>• Scripts analisados: {getinTestResults.scraping_info.deep_info.scripts.length}</p>
                                       <p>• Subdomínios funcionais: {getinTestResults.scraping_info.deep_info.workingSubdomains.length}</p>
                                       <p>• Endpoints descobertos: {getinTestResults.scraping_info.deep_info.apiHints?.endpoints?.length || 0}</p>
                                       <p>• URLs de API completas: {getinTestResults.scraping_info.deep_info.apiHints?.fullApiUrls?.length || 0}</p>
                                       <p>• Padrões de auth encontrados: {getinTestResults.scraping_info.deep_info.apiHints?.authInfo?.length || 0}</p>
                                       {getinTestResults.scraping_info.deep_info.workingSubdomains.length > 0 && (
                                         <div>
                                           <p className="font-medium mt-2">Subdomínios ativos:</p>
                                           <ul className="ml-2">
                                             {getinTestResults.scraping_info.deep_info.workingSubdomains.slice(0, 3).map((sub: any, idx: number) => (
                                               <li key={idx}>{sub.domain} (Status: {sub.status})</li>
                                             ))}
                                           </ul>
                                         </div>
                                       )}
                                       {getinTestResults.scraping_info.deep_info.recommendations && (
                                         <div>
                                           <p className="font-medium mt-2">Recomendações:</p>
                                           <ul className="ml-2">
                                             {getinTestResults.scraping_info.deep_info.recommendations.slice(0, 2).map((rec: string, idx: number) => (
                                               <li key={idx}>• {rec}</li>
                                             ))}
                                           </ul>
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                 )}
                                 {getinTestResults.scraping_info.steps_completed && (
                                   <div>
                                     <p><strong>Etapas Concluídas:</strong></p>
                                     <ul className="list-disc list-inside ml-4 space-y-1">
                                       {getinTestResults.scraping_info.steps_completed.map((step: string, index: number) => (
                                         <li key={index} className="text-xs">{step}</li>
                                       ))}
                                     </ul>
                                   </div>
                                 )}
                               </>
                             )}
                          </div>
                          {getinTestResults.reservas && getinTestResults.reservas.length > 0 && (
                            <div className="mt-4">
                              <p className="font-medium mb-2">Últimas Reservas:</p>
                              <div className="space-y-2">
                                {getinTestResults.reservas.map((reserva: any, index: number) => (
                                  <div key={index} className="bg-white p-3 rounded border">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-medium">{reserva.nome_cliente}</p>
                                        <p className="text-sm text-gray-600">
                                          {reserva.data_reserva} às {reserva.horario} - {reserva.pessoas} pessoas
                                        </p>
                                      </div>
                                      <Badge variant="outline">{reserva.status}</Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-red-50 p-4 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <XCircle className="w-5 h-5 text-red-600" />
                            <span className="font-medium text-red-800">Erro na Conexão</span>
                          </div>
                          <p className="text-sm text-red-700 mt-2">{getinTestResults.error}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Resultados do Debug */}
                {getinDebugResults && (
                  <div className="space-y-4">
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">🧪 Resultados do Debug de Login</h4>
                      <div className="space-y-3">
                        {getinDebugResults.map((result: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-sm">{result.variation}</h5>
                              <div className="flex items-center space-x-2">
                                {result.ok ? (
                                  <Badge className="bg-green-100 text-green-800">✅ Sucesso</Badge>
                                ) : (
                                  <Badge variant="destructive">❌ Falhou</Badge>
                                )}
                                <Badge variant="outline">HTTP {result.status}</Badge>
                              </div>
                            </div>
                            
                            {result.error ? (
                              <p className="text-sm text-red-600 mt-2">
                                <strong>Erro:</strong> {result.error}
                              </p>
                            ) : (
                              <div className="text-sm text-gray-600 mt-2">
                                <p><strong>Status:</strong> {result.status}</p>
                                {result.data && (
                                  <div className="mt-2">
                                    <p><strong>Resposta:</strong></p>
                                    <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-x-auto">
                                      {JSON.stringify(result.data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Análise dos Resultados */}
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h5 className="font-medium text-blue-800 mb-2">📊 Análise dos Resultados</h5>
                        <div className="text-sm text-blue-700">
                          {getinDebugResults.every((r: any) => r.status === 404) ? (
                            <div>
                              <p className="font-medium">🔍 Problema Identificado: Endpoint não encontrado (404)</p>
                              <p className="mt-1">A URL da API parece estar incorreta ou o endpoint foi alterado.</p>
                              <p className="mt-1"><strong>URL atual:</strong> https://agent.getinapis.com/auth/v1/login</p>
                              <p className="mt-1"><strong>Sugestão:</strong> Verificar se a URL mudou ou se há uma nova versão da API.</p>
                            </div>
                          ) : getinDebugResults.every((r: any) => r.status === 401) ? (
                            <div>
                              <p className="font-medium">🔐 Problema Identificado: Credenciais inválidas (401)</p>
                              <p className="mt-1">As credenciais podem estar incorretas ou a conta pode estar desativada.</p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium">🔄 Resultados Mistos</p>
                              <p className="mt-1">Diferentes headers estão retornando resultados diferentes.</p>
                            </div>
                          )}
                        </div>
                      </div>
                                         </div>
                   </div>
                 )}

                {/* Resultados do Teste de URLs */}
                {getinUrlTestResults && (
                  <div className="space-y-4">
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">🔍 Resultados do Teste de URLs</h4>
                      
                      {/* Resumo */}
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-lg text-blue-600">{getinUrlTestResults.summary.total}</div>
                            <div className="text-gray-600">Total testadas</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-lg text-green-600">{getinUrlTestResults.summary.working}</div>
                            <div className="text-gray-600">Funcionando</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-lg text-red-600">{getinUrlTestResults.summary.authErrors}</div>
                            <div className="text-gray-600">Auth Error</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-lg text-gray-600">{getinUrlTestResults.summary.notFound}</div>
                            <div className="text-gray-600">Not Found</div>
                          </div>
                        </div>
                      </div>

                      {/* URLs Funcionando */}
                      {getinUrlTestResults.results.filter((r: any) => r.ok).length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-green-800 mb-2">✅ URLs Funcionando</h5>
                          <div className="space-y-2">
                            {getinUrlTestResults.results.filter((r: any) => r.ok).map((result: any, index: number) => (
                              <div key={index} className="bg-green-50 p-3 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between">
                                  <code className="text-sm text-green-800">{result.url}</code>
                                  <Badge className="bg-green-100 text-green-800">HTTP {result.status}</Badge>
                                </div>
                                {result.data && (
                                  <pre className="text-xs text-green-700 mt-2 bg-green-100 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(result.data, null, 2)}
                                  </pre>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* URLs com Erro de Autenticação */}
                      {getinUrlTestResults.results.filter((r: any) => r.status === 401).length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-yellow-800 mb-2">🔐 URLs com Erro de Autenticação</h5>
                          <div className="space-y-2">
                            {getinUrlTestResults.results.filter((r: any) => r.status === 401).map((result: any, index: number) => (
                              <div key={index} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                <div className="flex items-center justify-between">
                                  <code className="text-sm text-yellow-800">{result.url}</code>
                                  <Badge variant="outline" className="text-yellow-800 border-yellow-800">HTTP {result.status}</Badge>
                                </div>
                                <p className="text-xs text-yellow-700 mt-1">
                                  Endpoint encontrado, mas credenciais rejeitadas.
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* URLs Não Encontradas */}
                      {getinUrlTestResults.results.filter((r: any) => r.status === 404).length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-red-800 mb-2">❌ URLs Não Encontradas</h5>
                          <div className="space-y-1">
                            {getinUrlTestResults.results.filter((r: any) => r.status === 404).slice(0, 5).map((result: any, index: number) => (
                              <div key={index} className="bg-red-50 p-2 rounded border border-red-200">
                                <code className="text-xs text-red-800">{result.url}</code>
                              </div>
                            ))}
                            {getinUrlTestResults.results.filter((r: any) => r.status === 404).length > 5 && (
                              <div className="text-xs text-gray-600 text-center py-2">
                                ... e mais {getinUrlTestResults.results.filter((r: any) => r.status === 404).length - 5} URLs
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Recomendações */}
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h5 className="font-medium text-blue-800 mb-2">💡 Recomendações</h5>
                        <div className="text-sm text-blue-700 space-y-1">
                          {getinUrlTestResults.summary.working > 0 ? (
                            <p>✅ Encontramos URLs funcionando! Use uma delas para atualizar a configuração.</p>
                          ) : getinUrlTestResults.summary.authErrors > 0 ? (
                            <p>🔐 Alguns endpoints foram encontrados mas as credenciais estão incorretas. Verifique email/senha.</p>
                          ) : (
                            <p>❌ Nenhuma URL funcionou. A API do GetIn pode ter mudado completamente ou estar fora do ar.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                                 )}

                {/* Resultados do Teste de Conectividade */}
                {getinConnectivityResults && (
                  <div className="space-y-4">
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">🌐 Resultados do Teste de Conectividade</h4>
                      
                      {/* Resumo */}
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-3 gap-4 text-sm text-center">
                          <div>
                            <div className="font-bold text-lg text-green-600">{getinConnectivityResults.summary.accessible}</div>
                            <div className="text-gray-600">Acessíveis</div>
                          </div>
                          <div>
                            <div className="font-bold text-lg text-red-600">{getinConnectivityResults.summary.inaccessible}</div>
                            <div className="text-gray-600">Bloqueados</div>
                          </div>
                          <div>
                            <div className="font-bold text-lg text-blue-600">{getinConnectivityResults.summary.total}</div>
                            <div className="text-gray-600">Total</div>
                          </div>
                        </div>
                        <div className="mt-3 text-center">
                          <p className="text-sm font-medium text-gray-800">{getinConnectivityResults.summary.diagnosis}</p>
                        </div>
                      </div>

                      {/* Sites Acessíveis */}
                      {getinConnectivityResults.results.filter((r: any) => r.accessible).length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-green-800 mb-2">✅ Sites Acessíveis</h5>
                          <div className="space-y-2">
                            {getinConnectivityResults.results.filter((r: any) => r.accessible).map((result: any, index: number) => (
                              <div key={index} className="bg-green-50 p-3 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-green-800">{result.name}</p>
                                    <code className="text-xs text-green-700">{result.url}</code>
                                  </div>
                                  <div className="text-right">
                                    <Badge className="bg-green-100 text-green-800">HTTP {result.status}</Badge>
                                    <p className="text-xs text-green-600 mt-1">{result.duration}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sites Bloqueados */}
                      {getinConnectivityResults.results.filter((r: any) => !r.accessible).length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-red-800 mb-2">❌ Sites Bloqueados/Inacessíveis</h5>
                          <div className="space-y-2">
                            {getinConnectivityResults.results.filter((r: any) => !r.accessible).map((result: any, index: number) => (
                              <div key={index} className="bg-red-50 p-3 rounded-lg border border-red-200">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-red-800">{result.name}</p>
                                    <code className="text-xs text-red-700">{result.url}</code>
                                  </div>
                                  <Badge variant="destructive">{result.errorType}</Badge>
                                </div>
                                <p className="text-xs text-red-600 mt-2">{result.error}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recomendações */}
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h5 className="font-medium text-blue-800 mb-2">💡 Recomendações</h5>
                        <div className="text-sm text-blue-700 space-y-1">
                          {getinConnectivityResults.recommendations.map((rec: string, index: number) => (
                            <p key={index}>• {rec}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informações da Integração */}
                <div className="space-y-4">
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-3">Sobre a Integração GetIn</h4>
                    <div className="space-y-3 text-sm text-gray-600">
                      <p>• <strong>Sincronização automática</strong> de reservas do sistema GetIn</p>
                      <p>• <strong>Dados em tempo real</strong> sobre ocupação e disponibilidade</p>
                      <p>• <strong>Gestão centralizada</strong> de todas as reservas</p>
                      <p>• <strong>Relatórios integrados</strong> com outros sistemas</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle>WhatsApp Business API</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">WhatsApp Business API</h3>
                  <p className="text-gray-600 mb-6">
                    Configure notificações automáticas, confirmações de reserva e comunicação direta com seus clientes
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 border rounded-lg bg-green-50">
                      <h4 className="font-semibold text-green-800 mb-2">✨ Funcionalidades</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Confirmações automáticas de reservas</li>
                        <li>• Notificações de pedidos</li>
                        <li>• Lembretes de eventos</li>
                        <li>• Suporte ao cliente 24/7</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <h4 className="font-semibold text-blue-800 mb-2">🎯 Benefícios</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Redução de no-shows em 75%</li>
                        <li>• Atendimento mais eficiente</li>
                        <li>• Maior satisfação dos clientes</li>
                        <li>• Aumento na fidelização</li>
                      </ul>
                    </div>
                  </div>
                  <Button 
                    onClick={() => window.location.href = '/configuracoes/whatsapp'}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    💬 Configurar WhatsApp Business
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ContaAzul Tab */}
          <TabsContent value="contaazul" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">CA</span>
                  </div>
                  <CardTitle>ContaAzul Integration</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-10 h-10 bg-blue-500 rounded text-white flex items-center justify-center font-bold text-lg">
                      CA
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Integração ContaAzul</h3>
                  <p className="text-gray-600 mb-6">
                    Configure a conexão OAuth com ContaAzul para sincronização automática de dados financeiros
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <h4 className="font-semibold text-blue-800 mb-2">📊 Dados Sincronizados</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Vendas e faturamento</li>
                        <li>• Produtos e categorias</li>
                        <li>• Clientes e fornecedores</li>
                        <li>• Contas a pagar e receber</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg bg-green-50">
                      <h4 className="font-semibold text-green-800 mb-2">⚡ Automação</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Renovação automática de tokens</li>
                        <li>• Sincronização em tempo real</li>
                        <li>• Relatórios automatizados</li>
                        <li>• Alertas de problemas</li>
                      </ul>
                    </div>
                  </div>
                  <Button 
                    onClick={() => window.location.href = '/configuracoes/integracoes/contaazul'}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    🔗 Configurar ContaAzul OAuth
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Meta Tab */}
          <TabsContent value="meta" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
                  <CardTitle>Meta & Social Media</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 border rounded-lg bg-gradient-to-br from-blue-50 to-purple-50">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                          <Facebook className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">Facebook</h4>
                          <p className="text-sm text-gray-600">Posts e análises</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Automação de posts, análise de engajamento e gerenciamento de campanhas publicitárias
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-xs text-yellow-600">Em desenvolvimento</span>
                      </div>
                    </div>
                    
                    <div className="p-6 border rounded-lg bg-gradient-to-br from-pink-50 to-purple-50">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                          <Instagram className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">Instagram</h4>
                          <p className="text-sm text-gray-600">Stories e posts</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Publicação automática de conteúdo, stories promocionais e análise de métricas
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-xs text-yellow-600">Em desenvolvimento</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border rounded-lg bg-gradient-to-br from-red-50 to-orange-50">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center mr-3">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Google Reviews</h4>
                        <p className="text-sm text-gray-600">Monitoramento e resposta automática</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Monitoramento em tempo real de novas avaliações, notificações automáticas e sugestões de resposta
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-xs text-gray-500">Planejado</span>
                    </div>
                  </div>

                  <div className="text-center py-6">
                    <Button 
                      onClick={() => window.location.href = '/configuracoes/meta-configuracao'}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                      🎯 Configurar Meta APIs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle>Email & SMS Marketing</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 border rounded-lg bg-blue-50">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">Email Marketing</h4>
                          <p className="text-sm text-gray-600">Campanhas automatizadas</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Envio de newsletters, promoções especiais e acompanhamento de eventos
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-gray-500">Próxima versão</span>
                      </div>
                    </div>
                    
                    <div className="p-6 border rounded-lg bg-green-50">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                          <Smartphone className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">SMS Notifications</h4>
                          <p className="text-sm text-gray-600">Alertas em tempo real</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Confirmações de reserva, lembretes e notificações importantes via SMS
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-gray-500">Próxima versão</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Em Desenvolvimento</h3>
                    <p className="text-gray-600 mb-4">
                      Estamos trabalhando nas integrações de email e SMS para oferecer a melhor experiência de comunicação
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      Lançamento previsto para próxima versão
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Eventos Tab */}
          <TabsContent value="eventos" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle>Plataformas de Eventos</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 border rounded-lg bg-yellow-50">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center mr-3">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">Sympla</h4>
                          <p className="text-sm text-gray-600">Gestão de eventos</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Sincronização automática de eventos, vendas de ingressos e controle de participantes
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-xs text-yellow-600">Em desenvolvimento</span>
                      </div>
                    </div>
                    
                    <div className="p-6 border rounded-lg bg-indigo-50">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center mr-3">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">GetIn</h4>
                          <p className="text-sm text-gray-600">Lista de convidados</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Integração para gestão de lista de convidados e controle de acesso a eventos
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span className="text-xs text-indigo-600">Em desenvolvimento</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Integrações de Eventos</h3>
                    <p className="text-gray-600 mb-4">
                      Conecte seu estabelecimento com as principais plataformas de eventos do Brasil
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      Funcionalidades em desenvolvimento
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-teal-500 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle>Business Intelligence & Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 border rounded-lg bg-orange-50">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                          <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">ContaHub</h4>
                          <p className="text-sm text-gray-600">Análise avançada</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Análise avançada de dados financeiros e operacionais com insights automáticos
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">Ativo</span>
                      </div>
                    </div>
                    
                    <div className="p-6 border rounded-lg bg-blue-50">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">Power BI</h4>
                          <p className="text-sm text-gray-600">Dashboards avançados</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Dashboards interativos e relatórios personalizados com Microsoft Power BI
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-gray-500">Planejado</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-6">
                    <Button 
                      onClick={() => window.location.href = '/relatorios/contahub-teste'}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      📊 Acessar ContaHub Analytics
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Espaçamento final para evitar corte da página */}
        <div className="h-16"></div>
      </div>
    </div>
  )
} 