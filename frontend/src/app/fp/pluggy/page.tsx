'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Link2, Plus, RefreshCw, Unlink, ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function PluggyPage() {
  const [contas, setContas] = useState<any[]>([])
  const [conectores, setConectores] = useState<any[]>([])
  const [conexoes, setConexoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [formData, setFormData] = useState({
    conta_id: '',
    connector_id: '',
    credentials: {} as Record<string, string>
  })
  const [selectedConnector, setSelectedConnector] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [contasRes, conectoresRes, conexoesRes] = await Promise.all([
        fetch('/api/fp/contas'),
        fetch('/api/fp/pluggy/connectors'),
        fetch('/api/fp/pluggy/items')
      ])

      const [contasResult, conectoresResult, conexoesResult] = await Promise.all([
        contasRes.json(),
        conectoresRes.json(),
        conexoesRes.json()
      ])

      if (contasResult.success) setContas(contasResult.data || [])
      if (conectoresResult.success) setConectores(conectoresResult.data || [])
      if (conexoesResult.success) setConexoes(conexoesResult.data || [])
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectConnector = (connectorId: string) => {
    const connector = conectores.find(c => c.id === connectorId)
    setSelectedConnector(connector)
    setFormData({ ...formData, connector_id: connectorId, credentials: {} })
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.conta_id || !formData.connector_id) {
      toast.error('Selecione uma conta e um banco')
      return
    }

    // Validar credenciais
    if (selectedConnector) {
      for (const cred of selectedConnector.credentials) {
        if (!formData.credentials[cred.name]) {
          toast.error(`Campo ${cred.label} é obrigatório`)
          return
        }
      }
    }

    try {
      setConnecting(true)

      const response = await fetch('/api/fp/pluggy/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        setModalOpen(false)
        resetForm()
        fetchData()
      } else {
        toast.error(result.error || 'Erro ao conectar banco')
      }
    } catch (error) {
      console.error('Erro ao conectar:', error)
      toast.error('Erro ao conectar banco')
    } finally {
      setConnecting(false)
    }
  }

  const handleSync = async (pluggyItemId: string) => {
    try {
      toast.info('Sincronizando transações...')

      const response = await fetch('/api/fp/pluggy/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pluggy_item_id: pluggyItemId })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`${result.data.inseridas} novas transações importadas!`)
        fetchData()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Erro ao sincronizar')
    }
  }

  const handleDisconnect = async (pluggyItemId: string) => {
    if (!confirm('Deseja realmente desconectar este banco?')) return

    try {
      const response = await fetch('/api/fp/pluggy/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pluggy_item_id: pluggyItemId })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Banco desconectado')
        fetchData()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Erro ao desconectar')
    }
  }

  const resetForm = () => {
    setFormData({
      conta_id: '',
      connector_id: '',
      credentials: {}
    })
    setSelectedConnector(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 dark:text-green-400'
      case 'UPDATING':
        return 'text-blue-600 dark:text-blue-400'
      case 'LOGIN_ERROR':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-5 h-5" />
      case 'UPDATING':
        return <RefreshCw className="w-5 h-5 animate-spin" />
      case 'LOGIN_ERROR':
        return <XCircle className="w-5 h-5" />
      default:
        return <AlertCircle className="w-5 h-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="card-dark p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/fp/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Open Finance (Pluggy)
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Conecte seus bancos e sincronize transações automaticamente
                </p>
              </div>
            </div>

            <Dialog open={modalOpen} onOpenChange={(open) => {
              setModalOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Conectar Banco
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-gray-900 dark:text-white">
                    Conectar Banco via Open Finance
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-400">
                    Suas credenciais são criptografadas e seguras
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleConnect} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Conta Destino *
                    </label>
                    <Select value={formData.conta_id} onValueChange={(value) => setFormData({ ...formData, conta_id: value })}>
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                        <SelectValue placeholder="Selecione a conta" />
                      </SelectTrigger>
                      <SelectContent>
                        {contas.map((conta) => (
                          <SelectItem key={conta.id} value={conta.id}>
                            {conta.nome} - {conta.banco}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Banco *
                    </label>
                    <Select value={formData.connector_id} onValueChange={handleSelectConnector}>
                      <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                        <SelectValue placeholder="Selecione o banco" />
                      </SelectTrigger>
                      <SelectContent>
                        {conectores.map((connector) => (
                          <SelectItem key={connector.id} value={connector.id}>
                            {connector.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedConnector && selectedConnector.credentials.map((cred: any) => (
                    <div key={cred.name}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {cred.label} *
                      </label>
                      <Input
                        type={cred.type === 'password' ? 'password' : 'text'}
                        value={formData.credentials[cred.name] || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          credentials: { ...formData.credentials, [cred.name]: e.target.value }
                        })}
                        placeholder={cred.placeholder || cred.label}
                        required
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  ))}

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={connecting || !formData.conta_id || !formData.connector_id}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {connecting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4 mr-2" />
                          Conectar
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setModalOpen(false)
                        resetForm()
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Bancos Conectados */}
        {loading ? (
          <div className="card-dark p-6">
            <p className="text-gray-600 dark:text-gray-400">Carregando conexões...</p>
          </div>
        ) : conexoes.length === 0 ? (
          <div className="card-dark p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum banco conectado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Conecte seu banco para sincronização automática de transações
            </p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Conectar Primeiro Banco
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conexoes.map((conexao) => (
              <Card key={conexao.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900 dark:text-white">
                          {conexao.banco_nome}
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                          {conexao.conta?.nome}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className={`flex items-center gap-2 ${getStatusColor(conexao.status)}`}>
                      {getStatusIcon(conexao.status)}
                      <span className="text-sm font-medium">
                        {conexao.status === 'ACTIVE' && 'Conectado'}
                        {conexao.status === 'UPDATING' && 'Sincronizando...'}
                        {conexao.status === 'LOGIN_ERROR' && 'Erro de autenticação'}
                        {conexao.status === 'OUTDATED' && 'Desatualizado'}
                      </span>
                    </div>

                    {conexao.ultima_sincronizacao && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Última sincronização:{' '}
                        {new Date(conexao.ultima_sincronizacao).toLocaleString('pt-BR')}
                      </p>
                    )}

                    {conexao.erro_mensagem && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {conexao.erro_mensagem}
                      </p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSync(conexao.pluggy_item_id)}
                        className="flex-1"
                        disabled={conexao.status === 'UPDATING'}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Sincronizar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDisconnect(conexao.pluggy_item_id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <Unlink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Informações */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 mt-6">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-300 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Segurança e Privacidade
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
            <p>✅ Conexão criptografada e segura via Open Finance (Banco Central)</p>
            <p>✅ Suas credenciais nunca são armazenadas no nosso servidor</p>
            <p>✅ Sincronização automática de transações em tempo real</p>
            <p>✅ Você pode desconectar a qualquer momento</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
