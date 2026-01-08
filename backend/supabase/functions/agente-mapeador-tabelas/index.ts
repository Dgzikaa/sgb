import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * 🗺️ AGENTE MAPEADOR DE TABELAS
 * 
 * Responsável por:
 * - Mapear estrutura do banco de dados
 * - Explicar relacionamentos entre tabelas
 * - Descrever campos e seus significados
 * - Auxiliar na construção de queries
 */

console.log("🗺️ Agente Mapeador de Tabelas - Documentação do Schema");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento completo das tabelas do SGB
const SCHEMA_SGB = {
  // ===== TABELAS DE EVENTOS E FATURAMENTO =====
  eventos: {
    descricao: 'Tabela principal de eventos do bar - contém dados consolidados de cada dia/evento',
    campos: {
      id: 'ID único do evento',
      bar_id: 'ID do bar (FK para bars)',
      data_evento: 'Data do evento',
      nome: 'Nome do evento',
      real_r: 'Faturamento real do evento (R$)',
      pax_r: 'Público real (número de pessoas)',
      te_r: 'Ticket Entrada real (R$)',
      tb_r: 'Ticket Bebida real (R$)',
      m1_r: 'Meta 1 de faturamento',
      c_art: 'Custo artístico',
      c_prod: 'Custo de produção',
      percent_art_fat: 'Percentual do custo artístico sobre faturamento'
    },
    relacionamentos: ['bars', 'contahub_analitico', 'yuzer_eventos']
  },

  // ===== TABELAS CONTAHUB =====
  contahub_analitico: {
    descricao: 'Dados analíticos de vendas por produto - detalhamento item a item',
    campos: {
      id: 'ID único do registro',
      bar_id: 'ID do bar',
      trn_dtgerencial: 'Data gerencial da transação',
      prd_desc: 'Descrição do produto',
      grp_desc: 'Grupo/categoria do produto',
      qtd: 'Quantidade vendida',
      valorfinal: 'Valor final da venda',
      custo: 'Custo do produto',
      desconto: 'Desconto aplicado'
    },
    relacionamentos: ['eventos', 'bars']
  },

  contahub_fatporhora: {
    descricao: 'Faturamento por hora do dia - análise de picos de vendas',
    campos: {
      id: 'ID único',
      bar_id: 'ID do bar',
      vd_dtgerencial: 'Data gerencial',
      hora: 'Hora do dia (0-23)',
      valor: 'Valor total na hora',
      qtd: 'Quantidade de vendas'
    },
    relacionamentos: ['eventos', 'bars']
  },

  contahub_pagamentos: {
    descricao: 'Registro de pagamentos - formas de pagamento utilizadas',
    campos: {
      id: 'ID único',
      bar_id: 'ID do bar',
      dt_gerencial: 'Data gerencial',
      meio: 'Meio de pagamento (Crédito, Débito, PIX, Dinheiro)',
      valor: 'Valor do pagamento',
      taxa: 'Taxa aplicada',
      liquido: 'Valor líquido'
    },
    relacionamentos: ['eventos', 'bars']
  },

  contahub_periodo: {
    descricao: 'Dados de período/comanda - informações de clientes e consumo',
    campos: {
      id: 'ID único',
      bar_id: 'ID do bar',
      dt_gerencial: 'Data gerencial',
      cli_nome: 'Nome do cliente',
      cli_email: 'Email do cliente',
      cli_fone: 'Telefone do cliente',
      pessoas: 'Número de pessoas na mesa',
      vr_pagamentos: 'Valor total pago',
      vr_produtos: 'Valor em produtos',
      vd_mesadesc: 'Descrição da mesa/comanda'
    },
    relacionamentos: ['eventos', 'bars']
  },

  contahub_tempo: {
    descricao: 'Tempos de produção e entrega - KPIs operacionais',
    campos: {
      id: 'ID único',
      bar_id: 'ID do bar',
      data: 'Data do registro',
      prd_desc: 'Descrição do produto',
      t0_lancamento: 'Timestamp do lançamento',
      t2_prodfim: 'Timestamp fim da produção',
      t3_entrega: 'Timestamp da entrega',
      t0_t2: 'Tempo lançamento até produção (segundos)',
      t0_t3: 'Tempo lançamento até entrega (segundos)'
    },
    relacionamentos: ['eventos', 'bars']
  },

  // ===== TABELAS NIBO (FINANCEIRO) =====
  nibo_agendamentos: {
    descricao: 'Agendamentos financeiros do NIBO - contas a pagar e receber',
    campos: {
      id: 'ID único',
      bar_id: 'ID do bar',
      nibo_id: 'ID no sistema NIBO',
      tipo: 'Tipo (receita/despesa)',
      status: 'Status do agendamento',
      valor: 'Valor do agendamento',
      data_vencimento: 'Data de vencimento',
      data_competencia: 'Data de competência',
      descricao: 'Descrição do lançamento',
      categoria_nome: 'Nome da categoria',
      stakeholder_nome: 'Nome do fornecedor/cliente'
    },
    relacionamentos: ['bars']
  },

  // ===== TABELAS DE RESERVAS =====
  getin_reservas: {
    descricao: 'Reservas do sistema GetIn',
    campos: {
      id: 'ID único',
      bar_id: 'ID do bar',
      reservation_id: 'ID da reserva no GetIn',
      date: 'Data da reserva',
      time: 'Horário da reserva',
      name: 'Nome do cliente',
      email: 'Email do cliente',
      phone: 'Telefone',
      guests: 'Número de pessoas',
      status: 'Status da reserva'
    },
    relacionamentos: ['bars', 'eventos']
  },

  // ===== TABELAS YUZER (EVENTOS ESPECIAIS) =====
  yuzer_eventos: {
    descricao: 'Eventos do sistema Yuzer - shows e eventos especiais',
    campos: {
      id: 'ID único',
      bar_id: 'ID do bar',
      evento_id: 'ID do evento no Yuzer',
      nome_evento: 'Nome do evento',
      data_inicio: 'Data de início',
      data_fim: 'Data de fim'
    },
    relacionamentos: ['bars', 'eventos']
  },

  yuzer_produtos: {
    descricao: 'Produtos vendidos em eventos Yuzer',
    campos: {
      id: 'ID único',
      bar_id: 'ID do bar',
      evento_id: 'ID do evento',
      produto_nome: 'Nome do produto',
      quantidade: 'Quantidade vendida',
      valor_total: 'Valor total'
    },
    relacionamentos: ['yuzer_eventos']
  },

  // ===== TABELAS DE CONFIGURAÇÃO =====
  bars: {
    descricao: 'Cadastro de bares/estabelecimentos',
    campos: {
      id: 'ID único do bar',
      nome: 'Nome do bar',
      ativo: 'Se está ativo',
      created_at: 'Data de criação'
    },
    relacionamentos: ['eventos', 'usuarios_bar', 'api_credentials']
  },

  usuarios_bar: {
    descricao: 'Usuários com acesso ao sistema por bar',
    campos: {
      id: 'ID único',
      bar_id: 'ID do bar',
      email: 'Email do usuário',
      role: 'Função (admin, gerente, operador)',
      modulos_permitidos: 'Módulos que pode acessar'
    },
    relacionamentos: ['bars']
  }
};

