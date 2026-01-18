import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json().catch(() => ({}));
    
    // Parâmetros opcionais
    const barId = body.bar_id || 3;
    let semana = body.semana;
    let ano = body.ano;

    // Se não especificado, usa semana anterior (dados completos)
    if (!semana || !ano) {
      const hoje = new Date();
      const semanaAtual = getWeekNumber(hoje);
      ano = hoje.getFullYear();
      semana = semanaAtual - 1;
      
      if (semana < 1) {
        semana = 52;
        ano = ano - 1;
      }
    }

    console.log(`Sincronização automática de marketing: Semana ${semana}/${ano}`);

    const resultados: any = {
      semana,
      ano,
      bar_id: barId,
      meta: null,
      google: null,
      erros: []
    };

    // 1. Sincronizar Meta (Facebook/Instagram)
    try {
      const metaResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-marketing-meta`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ bar_id: barId, semana, ano })
        }
      );
      
      resultados.meta = await metaResponse.json();
      console.log('Meta sincronizado:', resultados.meta.success ? 'OK' : 'ERRO');
    } catch (error) {
      console.error('Erro ao sincronizar Meta:', error);
      resultados.erros.push({ fonte: 'meta', erro: error.message });
    }

    // 2. Sincronizar Google (Ads + GMB)
    try {
      const googleResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-marketing-google`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ bar_id: barId, semana, ano })
        }
      );
      
      resultados.google = await googleResponse.json();
      console.log('Google sincronizado:', resultados.google.success ? 'OK' : 'ERRO');
    } catch (error) {
      console.error('Erro ao sincronizar Google:', error);
      resultados.erros.push({ fonte: 'google', erro: error.message });
    }

    // 3. Registrar log de execução
    await supabase
      .from('logs_sistema')
      .insert({
        tipo: 'sync_marketing',
        mensagem: `Sincronização marketing semana ${semana}/${ano}`,
        dados: resultados,
        created_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({
        success: resultados.erros.length === 0,
        message: `Marketing sincronizado para semana ${semana}/${ano}`,
        resultados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na sincronização automática:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Obter número da semana ISO
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
