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
    if (!selectedBar) return

    setLoading(true)
    try {
      console.log('🔄 Iniciando sincronização de dados ContaAzul...')
      
      const response = await fetch('/api/contaazul/sync-correto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          barId: selectedBar.id
        })
      })

      const result = await response.json()
      
      if (result.success) {
        await carregarConfiguracao()
        console.log('✅ Sync de dados concluído:', result.resultado)
        
        const { receitas, despesas, parcelas } = result.resultado
        alert(`✅ Sync de dados concluído!\n\n💰 ${receitas.processadas} receitas\n💸 ${despesas.processadas} despesas\n📋 ${parcelas.processadas} parcelas`)
      } else {
        console.error('❌ Erro no sync de dados:', result.erro)
        alert(`❌ Erro no sync: ${result.erro}`)
      }
    } catch (error) {
      console.error('❌ Erro no sync de dados:', error)
      alert('❌ Erro no sync. Verifique o console para detalhes.')
    } finally {
      setLoading(false)
    }
  }

  const sincronizarCompetencia = async () => {
    if (!selectedBar) return

    setLoading(true)
    try {
      console.log('📋 Iniciando sync de competência...')
      
      const response = await fetch('/api/contaazul/sync-competencia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          barId: selectedBar.id
        })
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Sync de competência concluído:', result.resultado)
        
        const { parcelas } = result.resultado
        alert(`✅ Sync de competência concluído!\n\n📋 ${parcelas.processadas} parcelas processadas\n🎯 ${parcelas.eventos_processados} eventos processados`)
      } else {
        console.error('❌ Erro no sync de competência:', result.erro)
        alert(`❌ Erro: ${result.message || result.erro}`)
      }
    } catch (error) {
      console.error('❌ Erro no sync de competência:', error)
      alert('❌ Erro no sync. Verifique o console para detalhes.')
    } finally {
      setLoading(false)
    }
  }

  const debugInsercao = async () => {
    if (!selectedBar) return

    setLoading(true)
    try {
      console.log('🔍 Iniciando debug de inserção...')
      
      const response = await fetch('/api/contaazul/debug-inserção', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          barId: selectedBar.id
        })
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Debug bem-sucedido:', result)
        alert(`✅ Teste de inserção bem-sucedido!\n\nTransação: ${result.transacao_testada}\nCategoria: ${result.categoria_testada}`)
      } else {
        console.error('❌ Erro no debug:', result)
        alert(`❌ Erro no debug: ${result.message || result.error}`)
      }
    } catch (error) {
      console.error('❌ Erro no debug:', error)
      alert('❌ Erro no debug. Verifique o console para detalhes.')
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
                  onClick={desconectar}
                  disabled={loading}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
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

      {/* Sincronização de Dados */}
      {config.conectado && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">🔄 Sincronização de Dados</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sync Dados Completo */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="mb-3">
                <h4 className="font-semibold text-blue-800">📦 Sync Dados</h4>
                <p className="text-sm text-blue-600 mt-1">
                  Sincronização completa: categorias, receitas, despesas e parcelas
                </p>
              </div>
              <button
                onClick={sincronizarDados}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <span>📦</span>
                    <span>Sync Dados</span>
                  </>
                )}
              </button>
            </div>

            {/* Sync Competência */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="mb-3">
                <h4 className="font-semibold text-purple-800">📋 Sync Competência</h4>
                <p className="text-sm text-purple-600 mt-1">
                  Busca parcelas dos dados já existentes (mais rápido)
                </p>
              </div>
              <button
                onClick={sincronizarCompetencia}
                disabled={loading}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    <span>Sync Competência</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>💡 Dica:</strong> Execute primeiro "Sync Dados" para coletar todos os dados, 
              depois use "Sync Competência" para atualizações mais rápidas das parcelas.
            </p>
          </div>
        </div>
      )}

      {/* Debug e Desenvolvimento */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">🔧 Ferramentas de Debug</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Debug Inserção */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="mb-3">
              <h4 className="font-semibold text-gray-800">🔍 Debug Inserção</h4>
              <p className="text-sm text-gray-600 mt-1">
                Testa inserção de dados no banco (desenvolvimento)
              </p>
            </div>
            <button
              onClick={debugInsercao}
              disabled={loading || !config.conectado}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Testando...</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>Debug</span>
                </>
              )}
            </button>
            {!config.conectado && (
              <p className="text-xs text-gray-500 mt-2">
                ⚠️ Conecte ao ContaAzul para usar esta ferramenta
              </p>
            )}
          </div>

          {/* Status da Conexão */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="mb-3">
              <h4 className="font-semibold text-blue-800">📊 Status Debug</h4>
              <p className="text-sm text-blue-600 mt-1">
                Informações para debugging
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Conectado:</span>
                <span className={config.conectado ? 'text-green-600' : 'text-red-600'}>
                  {config.conectado ? '✅ Sim' : '❌ Não'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Token:</span>
                <span className={config.access_token ? 'text-green-600' : 'text-red-600'}>
                  {config.access_token ? '✅ Presente' : '❌ Ausente'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Expira:</span>
                <span className="text-gray-600">
                  {config.expires_at ? new Date(config.expires_at).toLocaleDateString('pt-BR') : 'N/A'}
                </span>
              </div>
            </div>
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