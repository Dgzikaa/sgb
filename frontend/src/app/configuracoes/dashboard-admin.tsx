import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿'use client';

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

interface Evento {
  id?: number;
  nome: string;
  data: string;
  tipo: string;
  descricao?: string;
  bar_id: number;
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
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [editingEvent, setEditingEvent] = useState<Evento | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  
  // Estados para configurações de APIs por bar
  const [barConfigs, setBarConfigs] = useState<Record<number, any>>({});
  
  // Estados para configurações gerais do sistema
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
    
    // Segurança
    admin_password: '',
    jwt_secret: '',
    
    // Features
    monitoring_enabled: true,
    debug_enabled: false,
    auto_sync_enabled: true,
    notifications_enabled: true
  });

  // Estados para verificação de receitas
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
      console.log('⚠️ Carregando bares do banco de dados...');
      const response = await fetch('/api/bars');
      console.log('⚠️ Response status:', response.status);
      
      const result = await response.json();
      console.log('⚠️ Resultado da API:', result);
      
      if (result.success) {
        setBars(result.data);
        
        // Selecionar automaticamente o Bar Ordinário (ID 1) por padrão
        const barOrdinario = result.data.find((bar: Bar) => bar.id === 1);
        if (barOrdinario && !selectedBarId) {
          setSelectedBarId(1);
        }
        
        setMessage(`✅ ${result.data.length} bares carregados com sucesso!`);
        console.log(`✅ ${result.data.length} bares carregados:`, result.data);
      } else {
        setMessage(`❌ Erro ao carregar bares: ${result.error}`);
        console.error('❌ Erro da API:', result.error);
        setBars([]);
      }
    } catch (error) {
      console.error('⚠️ Erro ao carregar bares:', error);
      setMessage(`⚠️ Erro de conexão: ${error}`);
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
        setConfigs({ ...configs, ...JSON.parse(saved) as unknown });
      }

      // Carregar configurações dos bares
      const savedBarConfigs = localStorage.getItem('sgb-bar-configs');
      if (savedBarConfigs) {
        setBarConfigs(JSON.parse(savedBarConfigs) as unknown);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const saveConfigs = async () => {
    setLoading(true);
    try {
      localStorage.setItem('sgb-admin-configs', JSON.stringify(configs));
      setMessage('Configurações salvas com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setMessage('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  // Funções para Planejamento Comercial
  const loadEventos = async () => {
    // Não carregar eventos se nenhum bar estiver selecionado
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

  const saveEvento = async (evento: Evento) => {
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
    // Encontrar o bar ordinário pelo nome
    const barOrdinario = bars.find((bar) => 
      bar.nome.toLowerCase().includes('ordinário') || 
      bar.nome.toLowerCase().includes('ordinario')
    );
    
    if (!barOrdinario) {
      setMessage('❌ Bar Ordinário não encontrado na lista de bares');
      return;
    }
    
    const confirmacao = confirm(
      `⚠️ Deseja importar os dados históricos de Fevereiro a Junho 2025 para o ${barOrdinario.nome}?\n\n` +
      '⚠️ Isso incluirá:\n' +
      '🎵 ~150 eventos de diferentes gêneros\n' +
      '🎵 Informações de artistas e capacidade\n' +
      '🎵 Eventos recorrentes (Quarta de Bamba, Pagode Vira-lata, etc.)\n' +
      '🎵 Eventos especiais (Carnaval, Homenagens, Festival Junino)\n\n' +
      '✅ Se já existirem eventos no período, eles serão substituídos.'
    );
    
    if (!confirmacao) return;
    
    setLoading(true);
    try {
      console.log(`⚠️ Importando eventos para bar: ${barOrdinario.nome} (ID: ${barOrdinario.id})`);
      
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
          `✅ Atenção: Já existem ${result1.eventos_existentes} eventos no período!\n\n` +
          `⚠️ Eventos para importar: ${result1.eventos_para_importar}\n` +
          `⚠️ Eventos existentes: ${result1.eventos_existentes}\n\n` +
          'Deseja SUBSTITUIR os eventos existentes pelos dados históricos?'
        );
        
        if (!confirmarSubstituicao) {
          setLoading(false);
          return;
        }
        
        // Segunda tentativa - confirmar substituição
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
            `✅ ${result2.eventos_importados} eventos importados com sucesso!\n\n` +
            `⚠️ Resumo por mês:\n` +
            `🎵 Fevereiro: ${result2.resumo.fevereiro} eventos\n` +
            `🎵 Março: ${result2.resumo.marco} eventos\n` +
            `🎵 Abril: ${result2.resumo.abril} eventos\n` +
            `🎵 Maio: ${result2.resumo.maio} eventos\n` +
            `🎵 Junho: ${result2.resumo.junho} eventos\n\n` +
            `✅ Gêneros: ${result2.generos_detectados.join(', ')}`
          );
          loadEventos();
        } else {
          setMessage(`❌ Erro na importação: ${result2.error}`);
        }
      } else if (result1.success) {
        setMessage(
          `✅ ${result1.eventos_importados} eventos importados com sucesso!\n\n` +
          `⚠️ Resumo por mês:\n` +
          `🎵 Fevereiro: ${result1.resumo.fevereiro} eventos\n` +
          `🎵 Março: ${result1.resumo.marco} eventos\n` +
          `🎵 Abril: ${result1.resumo.abril} eventos\n` +
          `🎵 Maio: ${result1.resumo.maio} eventos\n` +
          `🎵 Junho: ${result1.resumo.junho} eventos\n\n` +
          `✅ Gêneros: ${result1.generos_detectados.join(', ')}`
        );
        loadEventos();
      } else {
        setMessage(`❌ Erro na importação: ${result1.error}`);
      }
    } catch (error) {
      console.error('Erro ao importar eventos históricos:', error);
      setMessage('❌ Erro ao importar eventos históricos');
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
        
        // Atualizar estado local com as configurações migradas
        setBarConfigs({
          ...barConfigs,
          [barId]: {
            ...barConfigs[barId],
            ...migratedConfigs
          }
        });
        
        setMessage(`✅ Migração concluída! ${summary.successful}/${summary.total} APIs migradas com sucesso`);
        
        // Log detalhado
        console.log('⚠️ Migração detalhada:', migrationLog);
      } else {
        setMessage(`❌ Erro na migração: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao migrar configurações:', error);
      setMessage('❌ Erro ao migrar configurações existentes');
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
      const savedBarConfigs = JSON.parse(localStorage.getItem('sgb-bar-configs') as unknown || '{}');
      savedBarConfigs[barId] = currentBarConfig;
      localStorage.setItem('sgb-bar-configs', JSON.stringify(savedBarConfigs));
      
      const barName = bars.find((b) => b.id === barId)?.nome || 'Bar';
      setMessage(`✅ Configurações do ${barName} salvas com sucesso!`);
      setTimeout(() => setMessage(''), 3000);
      
      console.log(`⚠️ Configurações salvas para bar ${barId}:`, currentBarConfig);
    } catch (error) {
      console.error('Erro ao salvar configurações do bar:', error);
      setMessage('Erro ao salvar configurações do bar');
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
      setMessage('❌ Sistema ContaHub não está habilitado para este bar');
      return;
    }

    const credentials = {
      username: barConfigs[barId]?.contahub_login,
      password: barConfigs[barId]?.contahub_password,
      base_url: barConfigs[barId]?.contahub_url,
      empresa_id: barConfigs[barId]?.contahub_empresa_id
    };

    if (!credentials.username || !credentials.password) {
      setMessage('❌ Credenciais incompletas. Login e senha são obrigatórios.');
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
        setMessage(`✅ Conexão bem-sucedida! Tempo de resposta: ${result.data.responseTime}ms`);
        
        // Atualizar configuração com sucesso
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
        setMessage(`❌ Falha na conexão: ${errorMsg}`);
        
        // Atualizar configuração com erro
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
      console.error('Erro ao testar conexão:', error);
      const errorMsg = 'Erro de comunicação com o servidor';
      setMessage(`❌ ${errorMsg}`);
      
      // Atualizar configuração com erro
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
      setMessage('Nome e endereço são obrigatórios');
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
        setBars(bars.filter((bar) => bar.id !== id));
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
      setMessage('❌ Selecione um bar primeiro');
      return;
    }

    setVerificandoReceitas(true);
    try {
      console.log(`⚠️ Verificando receitas problemáticas para bar ${selectedBarId}...`);
      
              const response = await fetch(`/api/receitas/verificar-sem-nome?bar_id=${selectedBarId}`);
      const result = await response.json();
      
      if (result.success) {
        setResultadoVerificacao(result.data);
        
        const { estatisticas } = result.data;
        let mensagem = `✅ Verificação concluída!\n\n`;
        mensagem += `⚠️ ESTATÍSTICAS:\n`;
        mensagem += `🎵 Total de receitas: ${estatisticas.total_receitas}\n`;
        mensagem += `🎵 Total de problemas: ${estatisticas.total_problemas}\n\n`;
        
        if (estatisticas.total_problemas > 0) {
          mensagem += `❌ PROBLEMAS ENCONTRADOS:\n`;
          if (estatisticas.codigo_sem_nome > 0) {
            mensagem += `🎵 ${estatisticas.codigo_sem_nome} insumos com código mas sem nome\n`;
          }
          if (estatisticas.nome_sem_codigo > 0) {
            mensagem += `🎵 ${estatisticas.nome_sem_codigo} insumos com nome mas sem código\n`;
          }
          if (estatisticas.sem_codigo_e_nome > 0) {
            mensagem += `🎵 ${estatisticas.sem_codigo_e_nome} insumos sem código e sem nome\n`;
          }
          mensagem += `\n⚠️ Verifique o console para mais detalhes.`;
        } else {
          mensagem += `✅ Nenhum problema encontrado! Todas as receitas estão OK.`;
        }
        
        setMessage(mensagem);
        
        // Log detalhado no console
        if (result.data.problemas.length > 0) {
          console.log(`✅ PROBLEMAS ENCONTRADOS:`, result.data.problemas);
          console.log(`⚠️ RECEITAS COM PROBLEMAS:`, result.data.receitas_com_problemas);
        }
      } else {
        setMessage(`❌ Erro na verificação: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao verificar receitas:', error);
      setMessage('❌ Erro ao verificar receitas problemáticas');
    } finally {
      setVerificandoReceitas(false);
      setTimeout(() => setMessage(''), 10000); // Mensagem mais longa
    }
  };

  const adicionarCamposProducao = async () => {
    setLoading(true);
    try {
      console.log('⚠️ Executando migration para campos de aderência à  receita...');
      
              const response = await fetch('/api/producoes/adicionar-campos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage(`✅ Migration executada com sucesso!\n\n` +
                  `⚠️ Detalhes:\n` +
                  `🎵 Campo na tabela produções: ${result.detalhes.campo_producoes}\n` +
                  `🎵 Atualização tabela insumos: ${result.detalhes.tabela_insumos}\n` +
                  `🎵 Criação de índices: ${result.detalhes.indices}\n\n` +
                  `✅ Agora o sistema pode calcular o percentual de aderência à  receita!`);
      } else {
        setMessage(`❌ Erro na migration: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao executar migration:', error);
      setMessage('❌ Erro ao executar migration de campos');
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
          <p>Gerencie todas as configurações do sistema SGB</p>
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
              {bars.map((bar) => (
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
            ⚠️ Salvar Configurações
          </button>
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes('sucesso') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Informações do Bar Selecionado */}
      {selectedBarId && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem' }}>
                  ⚠️ {bars.find((b) => b.id === selectedBarId)?.nome}
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                  ⚠️ {bars.find((b) => b.id === selectedBarId)?.endereco} | 
                  ⚠️ {bars.find((b) => b.id === selectedBarId)?.telefone}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {getStatusBadge(bars.find((b) => b.id === selectedBarId)?.status || 'inativo')}
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Criado em {new Date(bars.find((b) => b.id === selectedBarId)?.created_at || '').toLocaleDateString('pt-BR')}
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
            ⚠️ Visão Geral
          </button>
          <button 
            className={`tab-button ${currentTab === 'apis' ? 'active' : ''}`}
            onClick={() => setCurrentTab('apis')}
          >
            ⚠️ APIs
          </button>
          <button 
            className={`tab-button ${currentTab === 'bars' ? 'active' : ''}`}
            onClick={() => setCurrentTab('bars')}
          >
            ⚠️ Bares
          </button>
          <button 
            className={`tab-button ${currentTab === 'services' ? 'active' : ''}`}
            onClick={() => setCurrentTab('services')}
          >
            ✅ Serviços
          </button>
          <button 
            className={`tab-button ${currentTab === 'sistemas' ? 'active' : ''}`}
            onClick={() => setCurrentTab('sistemas')}
          >
            ⚠️ Sistemas
          </button>
          <button 
            className={`tab-button ${currentTab === 'security' ? 'active' : ''}`}
            onClick={() => setCurrentTab('security')}
          >
            🔒 Segurança
          </button>
          <button 
            className={`tab-button ${currentTab === 'monitoring' ? 'active' : ''}`}
            onClick={() => setCurrentTab('monitoring')}
          >
            📈 Monitoramento
          </button>
          <button 
            className={`tab-button ${currentTab === 'planejamento' ? 'active' : ''}`}
            onClick={() => setCurrentTab('planejamento')}
          >
            🎵 Planejamento
          </button>
          <button 
            className={`tab-button ${currentTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setCurrentTab('analytics')}
          >
            📈 Analytics
          </button>
        </div>

        {/* Visão Geral */}
        {currentTab === 'overview' && (
          <div className="tab-content">
            {selectedBarId && (
              <div className="alert alert-info" style={{ marginBottom: '20px' }}>
                ⚠️ Visualizando dados específicos de: <strong>{bars.find((b) => b.id === selectedBarId)?.nome}</strong>
              </div>
            )}
            <div className="grid grid-3">
              <div className="card">
                <div className="card-header">
                  <h3>⚠️ Status do Sistema</h3>
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
                      {selectedBarId ? '1 (selecionado)' : bars.filter((b) => b.status === 'ativo').length}
                    </span>
                  </div>
                  {selectedBarId && (
                    <>
                      <div className="stat-row">
                        <span>APIs Configuradas:</span>
                        <span className="stat-value text-green">
                          {Object.values(barConfigs[selectedBarId] || {}).filter((v) => 
                            typeof v === 'boolean' && v === true
                          ).length}
                        </span>
                      </div>
                      <div className="stat-row">
                        <span>Sistema Integrado:</span>
                        <span className="stat-value">
                          {barConfigs[selectedBarId]?.contahub_login ? 
                            <span className="text-green">✅ ContaHub</span> : 
                            <span className="text-red">❌ Nenhum</span>
                          }
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>⚠️ Monitoramento</h3>
                </div>
                <div className="card-content">
                  <button 
                    onClick={runApiMonitoring} 
                    disabled={loading}
                    className="btn btn-primary btn-full"
                  >
                    {loading ? '⚠️ Verificando...' : '✅ Verificar APIs'}
                  </button>
                  
                  {monitoringResult && (
                    <div className="last-check">
                      Última verificação: {new Date(monitoringResult.timestamp).toLocaleString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>✅ Ações Rápidas</h3>
                </div>
                <div className="card-content">
                  <button className="btn btn-outline btn-full">
                    ⚠️ Backup do Banco
                  </button>
                  <button className="btn btn-outline btn-full">
                    ⚠️ Sincronizar Dados
                  </button>
                  <button className="btn btn-outline btn-full">
                    ⚠️ Gerar Nova API Key
                  </button>
                  <button 
                    onClick={verificarReceitasProblematicas}
                    disabled={verificandoReceitas || !selectedBarId}
                    className="btn btn-outline btn-full"
                    title={!selectedBarId ? 'Selecione um bar primeiro' : 'Verificar receitas com insumos problemáticos'}
                  >
                    {verificandoReceitas ? '⚠️ Verificando...' : '✅ Verificar Receitas'}
                  </button>
                  <button 
                    onClick={adicionarCamposProducao}
                    disabled={loading}
                    className="btn btn-outline btn-full"
                    title="Adicionar campos para controle de aderência à  receita"
                  >
                    {loading ? '⚠️ Executando...' : '⚠️ Migrar Campos Produção'}
                  </button>
                </div>
              </div>
            </div>

            {/* Resultado do Monitoramento */}
            {monitoringResult && (
              <div className="card mt-20">
                <div className="card-header">
                  <h3>⚠️ Status das APIs</h3>
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

        {/* Configuração de APIs por Bar */}
        {currentTab === 'apis' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">
                <h3>⚠️ APIs Conectadas{selectedBarId ? ` - ${bars.find((b) => b.id === selectedBarId)?.nome}` : ''}</h3>
                <p>
                  {selectedBarId 
                    ? `Configure as APIs específicas para ${bars.find((b) => b.id === selectedBarId)?.nome}`
                    : 'Selecione um bar no cabeçalho para ver suas APIs específicas'
                  }
                </p>
              </div>
              <div className="card-content">
                {!selectedBarId && (
                  <div className="alert alert-info">
                    ⚠️ Selecione um bar no seletor do cabeçalho para configurar suas APIs específicas
                  </div>
                )}

                {/* Configurações de APIs (só aparece quando um bar for selecionado) */}
                {selectedBarId && (
                  <div className="form-section">
                    <div style={{ marginBottom: '20px' }}>
                      <h4>⚠️ Status das APIs Configuradas</h4>
                      <div className="grid grid-2" style={{ marginBottom: '20px' }}>
                        <div className="api-status-card">
                          <div className="api-header">
                            <span className="api-name">Sympla</span>
                            {barConfigs[selectedBarId]?.sympla_enabled ? 
                              <span className="status-badge status-online">✅ Ativa</span> : 
                              <span className="status-badge status-offline">❌ Inativa</span>
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
                              <span className="status-badge status-online">✅ Ativa</span> : 
                              <span className="status-badge status-offline">❌ Inativa</span>
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
                              <span className="status-badge status-online">✅ Ativa</span> : 
                              <span className="status-badge status-offline">❌ Inativa</span>
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
                              <span className="status-badge status-online">✅ Ativa</span> : 
                              <span className="status-badge status-offline">❌ Inativa</span>
                            }
                          </div>
                          {barConfigs[selectedBarId]?.openai_key && (
                            <div className="api-time">Chave configurada</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <h4>✅ Configurar APIs</h4>
                    
                    <div className="grid grid-2">
                      <div>
                        <h5>APIs de Produção</h5>
                        
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
                        <h5>APIs Futuras</h5>
                        
                                        <div className="alert alert-info">
                  Essas APIs serão integradas em breve. Configure antecipadamente.
                </div>
                
                {/* Botão de Migração */}
                <div className="form-group">
                  <button 
                    onClick={() => migrateExistingConfigs(selectedBarId)}
                    disabled={loading || migrating}
                    className="btn btn-outline"
                    style={{ marginBottom: '10px' }}
                  >
                    {migrating ? '⚠️ Migrando...' : '⚠️ Migrar APIs Existentes'}
                  </button>
                  <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
                    Importa as configurações de APIs já funcionando no sistema (Sympla, Yuzer, Google Places, OpenAI)
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
                        ⚠️ Salvar Configurações do Bar
                      </button>
                    </div>
                  </div>
                )}

                {!selectedBarId && (
                  <div className="alert alert-info">
                    ⚠️ Selecione um bar acima para configurar suas APIs específicas
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
                <h3>⚠️ Gerenciar Bares{selectedBarId ? ` - Foco: ${bars.find((b) => b.id === selectedBarId)?.nome}` : ''}</h3>
                <p>
                  {selectedBarId 
                    ? `Visualizando detalhes e configurações de ${bars.find((b) => b.id === selectedBarId)?.nome}`
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
                        placeholder="Ex: Bar do João"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="bar_endereco">Endereço</label>
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
                    ✅ Adicionar Bar
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
                      {loading ? '⚠️ Carregando...' : '⚠️ Recarregar'}
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
                            ✅ Editar
                          </button>
                          <button 
                            className="btn btn-small btn-outline btn-danger"
                            onClick={() => deleteBar(bar.id)}
                          >
                            ❌ Excluir
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

        {/* Serviços Externos */}
        {currentTab === 'services' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">
                <h3>✅ Serviços Externos</h3>
                <p>Configure integrações com serviços externos</p>
              </div>
              <div className="card-content">
                <div className="grid grid-2">
                  {/* ContaHub */}
                  <div>
                    <h4>⚠️ ContaHub</h4>
                    <div className="form-group">
                      <label htmlFor="contahub_username">Usuário</label>
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
                    <h4>⚠️ Discord</h4>
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
                <h3>⚠️ Sistemas de Bar{selectedBarId ? ` - ${bars.find((b) => b.id === selectedBarId)?.nome}` : ''}</h3>
                <p>
                  {selectedBarId 
                    ? `Configure sistemas de gestão para ${bars.find((b) => b.id === selectedBarId)?.nome} (ContaHub, etc.)`
                    : 'Configure e gerencie sistemas de gestão para cada bar (ContaHub, etc.)'
                  }
                </p>
              </div>
              <div className="card-content">
                <div className="form-section">
                  <h4>⚠️ Sistemas Disponíveis</h4>
                  <div className="bars-list">
                    <div className="bar-item">
                      <div className="bar-info">
                        <h5>ContaHub</h5>
                        <p>Sistema de gestão para bares e restaurantes</p>
                        <p><strong>Campos obrigatórios:</strong> Login e Senha</p>
                      </div>
                      <div className="bar-actions">
                        <span className="status-badge status-online">Ativo</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>✅ Configurar Sistema por Bar</h4>
                  
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
                      {bars.map((bar) => (
                        <option key={bar.id} value={bar.id}>
                          {bar.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Configurações quando um bar está selecionado */}
                  {selectedBarId && (
                    <div className="api-config-item">
                      <h5>⚠️ ContaHub - {bars.find((b) => b.id === selectedBarId)?.nome}</h5>
                      
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
                              placeholder="Senha do ContaHub"
                              className="form-input"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Segurança */}
        {currentTab === 'security' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">
                <h3>🔒 Segurança</h3>
              </div>
              <div className="card-content">
                <div className="form-section">
                  <h4>⚠️ Configurar Segurança</h4>
                  <div className="grid grid-2">
                    <div>
                      <h5>⚠️ Senha do Administrador</h5>
                      <div className="form-group">
                        <label htmlFor="admin_password">Senha</label>
                        <input
                          id="admin_password"
                          type="password"
                          value={configs.admin_password}
                          onChange={(e) => setConfigs({...configs, admin_password: e.target.value})}
                          className="form-input"
                        />
                      </div>
                    </div>
                    <div>
                      <h5>⚠️ Chave JWT</h5>
                      <div className="form-group">
                        <label htmlFor="jwt_secret">Chave</label>
                        <input
                          id="jwt_secret"
                          type="password"
                          value={configs.jwt_secret}
                          onChange={(e) => setConfigs({...configs, jwt_secret: e.target.value})}
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>
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
                <h3>📈 Monitoramento</h3>
              </div>
              <div className="card-content">
                <div className="form-section">
                  <h4>⚠️ Configurar Monitoramento</h4>
                  <div className="grid grid-2">
                    <div>
                      <h5>⚠️ Habilitar Monitoramento</h5>
                      <div className="form-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={configs.monitoring_enabled}
                            onChange={(e) => setConfigs({...configs, monitoring_enabled: e.target.checked})}
                          />
                          Habilitar Monitoramento
                        </label>
                      </div>
                    </div>
                    <div>
                      <h5>⚠️ Habilitar Debug</h5>
                      <div className="form-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={configs.debug_enabled}
                            onChange={(e) => setConfigs({...configs, debug_enabled: e.target.checked})}
                          />
                          Habilitar Debug
                        </label>
                      </div>
                    </div>
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
                <h3>🎵 Planejamento</h3>
              </div>
              <div className="card-content">
                <div className="form-section">
                  <h4>⚠️ Configurar Planejamento Comercial</h4>
                  <div className="grid grid-2">
                    <div>
                      <h5>⚠️ Habilitar Planejamento</h5>
                      <div className="form-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={configs.auto_sync_enabled}
                            onChange={(e) => setConfigs({...configs, auto_sync_enabled: e.target.checked})}
                          />
                          Habilitar Planejamento Automático
                        </label>
                      </div>
                    </div>
                    <div>
                      <h5>⚠️ Habilitar Notificações</h5>
                      <div className="form-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={configs.notifications_enabled}
                            onChange={(e) => setConfigs({...configs, notifications_enabled: e.target.checked})}
                          />
                          Habilitar Notificações
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics */}
        {currentTab === 'analytics' && (
          <div className="tab-content">
            <div className="card">
              <div className="card-header">
                <h3>📈 Analytics</h3>
              </div>
              <div className="card-content">
                <div className="form-section">
                  <h4>⚠️ Configurar Analytics</h4>
                  <div className="grid grid-2">
                    <div>
                      <h5>⚠️ Habilitar Analytics</h5>
                      <div className="form-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={configs.monitoring_enabled}
                            onChange={(e) => setConfigs({...configs, monitoring_enabled: e.target.checked})}
                          />
                          Habilitar Analytics
                        </label>
                      </div>
                    </div>
                    <div>
                      <h5>⚠️ Habilitar Debug</h5>
                      <div className="form-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={configs.debug_enabled}
                            onChange={(e) => setConfigs({...configs, debug_enabled: e.target.checked})}
                          />
                          Habilitar Debug
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}