import "jsr:@supabase/functions-js/edge-runtime.d.ts";

console.log("🔄 Sync Eventos Automático - Alias para sync-eventos");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔄 Redirecionando para sync-eventos...');
    
    // Redirecionar para a função sync-eventos real
    const syncEventosUrl = 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/sync-eventos';
    
    const body = await req.text();
    
    const response = await fetch(syncEventosUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization') || ''
      },
      body: body
    });
    
    const result = await response.text();
    
    return new Response(result, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.status
    });
    
  } catch (error) {
    console.error('❌ Erro no redirect para sync-eventos:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      note: 'Erro ao redirecionar para sync-eventos'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
