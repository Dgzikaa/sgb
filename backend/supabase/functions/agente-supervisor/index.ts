import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * 🎯 AGENTE SUPERVISOR (ORQUESTRADOR)
 * 
 * Responsável por:
 * - Receber perguntas do usuário
 * - Analisar intenção e contexto
 * - Rotear para o agente especialista correto
 * - Consolidar respostas
 * - Gerenciar fluxo de conversa
 */

console.log("🎯 Agente Supervisor - Orquestrador de Agentes");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento de intenções para agentes
const AGENT_ROUTING: Record<string, string[]> = {
  'agente-sql-expert': [
    'consulta', 'query', 'buscar', 'listar', 'mostrar', 'dados',
    'faturamento', 'vendas', 'clientes', 'produtos', 'receita',
    'quanto', 'quantos', 'total', 'soma', 'média', 'ranking',
    'top', 'maiores', 'menores', 'comparar'
  ],
  'agente-auditor': [
    'verificar', 'validar', 'auditoria', 'qualidade', 'sync',
    'erro', 'inconsistência', 'problema', 'checar', 'conferir'
  ],
  'agente-mapeador-tabelas': [
    'tabela', 'schema', 'estrutura', 'campos', 'colunas',
    'relacionamento', 'banco', 'database', 'mapeamento'
  ],
  'agente-analise-periodos': [
    'período', 'semana', 'mês', 'ano', 'comparativo',
    'evolução', 'tendência', 'histórico', 'crescimento', 'queda'
  ]
};

interface SupervisorRequest {
  mensagem: string;
  bar_id: number;
  contexto?: Record<string, unknown>;
  historico?: Array<{ role: string; content: string }>;
}

interface SupervisorResponse {
  success: boolean;
  resposta: string;
  agente_utilizado: string;
  intencao_detectada: string;
  dados?: unknown;
  sugestoes?: string[];
  tempo_processamento_ms: number;
}

function detectarIntencao(mensagem: string): { agente: string; intencao: string; confianca: number } {
  const mensagemLower = mensagem.toLowerCase();
  
  let melhorAgente = 'agente-sql-expert'; // Default
  let melhorScore = 0;
  let intencaoDetectada = 'consulta_generica';

  for (const [agente, keywords] of Object.entries(AGENT_ROUTING)) {
    let score = 0;
    for (const keyword of keywords) {
      if (mensagemLower.includes(keyword)) {
        score++;
      }
    }
    
    if (score > melhorScore) {
      melhorScore = score;
      melhorAgente = agente;
      intencaoDetectada = keywords[0]; // Primeira keyword como intenção principal
    }
  }

  const confianca = melhorScore > 0 ? Math.min(melhorScore / 3, 1) : 0.3;

  return {
    agente: melhorAgente,
    intencao: intencaoDetectada,
    confianca
  };
}

async function chamarAgente(
  agente: string, 
  payload: Record<string, unknown>,
  supabaseUrl: string,
  supabaseKey: string
): Promise<unknown> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/${agente}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Agente ${agente} retornou erro: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Erro ao chamar ${agente}:`, error);
    throw error;
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const request: SupervisorRequest = await req.json();
    const { mensagem, bar_id, contexto, historico } = request;

    console.log(`🎯 Mensagem recebida: "${mensagem}"`);
    console.log(`🏪 Bar ID: ${bar_id}`);

    // 1. Detectar intenção
    const { agente, intencao, confianca } = detectarIntencao(mensagem);
    console.log(`🔍 Intenção: ${intencao} | Agente: ${agente} | Confiança: ${(confianca * 100).toFixed(0)}%`);

    // 2. Preparar payload para o agente
    const agentePayload = {
      mensagem,
      bar_id,
      contexto: {
        ...contexto,
        intencao,
        confianca,
        historico_conversa: historico?.slice(-5) // Últimas 5 mensagens
      }
    };

    // 3. Chamar agente especialista
    let respostaAgente: unknown;
    let respostaFinal = '';
    
    try {
      respostaAgente = await chamarAgente(agente, agentePayload, supabaseUrl, supabaseKey);
      
      // Formatar resposta baseada no tipo de agente
      if (typeof respostaAgente === 'object' && respostaAgente !== null) {
        const resp = respostaAgente as Record<string, unknown>;
        respostaFinal = resp.resposta as string || resp.message as string || JSON.stringify(resp);
      } else {
        respostaFinal = String(respostaAgente);
      }
    } catch (error) {
      console.error(`⚠️ Erro no agente ${agente}, usando fallback`);
      respostaFinal = `Desculpe, não consegui processar sua solicitação no momento. Erro: ${error instanceof Error ? error.message : 'desconhecido'}`;
    }

    // 4. Gerar sugestões de próximas perguntas
    const sugestoes = [
      'Qual foi o faturamento da última semana?',
      'Mostre os produtos mais vendidos',
      'Compare o desempenho dos últimos 3 meses',
      'Verifique a qualidade dos dados'
    ];

    const response: SupervisorResponse = {
      success: true,
      resposta: respostaFinal,
      agente_utilizado: agente,
      intencao_detectada: intencao,
      dados: respostaAgente,
      sugestoes: sugestoes.slice(0, 3),
      tempo_processamento_ms: Date.now() - startTime
    };

    console.log(`✅ Resposta gerada em ${response.tempo_processamento_ms}ms`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Erro no Agente Supervisor:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      tempo_processamento_ms: Date.now() - startTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

