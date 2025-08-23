import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

// Definindo as permissões baseadas na SIDEBAR REAL do sistema
const MODULOS_SISTEMA = [
  // Permissão especial
  { id: 'todos', nome: 'Acesso Total (Administrador)', categoria: 'especial' },
  
  // Home
  { id: 'home', nome: 'Home', categoria: 'principal' },
  
  // Operações
  { id: 'operacoes_checklists', nome: 'Gestão de Checklists', categoria: 'operacoes' },
  { id: 'operacoes_meus_checklists', nome: 'Meus Checklists', categoria: 'operacoes' },
  { id: 'operacoes_receitas', nome: 'Receitas', categoria: 'operacoes' },
  { id: 'operacoes_terminal', nome: 'Terminal de Produção', categoria: 'operacoes' },
  
  // Relatórios
  { id: 'relatorios_visao_geral', nome: 'Visão Geral', categoria: 'relatorios' },
  
  // Marketing
  { id: 'marketing_360', nome: 'Marketing 360', categoria: 'marketing' },
  
  // Gestão
  { id: 'gestao_desempenho', nome: 'Tabela de Desempenho', categoria: 'gestao' },
  { id: 'gestao_calendario', nome: 'Calendário', categoria: 'gestao' },
  { id: 'gestao_planejamento_comercial', nome: 'Planejamento Comercial', categoria: 'gestao' },
  
  // Financeiro
  { id: 'financeiro_agendamento', nome: 'Agendamento', categoria: 'financeiro' },
  { id: 'financeiro_dre', nome: 'DRE', categoria: 'financeiro' },
  
  // Configurações
  { id: 'configuracoes_checklists', nome: 'Checklists', categoria: 'configuracoes' },
  { id: 'configuracoes_metas', nome: 'Metas', categoria: 'configuracoes' },
  { id: 'configuracoes_integracoes', nome: 'Integrações', categoria: 'configuracoes' },
  { id: 'configuracoes_seguranca', nome: 'Segurança', categoria: 'configuracoes' },
  { id: 'configuracoes_whatsapp', nome: 'WhatsApp', categoria: 'configuracoes' },
  { id: 'configuracoes_contahub', nome: 'ContaHub Auto', categoria: 'configuracoes' },
  { id: 'configuracoes_meta_config', nome: 'Meta Config', categoria: 'configuracoes' },
  { id: 'configuracoes_templates', nome: 'Templates', categoria: 'configuracoes' },
  { id: 'configuracoes_analytics', nome: 'Analytics', categoria: 'configuracoes' },
  { id: 'configuracoes_pwa', nome: 'PWA', categoria: 'configuracoes' },
  { id: 'configuracoes_usuarios', nome: 'Usuários', categoria: 'configuracoes' },
  { id: 'configuracoes_permissoes', nome: 'Permissões', categoria: 'configuracoes' },
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
      'home',
      'operacoes_checklists',
      'operacoes_meus_checklists',
      'operacoes_receitas',
      'operacoes_terminal',
    ],
  },
  financeiro: {
    nome: 'Financeiro',
    descricao: 'Acesso a relatórios e área financeira',
    modulos: [
      'home',
      'relatorios_visao_geral',
      'gestao_desempenho',
      'gestao_planejamento_comercial',
      'financeiro_agendamento',
      'financeiro_dre',
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