interface MapeadorRequest {
  action: 'listar_tabelas' | 'detalhar_tabela' | 'buscar_campo' | 'sugerir_query' | 'explicar_relacionamento';
  tabela?: string;
  campo?: string;
  termo_busca?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const request: MapeadorRequest = await req.json();
    const { action, tabela, campo, termo_busca } = request;

    console.log(`🗺️ Ação: ${action}`);

    let resposta: Record<string, unknown> = {};

    switch (action) {
      case 'listar_tabelas':
        resposta = {
          tabelas: Object.entries(SCHEMA_SGB).map(([nome, info]) => ({
            nome,
            descricao: info.descricao,
            total_campos: Object.keys(info.campos).length
          })),
          total: Object.keys(SCHEMA_SGB).length
        };
        break;

      case 'detalhar_tabela':
        if (!tabela || !SCHEMA_SGB[tabela as keyof typeof SCHEMA_SGB]) {
          throw new Error(`Tabela "${tabela}" não encontrada`);
        }
        resposta = {
          tabela,
          ...SCHEMA_SGB[tabela as keyof typeof SCHEMA_SGB]
        };
        break;

      case 'buscar_campo':
        if (!termo_busca) {
          throw new Error('termo_busca é obrigatório');
        }
        
        const termoLower = termo_busca.toLowerCase();
        const resultados: Array<{ tabela: string; campo: string; descricao: string }> = [];
        
        for (const [nomeTabela, info] of Object.entries(SCHEMA_SGB)) {
          for (const [nomeCampo, descricao] of Object.entries(info.campos)) {
            if (nomeCampo.toLowerCase().includes(termoLower) || 
                descricao.toLowerCase().includes(termoLower)) {
              resultados.push({
                tabela: nomeTabela,
                campo: nomeCampo,
                descricao
              });
            }
          }
        }
        
        resposta = {
          termo_busca,
          resultados,
          total: resultados.length
        };
        break;

      case 'sugerir_query':
        if (!termo_busca) {
          throw new Error('termo_busca é obrigatório para sugerir query');
        }
        
        // Sugestões baseadas no termo
        const sugestoes: string[] = [];
        const termoL = termo_busca.toLowerCase();
        
        if (termoL.includes('faturamento') || termoL.includes('receita')) {
          sugestoes.push('SELECT SUM(real_r) FROM eventos WHERE bar_id = ?');
          sugestoes.push('SELECT data_evento, real_r FROM eventos ORDER BY data_evento DESC');
        }
        if (termoL.includes('produto') || termoL.includes('venda')) {
          sugestoes.push('SELECT prd_desc, SUM(qtd), SUM(valorfinal) FROM contahub_analitico GROUP BY prd_desc');
        }
        if (termoL.includes('cliente') || termoL.includes('frequente')) {
          sugestoes.push('SELECT cli_nome, COUNT(*) FROM contahub_periodo GROUP BY cli_nome ORDER BY COUNT(*) DESC');
        }
        if (termoL.includes('pagamento') || termoL.includes('forma')) {
          sugestoes.push('SELECT meio, SUM(valor) FROM contahub_pagamentos GROUP BY meio');
        }
        
        resposta = {
          termo: termo_busca,
          sugestoes_query: sugestoes.length > 0 ? sugestoes : ['Não encontrei sugestões específicas para esse termo'],
          dica: 'Substitua ? pelo bar_id desejado'
        };
        break;

      case 'explicar_relacionamento':
        if (!tabela) {
          throw new Error('tabela é obrigatória');
        }
        
        const tabelaInfo = SCHEMA_SGB[tabela as keyof typeof SCHEMA_SGB];
        if (!tabelaInfo) {
          throw new Error(`Tabela "${tabela}" não encontrada`);
        }
        
        resposta = {
          tabela,
          relacionamentos: tabelaInfo.relacionamentos,
          explicacao: `A tabela ${tabela} se relaciona com: ${tabelaInfo.relacionamentos.join(', ')}. ` +
            `Use bar_id para fazer JOINs com a tabela bars e data_evento/dt_gerencial para relacionar com eventos.`
        };
        break;
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      ...resposta
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Erro no Agente Mapeador:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

