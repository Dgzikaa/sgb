import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Configurar CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const requestBody = await req.text()
    console.log('📥 NIBO Light - Recebido:', requestBody)
    
    const { barId, cronSecret } = JSON.parse(requestBody || '{}')
    
    if (!barId) {
      return new Response(
        JSON.stringify({ error: 'barId é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🔄 NIBO Light - Iniciando para bar_id: ${barId}`)
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Log de início
    const { data: logInicio } = await supabase
      .from('nibo_logs_sincronizacao')
      .insert({
        bar_id: parseInt(barId),
        tipo_sincronizacao: 'light_sync',
        status: 'iniciado',
        data_inicio: new Date().toISOString(),
        criado_em: new Date().toISOString()
      })
      .select()
      .single()

    // Buscar credenciais
    const { data: credenciais, error: credError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('sistema', 'nibo')
      .eq('bar_id', parseInt(barId))
      .eq('ativo', true)
      .single()

    if (credError || !credenciais) {
      throw new Error(`Credenciais NIBO não encontradas para bar_id ${barId}`)
    }

    // Buscar APENAS 10 categorias para teste
    const url = new URL('https://api.nibo.com.br/empresas/v1/categories')
    url.searchParams.set('$top', '10')
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'apitoken': credenciais.api_token
      }
    })

    if (!response.ok) {
      throw new Error(`API NIBO falhou: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()
    
    let inseridas = 0
    let atualizadas = 0
    
    // Processar apenas as 10 categorias
    if (data.items && data.items.length > 0) {
      for (const category of data.items) {
        const { error } = await supabase
          .from('nibo_categorias')
          .upsert({
            nibo_id: category.id,
            bar_id: parseInt(barId),
            nome: category.name,
            tipo: category.type,
            ativo: category.active,
            data_sincronizacao: new Date().toISOString()
          }, {
            onConflict: 'nibo_id'
          })

        if (!error) {
          // Verificar se é novo (simplificado)
          inseridas++
        }
      }
    }
    
    // Atualizar log com sucesso
    if (logInicio) {
      await supabase
        .from('nibo_logs_sincronizacao')
        .update({
          status: 'concluido',
          data_fim: new Date().toISOString(),
          total_registros: data.items?.length || 0,
          registros_processados: inseridas
        })
        .eq('id', logInicio.id)
    }

    const result = {
      success: true,
      message: `NIBO Light sync concluído para bar_id: ${barId}`,
      data: {
        categories_processed: data.items?.length || 0,
        categories_upserted: inseridas,
        timestamp: new Date().toISOString()
      }
    }

    console.log('✅ NIBO Light - Sucesso:', result)
    
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ NIBO Light - Erro:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}) 