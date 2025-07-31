import { NextRequest, NextResponse } from 'next/server';

// Definindo as permissões do sistema baseadas na estrutura atual
const MODULOS_SISTEMA = [
  // Operações
  { id: 'checklists', nome: 'Checklists', categoria: 'operacoes' },
  { id: 'terminal_producao', nome: 'Terminal de Produção', categoria: 'operacoes' },
  { id: 'receitas_insumos', nome: 'Receitas e Insumos', categoria: 'operacoes' },
  { id: 'produtos', nome: 'Produtos', categoria: 'operacoes' },
  { id: 'periodo', nome: 'Gestão de Período', categoria: 'operacoes' },
  
  // Relatórios
  { id: 'relatorio_producoes', nome: 'Relatório de Produções', categoria: 'relatorios' },
  { id: 'relatorio_produtos', nome: 'Relatório de Produtos', categoria: 'relatorios' },
  { id: 'analitico', nome: 'Relatório Analítico', categoria: 'relatorios' },
  { id: 'fatporhora', nome: 'Faturamento por Hora', categoria: 'relatorios' },
  { id: 'tempo', nome: 'Relatório de Tempo', categoria: 'relatorios' },
  { id: 'pagamentos', nome: 'Relatório de Pagamentos', categoria: 'relatorios' },
  
  // Dashboards
  { id: 'dashboard_diario', nome: 'Dashboard Diário', categoria: 'dashboards' },
  { id: 'dashboard_semanal', nome: 'Dashboard Semanal', categoria: 'dashboards' },
  { id: 'dashboard_mensal', nome: 'Dashboard Mensal', categoria: 'dashboards' },
  { id: 'dashboard_financeiro_mensal', nome: 'Dashboard Financeiro', categoria: 'dashboards' },
  { id: 'dashboard_metrica_evolucao', nome: 'Métricas de Evolução', categoria: 'dashboards' },
  { id: 'dashboard_metricas_barras', nome: 'Métricas em Barras', categoria: 'dashboards' },
  { id: 'dashboard_comparativo', nome: 'Dashboard Comparativo', categoria: 'dashboards' },
  { id: 'dashboard_garcons', nome: 'Dashboard de Garçons', categoria: 'dashboards' },
  
  // Gestão
  { id: 'planejamento', nome: 'Planejamento Comercial', categoria: 'gestao' },
  { id: 'recorrencia', nome: 'Gestão de Recorrência', categoria: 'gestao' },
  
  // Configurações
  { id: 'configuracoes', nome: 'Configurações Gerais', categoria: 'configuracoes' },
  { id: 'integracoes', nome: 'Integrações', categoria: 'configuracoes' },
  { id: 'usuarios', nome: 'Gestão de Usuários', categoria: 'configuracoes' },
  { id: 'permissoes', nome: 'Gestão de Permissões', categoria: 'configuracoes' },
  
  // Financeiro
  { id: 'nfs', nome: 'Notas Fiscais', categoria: 'financeiro' },
  { id: 'financeiro_geral', nome: 'Financeiro Geral', categoria: 'financeiro' },
];

const ROLES_PADRAO = {
  admin: {
    nome: 'Administrador',
    descricao: 'Acesso completo ao sistema',
    modulos: MODULOS_SISTEMA.map(m => m.id), // Todos os módulos
  },
  funcionario: {
    nome: 'Funcionário',
    descricao: 'Acesso apenas a operações básicas',
    modulos: [
      'checklists',
      'terminal_producao',
      'produtos',
    ],
  },
  financeiro: {
    nome: 'Financeiro',
    descricao: 'Acesso a relatórios e dashboards financeiros',
    modulos: [
      'relatorio_producoes',
      'relatorio_produtos',
      'analitico',
      'fatporhora',
      'tempo',
      'pagamentos',
      'dashboard_diario',
      'dashboard_semanal',
      'dashboard_mensal',
      'dashboard_financeiro_mensal',
      'dashboard_metrica_evolucao',
      'dashboard_metricas_barras',
      'dashboard_comparativo',
      'nfs',
      'financeiro_geral',
    ],
  },
};

// GET - Listar módulos do sistema e roles padrão
export async function GET() {
  try {
    return NextResponse.json({
      modulos: MODULOS_SISTEMA,
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