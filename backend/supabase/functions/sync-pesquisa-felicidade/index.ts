import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PesquisaFelicidadeRow {
  bar_id: number;
  data_pesquisa: string;
  setor: string;
  quorum: number;
  eu_comigo_engajamento: number;
  eu_com_empresa_pertencimento: number;
  eu_com_colega_relacionamento: number;
  eu_com_gestor_lideranca: number;
  justica_reconhecimento: number;
  funcionario_nome: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // ID da planilha do Google Sheets
    const SHEET_ID = '1sYIKzphim9bku0jl_J6gSDEqrIhYMxAn'
    const SHEET_NAME = 'Pesquisa da Felicidade' // Nome da aba
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_SHEETS_API_KEY') ?? ''

    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_SHEETS_API_KEY não configurada')
    }

    // Buscar dados do Google Sheets
    const range = `${SHEET_NAME}!A4:K100` // A partir da linha 4 (dados), até coluna K
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${GOOGLE_API_KEY}`
    
    console.log('Buscando dados do Google Sheets...')
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro ao buscar Google Sheets: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const rows = data.values || []

    console.log(`${rows.length} linhas encontradas`)

    // Processar dados
    const registros: PesquisaFelicidadeRow[] = []
    const BAR_ID = 3 // ID do bar (ajustar conforme necessário)

    for (const row of rows) {
      // Pular linhas vazias ou incompletas
      if (!row[0] || row[0].trim() === '') continue
      
      try {
        // Parsear data (formato DD/MM/YYYY)
        const dataParts = row[0].split('/')
        let dataFormatada = ''
        
        if (dataParts.length === 3) {
          const dia = dataParts[0].padStart(2, '0')
          const mes = dataParts[1].padStart(2, '0')
          const ano = dataParts[2]
          dataFormatada = `${ano}-${mes}-${dia}`
        } else {
          console.warn(`Data inválida: ${row[0]}`)
          continue
        }

        // Converter percentuais para decimais (ex: "91,67%" -> 0.9167)
        const parsePercentual = (val: string): number => {
          if (!val) return 0
          const num = parseFloat(val.replace('%', '').replace(',', '.'))
          return num / 100
        }

        const registro: PesquisaFelicidadeRow = {
          bar_id: BAR_ID,
          data_pesquisa: dataFormatada,
          setor: row[1] || 'TODOS',
          quorum: parseInt(row[2]) || 0,
          eu_comigo_engajamento: parsePercentual(row[3]),
          eu_com_empresa_pertencimento: parsePercentual(row[4]),
          eu_com_colega_relacionamento: parsePercentual(row[5]),
          eu_com_gestor_lideranca: parsePercentual(row[6]),
          justica_reconhecimento: parsePercentual(row[7]),
          funcionario_nome: 'Equipe', // Nome genérico, pois a planilha agrupa por setor
        }

        registros.push(registro)
      } catch (error) {
        console.error(`Erro ao processar linha:`, row, error)
      }
    }

    console.log(`${registros.length} registros processados`)

    if (registros.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum registro novo para importar',
          total: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Inserir no Supabase (upsert para evitar duplicatas)
    const { data: insertedData, error: insertError } = await supabaseClient
      .from('pesquisa_felicidade')
      .upsert(registros, {
        onConflict: 'bar_id,data_pesquisa,setor',
        ignoreDuplicates: false
      })
      .select()

    if (insertError) {
      console.error('Erro ao inserir dados:', insertError)
      throw insertError
    }

    console.log(`${insertedData?.length || 0} registros inseridos/atualizados`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${registros.length} registros processados, ${insertedData?.length || 0} inseridos/atualizados`,
        total: registros.length,
        inserted: insertedData?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro na função:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

