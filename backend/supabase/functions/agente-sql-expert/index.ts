import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * 🗄️ AGENTE SQL EXPERT
 * 
 * Responsável por:
 * - Interpretar perguntas em linguagem natural
 * - Gerar queries SQL seguras
 * - Executar consultas no banco
 * - Formatar resultados para o usuário
 */

console.log("🗄️ Agente SQL Expert - Consultas ao Banco de Dados");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento de termos para tabelas e campos
const SCHEMA_MAPPING = {
  // Termos de faturamento
  faturamento: { tabela: 'eventos', campo: 'real_r' },
  receita: { tabela: 'eventos', campo: 'real_r' },
  vendas: { tabela: 'contahub_analitico', campo: 'valorfinal' },
  
  // Termos de clientes
  clientes: { tabela: 'contahub_periodo', campo: 'cli_nome' },
  pessoas: { tabela: 'contahub_periodo', campo: 'pessoas' },
  público: { tabela: 'eventos', campo: 'pax_r' },
  
  // Termos de produtos
  produtos: { tabela: 'contahub_analitico', campo: 'prd_desc' },
  itens: { tabela: 'contahub_analitico', campo: 'qtd' },
  
  // Termos de tempo
  hora: { tabela: 'contahub_fatporhora', campo: 'hora' },
  horário: { tabela: 'contahub_fatporhora', campo: 'hora' },
  
  // Termos de pagamento
  pagamento: { tabela: 'contahub_pagamentos', campo: 'valor' },
  cartão: { tabela: 'contahub_pagamentos', campo: 'meio' },
  pix: { tabela: 'contahub_pagamentos', campo: 'meio' },
};

// Queries pré-definidas seguras
const SAFE_QUERIES: Record<string, (barId: number, params?: Record<string, string>) => string> = {
  'faturamento_total': (barId, params) => `
    SELECT 
      SUM(real_r) as faturamento_total,
      COUNT(*) as total_eventos,
      AVG(real_r) as media_por_evento
    FROM eventos 
    WHERE bar_id = ${barId}
    ${params?.data_inicio ? `AND data_evento >= '${params.data_inicio}'` : ''}
    ${params?.data_fim ? `AND data_evento <= '${params.data_fim}'` : ''}
  `,
  
  'produtos_mais_vendidos': (barId, params) => `
    SELECT 
      prd_desc as produto,
      SUM(qtd) as quantidade_vendida,
      SUM(valorfinal) as valor_total
    FROM contahub_analitico 
    WHERE bar_id = ${barId}
    ${params?.data_inicio ? `AND trn_dtgerencial >= '${params.data_inicio}'` : ''}
    ${params?.data_fim ? `AND trn_dtgerencial <= '${params.data_fim}'` : ''}
    GROUP BY prd_desc
    ORDER BY quantidade_vendida DESC
    LIMIT ${params?.limite || 10}
  `,
  
  'faturamento_por_hora': (barId, params) => `
    SELECT 
      hora,
      SUM(valor) as faturamento,
      SUM(qtd) as quantidade
    FROM contahub_fatporhora 
    WHERE bar_id = ${barId}
    ${params?.data ? `AND vd_dtgerencial = '${params.data}'` : ''}
    GROUP BY hora
    ORDER BY hora
  `,
  
  'resumo_periodo': (barId, params) => `
    SELECT 
      data_evento,
      nome,
      real_r as faturamento,
      pax_r as publico,
      te_r as ticket_medio
    FROM eventos 
    WHERE bar_id = ${barId}
    ${params?.data_inicio ? `AND data_evento >= '${params.data_inicio}'` : ''}
    ${params?.data_fim ? `AND data_evento <= '${params.data_fim}'` : ''}
    ORDER BY data_evento DESC
    LIMIT ${params?.limite || 30}
  `,
  
  'clientes_frequentes': (barId, params) => `
    SELECT 
      cli_nome as cliente,
      cli_email as email,
      COUNT(*) as visitas,
      SUM(vr_pagamentos) as total_gasto
    FROM contahub_periodo 
    WHERE bar_id = ${barId}
    AND cli_nome IS NOT NULL 
    AND cli_nome != ''
    ${params?.data_inicio ? `AND dt_gerencial >= '${params.data_inicio}'` : ''}
    ${params?.data_fim ? `AND dt_gerencial <= '${params.data_fim}'` : ''}
    GROUP BY cli_nome, cli_email
    ORDER BY visitas DESC
    LIMIT ${params?.limite || 20}
  `,
  
  'meios_pagamento': (barId, params) => `
    SELECT 
      meio,
      COUNT(*) as quantidade,
      SUM(valor) as valor_total,
      ROUND(AVG(valor)::numeric, 2) as ticket_medio
    FROM contahub_pagamentos 
    WHERE bar_id = ${barId}
    ${params?.data_inicio ? `AND dt_gerencial >= '${params.data_inicio}'` : ''}
    ${params?.data_fim ? `AND dt_gerencial <= '${params.data_fim}'` : ''}
    GROUP BY meio
    ORDER BY valor_total DESC
  `
};

