import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { read, utils } from 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Credenciais da Service Account - carregadas de variável de ambiente
function getCredentials() {
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY')
  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY não configurada. Configure o secret no Supabase Dashboard.')
  }
  
  try {
    const credentials = JSON.parse(serviceAccountKey)
    return {
      client_email: credentials.client_email,
      private_key: credentials.private_key
    }
  } catch (e) {
    throw new Error('Erro ao parsear GOOGLE_SERVICE_ACCOUNT_KEY: ' + e.message)
  }
}

// ID do arquivo do Google Drive - NPS
// https://docs.google.com/spreadsheets/d/1GSsU3G2uEl6RHkQUop_WDWjzLBsMVomJN-rf-_J8Sx4/edit?resourcekey=&pli=1&gid=38070213#gid=38070213
const FILE_ID = '1GSsU3G2uEl6RHkQUop_WDWjzLBsMVomJN-rf-_J8Sx4'
const SHEET_NAME = 'Respostas ao formulário 1'

interface NPSRow {
  bar_id: number
  data_pesquisa: string
  setor: string
  quorum: number
  nps_geral: number
  nps_ambiente: number
  nps_atendimento: number
  nps_limpeza: number
  nps_musica: number
  nps_comida: number
  nps_drink: number
  nps_preco: number
  nps_reservas: number
  media_geral: number
  resultado_percentual: number
  funcionario_nome: string
  comentarios: string
}

