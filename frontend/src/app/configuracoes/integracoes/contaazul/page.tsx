'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { useBar } from '@/contexts/BarContext'

interface ContaAzulConfig {
  id?: number
  access_token?: string
  refresh_token?: string
  expires_at?: string
  empresa_id?: string
  conectado: boolean
  ultima_sync?: string
}

export default function ContaAzulPage() {
  const { selectedBar } = useBar()
  const [config, setConfig] = useState<ContaAzulConfig>({ conectado: false })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')

  useEffect(() => {
    if (selectedBar) {
      carregarConfiguracao()
    }

    // Verificar URL parameters para callback do OAuth
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')

    if (success === 'connected') {
      setStatus('connected')
      alert('✅ ContaAzul conectado com sucesso!')
      // Limpar URL parameters
      window.history.replaceState({}, '', window.location.pathname)
      // Recarregar configuração
      if (selectedBar) {
        carregarConfiguracao()
      }
    } else if (error) {
      setStatus('error')
      let errorMessage = 'Erro na conexão'
      
      switch (error) {
        case 'unauthorized':
          errorMessage = 'Não autorizado'
          break
        case 'missing_code':
          errorMessage = 'Código de autorização não recebido'
          break
        case 'invalid_state':
          errorMessage = 'Estado de segurança inválido'
          break
        case 'callback_error':
          errorMessage = 'Erro no processamento da autorização'
          break
        default:
          errorMessage = decodeURIComponent(error)
      }
      
      alert(`❌ Erro ao conectar: ${errorMessage}`)
      // Limpar URL parameters
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [selectedBar])

  const carregarConfiguracao = async () => {
    
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.error('❌ Erro ao conectar com banco');
      return;
    }

    if (!selectedBar) return

    try {
      const { data, error } = await supabase
        .from('contaazul_config')
        .select('*')
        .eq('bar_id', selectedBar.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar config:', error)
        return
      }

      if (data) {
        setConfig({
          ...data,
          conectado: !!data.access_token && new Date(data.expires_at) > new Date()
        })
        setStatus(data.access_token ? 'connected' : 'idle')
      }
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  const conectarContaAzul = async () => {
    
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.error('❌ Erro ao conectar com banco');
      return;
    }

    if (!selectedBar) {
      alert('Selecione um bar primeiro!')
      return
    }

    setLoading(true)
    setStatus('connecting')

    try {
      // Solicitar URL de autorização OAuth
      const response = await fetch('/api/contaazul-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'get_auth_url',
          bar_id: selectedBar.id
        })
      })

      const result = await response.json()

      if (result.success) {
        // Redirecionar para a página de autorização do ContaAzul
        console.log('🔗 Redirecionando para:', result.auth_url)
        window.location.href = result.auth_url
      } else {
        throw new Error(result.error || 'Erro na conexão')
      }
    } catch (error) {
      console.error('Erro ao conectar:', error)
      setStatus('error')
      alert(`❌ Erro ao conectar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setLoading(false)
    }
  }

  const desconectar = async () => {
    
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.error('❌ Erro ao conectar com banco');
      return;
    }

    if (!selectedBar) return

    setLoading(true)
    try {
      const response = await fetch('/api/contaazul-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'disconnect',
          bar_id: selectedBar.id
        })
      })

      const result = await response.json()

      if (result.success) {
        setConfig({ conectado: false })
        setStatus('idle')
        alert('✅ ContaAzul desconectado com sucesso!')
      } else {
        throw new Error(result.error || 'Erro ao desconectar')
      }

    } catch (error) {
      console.error('Erro ao desconectar:', error)
      alert(`❌ Erro ao desconectar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  const sincronizarDados = async () => {
    
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.error('❌ Erro ao conectar com banco');
      return;
    }

    if (!selectedBar) return

    setLoading(true)
    try {
      console.log('🔄 Iniciando sincronização ContaAzul...')
      
      // Pegar dados do usuário do localStorage para autenticação
      const userData = localStorage.getItem('sgb_user')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      // Adicionar header de autenticação se o usuário estiver logado
      if (userData) {
        headers['x-user-data'] = encodeURIComponent(userData)
      }
      
      const response = await fetch('/api/contaazul-sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bar_id: selectedBar.id,
          sync_type: 'all'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Recarregar configuração com nova data de sync
        await carregarConfiguracao()
        
        // Mostrar resultados da sincronização
        console.log('✅ Sincronização concluída:', result.results)
        const summary = result.summary || {}
        alert(`✅ Sincronização concluída!\n\n📊 ${summary.categorias || 0} categorias\n🏦 ${summary.contas || 0} contas financeiras\n👥 ${summary.pessoas || 0} pessoas\n💰 ${summary.movimentacoes || 0} eventos financeiros`)
      } else {
        console.error('❌ Erro na sincronização:', result.error)
        alert(`❌ Erro na sincronização: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Erro na sincronização:', error)
      alert('❌ Erro na sincronização. Verifique o console para detalhes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl font-bold">CA</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">🔗 Integração ContaAzul</h1>
            <p className="text-slate-600">Conecte seu ContaAzul para sincronizar dados financeiros</p>
          </div>
        </div>
      </div>

      {/* Status da Conexão */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">📊 Status da Integração</h3>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              status === 'connected' ? 'bg-green-500' :
              status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              status === 'error' ? 'bg-red-500' : 'bg-gray-400'
            }`}></div>
            <div>
              <div className="font-medium text-slate-800">
                {status === 'connected' ? '✅ Conectado' :
                 status === 'connecting' ? '🔄 Conectando...' :
                 status === 'error' ? '❌ Erro na conexão' : '⚪ Não conectado'}
              </div>
              {config.empresa_id && (
                <div className="text-sm text-slate-500">Empresa ID: {config.empresa_id}</div>
              )}
              {config.ultima_sync && (
                <div className="text-sm text-slate-500">
                  Última sync: {new Date(config.ultima_sync).toLocaleString('pt-BR')}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {config.conectado ? (
              <>
                <button
                  onClick={sincronizarDados}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sincronizando...</span>
                    </>
                  ) : (
                    <>
                      <span>🔄</span>
                      <span>Sincronizar</span>
                    </>
                  )}
                </button>
                <button
                  onClick={desconectar}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Desconectar
                </button>
              </>
            ) : (
              <button
                onClick={conectarContaAzul}
                disabled={loading || !selectedBar}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Conectando...</span>
                  </>
                ) : (
                  <>
                    <span>🔗</span>
                    <span>Conectar ContaAzul</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dados Disponíveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { titulo: 'Produtos', icone: '📦', descricao: 'Catálogo e preços', disponivel: config.conectado },
          { titulo: 'Contas a Pagar', icone: '💳', descricao: 'Fornecedores e despesas', disponivel: config.conectado },
          { titulo: 'Contas a Receber', icone: '💰', descricao: 'Recebimentos e vendas', disponivel: config.conectado },
          { titulo: 'DRE', icone: '📊', descricao: 'Demonstrativo de resultados', disponivel: config.conectado }
        ].map((item: any, index: any) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{item.icone}</span>
              <div className={`w-3 h-3 rounded-full ${item.disponivel ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            </div>
            <h4 className="font-semibold text-slate-800">{item.titulo}</h4>
            <p className="text-sm text-slate-500 mt-1">{item.descricao}</p>
          </div>
        ))}
      </div>

      {/* Configurações Avançadas */}
      {config.conectado && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">⚙️ Configurações</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-slate-800">Sincronização Automática</div>
                <div className="text-sm text-slate-500">Atualizar dados a cada hora</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-slate-800">Notificações de Sincronização</div>
                <div className="text-sm text-slate-500">Receber alertas de problemas</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Instruções */}
      {!config.conectado && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-3">📋 Como Conectar</h3>
          <div className="space-y-2 text-blue-700">
            <p>1. <strong>Clique em "Conectar ContaAzul"</strong> acima</p>
            <p>2. <strong>Faça login</strong> na sua conta ContaAzul</p>
            <p>3. <strong>Autorize o acesso</strong> aos seus dados</p>
            <p>4. <strong>Configure a sincronização</strong> automática</p>
          </div>
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Dica:</strong> Seus dados ContaAzul serão sincronizados automaticamente com o sistema SGB, 
              permitindo análises financeiras em tempo real.
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 