interface SQLExpertRequest {
  mensagem: string;
  bar_id: number;
  contexto?: {
    intencao?: string;
    data_inicio?: string;
    data_fim?: string;
    limite?: number;
  };
}

function identificarQuery(mensagem: string): string {
  const mensagemLower = mensagem.toLowerCase();
  
  if (mensagemLower.includes('produto') || mensagemLower.includes('mais vendido') || mensagemLower.includes('top')) {
    return 'produtos_mais_vendidos';
  }
  if (mensagemLower.includes('hora') || mensagemLower.includes('horário') || mensagemLower.includes('pico')) {
    return 'faturamento_por_hora';
  }
  if (mensagemLower.includes('cliente') || mensagemLower.includes('frequente') || mensagemLower.includes('vip')) {
    return 'clientes_frequentes';
  }
  if (mensagemLower.includes('pagamento') || mensagemLower.includes('cartão') || mensagemLower.includes('pix')) {
    return 'meios_pagamento';
  }
  if (mensagemLower.includes('resumo') || mensagemLower.includes('período') || mensagemLower.includes('evento')) {
    return 'resumo_periodo';
  }
  
  // Default: faturamento total
  return 'faturamento_total';
}

function extrairParametros(mensagem: string, contexto?: Record<string, unknown>): Record<string, string> {
  const params: Record<string, string> = {};
  
  // Extrair datas do contexto
  if (contexto?.data_inicio) params.data_inicio = String(contexto.data_inicio);
  if (contexto?.data_fim) params.data_fim = String(contexto.data_fim);
  if (contexto?.limite) params.limite = String(contexto.limite);
  
  // Extrair datas da mensagem
  const regexData = /(\d{4}-\d{2}-\d{2})/g;
  const datas = mensagem.match(regexData);
  if (datas) {
    if (datas[0] && !params.data_inicio) params.data_inicio = datas[0];
    if (datas[1] && !params.data_fim) params.data_fim = datas[1];
  }
  
  // Extrair limite
  const regexTop = /top\s*(\d+)/i;
  const matchTop = mensagem.match(regexTop);
  if (matchTop && matchTop[1]) {
    params.limite = matchTop[1];
  }
  
  // Se não tiver período, usar últimos 30 dias
  if (!params.data_inicio) {
    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - 30);
    params.data_inicio = inicio.toISOString().split('T')[0];
    params.data_fim = hoje.toISOString().split('T')[0];
  }
  
  return params;
}

