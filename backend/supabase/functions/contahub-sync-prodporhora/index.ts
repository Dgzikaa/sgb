import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data_inicial, data_final, bar_id = 3 } = await req.json()

    if (!data_inicial || !data_final) {
      return new Response(
        JSON.stringify({ error: 'data_inicial e data_final são obrigatórias' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Sincronizando produtos por hora: ${data_inicial} a ${data_final} para bar_id ${bar_id}`)

    // Buscar credenciais do ContaHub
    const { data: credentials } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('service', 'contahub')
      .eq('bar_id', bar_id)
      .single()

    if (!credentials) {
      throw new Error('Credenciais do ContaHub não encontradas')
    }

    const contahubUrl = credentials.base_url
    const token = credentials.token

    // Processar cada data no período
    const startDate = new Date(data_inicial)
    const endDate = new Date(data_final)
    const results = []

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      
      try {
        console.log(`Processando data: ${dateStr}`)

        // URL da API do ContaHub para produtos por hora
        const apiUrl = `https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/1757528448438?qry=95&d0=${dateStr}&d1=${dateStr}&prod=&grupo=&turno=&emp=${credentials.emp_id}&nfe=1`

        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          console.error(`Erro na API ContaHub para ${dateStr}:`, response.status, response.statusText)
          continue
        }

        const data = await response.json()
        
        if (!data || !Array.isArray(data)) {
          console.log(`Sem dados para ${dateStr}`)
          continue
        }

        // Processar e inserir dados
        const recordsToInsert = data.map(item => ({
          dt_gerencial: dateStr,
          hora: parseInt(item.hora) || 0,
          grp_desc: item.grp_desc || null,
          prd_desc: item.prd_desc || 'Produto não identificado',
          prd_id: parseInt(item.prd) || null,
          loc_desc: item.loc_desc || null,
          trn_desc: item.trn_desc || null,
          prefixo: item.prefixo || null,
          tipovenda: item.tipovenda || null,
          qtd: parseFloat(item.q) || 0,
          valorpago: parseFloat(item.valorpago) || 0,
          desconto: parseFloat(item.desconto) || 0,
          bar_id: bar_id,
          raw_data: item
        }))

        if (recordsToInsert.length > 0) {
          // Deletar dados existentes para a data
          await supabase
            .from('contahub_prodporhora')
            .delete()
            .eq('dt_gerencial', dateStr)
            .eq('bar_id', bar_id)

          // Inserir novos dados
          const { error: insertError } = await supabase
            .from('contahub_prodporhora')
            .insert(recordsToInsert)

          if (insertError) {
            console.error(`Erro ao inserir dados para ${dateStr}:`, insertError)
          } else {
            console.log(`Inseridos ${recordsToInsert.length} registros para ${dateStr}`)
            results.push({
              data: dateStr,
              registros: recordsToInsert.length,
              status: 'sucesso'
            })
          }
        }

      } catch (error) {
        console.error(`Erro ao processar ${dateStr}:`, error)
        results.push({
          data: dateStr,
          erro: error.message,
          status: 'erro'
        })
      }

      // Pequena pausa entre requisições
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return new Response(
      JSON.stringify({
        success: true,
        periodo: `${data_inicial} a ${data_final}`,
        resultados: results,
        total_processado: results.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro na sincronização:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