// Função para obter Access Token usando Service Account
async function getAccessToken(): Promise<string> {
  const CREDENTIALS = getCredentials()
  const encoder = new TextEncoder()
  const now = Math.floor(Date.now() / 1000)
  
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: CREDENTIALS.client_email,
    sub: CREDENTIALS.client_email,
    scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }

  // Importar chave privada
  const pemHeader = '-----BEGIN PRIVATE KEY-----'
  const pemFooter = '-----END PRIVATE KEY-----'
  const pemContents = CREDENTIALS.private_key
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '')
  
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  )

  // Criar assinatura
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const signatureInput = `${headerB64}.${payloadB64}`
  
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  )
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  
  const jwt = `${headerB64}.${payloadB64}.${signatureB64}`

  // Trocar JWT por Access Token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  })

  const data = await response.json()
  if (data.error) {
    throw new Error(`Google Auth Error: ${data.error_description || data.error}`)
  }
  
  return data.access_token
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Permitir acesso sem autenticação para pg_cron
    const authHeader = req.headers.get('authorization')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    // Log para debugging
    console.log('🔄 Iniciando sincronização do NPS...')
    console.log('🔐 Auth presente:', !!authHeader)

    // 1. Obter Access Token
    console.log('🔑 Obtendo Access Token...')
    const accessToken = await getAccessToken()
    console.log('✅ Token obtido!')

    // 2. Baixar arquivo Excel do Google Drive
    console.log('📥 Baixando arquivo Excel...')
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${FILE_ID}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    
    const fileResponse = await fetch(downloadUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })

    if (!fileResponse.ok) {
      throw new Error(`Erro ao baixar arquivo: ${fileResponse.status} ${fileResponse.statusText}`)
    }

    const arrayBuffer = await fileResponse.arrayBuffer()
    console.log(`✅ Arquivo baixado! (${(arrayBuffer.byteLength / 1024).toFixed(2)} KB)`)

    // 3. Processar Excel com SheetJS
    console.log('📊 Processando planilha...')
    const workbook = read(new Uint8Array(arrayBuffer), { type: 'array' })
    
    console.log(`📑 Abas encontradas: ${workbook.SheetNames.join(', ')}`)

    // Encontrar aba "Respostas ao formulário 1"
    let targetSheet = workbook.Sheets[SHEET_NAME]
    if (!targetSheet) {
      console.warn(`⚠️ Aba "${SHEET_NAME}" não encontrada, buscando alternativas...`)
      // Tentar encontrar por nome parcial
      const npsSheetName = workbook.SheetNames.find(name => 
        name.toLowerCase().includes('respostas') || 
        name.toLowerCase().includes('formulário') ||
        name.toLowerCase().includes('formulario')
      )
      if (npsSheetName) {
        targetSheet = workbook.Sheets[npsSheetName]
        console.log(`✅ Usando aba: ${npsSheetName}`)
      } else {
        throw new Error('Aba de respostas não encontrada na planilha')
      }
    }

    // Converter para JSON
    const jsonData = utils.sheet_to_json(targetSheet, { 
      header: 1,
      defval: '',
      raw: false
    }) as any[][]

    console.log(`📊 ${jsonData.length} linhas encontradas na planilha NPS`)
    
    // Log da primeira linha (cabeçalho)
    if (jsonData.length > 0) {
      console.log('📋 Cabeçalho (primeira 10 colunas):', jsonData[0].slice(0, 10))
    }
    
    // Log de uma linha de exemplo (linha 2)
    if (jsonData.length > 1) {
      console.log('📝 Exemplo linha 2:', {
        carimbo: jsonData[1][0],
        dia: jsonData[1][1],
        genero: jsonData[1][2],
        idade: jsonData[1][3],
        ambiente: jsonData[1][4],
        atendimento: jsonData[1][5],
        limpeza: jsonData[1][6],
        musica: jsonData[1][7],
        comidas: jsonData[1][8],
        drinks: jsonData[1][9]
      })
    }

    // 4. Processar dados (pular cabeçalho - linha 0)
    const registros: NPSRow[] = []
    
    // Google Forms geralmente tem: Carimbo de data/hora + perguntas
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      
      if (!row[0] || String(row[0]).trim() === '') continue

      try {
        // USAR COLUNA O (índice 14) - Data ajustada já no formato DD/MM/YYYY
        // Coluna O = EXT.TEXTO(A;1;10) que extrai apenas "DD/MM/YYYY"
        let dataFormatada = ''
        let timestampCompleto = String(row[0] || '') // Carimbo para timestamp único
        
        // Usar coluna O que já tem data limpa
        const dataAjustada = row[14] // Coluna O
        
        if (dataAjustada) {
          const dateStr = String(dataAjustada).trim()
          const dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
          
          if (dateMatch) {
            const day = dateMatch[1].padStart(2, '0')
            const month = dateMatch[2].padStart(2, '0')
            const year = dateMatch[3]
            
            // Formato YYYY-MM-DD para PostgreSQL (sempre DD/MM/YYYY → YYYY-MM-DD)
            dataFormatada = `${year}-${month}-${day}`
            
            // Log primeiras linhas para confirmar
            if (i <= 5) {
              console.log(`✅ Linha ${i}: Coluna O="${dateStr}" → ${dataFormatada}`)
            }
          }
        }

        if (!dataFormatada) {
          console.warn(`⚠️ Linha ${i + 1}: Data inválida - ${row[0]}`)
          continue
        }
        
        // Log apenas das primeiras 5 linhas e linhas com problemas
        if (i <= 5 || dataFormatada.includes('2025-11-03') || dataFormatada.includes('2025-11-05') || dataFormatada.includes('2025-11-06')) {
          console.log(`✅ Linha ${i + 1}: ${row[0]} → ${dataFormatada}`)
        }

        // Converter valores (podem ser números 1-5, texto descritivo, ou "Não" quando não consumiu)
        const parseValue = (val: any): number => {
          if (!val) return 0
          
          const str = String(val).trim().toLowerCase()
          
          // Se é "Não" ou texto negativo, retornar 0 (não avaliado)
          if (str === 'não' || str === 'nao' || str === 'não consumiu' || str === '') {
            return 0
          }
          
          // Mapear textos descritivos para números
          const textoParaNota: { [key: string]: number } = {
            'péssimo': 1,
            'pessimo': 1,
            'ruim': 2,
            'regular': 3,
            'bom': 4,
            'ótimo': 5,
            'otimo': 5,
            'excelente': 5
          }
          
          if (textoParaNota[str]) {
            return textoParaNota[str]
          }
          
          // Tentar converter para número
          const num = parseFloat(str.replace('%', '').replace(',', '.'))
          
          if (isNaN(num)) return 0
          
          // Google Forms usa escala 0-10, manter valor original
          // NÃO converter para 0-5, pois o NPS tradicional usa escala 0-10
          if (num >= 0 && num <= 10) {
            return Math.round(num * 10) / 10
          }
          
          // Número fora do range esperado
          return 0
        }

        // Estrutura do Google Forms NPS Ordi:
        // Col 0: Carimbo | Cols 1-3: Dia/Gênero/Idade | Cols 4-11: 8 perguntas NPS | Col 12: Comentários
        // Col 4 (E): Ambiente | Col 5 (F): Atendimento | Col 6 (G): Limpeza
        // Col 7 (H): Música | Col 8 (I): Comidas | Col 9 (J): Drinks
        // Col 10 (K): Preço | Col 11 (L): Geral | Col 12 (M): Comentários | Col 13 (N): Reserva?
        const nps_ambiente = parseValue(row[4])      // E - Ambiente
        const nps_atendimento = parseValue(row[5])   // F - Atendimento
        const nps_limpeza = parseValue(row[6])       // G - Limpeza
        const nps_musica = parseValue(row[7])        // H - Música
        const nps_comida = parseValue(row[8])        // I - Comidas
        const nps_drink = parseValue(row[9])         // J - Drinks
        const nps_preco = parseValue(row[10])        // K - Preço
        const nps_geral = parseValue(row[11])        // L - O quanto você indicaria o Ordi
        const comentarios = row[12] ? String(row[12]).trim() : ''  // M - Comentários
        const nps_reservas = parseValue(row[13])     // N - Reserva (Sim/Não convertido para nota)
        
        // Calcular média apenas das perguntas respondidas (ignorar zeros)
        const valores = [nps_ambiente, nps_atendimento, nps_limpeza, nps_musica, nps_comida, nps_drink, nps_preco, nps_reservas, nps_geral]
        const valoresRespondidos = valores.filter(v => v > 0)
        const mediaGeral = valoresRespondidos.length > 0 
          ? valoresRespondidos.reduce((a, b) => a + b, 0) / valoresRespondidos.length 
          : 0
        
        // Calcular resultado percentual (média / 5 * 100)
        const resultadoPercentual = (mediaGeral / 5) * 100

        const registro: NPSRow = {
          bar_id: 3,
          data_pesquisa: dataFormatada,
          setor: 'TODOS',
          quorum: 1,
          nps_geral,
          nps_ambiente,
          nps_atendimento,
          nps_limpeza,
          nps_musica,
          nps_comida,
          nps_drink,
          nps_preco,
          nps_reservas,
          media_geral: parseFloat(mediaGeral.toFixed(2)),
          resultado_percentual: parseFloat(resultadoPercentual.toFixed(2)),
          funcionario_nome: timestampCompleto.substring(0, 40), // Timestamp sem prefixo "Cliente_"
          comentarios
        }

        registros.push(registro)
      } catch (error) {
        console.error(`⚠️ Erro ao processar linha ${i + 1}:`, error)
        console.error(`⚠️ Dados da linha:`, {
          carimbo: row[0],
          dia: row[1],
          ambiente: row[4],
          atendimento: row[5],
          comentarios: row[13]
        })
      }
    }

    console.log(`✅ ${registros.length} registros processados`)

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

    // 5. Inserir no Supabase em LOTES (paginação)
    console.log(`💾 Inserindo ${registros.length} registros no Supabase em lotes...`)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const BATCH_SIZE = 500 // Lotes de 500 registros por vez
    let totalInserted = 0
    
    for (let i = 0; i < registros.length; i += BATCH_SIZE) {
      const batch = registros.slice(i, i + BATCH_SIZE)
      console.log(`📦 Inserindo lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(registros.length / BATCH_SIZE)} (${batch.length} registros)...`)
      
      const { data: insertedData, error: insertError } = await supabaseClient
        .from('nps')
        .upsert(batch, {
          onConflict: 'bar_id,data_pesquisa,funcionario_nome,setor',
          ignoreDuplicates: false
        })
        .select()

      if (insertError) {
        console.error(`❌ Erro ao inserir lote ${Math.floor(i / BATCH_SIZE) + 1}:`, insertError)
        throw insertError
      }

      totalInserted += insertedData?.length || 0
      console.log(`✅ Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${insertedData?.length || 0} registros inseridos`)
    }

    console.log(`✅ Total: ${totalInserted} registros inseridos/atualizados`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${registros.length} registros processados, ${totalInserted} inseridos/atualizados`,
        total: registros.length,
        inserted: totalInserted
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erro na função:', error)
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