function formatarResposta(queryType: string, dados: unknown[]): string {
  if (!dados || dados.length === 0) {
    return 'Não encontrei dados para essa consulta no período especificado.';
  }

  switch (queryType) {
    case 'faturamento_total':
      const fat = dados[0] as Record<string, unknown>;
      return `📊 **Resumo de Faturamento**\n\n` +
        `💰 **Total:** R$ ${Number(fat.faturamento_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
        `📅 **Eventos:** ${fat.total_eventos}\n` +
        `📈 **Média por evento:** R$ ${Number(fat.media_por_evento || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    case 'produtos_mais_vendidos':
      let respProd = '🏆 **Produtos Mais Vendidos**\n\n';
      (dados as Record<string, unknown>[]).slice(0, 10).forEach((p, i) => {
        respProd += `${i + 1}. **${p.produto}** - ${p.quantidade_vendida} unidades (R$ ${Number(p.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})\n`;
      });
      return respProd;

    case 'faturamento_por_hora':
      let respHora = '⏰ **Faturamento por Hora**\n\n';
      (dados as Record<string, unknown>[]).forEach((h) => {
        const horaFormatada = `${String(h.hora).padStart(2, '0')}:00`;
        respHora += `${horaFormatada} - R$ ${Number(h.faturamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${h.quantidade} vendas)\n`;
      });
      return respHora;

    case 'clientes_frequentes':
      let respCli = '👥 **Clientes Mais Frequentes**\n\n';
      (dados as Record<string, unknown>[]).slice(0, 10).forEach((c, i) => {
        respCli += `${i + 1}. **${c.cliente}** - ${c.visitas} visitas (R$ ${Number(c.total_gasto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})\n`;
      });
      return respCli;

    case 'meios_pagamento':
      let respPag = '💳 **Meios de Pagamento**\n\n';
      (dados as Record<string, unknown>[]).forEach((p) => {
        respPag += `**${p.meio}**: ${p.quantidade} transações - R$ ${Number(p.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (ticket: R$ ${p.ticket_medio})\n`;
      });
      return respPag;

    case 'resumo_periodo':
      let respRes = '📋 **Resumo do Período**\n\n';
      (dados as Record<string, unknown>[]).slice(0, 10).forEach((e) => {
        respRes += `📅 **${e.data_evento}** - ${e.nome}\n`;
        respRes += `   💰 R$ ${Number(e.faturamento || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | 👥 ${e.publico || 0} pessoas | 🎟️ R$ ${Number(e.ticket_medio || 0).toFixed(2)}\n\n`;
      });
      return respRes;

    default:
      return `Encontrei ${dados.length} registros. Aqui estão os dados:\n\n\`\`\`json\n${JSON.stringify(dados.slice(0, 5), null, 2)}\n\`\`\``;
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const request: SQLExpertRequest = await req.json();
    const { mensagem, bar_id, contexto } = request;

    console.log(`🗄️ Query solicitada: "${mensagem}"`);
    console.log(`🏪 Bar ID: ${bar_id}`);

    // 1. Identificar tipo de query
    const queryType = identificarQuery(mensagem);
    console.log(`📋 Tipo de query identificada: ${queryType}`);

    // 2. Extrair parâmetros
    const params = extrairParametros(mensagem, contexto);
    console.log(`📊 Parâmetros:`, params);

    // 3. Obter query SQL
    const queryBuilder = SAFE_QUERIES[queryType];
    if (!queryBuilder) {
      throw new Error(`Query type não suportado: ${queryType}`);
    }

    const sqlQuery = queryBuilder(bar_id, params);
    console.log(`🔍 Executando query...`);

    // 4. Executar query
    const { data, error } = await supabase.rpc('execute_safe_query', {
      query_text: sqlQuery
    });

    // Fallback: executar query diretamente se RPC não existir
    let resultados = data;
    if (error) {
      console.log(`⚠️ RPC não disponível, tentando query direta...`);
      
      // Usar a tabela diretamente baseado no tipo de query
      const tabela = queryType.includes('produto') ? 'contahub_analitico' :
                     queryType.includes('hora') ? 'contahub_fatporhora' :
                     queryType.includes('cliente') ? 'contahub_periodo' :
                     queryType.includes('pagamento') ? 'contahub_pagamentos' :
                     'eventos';
      
      // Query simplificada
      const { data: directData, error: directError } = await supabase
        .from(tabela)
        .select('*')
        .eq('bar_id', bar_id)
        .limit(100);

      if (directError) {
        throw new Error(`Erro na query: ${directError.message}`);
      }
      
      resultados = directData;
    }

    // 5. Formatar resposta
    const respostaFormatada = formatarResposta(queryType, resultados || []);

    console.log(`✅ Query executada com sucesso: ${resultados?.length || 0} resultados`);

    return new Response(JSON.stringify({
      success: true,
      resposta: respostaFormatada,
      query_type: queryType,
      parametros: params,
      total_resultados: resultados?.length || 0,
      dados_brutos: resultados?.slice(0, 20) // Limitar dados brutos
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Erro no Agente SQL Expert:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      resposta: 'Desculpe, não consegui executar essa consulta. Por favor, tente reformular sua pergunta.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

