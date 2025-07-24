'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'

interface WebhookConfig {
  bar_id: string
  chave_pix: string
  webhook_url: string
}

interface WebhookInfo {
  webhookUrl: string
  chave: string
  criacao: string
}

export default function InterWebhookPage() {
  const [config, setConfig] = useState<WebhookConfig>({
    bar_id: '',
    chave_pix: '',
    webhook_url: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [webhookInfo, setWebhookInfo] = useState<WebhookInfo | null>(null)
  const [consultando, setConsultando] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (field: keyof WebhookConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  const configurarWebhook = async () => {
    if (!config.bar_id || !config.chave_pix || !config.webhook_url) {
      toast({
        title: "Erro",
        description: "Todos os campos obrigatórios devem ser preenchidos",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/inter-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso!",
          description: "Webhook configurado com sucesso",
        })
        // Consultar webhook após configuração
        consultarWebhook()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao configurar webhook",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro de conexão",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const consultarWebhook = async () => {
    if (!config.bar_id || !config.chave_pix) {
      toast({
        title: "Erro",
        description: "Bar ID e chave PIX são obrigatórios",
        variant: "destructive"
      })
      return
    }

    setConsultando(true)
    try {
      const response = await fetch('/api/inter-webhook-consultar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bar_id: config.bar_id,
          chave_pix: config.chave_pix
        })
      })

      const data = await response.json()

      if (data.success) {
        if (data.webhook) {
          setWebhookInfo(data.webhook)
          toast({
            title: "Webhook encontrado",
            description: "Configuração atual carregada",
          })
        } else {
          setWebhookInfo(null)
          toast({
            title: "Webhook não encontrado",
            description: "Nenhum webhook configurado para esta chave PIX",
          })
        }
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao consultar webhook",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro de conexão",
        variant: "destructive"
      })
    } finally {
      setConsultando(false)
    }
  }

  const getWebhookUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/inter-webhook-callback`
    }
    return '/api/inter-webhook-callback'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Configuração Webhook Inter
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Configure webhooks para receber notificações de pagamentos PIX do Banco Inter
            </p>
          </div>

          {/* URL do Webhook */}
          <Card className="card-dark">
            <CardHeader>
              <CardTitle className="card-title-dark flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                URL do Webhook
              </CardTitle>
              <CardDescription className="card-description-dark">
                Esta é a URL que o Inter usará para enviar notificações de pagamentos PIX
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input 
                  value={getWebhookUrl()} 
                  readOnly 
                  className="input-dark font-mono text-sm"
                />
                <Button 
                  variant="outline" 
                  onClick={() => navigator.clipboard.writeText(getWebhookUrl())}
                  className="btn-outline-dark"
                >
                  Copiar
                </Button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Use esta URL no campo "webhook_url" ao configurar o webhook
              </p>
            </CardContent>
          </Card>

          {/* Configuração */}
          <Card className="card-dark">
            <CardHeader>
              <CardTitle className="card-title-dark">Configuração do Webhook</CardTitle>
              <CardDescription className="card-description-dark">
                Preencha as credenciais do Inter e a chave PIX para configurar o webhook
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bar_id" className="text-gray-700 dark:text-gray-300">
                    Bar ID *
                  </Label>
                  <Input
                    id="bar_id"
                    type="text"
                    value={config.bar_id}
                    onChange={(e) => handleInputChange('bar_id', e.target.value)}
                    placeholder="ID do bar (ex: 1, 2, 3...)"
                    className="input-dark"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    As credenciais do Inter serão carregadas automaticamente do banco
                  </p>
                </div>

                <div>
                  <Label htmlFor="chave_pix" className="text-gray-700 dark:text-gray-300">
                    Chave PIX *
                  </Label>
                  <Input
                    id="chave_pix"
                    type="text"
                    value={config.chave_pix}
                    onChange={(e) => handleInputChange('chave_pix', e.target.value)}
                    placeholder="Sua chave PIX (CPF, CNPJ, email, telefone ou EVP)"
                    className="input-dark"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="webhook_url" className="text-gray-700 dark:text-gray-300">
                  URL do Webhook *
                </Label>
                <Input
                  id="webhook_url"
                  type="url"
                  value={config.webhook_url}
                  onChange={(e) => handleInputChange('webhook_url', e.target.value)}
                  placeholder="https://seu-dominio.com/api/inter-webhook-callback"
                  className="input-dark"
                />
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Deve começar com https:// e apontar para o endpoint de callback
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={configurarWebhook} 
                  disabled={loading}
                  className="btn-primary-dark"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Configurando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Configurar Webhook
                    </>
                  )}
                </Button>

                <Button 
                  onClick={consultarWebhook} 
                  disabled={consultando}
                  variant="outline"
                  className="btn-outline-dark"
                >
                  {consultando ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Consultando...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Consultar Webhook
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status do Webhook */}
          {webhookInfo && (
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="card-title-dark flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Webhook Configurado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">URL:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-mono text-sm">
                      {webhookInfo.webhookUrl}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Chave PIX:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-mono text-sm">
                      {webhookInfo.chave}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Criado em:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {new Date(webhookInfo.criacao).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações */}
          <Card className="card-dark">
            <CardHeader>
              <CardTitle className="card-title-dark">Como Funciona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p><strong>1.</strong> Configure as credenciais do Inter em Configurações {'>'} Credenciais (sistema: banco_inter)</p>
                <p><strong>2.</strong> Informe o Bar ID e sua chave PIX (CPF, CNPJ, email, telefone ou EVP)</p>
                <p><strong>3.</strong> Use a URL do webhook fornecida acima</p>
                <p><strong>4.</strong> Clique em "Configurar Webhook" para ativar</p>
                <p><strong>5.</strong> O Inter enviará notificações para o endpoint quando houver pagamentos PIX</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
} 