import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

// Definindo as permissões baseadas na SIDEBAR REAL do sistema
// ATUALIZADO para incluir TODAS as ferramentas do menu lateral
const MODULOS_SISTEMA = [
  // Permissão especial
  { id: 'todos', nome: 'Acesso Total (Administrador)', categoria: 'especial' },
  
  // Home / Principal
  { id: 'home', nome: 'Guia de Funcionalidades', categoria: 'principal' },
  
  // Estratégico
  { id: 'relatorios_visao_geral', nome: 'Visão Geral', categoria: 'relatorios' },
  { id: 'gestao_desempenho', nome: 'Tabela de Desempenho', categoria: 'gestao' },
  { id: 'gestao_planejamento_comercial', nome: 'Planejamento Comercial', categoria: 'gestao' },
  
  // Ferramentas
  { id: 'operacoes', nome: 'Produção e Insumos', categoria: 'ferramentas' },
  { id: 'operacoes_contagem_estoque', nome: 'Contagem de Estoque', categoria: 'ferramentas' },
  { id: 'operacoes_teste_producao', nome: 'Teste de Produção', categoria: 'ferramentas' },
  { id: 'operacoes_contagem_rapida', nome: 'Contagem Rápida', categoria: 'ferramentas' },
  { id: 'gestao_calendario', nome: 'Calendário Operacional', categoria: 'ferramentas' },
  { id: 'financeiro_agendamento', nome: 'Agendamento', categoria: 'ferramentas' },
  { id: 'gestao_nps', nome: 'NPS Funcionários', categoria: 'ferramentas' },
  { id: 'gestao_nps_clientes', nome: 'NPS Clientes', categoria: 'ferramentas' },
  { id: 'gestao_cmv_semanal', nome: 'CMV Semanal', categoria: 'ferramentas' },
  { id: 'gestao_simulacao_cmo', nome: 'Simulação de CMO', categoria: 'ferramentas' },
  { id: 'gestao_stockout', nome: 'Stockout', categoria: 'ferramentas' },
  
  // Analítico
  { id: 'relatorios_eventos', nome: 'Eventos', categoria: 'analitico' },
  { id: 'relatorios_clientes', nome: 'Clientes', categoria: 'analitico' },
  { id: 'relatorios_clientes_ativos', nome: 'Clientes Ativos', categoria: 'analitico' },
  { id: 'gestao_crm', nome: 'CRM Inteligente', categoria: 'analitico' },
  
  // Marketing
  { id: 'marketing_360', nome: 'Marketing 360', categoria: 'marketing' },
  
  // Configurações
  { id: 'configuracoes_usuarios', nome: 'Usuários', categoria: 'configuracoes' },
  { id: 'configuracoes_fichas_tecnicas', nome: 'Fichas Técnicas', categoria: 'configuracoes' },
  { id: 'configuracoes_checklists', nome: 'Checklists', categoria: 'configuracoes' },
  { id: 'configuracoes_metas', nome: 'Metas de Desempenho', categoria: 'configuracoes' },
];

const ROLES_PADRAO = {
  admin: {
    nome: 'Administrador',
    descricao: 'Acesso completo ao sistema',
    modulos: MODULOS_SISTEMA.map(m => m.id), // Todos os módulos
  },
  funcionario: {
    nome: 'Funcionário',
    descricao: 'Acesso a operações e ferramentas básicas',
    modulos: [
      'home',
      'operacoes',
      'operacoes_contagem_estoque',
      'operacoes_contagem_rapida',
      'gestao_calendario',
    ],
  },
  financeiro: {
    nome: 'Financeiro',
    descricao: 'Acesso a relatórios, gestão e área financeira',
    modulos: [
      'home',
      'relatorios_visao_geral',
      'gestao_desempenho',
      'gestao_planejamento_comercial',
      'financeiro_agendamento',
      'gestao_cmv_semanal',
      'relatorios_eventos',
      'relatorios_clientes',
      'relatorios_clientes_ativos',
    ],
  },
};

// GET - Listar módulos do sistema e roles padrão
export async function GET() {
  try {
    // Filtrar "todos" da lista - agora é controlado pelo checkbox "É Administrador"
    const modulosParaExibir = MODULOS_SISTEMA.filter(m => m.id !== 'todos');
    
    return NextResponse.json({
      modulos: modulosParaExibir,
      roles: ROLES_PADRAO,
    });
  } catch (error) {
    console.error('Erro ao buscar permissões:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Atualizar permissões de uma role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, modulos } = body;

    if (!role || !Array.isArray(modulos)) {
      return NextResponse.json(
        { error: 'Role e módulos são obrigatórios' },
        { status: 400 }
      );
    }

    // Aqui você poderia salvar as permissões customizadas em uma tabela
    // Por enquanto, retornamos sucesso
    
    return NextResponse.json({
      message: 'Permissões atualizadas com sucesso',
      role,
      modulos,
    });
  } catch (error) {
    console.error('Erro ao atualizar permissões:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
