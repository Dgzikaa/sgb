'use client';

import { useState, useEffect } from 'react';
import './admin.css';

interface Bar {
  id: number;
  nome: string;
  endereco: string;
  telefone: string;
  status: 'ativo' | 'inativo';
  created_at: string;
}

interface ApiStatus {
  name: string;
  status: 'online' | 'offline' | 'pending';
  responseTime?: number;
  error?: string;
  category: 'production' | 'pending';
}

interface MonitoringResult {
  timestamp: string;
  summary: {
    total: number;
    online: number;
    offline: number;
    pending: number;
  };
  apis: Record<string, ApiStatus>;
}

export default function AdminPage() {
  const [currentTab, setCurrentTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [monitoringResult, setMonitoringResult] = useState<MonitoringResult | null>(null);
  const [bars, setBars] = useState<Bar[]>([]);
  const [newBar, setNewBar] = useState({ nome: '', endereco: '', telefone: '' });
  const [message, setMessage] = useState('');
  const [selectedBarId, setSelectedBarId] = useState<number | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [migrating, setMigrating] = useState(false);
  
  // Estados para Planejamento Comercial
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [eventos, setEventos] = useState<any[]>([]);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  
  // Estados para configura·ß·µes de APIs por bar
  const [barConfigs, setBarConfigs] = useState<Record<number, any>>({});
  
  // Estados para configura·ß·µes gerais do sistema
  const [configs, setConfigs] = useState({
    // ContaHub
    contahub_username: '',
    contahub_password: '',
    contahub_url: '',
    
    // Discord
    discord_webhook: '',
    discord_bot_token: '',
    discord_channel_alerts: '',
    
    // Email
    email_provider: 'sendgrid',
    email_api_key: '',
    email_from: '',
    
    // Seguran·ßa
    admin_password: '',
    jwt_secret: '',
    
    // Features
    monitoring_enabled: true,
    debug_enabled: false,
    auto_sync_enabled: true,
    notifications_enabled: true
  });

  // Estados para verifica·ß·£o de receitas
  const [verificandoReceitas, setVerificandoReceitas] = useState(false);
  const [resultadoVerificacao, setResultadoVerificacao] = useState<any>(null);

  useEffect(() => {
    loadBars();
    loadConfigs();
  }, []);

  useEffect(() => {
    if (currentTab === 'planejamento') {
      loadEventos();
    }
  }, [currentTab, currentMonth, currentYear, selectedBarId]);

  const loadBars = async () => {
    setLoading(true);
    try {
      console.log('üîç Carregando bares do banco de dados...');
      const response = await fetch('/api/bars');
      console.log('üì° Response status:', response.status);
      
      const result = await response.json();
      console.log('üìä Resultado da API:', result);
      
      if (result.success) {
        setBars(result.data);
        
        // Selecionar automaticamente o Bar Ordin·°rio (ID 1) por padr·£o
        const barOrdinario = result.data.find((bar: Bar) => bar.id === 1);
        if (barOrdinario && !selectedBarId) {
          setSelectedBarId(1);
        }
        
        setMessage(`úÖ ${result.data.length} bares carregados com sucesso!`);
        console.log(`úÖ ${result.data.length} bares carregados:`, result.data);
      } else {
        setMessage(`ùå Erro ao carregar bares: ${result.error}`);
        console.error('ùå Erro da API:', result.error);
        setBars([]);
      }
    } catch (error) {
      console.error('üí• Erro ao carregar bares:', error);
      setMessage(`üí• Erro de conex·£o: ${error}`);
      setBars([]);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const loadConfigs = async () => {
    try {
      const saved = localStorage.getItem('sgb-admin-configs');
      if (saved) {
        setConfigs({ ...configs, ...JSON.parse(saved) });
      }

      // Carregar configura·ß·µes dos bares
      const savedBarConfigs = localStorage.getItem('sgb-bar-configs');
      if (savedBarConfigs) {
        setBarConfigs(JSON.parse(savedBarConfigs));
      }
    } catch (error) {
      console.error('Erro ao carregar configura·ß·µes:', error);
    }
  };

  const saveConfigs = async () => {
    setLoading(true);
    try {
      localStorage.setItem('sgb-admin-configs', JSON.stringify(configs));
      setMessage('Configura·ß·µes salvas com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar configura·ß·µes:', error);
      setMessage('Erro ao salvar configura·ß·µes');
    } finally {
      setLoading(false);
    }
  };

  // Fun·ß·µes para Planejamento Comercial
  const loadEventos = async () => {
    // N·£o carregar eventos se nenhum bar estiver selecionado
    if (!selectedBarId) {
      setEventos([]);
      return;
    }
    
    try {
      const params = new URLSearchParams({
        mes: currentMonth.toString(),
        ano: currentYear.toString(),
        bar_id: selectedBarId.toString()
      });

      const response = await fetch(`/api/eventos?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setEventos(result.data);
      } else {
        setMessage(`Erro ao carregar eventos: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      setMessage('Erro ao carregar eventos');
    }
  };

  const saveEvento = async (evento: any) => {
    setLoading(true);
    try {
      const method = evento.id ? 'PUT' : 'POST';
      const response = await fetch('/api/eventos', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evento)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage('Evento salvo com sucesso!');
        setShowEventModal(false);
        setEditingEvent(null);
        loadEventos();
      } else {
        setMessage(`Erro ao salvar evento: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      setMessage('Erro ao salvar evento');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const deleteEvento = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este evento?')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/eventos?id=${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage('Evento deletado com sucesso!');
        loadEventos();
      } else {
        setMessage(`Erro ao deletar evento: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      setMessage('Erro ao deletar evento');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const importarEventosHistoricos = async () => {
    // Encontrar o bar ordin·°rio pelo nome
    const barOrdinario = bars.find((bar: any) => 
      bar.nome.toLowerCase().includes('ordin·°rio') || 
      bar.nome.toLowerCase().includes('ordinario')
    );
    
    if (!barOrdinario) {
      setMessage('ùå Bar Ordin·°rio n·£o encontrado na lista de bares');
      return;
    }
    
    const confirmacao = confirm(
      `üöÄ Deseja importar os dados hist·≥ricos de Fevereiro a Junho 2025 para o ${barOrdinario.nome}?\n\n` +
      'üìä Isso incluir·°:\n' +
      'Ä¢ ~150 eventos de diferentes g·™neros\n' +
      'Ä¢ Informa·ß·µes de artistas e capacidade\n' +
      'Ä¢ Eventos recorrentes (Quarta de Bamba, Pagode Vira-lata, etc.)\n' +
      'Ä¢ Eventos especiais (Carnaval, Homenagens, Festival Junino)\n\n' +
      'ö†Ô∏è Se j·° existirem eventos no per·≠odo, eles ser·£o substitu·≠dos.'
    );
    
    if (!confirmacao) return;
    
    setLoading(true);
    try {
      console.log(`üìä Importando eventos para bar: ${barOrdinario.nome} (ID: ${barOrdinario.id})`);
      
      // Primeira tentativa - verificar se existem eventos
              const response1 = await fetch('/api/eventos/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bar_id: barOrdinario.id,
          ano: 2025,
          confirmar_substituicao: false
        })
      });
      
      const result1 = await response1.json();
      
      if (result1.requer_confirmacao) {
        const confirmarSubstituicao = confirm(
          `ö†Ô∏è Aten·ß·£o: J·° existem ${result1.eventos_existentes} eventos no per·≠odo!\n\n` +
          `üì• Eventos para importar: ${result1.eventos_para_importar}\n` +
          `üóëÔ∏è Eventos existentes: ${result1.eventos_existentes}\n\n` +
          'Deseja SUBSTITUIR os eventos existentes pelos dados hist·≥ricos?'
        );
        
        if (!confirmarSubstituicao) {
          setLoading(false);
          return;
        }
        
        // Segunda tentativa - confirmar substitui·ß·£o
        const response2 = await fetch('/api/eventos/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bar_id: barOrdinario.id,
            ano: 2025,
            confirmar_substituicao: true
          })
        });
        
        const result2 = await response2.json();
        
        if (result2.success) {
          setMessage(
            `üéâ ${result2.eventos_importados} eventos importados com sucesso!\n\n` +
            `üìÖ Resumo por m·™s:\n` +
            `Ä¢ Fevereiro: ${result2.resumo.fevereiro} eventos\n` +
            `Ä¢ Mar·ßo: ${result2.resumo.marco} eventos\n` +
            `Ä¢ Abril: ${result2.resumo.abril} eventos\n` +
            `Ä¢ Maio: ${result2.resumo.maio} eventos\n` +
            `Ä¢ Junho: ${result2.resumo.junho} eventos\n\n` +
            `üéµ G·™neros: ${result2.generos_detectados.join(', ')}`
          );
          loadEventos();
        } else {
          setMessage(`ùå Erro na importa·ß·£o: ${result2.error}`);
        }
      } else if (result1.success) {
        setMessage(
          `üéâ ${result1.eventos_importados} eventos importados com sucesso!\n\n` +
          `üìÖ Resumo por m·™s:\n` +
          `Ä¢ Fevereiro: ${result1.resumo.fevereiro} eventos\n` +
          `Ä¢ Mar·ßo: ${result1.resumo.marco} eventos\n` +
          `Ä¢ Abril: ${result1.resumo.abril} eventos\n` +
          `Ä¢ Maio: ${result1.resumo.maio} eventos\n` +
          `Ä¢ Junho: ${result1.resumo.junho} eventos\n\n` +
          `üéµ G·™neros: ${result1.generos_detectados.join(', ')}`
        );
        loadEventos();
      } else {
        setMessage(`ùå Erro na importa·ß·£o: ${result1.error}`);
      }
    } catch (error) {
      console.error('Erro ao importar eventos hist·≥ricos:', error);
      setMessage('ùå Erro ao importar eventos hist·≥ricos');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 10000); // Mensagem mais longa para mostrar o resumo
    }
  };

  const migrateExistingConfigs = async (barId: number) => {
    setMigrating(true);
    try {
              const response = await fetch('/api/configuracoes/migrate-apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetBarId: barId
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        const { migratedConfigs, migrationLog, summary } = result.data;
        
        // Atualizar estado local com as configura·ß·µes migradas
        setBarConfigs({
          ...barConfigs,
          [barId]: {
            ...barConfigs[barId],
            ...migratedConfigs
          }
        });
        
        setMessage(`úÖ Migra·ß·£o conclu·≠da! ${summary.successful}/${summary.total} APIs migradas com sucesso`);
        
        // Log detalhado
        console.log('üìã Migra·ß·£o detalhada:', migrationLog);
      } else {
        setMessage(`ùå Erro na migra·ß·£o: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao migrar configura·ß·µes:', error);
      setMessage('ùå Erro ao migrar configura·ß·µes existentes');
    } finally {
      setMigrating(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const saveBarConfigs = async (barId: number) => {
    setLoading(true);
    try {
      const currentBarConfig = barConfigs[barId] || {};
      
      // Salvar no localStorage (depois pode integrar com API)
      const savedBarConfigs = JSON.parse(localStorage.getItem('sgb-bar-configs') || '{}');
      savedBarConfigs[barId] = currentBarConfig;
      localStorage.setItem('sgb-bar-configs', JSON.stringify(savedBarConfigs));
      
      const barName = bars.find((b: any) => b.id === barId)?.nome || 'Bar';
      setMessage(`úÖ Configura·ß·µes do ${barName} salvas com sucesso!`);
      setTimeout(() => setMessage(''), 3000);
      
      console.log(`üíæ Configura·ß·µes salvas para bar ${barId}:`, currentBarConfig);
    } catch (error) {
      console.error('Erro ao salvar configura·ß·µes do bar:', error);
      setMessage('Erro ao salvar configura·ß·µes do bar');
    } finally {
      setLoading(false);
    }
  };

  const runApiMonitoring = async () => {
    setLoading(true);
    try {
              const response = await fetch('/api/configuracoes/monitor-apis', {
        method: 'POST',
      });
      
      const result = await response.json();
      setMonitoringResult(result);
      setMessage('Monitoramento executado com sucesso!');
    } catch (error) {
      console.error('Erro no monitoramento:', error);
      setMessage('Erro ao executar monitoramento');
    } finally {
      setLoading(false);
    }
  };

  const testSystemConnection = async (barId: number) => {
    if (!barConfigs[barId]?.contahub_enabled) {
      setMessage('ùå Sistema ContaHub n·£o est·° habilitado para este bar');
      return;
    }

    const credentials = {
      username: barConfigs[barId]?.contahub_login,
      password: barConfigs[barId]?.contahub_password,
      base_url: barConfigs[barId]?.contahub_url,
      empresa_id: barConfigs[barId]?.contahub_empresa_id
    };

    if (!credentials.username || !credentials.password) {
      setMessage('ùå Credenciais incompletas. Login e senha s·£o obrigat·≥rios.');
      return;
    }

    setTestingConnection(true);
    try {
              const response = await fetch('/api/configuracoes/bar-systems?action=test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barId,
          credentials,
          systemType: 'contahub'
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.data.success) {
        setMessage(`úÖ Conex·£o bem-sucedida! Tempo de resposta: ${result.data.responseTime}ms`);
        
        // Atualizar configura·ß·£o com sucesso
        setBarConfigs({
          ...barConfigs,
          [barId]: {
            ...barConfigs[barId],
            last_test_status: 'success',
            last_test_time: new Date().toISOString(),
            last_error: null
          }
        });
      } else {
        const errorMsg = result.data?.message || result.error || 'Erro desconhecido';
        setMessage(`ùå Falha na conex·£o: ${errorMsg}`);
        
        // Atualizar configura·ß·£o com erro
        setBarConfigs({
          ...barConfigs,
          [barId]: {
            ...barConfigs[barId],
            last_test_status: 'failed',
            last_test_time: new Date().toISOString(),
            last_error: errorMsg
          }
        });
      }
    } catch (error) {
      console.error('Erro ao testar conex·£o:', error);
      const errorMsg = 'Erro de comunica·ß·£o com o servidor';
      setMessage(`ùå ${errorMsg}`);
      
      // Atualizar configura·ß·£o com erro
      setBarConfigs({
        ...barConfigs,
        [barId]: {
          ...barConfigs[barId],
          last_test_status: 'failed',
          last_test_time: new Date().toISOString(),
          last_error: errorMsg
        }
      });
    } finally {
      setTestingConnection(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const addBar = async () => {
    if (!newBar.nome || !newBar.endereco) {
      setMessage('Nome e endere·ßo s·£o obrigat·≥rios');
      return;
    }

    setLoading(true);
    try {
              const response = await fetch('/api/bars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBar)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setBars([...bars, result.data]);
        setNewBar({ nome: '', endereco: '', telefone: '' });
        setMessage('Bar adicionado com sucesso!');
      } else {
        setMessage(result.error || 'Erro ao adicionar bar');
      }
    } catch (error) {
      console.error('Erro ao adicionar bar:', error);
      setMessage('Erro ao adicionar bar');
    } finally {
      setLoading(false);
    }
  };

  const deleteBar = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este bar?')) return;
    
    try {
              const response = await fetch(`/api/bars?id=${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setBars(bars.filter((bar: any) => bar.id !== id));
        setMessage('Bar removido com sucesso!');
      } else {
        setMessage(result.error || 'Erro ao remover bar');
      }
    } catch (error) {
      console.error('Erro ao deletar bar:', error);
      setMessage('Erro ao remover bar');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      online: 'status-badge status-online',
      offline: 'status-badge status-offline',
      pending: 'status-badge status-pending',
      ativo: 'status-badge status-online',
      inativo: 'status-badge status-offline'
    };
    
    return (
      <span className={statusClasses[status as keyof typeof statusClasses]}>
        {status}
      </span>
    );
  };

  const verificarReceitasProblematicas = async () => {
    if (!selectedBarId) {
      setMessage('ùå Selecione um bar primeiro');
      return;
    }

    setVerificandoReceitas(true);
    try {
      console.log(`üîç Verificando receitas problem·°ticas para bar ${selectedBarId}...`);
      
              const response = await fetch(`/api/receitas/verificar-sem-nome?bar_id=${selectedBarId}`);
      const result = await response.json();
      
      if (result.success) {
        setResultadoVerificacao(result.data);
        
        const { estatisticas } = result.data;
        let mensagem = `úÖ Verifica·ß·£o conclu·≠da!\n\n`;
        mensagem += `üìä ESTAT·çSTICAS:\n`;
        mensagem += `Ä¢ Total de receitas: ${estatisticas.total_receitas}\n`;
        mensagem += `Ä¢ Total de problemas: ${estatisticas.total_problemas}\n\n`;
        
        if (estatisticas.total_problemas > 0) {
          mensagem += `ùå PROBLEMAS ENCONTRADOS:\n`;
          if (estatisticas.codigo_sem_nome > 0) {
            mensagem += `Ä¢ ${estatisticas.codigo_sem_nome} insumos com c·≥digo mas sem nome\n`;
          }
          if (estatisticas.nome_sem_codigo > 0) {
            mensagem += `Ä¢ ${estatisticas.nome_sem_codigo} insumos com nome mas sem c·≥digo\n`;
          }
          if (estatisticas.sem_codigo_e_nome > 0) {
            mensagem += `Ä¢ ${estatisticas.sem_codigo_e_nome} insumos sem c·≥digo e sem nome\n`;
          }
          mensagem += `\nüìã Verifique o console para mais detalhes.`;
        } else {
          mensagem += `úÖ Nenhum problema encontrado! Todas as receitas est·£o OK.`;
        }
        
        setMessage(mensagem);
        
        // Log detalhado no console
        if (result.data.problemas.length > 0) {
          console.log(`ö†Ô∏è PROBLEMAS ENCONTRADOS:`, result.data.problemas);
          console.log(`üìã RECEITAS COM PROBLEMAS:`, result.data.receitas_com_problemas);
        }
      } else {
        setMessage(`ùå Erro na verifica·ß·£o: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao verificar receitas:', error);
      setMessage('ùå Erro ao verificar receitas problem·°ticas');
    } finally {
      setVerificandoReceitas(false);
      setTimeout(() => setMessage(''), 10000); // Mensagem mais longa
    }
  };

  const adicionarCamposProducao = async () => {
    setLoading(true);
    try {
      console.log('üîß Executando migration para campos de ader·™ncia ·† receita...');
      
              const response = await fetch('/api/producoes/adicionar-campos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage(`úÖ Migration executada com sucesso!\n\n` +
                  `üìä Detalhes:\n` +
                  `Ä¢ Campo na tabela produ·ß·µes: ${result.detalhes.campo_producoes}\n` +
                  `Ä¢ Atualiza·ß·£o tabela insumos: ${result.detalhes.tabela_insumos}\n` +
                  `Ä¢ Cria·ß·£o de ·≠ndices: ${result.detalhes.indices}\n\n` +
                  `üéØ Agora o sistema pode calcular o percentual de ader·™ncia ·† receita!`);
      } else {
        setMessage(`ùå Erro na migration: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao executar migration:', error);
      setMessage('ùå Erro ao executar migration de campos');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 10000);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h1>Painel Administrativo</h1>
          <p>Gerencie todas as configura·ß·µes do sistema SGB</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Seletor de Bar Global */}
          <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
            <label htmlFor="global-bar-selector" style={{ fontSize: '0.8rem', marginBottom: '4px', color: '#64748b' }}>
              Selecionar Bar:
            </label>
            <select
              id="global-bar-selector"
              value={selectedBarId || ''}
              onChange={(e) => setSelectedBarId(e.target.value ? Number(e.target.value) : null)}
              className="form-input"
              style={{ padding: '8px 12px', fontSize: '0.9rem' }}
            >
              <option value="">-- Todos os Bares --</option>
              {bars.map((bar: any) => (
                <option key={bar.id} value={bar.id}>
                  {bar.nome}
                </option>
              ))}
            </select>
          </div>
          <button 
            onClick={saveConfigs} 
            disabled={loading}
            className="btn btn-primary"
          >
            üíæ Salvar Configura·ß·µes
          </button>
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes('sucesso') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Informa·ß·µes do Bar Selecionado */}
      {selectedBarId && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem' }}>
                  üè™ {bars.find((b: any) => b.id === selectedBarId)?.nome}
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                  üìç {bars.find((b: any) => b.id === selectedBarId)?.endereco} | 
                  üìû {bars.find((b: any) => b.id === selectedBarId)?.telefone}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {getStatusBadge(bars.find((b: any) => b.id === selectedBarId)?.status || 'inativo')}
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Criado em {new Date(bars.find((b: any) => b.id === selectedBarId)?.created_at || '').toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="tabs">
        <div className="tab-nav">
          <button 
            className={`tab-button ${currentTab === 'overview' ? 'active' : ''}`}
            onClick={() => setCurrentTab('overview')}
          >
            üìä Vis·£o Geral
          </button>
          <button 
            className={`tab-button ${currentTab === 'apis' ? 'active' : ''}`}
            onClick={() => setCurrentTab('apis')}
          >
            üì° APIs
          </button>
          <button 
            className={`tab-button ${currentTab === 'bars' ? 'active' : ''}`}
            onClick={() => setCurrentTab('bars')}
          >
            üç∫ Bares
          </button>
          <button 
            className={`tab-button ${currentTab === 'services' ? 'active' : ''}`}
            onClick={() => setCurrentTab('services')}
          >
            öôÔ∏è Servi·ßos
          </button>
          <button 
            className={`tab-button ${currentTab === 'sistemas' ? 'active' : ''}`}
            onClick={() => setCurrentTab('sistemas')}
          >
            üñ•Ô∏è Sistemas
          </button>
          <button 
            className={`tab-button ${currentTab === 'security' ? 'active' : ''}`}
            onClick={() => setCurrentTab('security')}
          >
            üîí Seguran·ßa
          </button>
          <button 
            className={`tab-button ${currentTab === 'monitoring' ? 'active' : ''}`}
            onClick={() => setCurrentTab('monitoring')}
          >
            üìà Monitoramento
          </button>
          <button 
            className={`tab-button ${currentTab === 'planejamento' ? 'active' : ''}`}
            onClick={() => setCurrentTab('planejamento')}
          >
            üéµ Planejamento
          </button>
          <button 
            className={`tab-button ${currentTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setCurrentTab('analytics')}
          >
            üìà Analytics
          </button>
        </div>

        {/* Vis·£o Geral */}
        {currentTab === 'overview' && (
          <div className="tab-content">
            {selectedBarId && (
              <div className="alert alert-info" style={{ marginBottom: '20px' }}>
                üìä Visualizando dados espec·≠ficos de: <strong>{bars.find((b: any) => b.id === selectedBarId)?.nome}</strong>
              </div>
            )}
            <div className="grid grid-3">
              <div className="card">
                <div className="card-header">
                  <h3>üìä Status do Sistema</h3>
                </div>
                <div className="card-content">
                  <div className="stat-row">
                    <span>APIs Online:</span>
                    <span className="stat-value text-green">
                      {monitoringResult?.summary.online || 0}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span>APIs Offline:</span>
                    <span className="stat-value text-red">
                      {monitoringResult?.summary.offline || 0}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span>Bares Ativos:</span>
                    <span className="stat-value text-blue">
                      {selectedBarId ? '1 (selecionado)' : bars.filter((b: any) => b.status === 'ativo').length}
                    </span>
                  </div>
                  {selectedBarId && (
                    <>
                      <div className="stat-row">
                        <span>APIs Configuradas:</span>
                        <span className="stat-value text-green">
                          {Object.values(barConfigs[selectedBarId] || {}).filter((v: any) => 
                            typeof v === 'boolean' && v === true
                          ).length}
                        </span>
                      </div>
                      <div className="stat-row">
                        <span>Sistema Integrado:</span>
                        <span className="stat-value">
                          {barConfigs[selectedBarId]?.contahub_login ? 
                            <span className="text-green">úÖ ContaHub</span> : 
                            <span className="text-red">ùå Nenhum</span>
                          }
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>üîç Monitoramento</h3>
                </div>
                <div className="card-content">
                  <button 
                    onClick={runApiMonitoring} 
                    disabled={loading}
                    className="btn btn-primary btn-full"
                  >
                    {loading ? 'üîÑ Verificando...' : 'ñ∂Ô∏è Verificar APIs'}
                  </button>
                  
                  {monitoringResult && (
                    <div className="last-check">
                      ·öltima verifica·ß·£o: {new Date(monitoringResult.timestamp).toLocaleString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>ö° A·ß·µes R·°pidas</h3>
                </div>
                <div className="card-content">
                  <button className="btn btn-outline btn-full">
                    üíæ Backup do Banco
                  </button>
                  <button className="btn btn-outline btn-full">
                    üîÑ Sincronizar Dados
                  </button>
                  <button className="btn btn-outline btn-full">
                    üîë Gerar Nova API Key
                  </button>
                  <button 
                    onClick={verificarReceitasProblematicas}
                    disabled={verificandoReceitas || !selectedBarId}
                    className="btn btn-outline btn-full"
                    title={!selectedBarId ? 'Selecione um bar primeiro' : 'Verificar receitas com insumos problem·°ticos'}
                  >
                    {verificandoReceitas ? 'üîç Verificando...' : 'üß™ Verificar Receitas'}
                  </button>
                  <button 
                    onClick={adicionarCamposProducao}
                    disabled={loading}
                    className="btn btn-outline btn-full"
                    title="Adicionar campos para controle de ader·™ncia ·† receita"
                  >
                    {loading ? 'üîß Executando...' : 'üìä Migrar Campos Produ·ß·£o'}
                  </button>
                </div>
              </div>
            </div>

            {/* Resultado do Monitoramento */}
            {monitoringResult && (
              <div className="card mt-20">
                <div className="card-header">
                  <h3>üìà Status das APIs</h3>
                </div>
                <div className="card-content">
                  <div className="grid grid-4">
                    {Object.entries(monitoringResult.apis).map(([key, api]) => (
                      <div key={key} className="api-status-card">
                        <div className="api-header">
                          <span className="api-name">{api.name}</span>
                          {getStatusBadge(api.status)}
                        </div>
                        {api.responseTime && (
                          <div className="api-time">
                            {api.responseTime}ms
                          </div>
                        )}
                        {api.error && (
                          <div className="api-error">
                            {api.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Configura·ß·£o de APIs por Bar */}
        {currentTab === 'apis' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">
                <h3>üîå APIs Conectadas{selectedBarId ? ` - ${bars.find((b: any) => b.id === selectedBarId)?.nome}` : ''}</h3>
                <p>
                  {selectedBarId 
                    ? `Configure as APIs espec·≠ficas para ${bars.find((b: any) => b.id === selectedBarId)?.nome}`
                    : 'Selecione um bar no cabe·ßalho para ver suas APIs espec·≠ficas'
                  }
                </p>
              </div>
              <div className="card-content">
                {!selectedBarId && (
                  <div className="alert alert-info">
                    üëÜ Selecione um bar no seletor do cabe·ßalho para configurar suas APIs espec·≠ficas
                  </div>
                )}

                {/* Configura·ß·µes de APIs (s·≥ aparece quando um bar for selecionado) */}
                {selectedBarId && (
                  <div className="form-section">
                    <div style={{ marginBottom: '20px' }}>
                      <h4>üìã Status das APIs Configuradas</h4>
                      <div className="grid grid-2" style={{ marginBottom: '20px' }}>
                        <div className="api-status-card">
                          <div className="api-header">
                            <span className="api-name">Sympla</span>
                            {barConfigs[selectedBarId]?.sympla_enabled ? 
                              <span className="status-badge status-online">úÖ Ativa</span> : 
                              <span className="status-badge status-offline">ùå Inativa</span>
                            }
                          </div>
                          {barConfigs[selectedBarId]?.sympla_token && (
                            <div className="api-time">Token configurado</div>
                          )}
                        </div>
                        <div className="api-status-card">
                          <div className="api-header">
                            <span className="api-name">Yuzer</span>
                            {barConfigs[selectedBarId]?.yuzer_enabled ? 
                              <span className="status-badge status-online">úÖ Ativa</span> : 
                              <span className="status-badge status-offline">ùå Inativa</span>
                            }
                          </div>
                          {barConfigs[selectedBarId]?.yuzer_token && (
                            <div className="api-time">Token configurado</div>
                          )}
                        </div>
                        <div className="api-status-card">
                          <div className="api-header">
                            <span className="api-name">Google Places</span>
                            {barConfigs[selectedBarId]?.google_places_enabled ? 
                              <span className="status-badge status-online">úÖ Ativa</span> : 
                              <span className="status-badge status-offline">ùå Inativa</span>
                            }
                          </div>
                          {barConfigs[selectedBarId]?.google_places_key && (
                            <div className="api-time">Chave configurada</div>
                          )}
                        </div>
                        <div className="api-status-card">
                          <div className="api-header">
                            <span className="api-name">OpenAI</span>
                            {barConfigs[selectedBarId]?.openai_enabled ? 
                              <span className="status-badge status-online">úÖ Ativa</span> : 
                              <span className="status-badge status-offline">ùå Inativa</span>
                            }
                          </div>
                          {barConfigs[selectedBarId]?.openai_key && (
                            <div className="api-time">Chave configurada</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <h4>öôÔ∏è Configurar APIs</h4>
                    
                    <div className="grid grid-2">
                      <div>
                        <h5>üè≠ APIs de Produ·ß·£o</h5>
                        
                        <div className="api-config-item">
                          <div className="form-group">
                            <label>
                              <input
                                type="checkbox"
                                checked={barConfigs[selectedBarId]?.sympla_enabled || false}
                                onChange={(e) => setBarConfigs({
                                  ...barConfigs,
                                  [selectedBarId]: {
                                    ...barConfigs[selectedBarId],
                                    sympla_enabled: e.target.checked
                                  }
                                })}
                              />
                              <span style={{ marginLeft: '8px' }}>Habilitar Sympla</span>
                            </label>
                          </div>
                          
                          {barConfigs[selectedBarId]?.sympla_enabled && (
                            <div className="form-group">
                              <label htmlFor="sympla_token">Token Sympla</label>
                              <input
                                id="sympla_token"
                                type="password"
                                value={barConfigs[selectedBarId]?.sympla_token || ''}
                                onChange={(e) => setBarConfigs({
                                  ...barConfigs,
                                  [selectedBarId]: {
                                    ...barConfigs[selectedBarId],
                                    sympla_token: e.target.value
                                  }
                                })}
                                className="form-input"
                                placeholder="Token de acesso da Sympla"
                              />
                            </div>
                          )}
                        </div>

                        <div className="api-config-item">
                          <div className="form-group">
                            <label>
                              <input
                                type="checkbox"
                                checked={barConfigs[selectedBarId]?.yuzer_enabled || false}
                                onChange={(e) => setBarConfigs({
                                  ...barConfigs,
                                  [selectedBarId]: {
                                    ...barConfigs[selectedBarId],
                                    yuzer_enabled: e.target.checked
                                  }
                                })}
                              />
                              <span style={{ marginLeft: '8px' }}>Habilitar Yuzer</span>
                            </label>
                          </div>
                          
                          {barConfigs[selectedBarId]?.yuzer_enabled && (
                            <div className="form-group">
                              <label htmlFor="yuzer_token">Token Yuzer</label>
                              <input
                                id="yuzer_token"
                                type="password"
                                value={barConfigs[selectedBarId]?.yuzer_token || ''}
                                onChange={(e) => setBarConfigs({
                                  ...barConfigs,
                                  [selectedBarId]: {
                                    ...barConfigs[selectedBarId],
                                    yuzer_token: e.target.value
                                  }
                                })}
                                className="form-input"
                                placeholder="Token de acesso da Yuzer"
                              />
                            </div>
                          )}
                        </div>

                        <div className="api-config-item">
                          <div className="form-group">
                            <label>
                              <input
                                type="checkbox"
                                checked={barConfigs[selectedBarId]?.google_places_enabled || false}
                                onChange={(e) => setBarConfigs({
                                  ...barConfigs,
                                  [selectedBarId]: {
                                    ...barConfigs[selectedBarId],
                                    google_places_enabled: e.target.checked
                                  }
                                })}
                              />
                              <span style={{ marginLeft: '8px' }}>Habilitar Google Places</span>
                            </label>
                          </div>
                          
                          {barConfigs[selectedBarId]?.google_places_enabled && (
                            <div className="form-group">
                              <label htmlFor="google_places_key">Google Places API Key</label>
                              <input
                                id="google_places_key"
                                type="password"
                                value={barConfigs[selectedBarId]?.google_places_key || ''}
                                onChange={(e) => setBarConfigs({
                                  ...barConfigs,
                                  [selectedBarId]: {
                                    ...barConfigs[selectedBarId],
                                    google_places_key: e.target.value
                                  }
                                })}
                                className="form-input"
                                placeholder="Chave da API Google Places"
                              />
                            </div>
                          )}
                        </div>

                        <div className="api-config-item">
                          <div className="form-group">
                            <label>
                              <input
                                type="checkbox"
                                checked={barConfigs[selectedBarId]?.openai_enabled || false}
                                onChange={(e) => setBarConfigs({
                                  ...barConfigs,
                                  [selectedBarId]: {
                                    ...barConfigs[selectedBarId],
                                    openai_enabled: e.target.checked
                                  }
                                })}
                              />
                              <span style={{ marginLeft: '8px' }}>Habilitar OpenAI</span>
                            </label>
                          </div>
                          
                          {barConfigs[selectedBarId]?.openai_enabled && (
                            <div className="form-group">
                              <label htmlFor="openai_key">OpenAI API Key</label>
                              <input
                                id="openai_key"
                                type="password"
                                value={barConfigs[selectedBarId]?.openai_key || ''}
                                onChange={(e) => setBarConfigs({
                                  ...barConfigs,
                                  [selectedBarId]: {
                                    ...barConfigs[selectedBarId],
                                    openai_key: e.target.value
                                  }
                                })}
                                className="form-input"
                                placeholder="Chave da API OpenAI"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h5>è≥ APIs Futuras</h5>
                        
                                        <div className="alert alert-info">
                  ö†Ô∏è Essas APIs ser·£o integradas em breve. Configure antecipadamente.
                </div>
                
                {/* Bot·£o de Migra·ß·£o */}
                <div className="form-group">
                  <button 
                    onClick={() => migrateExistingConfigs(selectedBarId)}
                    disabled={loading || migrating}
                    className="btn btn-outline"
                    style={{ marginBottom: '10px' }}
                  >
                    {migrating ? 'üîÑ Migrando...' : 'üì• Migrar APIs Existentes'}
                  </button>
                  <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
                    üí° Importa as configura·ß·µes de APIs j·° funcionando no sistema (Sympla, Yuzer, Google Places, OpenAI)
                  </p>
                </div>
                        
                        <div className="api-config-item">
                          <div className="form-group">
                            <label>
                              <input type="checkbox" disabled />
                              <span style={{ marginLeft: '8px', color: '#9ca3af' }}>Conta Azul (Em breve)</span>
                            </label>
                          </div>
                        </div>

                        <div className="api-config-item">
                          <div className="form-group">
                            <label>
                              <input type="checkbox" disabled />
                              <span style={{ marginLeft: '8px', color: '#9ca3af' }}>GetIN (Em breve)</span>
                            </label>
                          </div>
                        </div>

                        <div className="api-config-item">
                          <div className="form-group">
                            <label>
                              <input type="checkbox" disabled />
                              <span style={{ marginLeft: '8px', color: '#9ca3af' }}>Google My Business (Em breve)</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="form-section">
                      <button 
                        onClick={() => saveBarConfigs(selectedBarId)}
                        disabled={loading}
                        className="btn btn-primary"
                      >
                        üíæ Salvar Configura·ß·µes do Bar
                      </button>
                    </div>
                  </div>
                )}

                {!selectedBarId && (
                  <div className="alert alert-info">
                    üëÜ Selecione um bar acima para configurar suas APIs espec·≠ficas
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Gerenciamento de Bares */}
        {currentTab === 'bars' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">
                <h3>üç∫ Gerenciar Bares{selectedBarId ? ` - Foco: ${bars.find((b: any) => b.id === selectedBarId)?.nome}` : ''}</h3>
                <p>
                  {selectedBarId 
                    ? `Visualizando detalhes e configura·ß·µes de ${bars.find((b: any) => b.id === selectedBarId)?.nome}`
                    : 'Adicione, edite ou remova bares do sistema'
                  }
                </p>
              </div>
              <div className="card-content">
                {/* Adicionar Novo Bar */}
                <div className="form-section">
                  <h4>Adicionar Novo Bar</h4>
                  <div className="grid grid-3">
                    <div className="form-group">
                      <label htmlFor="bar_nome">Nome do Bar</label>
                      <input
                        id="bar_nome"
                        value={newBar.nome}
                        onChange={(e) => setNewBar({...newBar, nome: e.target.value})}
                        placeholder="Ex: Bar do Jo·£o"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="bar_endereco">Endere·ßo</label>
                      <input
                        id="bar_endereco"
                        value={newBar.endereco}
                        onChange={(e) => setNewBar({...newBar, endereco: e.target.value})}
                        placeholder="Rua A, 123 - Centro"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="bar_telefone">Telefone</label>
                      <input
                        id="bar_telefone"
                        value={newBar.telefone}
                        onChange={(e) => setNewBar({...newBar, telefone: e.target.value})}
                        placeholder="(11) 99999-9999"
                        className="form-input"
                      />
                    </div>
                  </div>
                  <button onClick={addBar} disabled={loading} className="btn btn-primary">
                    ûï Adicionar Bar
                  </button>
                </div>

                {/* Lista de Bares */}
                <div className="form-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4>Bares Cadastrados</h4>
                    <button 
                      onClick={loadBars} 
                      disabled={loading}
                      className="btn btn-outline btn-small"
                    >
                      {loading ? 'üîÑ Carregando...' : 'üîÑ Recarregar'}
                    </button>
                  </div>
                  <div className="bars-list">
                    {bars.map((bar) => (
                      <div key={bar.id} className="bar-item">
                        <div className="bar-info">
                          <h5>{bar.nome}</h5>
                          <p>{bar.endereco}</p>
                          <p>{bar.telefone}</p>
                        </div>
                        <div className="bar-actions">
                          {getStatusBadge(bar.status)}
                          <button className="btn btn-small btn-outline">
                            úèÔ∏è Editar
                          </button>
                          <button 
                            className="btn btn-small btn-outline btn-danger"
                            onClick={() => deleteBar(bar.id)}
                          >
                            üóëÔ∏è Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Servi·ßos Externos */}
        {currentTab === 'services' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">
                <h3>öôÔ∏è Servi·ßos Externos</h3>
                <p>Configure integra·ß·µes com servi·ßos externos</p>
              </div>
              <div className="card-content">
                <div className="grid grid-2">
                  {/* ContaHub */}
                  <div>
                    <h4>üè¢ ContaHub</h4>
                    <div className="form-group">
                      <label htmlFor="contahub_username">Usu·°rio</label>
                      <input
                        id="contahub_username"
                        value={configs.contahub_username}
                        onChange={(e) => setConfigs({...configs, contahub_username: e.target.value})}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="contahub_password">Senha</label>
                      <input
                        id="contahub_password"
                        type="password"
                        value={configs.contahub_password}
                        onChange={(e) => setConfigs({...configs, contahub_password: e.target.value})}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="contahub_url">URL da API</label>
                      <input
                        id="contahub_url"
                        value={configs.contahub_url}
                        onChange={(e) => setConfigs({...configs, contahub_url: e.target.value})}
                        placeholder="https://api.contahub.com.br"
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Discord */}
                  <div>
                    <h4>üí¨ Discord</h4>
                    <div className="form-group">
                      <label htmlFor="discord_webhook">Webhook URL</label>
                      <input
                        id="discord_webhook"
                        type="password"
                        value={configs.discord_webhook}
                        onChange={(e) => setConfigs({...configs, discord_webhook: e.target.value})}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="discord_bot_token">Bot Token</label>
                      <input
                        id="discord_bot_token"
                        type="password"
                        value={configs.discord_bot_token}
                        onChange={(e) => setConfigs({...configs, discord_bot_token: e.target.value})}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="discord_channel_alerts">Canal de Alertas</label>
                      <input
                        id="discord_channel_alerts"
                        value={configs.discord_channel_alerts}
                        onChange={(e) => setConfigs({...configs, discord_channel_alerts: e.target.value})}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sistemas de Bar */}
        {currentTab === 'sistemas' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">
                <h3>üñ•Ô∏è Sistemas de Bar{selectedBarId ? ` - ${bars.find((b: any) => b.id === selectedBarId)?.nome}` : ''}</h3>
                <p>
                  {selectedBarId 
                    ? `Configure sistemas de gest·£o para ${bars.find((b: any) => b.id === selectedBarId)?.nome} (ContaHub, etc.)`
                    : 'Configure e gerencie sistemas de gest·£o para cada bar (ContaHub, etc.)'
                  }
                </p>
              </div>
              <div className="card-content">
                <div className="form-section">
                  <h4>üìã Sistemas Dispon·≠veis</h4>
                  <div className="bars-list">
                    <div className="bar-item">
                      <div className="bar-info">
                        <h5>ContaHub</h5>
                        <p>Sistema de gest·£o para bares e restaurantes</p>
                        <p><strong>Campos obrigat·≥rios:</strong> Login e Senha</p>
                      </div>
                      <div className="bar-actions">
                        <span className="status-badge status-online">Ativo</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>öôÔ∏è Configurar Sistema por Bar</h4>
                  
                  {/* Seletor de Bar */}
                  <div className="form-group">
                    <label htmlFor="sistema-bar-selector">Selecione o bar:</label>
                    <select
                      id="sistema-bar-selector"
                      value={selectedBarId || ''}
                      onChange={(e) => setSelectedBarId(e.target.value ? Number(e.target.value) : null)}
                      className="form-input"
                    >
                      <option value="">-- Selecione um bar --</option>
                      {bars.map((bar: any) => (
                        <option key={bar.id} value={bar.id}>
                          {bar.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Configura·ß·µes quando um bar ·© selecionado */}
                  {selectedBarId && (
                    <div className="api-config-item">
                      <h5>üñ•Ô∏è ContaHub - {bars.find((b: any) => b.id === selectedBarId)?.nome}</h5>
                      
                      <div className="form-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={barConfigs[selectedBarId]?.contahub_enabled || false}
                            onChange={(e) => setBarConfigs({
                              ...barConfigs,
                              [selectedBarId]: {
                                ...barConfigs[selectedBarId],
                                contahub_enabled: e.target.checked
                              }
                            })}
                          />
                          Habilitar ContaHub para este bar
                        </label>
                      </div>

                      {barConfigs[selectedBarId]?.contahub_enabled && (
                        <div className="grid grid-2">
                          <div className="form-group">
                            <label htmlFor={`contahub_login_${selectedBarId}`}>Login ContaHub</label>
                            <input
                              id={`contahub_login_${selectedBarId}`}
                              type="text"
                              value={barConfigs[selectedBarId]?.contahub_login || ''}
                              onChange={(e) => setBarConfigs({
                                ...barConfigs,
                                [selectedBarId]: {
                                  ...barConfigs[selectedBarId],
                                  contahub_login: e.target.value
                                }
                              })}
                              placeholder="usuario@contahub.com"
                              className="form-input"
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor={`contahub_password_${selectedBarId}`}>Senha ContaHub</label>
                            <input
                              id={`contahub_password_${selectedBarId}`}
                              type="password"
                              value={barConfigs[selectedBarId]?.contahub_password || ''}
                              onChange={(e) => setBarConfigs({
                                ...barConfigs,
                                [selectedBarId]: {
                                  ...barConfigs[selectedBarId],
                                  contahub_password: e.target.value
                                }
                              })}
                              placeholder="Ä¢Ä¢Ä¢Ä¢Ä¢Ä¢Ä¢Ä¢"
                              className="form-input"
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor={`contahub_url_${selectedBarId}`}>URL Base (opcional)</label>
                            <input
                              id={`contahub_url_${selectedBarId}`}
                              type="url"
                              value={barConfigs[selectedBarId]?.contahub_url || 'https://api.contahub.com.br'}
                              onChange={(e) => setBarConfigs({
                                ...barConfigs,
                                [selectedBarId]: {
                                  ...barConfigs[selectedBarId],
                                  contahub_url: e.target.value
                                }
                              })}
                              className="form-input"
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor={`contahub_empresa_id_${selectedBarId}`}>ID da Empresa (opcional)</label>
                            <input
                              id={`contahub_empresa_id_${selectedBarId}`}
                              type="text"
                              value={barConfigs[selectedBarId]?.contahub_empresa_id || ''}
                              onChange={(e) => setBarConfigs({
                                ...barConfigs,
                                [selectedBarId]: {
                                  ...barConfigs[selectedBarId],
                                  contahub_empresa_id: e.target.value
                                }
                              })}
                              placeholder="ID ·∫nico da empresa no ContaHub (opcional)"
                              className="form-input"
                            />
                          </div>
                        </div>
                      )}

                      <div className="form-group">
                        <button 
                          onClick={() => saveBarConfigs(selectedBarId)}
                          disabled={loading}
                          className="btn btn-primary"
                        >
                          {loading ? 'üíæ Salvando...' : 'üíæ Salvar Configura·ß·µes'}
                        </button>
                        
                        {barConfigs[selectedBarId]?.contahub_enabled && (
                          <button 
                            onClick={() => testSystemConnection(selectedBarId)}
                            disabled={loading || testingConnection}
                            className="btn btn-outline"
                          >
                            {testingConnection ? 'üîÑ Testando...' : 'üîç Testar Conex·£o'}
                          </button>
                        )}
                      </div>

                      {/* Status do ·∫ltimo teste */}
                      {barConfigs[selectedBarId]?.last_test_time && (
                        <div className="api-config-item">
                          <h5>üìä Status da ·öltima Conex·£o</h5>
                          <div className="form-group">
                            <div className="stat-row">
                              <span>Status:</span>
                              <span className={`status-badge ${
                                barConfigs[selectedBarId]?.last_test_status === 'success' 
                                  ? 'status-online' 
                                  : 'status-offline'
                              }`}>
                                {barConfigs[selectedBarId]?.last_test_status === 'success' ? 'úÖ Online' : 'ùå Offline'}
                              </span>
                            </div>
                            <div className="stat-row">
                              <span>·öltimo teste:</span>
                              <span>{new Date(barConfigs[selectedBarId]?.last_test_time).toLocaleString('pt-BR')}</span>
                            </div>
                            {barConfigs[selectedBarId]?.last_error && (
                              <div className="stat-row">
                                <span>Erro:</span>
                                <span className="text-red">{barConfigs[selectedBarId]?.last_error}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!selectedBarId && (
                    <div className="alert alert-info">
                      üëÜ Selecione um bar acima para configurar seus sistemas de gest·£o
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seguran·ßa */}
        {currentTab === 'security' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">
                <h3>üîí Configura·ß·µes de Seguran·ßa</h3>
                <p>Configure senhas e chaves de seguran·ßa do sistema</p>
              </div>
              <div className="card-content">
                <div className="form-group">
                  <label htmlFor="admin_password">Senha do Administrador</label>
                  <input
                    id="admin_password"
                    type="password"
                    value={configs.admin_password}
                    onChange={(e) => setConfigs({...configs, admin_password: e.target.value})}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="jwt_secret">JWT Secret</label>
                  <input
                    id="jwt_secret"
                    type="password"
                    value={configs.jwt_secret}
                    onChange={(e) => setConfigs({...configs, jwt_secret: e.target.value})}
                    className="form-input"
                  />
                </div>
                
                <div className="alert alert-warning">
                  üõ°Ô∏è Essas configura·ß·µes s·£o cr·≠ticas para a seguran·ßa do sistema. 
                  Altere apenas se necess·°rio e mantenha em local seguro.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monitoramento */}
        {currentTab === 'monitoring' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">
                <h3>üìà Configura·ß·µes de Monitoramento</h3>
                <p>Configure alertas, notifica·ß·µes e recursos de monitoramento</p>
              </div>
              <div className="card-content">
                <div className="form-section">
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={configs.monitoring_enabled}
                        onChange={(e) => setConfigs({...configs, monitoring_enabled: e.target.checked})}
                      />
                      <span>Habilitar Monitoramento de APIs</span>
                    </label>
                    
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={configs.notifications_enabled}
                        onChange={(e) => setConfigs({...configs, notifications_enabled: e.target.checked})}
                      />
                      <span>Habilitar Notifica·ß·µes</span>
                    </label>
                    
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={configs.auto_sync_enabled}
                        onChange={(e) => setConfigs({...configs, auto_sync_enabled: e.target.checked})}
                      />
                      <span>Sincroniza·ß·£o Autom·°tica</span>
                    </label>
                    
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={configs.debug_enabled}
                        onChange={(e) => setConfigs({...configs, debug_enabled: e.target.checked})}
                      />
                      <span>Modo Debug (Desenvolvimento)</span>
                    </label>
                  </div>
                </div>
                
                <div className="form-section">
                  <h4>üìß Email de Notifica·ß·µes</h4>
                  <div className="form-group">
                    <label htmlFor="email_api_key">API Key de Email</label>
                    <input
                      id="email_api_key"
                      type="password"
                      value={configs.email_api_key}
                      onChange={(e) => setConfigs({...configs, email_api_key: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email_from">Email Remetente</label>
                    <input
                      id="email_from"
                      value={configs.email_from}
                      onChange={(e) => setConfigs({...configs, email_from: e.target.value})}
                      placeholder="noreply@seubar.com.br"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Planejamento Comercial */}
        {currentTab === 'planejamento' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">
                <h3>üéµ Planejamento Comercial{selectedBarId ? ` - ${bars.find((b: any) => b.id === selectedBarId)?.nome}` : ''}</h3>
                <p>
                  {selectedBarId 
                    ? `Gerencie as atra·ß·µes e eventos de ${bars.find((b: any) => b.id === selectedBarId)?.nome} para todos os dias do m·™s`
                    : 'Gerencie as atra·ß·µes e eventos de todos os bares para todos os dias do m·™s'
                  }
                </p>
              </div>
              <div className="card-content">
                {!selectedBarId && (
                  <div className="alert alert-info" style={{ marginBottom: '20px' }}>
                    ÑπÔ∏è Selecione um bar no cabe·ßalho para focar no planejamento espec·≠fico, ou continue vendo todos os eventos
                  </div>
                )}
                
                {/* Controles do Calend·°rio */}
                <div className="form-section">
                  <div className="grid grid-2">
                    <div className="form-group">
                      <label htmlFor="month-selector">M·™s:</label>
                      <select
                        id="month-selector"
                        value={currentMonth}
                        onChange={(e) => setCurrentMonth(Number(e.target.value))}
                        className="form-input"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="year-selector">Ano:</label>
                      <select
                        id="year-selector"
                        value={currentYear}
                        onChange={(e) => setCurrentYear(Number(e.target.value))}
                        className="form-input"
                      >
                        {Array.from({ length: 5 }, (_, i) => {
                          const year = new Date().getFullYear() - 2 + i;
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button 
                      onClick={() => {
                        setEditingEvent({
                          bar_id: selectedBarId || bars[0]?.id,
                          data_evento: '',
                          nome: '',
                          descricao: '',
                          tipo_evento: 'musica_ao_vivo',
                          categoria_musical: '',
                          genero_musical: '',
                          artistas_bandas: '',
                          horario_inicio: '20:00',
                          horario_fim: '02:00'
                        });
                        setShowEventModal(true);
                      }}
                      className="btn btn-primary"
                    >
                      ûï Adicionar Evento
                    </button>
                    
                    <button 
                      onClick={loadEventos}
                      disabled={loading}
                      className="btn btn-outline"
                    >
                      {loading ? 'üîÑ Carregando...' : 'üîÑ Recarregar'}
                    </button>
                    
                    <button 
                      onClick={importarEventosHistoricos}
                      disabled={loading}
                      className="btn btn-outline"
                      style={{ backgroundColor: '#e67e22', color: 'white' }}
                    >
                      üìä Importar Dados Hist·≥ricos
                    </button>
                  </div>
                </div>

                {/* Calend·°rio do M·™s */}
                <div className="form-section">
                  <h4>üìÖ Eventos de {new Date(currentYear, currentMonth - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h4>
                  
                  <div className="calendar-grid">
                    {/* Cabe·ßalho dos dias da semana */}
                    <div className="calendar-header">
                      <div className="calendar-day-header">Dom</div>
                      <div className="calendar-day-header">Seg</div>
                      <div className="calendar-day-header">Ter</div>
                      <div className="calendar-day-header">Qua</div>
                      <div className="calendar-day-header">Qui</div>
                      <div className="calendar-day-header">Sex</div>
                      <div className="calendar-day-header">S·°b</div>
                    </div>
                    
                    {/* Dias do m·™s */}
                    <div className="calendar-body">
                      {(() => {
                        const firstDay = new Date(currentYear, currentMonth - 1, 1);
                        const lastDay = new Date(currentYear, currentMonth, 0);
                        const startDate = new Date(firstDay);
                        startDate.setDate(startDate.getDate() - firstDay.getDay());
                        
                        const days = [];
                        for (let i = 0; i < 42; i++) {
                          const date = new Date(startDate);
                          date.setDate(startDate.getDate() + i);
                          
                          // Fix timezone issue - compare dates directly as strings
                          const dateString = date.toISOString().split('T')[0];
                          const dayEvents = eventos.filter((e: any) => 
                            e.data_evento === dateString
                          );
                          
                          const isCurrentMonth = date.getMonth() === currentMonth - 1;
                          const isToday = date.toDateString() === new Date().toDateString();
                          
                          days.push(
                            <div
                              key={date.toISOString()}
                              className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                            >
                              <div className="calendar-day-number">{date.getDate()}</div>
                              <div className="calendar-day-events">
                                {dayEvents.slice(0, 2).map((evento: any, idx: any) => (
                                  <div
                                    key={evento.id}
                                    className="calendar-event"
                                    onClick={() => {
                                      setEditingEvent(evento);
                                      setShowEventModal(true);
                                    }}
                                    title={`${evento.nome} - ${evento.descricao || 'Sem descri·ß·£o'}`}
                                  >
                                    <span className="event-name">{evento.nome}</span>
                                    <span className="event-genre">{evento.genero_musical}</span>
                                  </div>
                                ))}
                                {dayEvents.length > 2 && (
                                  <div className="calendar-event-more">
                                    +{dayEvents.length - 2} mais
                                  </div>
                                )}
                                {dayEvents.length === 0 && isCurrentMonth && (
                                  <button
                                    className="add-event-btn"
                                    onClick={() => {
                                      setEditingEvent({
                                        bar_id: selectedBarId || bars[0]?.id,
                                        data_evento: date.toISOString().split('T')[0],
                                        nome: '',
                                        descricao: '',
                                        tipo_evento: 'musica_ao_vivo',
                                        categoria_musical: '',
                                        genero_musical: '',
                                        artistas_bandas: '',
                                        horario_inicio: '20:00',
                                        horario_fim: '02:00'
                                      });
                                      setShowEventModal(true);
                                    }}
                                  >
                                    ûï
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return days;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Lista detalhada dos eventos */}
                <div className="form-section">
                  <h4>üìã Lista de Eventos</h4>
                  <div className="events-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Nome</th>
                          <th>G·™nero</th>
                          <th>Artista/Banda</th>
                          <th>Hor·°rio</th>
                          <th>A·ß·µes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventos.map((evento: any) => (
                          <tr key={evento.id}>
                            <td>{new Date(evento.data_evento).toLocaleDateString('pt-BR')}</td>
                            <td>
                              <strong>{evento.nome}</strong>
                              {evento.descricao && <br />}
                              <small>{evento.descricao}</small>
                            </td>
                            <td>
                              <span className="genre-badge">{evento.genero_musical}</span>
                            </td>
                            <td>{evento.artistas_bandas}</td>
                            <td>
                              {evento.horario_inicio} - {evento.horario_fim}
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  onClick={() => {
                                    setEditingEvent(evento);
                                    setShowEventModal(true);
                                  }}
                                  className="btn btn-small btn-outline"
                                >
                                  úèÔ∏è
                                </button>
                                <button
                                  onClick={() => deleteEvento(evento.id)}
                                  className="btn btn-small btn-outline btn-danger"
                                >
                                  üóëÔ∏è
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {eventos.length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
                              üìÖ Nenhum evento encontrado para este per·≠odo
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Evento */}
        {showEventModal && editingEvent && (
          <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingEvent.id ? 'úèÔ∏è Editar Evento' : 'ûï Novo Evento'}</h3>
                <button 
                  onClick={() => setShowEventModal(false)}
                  className="modal-close"
                >
                  úï
                </button>
              </div>
              
              <div className="modal-body">
                <div className="grid grid-2">
                  <div className="form-group">
                    <label>Bar:</label>
                    <select
                      value={editingEvent.bar_id || ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        bar_id: Number(e.target.value)
                      })}
                      className="form-input"
                    >
                      {bars.map((bar: any) => (
                        <option key={bar.id} value={bar.id}>
                          {bar.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Data:</label>
                    <input
                      type="date"
                      value={editingEvent.data_evento}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        data_evento: e.target.value
                      })}
                      className="form-input"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Nome do Evento:</label>
                  <input
                    type="text"
                    value={editingEvent.nome}
                    onChange={(e) => setEditingEvent({
                      ...editingEvent,
                      nome: e.target.value
                    })}
                    placeholder="Ex: Noite do Pagode"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Descri·ß·£o:</label>
                  <textarea
                    value={editingEvent.descricao || ''}
                    onChange={(e) => setEditingEvent({
                      ...editingEvent,
                      descricao: e.target.value
                    })}
                    placeholder="Descri·ß·£o do evento..."
                    className="form-input"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-2">
                  <div className="form-group">
                    <label>G·™nero Musical:</label>
                    <select
                      value={editingEvent.genero_musical || ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        genero_musical: e.target.value
                      })}
                      className="form-input"
                    >
                      <option value="">Selecione...</option>
                      <option value="pagode">Pagode</option>
                      <option value="samba">Samba</option>
                      <option value="sertanejo">Sertanejo</option>
                      <option value="rock">Rock</option>
                      <option value="pop">Pop</option>
                      <option value="eletronica">Eletr·¥nica</option>
                      <option value="funk">Funk</option>
                      <option value="rap">Rap</option>
                      <option value="reggae">Reggae</option>
                      <option value="karaoke">Karaok·™</option>
                      <option value="dj_set">DJ Set</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Artista/Banda:</label>
                    <input
                      type="text"
                      value={editingEvent.artistas_bandas || ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        artistas_bandas: e.target.value
                      })}
                      placeholder="Nome do artista ou banda"
                      className="form-input"
                    />
                  </div>
                </div>
                
                <div className="grid grid-2">
                  <div className="form-group">
                    <label>Hor·°rio In·≠cio:</label>
                    <input
                      type="time"
                      value={editingEvent.horario_inicio || ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        horario_inicio: e.target.value
                      })}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Hor·°rio Fim:</label>
                    <input
                      type="time"
                      value={editingEvent.horario_fim || ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        horario_fim: e.target.value
                      })}
                      className="form-input"
                    />
                  </div>
                </div>
                
                <div className="grid grid-3">
                  <div className="form-group">
                    <label>Valor Cover:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingEvent.valor_cover || ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        valor_cover: e.target.value ? parseFloat(e.target.value) : null
                      })}
                      placeholder="0.00"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Valor Show:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingEvent.valor_show || ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        valor_show: e.target.value ? parseFloat(e.target.value) : null
                      })}
                      placeholder="0.00"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Capacidade:</label>
                    <input
                      type="number"
                      value={editingEvent.capacidade_estimada || ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent,
                        capacidade_estimada: e.target.value ? parseInt(e.target.value) : null
                      })}
                      placeholder="Ex: 200"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => saveEvento(editingEvent)}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics de Eventos */}
        {currentTab === 'analytics' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">
                <h3>üìà Analytics de Performance{selectedBarId ? ` - ${bars.find((b: any) => b.id === selectedBarId)?.nome}` : ''}</h3>
                <p>
                  {selectedBarId 
                    ? `An·°lise de performance dos artistas e eventos de ${bars.find((b: any) => b.id === selectedBarId)?.nome} por dados reais de faturamento`
                    : 'An·°lise de performance dos artistas e eventos por dados reais de faturamento'
                  }
                </p>
              </div>
              <div className="card-content">
                {!selectedBarId && (
                  <div className="alert alert-warning">
                    üìä Selecione um bar no cabe·ßalho para visualizar suas an·°lises de performance
                  </div>
                )}

                {selectedBarId && (
                  <AnalyticsContent barId={selectedBarId} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente separado para Analytics
function AnalyticsContent({ barId }: { barId: number }) {
  const [tipoAnalise, setTipoAnalise] = useState('artistas');
  const [dadosAnalytics, setDadosAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/eventos/analytics?bar_id=${barId}&tipo=${tipoAnalise}`);
      const result = await response.json();
      
      if (result.success) {
        setDadosAnalytics(result.data);
      } else {
        console.error('Erro ao carregar analytics:', result.error);
        setDadosAnalytics([]);
      }
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
      setDadosAnalytics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (barId) {
      carregarAnalytics();
    }
  }, [barId, tipoAnalise]);

  return (
    <div className="analytics-content">
      {/* Selector de Tipo de An·°lise */}
      <div className="form-group">
        <label>Tipo de An·°lise:</label>
        <select
          value={tipoAnalise}
          onChange={(e) => setTipoAnalise(e.target.value)}
          className="form-input"
        >
          <option value="artistas">üìä Por Artista/Banda</option>
          <option value="generos">üéµ Por G·™nero Musical</option>
          <option value="periodo">üìÖ Por Per·≠odo (Mensal)</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-analytics">
          <div>üîÑ Carregando an·°lises...</div>
        </div>
      ) : dadosAnalytics.length > 0 ? (
        <div className="analytics-results">
          {tipoAnalise === 'artistas' && (
            <div className="analytics-table">
              <h4>üé§ Performance por Artista</h4>
              <table>
                <thead>
                  <tr>
                    <th>Artista/Banda</th>
                    <th>Total Eventos</th>
                    <th>P·∫blico Total</th>
                    <th>Faturamento Total</th>
                    <th>Ticket M·©dio</th>
                    <th>P·∫blico M·©dio</th>
                    <th>·öltimo Evento</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosAnalytics.map((item: any, index: any) => (
                    <tr key={index}>
                      <td>
                        <strong>{item.nome}</strong>
                        <div className="genres">
                          {item.generos.slice(0, 2).map((genero: string) => (
                            <span key={genero} className="genre-tag">{genero}</span>
                          ))}
                        </div>
                      </td>
                      <td>{item.total_eventos}</td>
                      <td>{item.publico_total.toLocaleString('pt-BR')}</td>
                      <td>R$ {item.faturamento_total.toFixed(2)}</td>
                      <td>R$ {item.ticket_medio_geral.toFixed(2)}</td>
                      <td>{Math.round(item.publico_medio)}</td>
                      <td>{item.ultimo_evento?.data_evento ? new Date(item.ultimo_evento.data_evento).toLocaleDateString('pt-BR') : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tipoAnalise === 'generos' && (
            <div className="analytics-table">
              <h4>üéµ Performance por G·™nero Musical</h4>
              <table>
                <thead>
                  <tr>
                    <th>G·™nero</th>
                    <th>Total Eventos</th>
                    <th>Artistas ·önicos</th>
                    <th>P·∫blico Total</th>
                    <th>Faturamento Total</th>
                    <th>Ticket M·©dio</th>
                    <th>Melhor Evento</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosAnalytics.map((item: any, index: any) => (
                    <tr key={index}>
                      <td><strong>{item.genero}</strong></td>
                      <td>{item.total_eventos}</td>
                      <td>{item.total_artistas}</td>
                      <td>{item.publico_total.toLocaleString('pt-BR')}</td>
                      <td>R$ {item.faturamento_total.toFixed(2)}</td>
                      <td>R$ {item.ticket_medio_geral.toFixed(2)}</td>
                      <td>
                        {item.melhor_evento ? (
                          <div>
                            <strong>{item.melhor_evento.nome}</strong>
                            <br />
                            <small>R$ {item.melhor_evento.faturamento_liquido.toFixed(2)}</small>
                          </div>
                        ) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tipoAnalise === 'periodo' && (
            <div className="analytics-table">
              <h4>üìÖ Performance por Per·≠odo</h4>
              <table>
                <thead>
                  <tr>
                    <th>Per·≠odo</th>
                    <th>Total Eventos</th>
                    <th>P·∫blico Total</th>
                    <th>Faturamento Total</th>
                    <th>Ticket M·©dio</th>
                    <th>P·∫blico M·©dio/Evento</th>
                    <th>G·™neros</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosAnalytics.map((item: any, index: any) => (
                    <tr key={index}>
                      <td><strong>{item.periodo_label}</strong></td>
                      <td>{item.total_eventos}</td>
                      <td>{item.publico_total.toLocaleString('pt-BR')}</td>
                      <td>R$ {item.faturamento_total.toFixed(2)}</td>
                      <td>R$ {item.ticket_medio_geral.toFixed(2)}</td>
                      <td>{Math.round(item.publico_medio)}</td>
                      <td>
                        <div className="genres">
                          {item.generos.slice(0, 3).map((genero: string) => (
                            <span key={genero} className="genre-tag">{genero}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="no-data">
          <div>üìä Nenhum dado de performance encontrado</div>
          <p>Os eventos precisam ter dados de p·∫blico e faturamento sincronizados para aparecer nas an·°lises.</p>
        </div>
      )}
    </div>
  );
} 
