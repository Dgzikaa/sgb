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

// ID do arquivo do Google Drive - NPS Reservas
// https://docs.google.com/spreadsheets/d/1HXSsGWum84HrB3yRvuzv-TsPcd8wEywVrOztdFcHna0/edit?resourcekey=&gid=1288620542#gid=1288620542
const FILE_ID = '1HXSsGWum84HrB3yRvuzv-TsPcd8wEywVrOztdFcHna0'

// Gerar JWT para autenticação Google
async function createJWT() {
  const CREDENTIALS = getCredentials()
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: CREDENTIALS.client_email,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }

  const encoder = new TextEncoder()
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  
  const data = `${headerB64}.${payloadB64}`
  
  // Importar chave privada
  const pemContents = CREDENTIALS.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
  
  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(data)
  )
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  
  return `${data}.${signatureB64}`
}

// Obter access token do Google
async function getAccessToken() {
  const jwt = await createJWT()
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  })
  
  const data = await response.json()
  return data.access_token
}

// Converter valor para escala 0-10
function parseValue(val: any): number {
  if (!val || val === '' || val === 'Não') return 0
  
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'))
  
  if (isNaN(num) || num < 0) return 0
  if (num >= 0 && num <= 10) { // Manter a escala original de 0-10
    return Math.round(num * 10) / 10
  }
  
  return 0
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Iniciando sincronização NPS Reservas...')

    // Obter access token
    const accessToken = await getAccessToken()
    
    // Baixar arquivo do Google Drive como Excel
    const driveUrl = `https://www.googleapis.com/drive/v3/files/${FILE_ID}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
    const fileResponse = await fetch(driveUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    
    if (!fileResponse.ok) {
      throw new Error(`Erro ao baixar arquivo: ${fileResponse.status} ${fileResponse.statusText}`)
    }
    
    const arrayBuffer = await fileResponse.arrayBuffer()
    const workbook = read(new Uint8Array(arrayBuffer))
    
    // Pegar primeira aba
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const data = utils.sheet_to_json(worksheet, { header: 1, raw: false }) as any[][]
    
    console.log(`📊 Total de linhas encontradas: ${data.length}`)
    
    if (data.length <= 1) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum dado para processar' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Conectar ao Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const registrosProcessados: any[] = []
    let atualizados = 0

    // Processar cada linha (pular header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      
      if (!row || row.length === 0) continue

      // Estrutura da planilha de reservas:
      // Col 0: Carimbo de data/hora (MM/DD/YYYY HH:MM:SS - formato americano)
      // Col 1: Dia da semana
      // Col 2: Avaliação (0-10)
      // Col 3: Comentários (opcional)
      
      // Extrair data do carimbo (coluna 0) - FORMATO AMERICANO MM/DD/YYYY
      let dataFormatada = ''
      const carimbo = String(row[0] || '').trim()
      
      if (carimbo) {
        // Formato: "MM/DD/YYYY HH:MM:SS" (americano)
        const dateMatch = carimbo.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
        
        if (dateMatch) {
          const month = dateMatch[1].padStart(2, '0')  // Primeiro número = MÊS
          const day = dateMatch[2].padStart(2, '0')    // Segundo número = DIA
          const year = dateMatch[3]
          dataFormatada = `${year}-${month}-${day}`
          
          if (i <= 5) {
            console.log(`✅ Linha ${i}: "${carimbo}" (MM/DD/YYYY) → ${dataFormatada}`)
          }
        }
      }

      if (!dataFormatada) {
        console.log(`⚠️ Linha ${i}: Data inválida - pulando`)
        continue
      }

      // Extrair avaliação (coluna 2)
      const nota = parseValue(row[2])
      const dia_semana = row[1] ? String(row[1]).trim() : null
      const comentarios = row[3] ? String(row[3]).trim() : null

      // Inserir na tabela nps_reservas
      const novoRegistro = {
        bar_id: 3,
        data_pesquisa: dataFormatada,
        nota,
        dia_semana,
        comentarios
      }

      const { error: erroInsert } = await supabase
        .from('nps_reservas')
        .insert(novoRegistro)
        .select()

      if (erroInsert) {
        // Ignorar duplicatas
        if (erroInsert.code === '23505') {
          if (i <= 5) {
            console.log(`⚠️ Linha ${i}: Registro duplicado - pulando`)
          }
        } else {
          console.error(`❌ Erro ao inserir linha ${i}:`, erroInsert)
        }
      } else {
        atualizados++
        if (i <= 5) {
          console.log(`✅ Inserido: ${dataFormatada} → Nota: ${nota}, Dia: ${dia_semana}`)
        }
      }
    }

    console.log(`✅ Sincronização concluída! ${atualizados} registros atualizados`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${data.length - 1} registros processados, ${atualizados} atualizados com NPS Reservas`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Erro na sincronização:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

