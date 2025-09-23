import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

console.log("📊 ContaHub ProdPorHora - Coleta de dados de produtos por hora");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚨 FUNÇÃO TEMPORÁRIA: contahub-prodporhora');
    console.log('⚠️ Esta função foi recriada para evitar erros no pg_cron');
    console.log('📋 TODO: Implementar lógica específica para produtos por hora');
    
    const requestBody = await req.text();
    console.log('📥 Body recebido:', requestBody);
    
    const { bar_id, data_date } = JSON.parse(requestBody || '{}');
    
    if (!bar_id || !data_date) {
      throw new Error('bar_id e data_date são obrigatórios');
    }
    
    console.log(`🎯 Processando produtos por hora para bar_id=${bar_id}, data=${data_date}`);
    
    // Por enquanto, apenas retornar sucesso para evitar erros no cron
    // TODO: Implementar lógica específica para coleta de produtos por hora
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Função temporária - coleta de produtos por hora não implementada',
      bar_id,
      data_date,
      status: 'placeholder',
      timestamp: new Date().toISOString(),
      todo: 'Implementar lógica específica para produtos por hora'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('❌ Erro na função contahub-prodporhora:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      status: 'error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
