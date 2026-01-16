import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * API Externa de Clientes
 * 
 * Endpoint para parceiros acessarem dados de clientes.
 * 
 * RESTRIÇÕES DE SEGURANÇA:
 * - Apenas Bar 3 (Moema)
 * - Autenticação via API Key obrigatória
 * - Rate limiting: 100 requisições por minuto
 * 
 * NOTA: verify_jwt está desabilitado pois usamos autenticação própria via x-api-key
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// API Key para autenticação do parceiro
const API_KEY_PARCEIRO = Deno.env.get("API_KEY_CLIENTES_EXTERNA") || "zykor_parceiro_2026_seguro";

// Bar permitido (apenas Bar 3 - Moema)
const BAR_ID_PERMITIDO = 3;

// Rate limiting simples em memória
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW = 60000;

function checkRateLimit(apiKey: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(apiKey);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(apiKey, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Apenas GET permitido
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Método não permitido. Use GET." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
    );
  }

  try {
    // 1. Validar API Key
    const apiKey = req.headers.get("x-api-key");
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: "API Key não fornecida",
          help: "Inclua o header 'x-api-key' na requisição"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    if (apiKey !== API_KEY_PARCEIRO) {
      return new Response(
        JSON.stringify({ error: "API Key inválida" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // 2. Rate limiting
    if (!checkRateLimit(apiKey)) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit excedido",
          help: "Máximo de 100 requisições por minuto. Aguarde e tente novamente."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    // 3. Parsear parâmetros da URL
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500); // máx 500 por página
    const busca = url.searchParams.get("busca")?.trim() || "";
    const minVisitas = parseInt(url.searchParams.get("min_visitas") || "1");
    const ordenar = url.searchParams.get("ordenar") || "visitas"; // visitas, nome, ultima_visita
    const ordem = url.searchParams.get("ordem") || "desc"; // asc, desc
    
    // 4. Conectar ao Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 5. Buscar clientes (agora com campos financeiros)
    let query = supabase
      .from('cliente_estatisticas')
      .select('telefone, nome, total_visitas, ultima_visita, total_gasto, total_entrada, total_consumo, ticket_medio, ticket_medio_entrada, ticket_medio_consumo, tempo_medio_minutos, total_visitas_com_tempo, updated_at', { count: 'exact' })
      .eq('bar_id', BAR_ID_PERMITIDO)
      .gte('total_visitas', minVisitas);

    // Aplicar busca por nome ou telefone
    if (busca) {
      query = query.or(`nome.ilike.%${busca}%,telefone.ilike.%${busca}%`);
    }

    // Aplicar ordenação
    const orderColumn = ordenar === 'nome' ? 'nome' 
      : ordenar === 'ultima_visita' ? 'ultima_visita'
      : ordenar === 'total_gasto' ? 'total_gasto'
      : ordenar === 'total_consumo' ? 'total_consumo'
      : 'total_visitas';
    query = query.order(orderColumn, { ascending: ordem === 'asc' });

    // Aplicar paginação
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: clientes, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar dados" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // 6. Formatar resposta (com dados financeiros)
    const clientesFormatados = (clientes || []).map(c => ({
      telefone: c.telefone,
      nome: c.nome || 'Sem nome',
      total_visitas: c.total_visitas,
      ultima_visita: c.ultima_visita,
      // Campos financeiros
      total_gasto: c.total_gasto ? parseFloat(c.total_gasto) : 0,
      total_entrada: c.total_entrada ? parseFloat(c.total_entrada) : 0,
      total_consumo: c.total_consumo ? parseFloat(c.total_consumo) : 0,
      ticket_medio: c.ticket_medio ? parseFloat(c.ticket_medio) : 0,
      ticket_medio_entrada: c.ticket_medio_entrada ? parseFloat(c.ticket_medio_entrada) : 0,
      ticket_medio_consumo: c.ticket_medio_consumo ? parseFloat(c.ticket_medio_consumo) : 0,
      // Tempo de estadia
      tempo_medio_estadia_minutos: c.tempo_medio_minutos ? Math.round(c.tempo_medio_minutos) : null,
      tempo_medio_estadia_formatado: c.tempo_medio_minutos 
        ? `${Math.floor(c.tempo_medio_minutos / 60)}h ${Math.round(c.tempo_medio_minutos % 60)}min`
        : null,
      visitas_com_tempo_registrado: c.total_visitas_com_tempo || 0,
      atualizado_em: c.updated_at
    }));

    // 7. Retornar resposta
    const totalPaginas = Math.ceil((count || 0) / limit);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          clientes: clientesFormatados,
          paginacao: {
            pagina_atual: page,
            total_paginas: totalPaginas,
            total_clientes: count || 0,
            por_pagina: limit
          }
        },
        meta: {
          bar: "Moema",
          campos_disponiveis: [
            "telefone",
            "nome", 
            "total_visitas",
            "ultima_visita",
            "total_gasto",
            "total_entrada",
            "total_consumo",
            "ticket_medio",
            "ticket_medio_entrada",
            "ticket_medio_consumo",
            "tempo_medio_estadia_minutos",
            "tempo_medio_estadia_formatado",
            "visitas_com_tempo_registrado",
            "atualizado_em"
          ],
          filtros_aplicados: {
            busca: busca || null,
            min_visitas: minVisitas,
            ordenar: ordenar,
            ordem: ordem
          }
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Erro na API:", error);
    return new Response(
      JSON.stringify({
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
