import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { read, utils } from 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Credenciais da Service Account
const CREDENTIALS = {
  client_email: 'contaazul-sheets-service@canvas-landing-447918-h7.iam.gserviceaccount.com',
  private_key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDFOiRlV86rqUPm
v/aadmu68+JgOQtvTxJ0dOT9BEOvd3nIJwbtda7NdBlcE7naIlrl7jkngLUUBu32
rBjzkFuGXRPzYqof4bBPCKVRiNOmN9hpmJHV7XrCXLEscBuyzM6Wp/owKbrAq93T
9oQixv9Xng4NjtYIQDwql4ngmEDxQdWCDtLersPpcOh2WDiuAqHCRraIjd7sHU9T
WDnn3wbKF7UhsDEmIQVZOsG/75kW9jycs8WGtXQUd7TSK700pw/7YfRqwJX17xpm
selgcYG5fKzcpFZz4fe06TeCjVtvt4ksb8LzoCPnaZLDn3EK3ywf9UxZQs7jta1g
6cCh1j1DAgMBAAECggEADUORQg2LNSk/i0u6sn2nVh3jyhPcDILVW2anJcr9IFZZ
JthVE3A4LtIRiIs9Ewn/cfo49sqlovCqXU4KqYq6VQl6d4JZraY4fMA4mgipL0MP
N17O5APCH0MrmTD68+XpOOGYJlgQGrgURZaNIWefsY1MJaZHB6wGP9kMKUIkD/V+
rOh1v1i4u3gbeRzvk3djHx8L8CJbsqRR7YGypZHEgPdt05EpjjMpNI3Doiz6OtPb
0Avxvhfg4xGqX7+mJfNXJoYkMpNq9+Jkfa7uTtnMpRq1RTJKykNaHpCVGnHf9wla
O9YpI6kv88bZvzqjm0XgQrPj9sR4cXsYLJJDxZiuxQKBgQDzBl8888jWDW2YtqZb
0NKea/DMqfdOvBtx4Rk7oYz36gLjGKo950fxGtiG3DyjbNr+ZEEcvR+F3Pwn+ahh
9IkD592yXwLPyLGPH15mgJofbccUrFmzz0n4s2bt2stO310QqTLZeiWYz4L2qDmx
YLw60SYIkP9G/AXor5yiyiFddQKBgQDPwdAhys8n9c+fBOBvJrj3mqGXjj4OBiDn
/5VTD2ERebbav3ZGdQbTJkCH+AWHo047SvYc6/4h2vuRaQWVh+EcyG16BmuGu5SW
oSB0+eoOzqpkTBSefJ/fh6O0YYITexsOwwxMUBNhtiE+Nia1l6NcnHyS/4Edjuei
jy5e7rXA1wKBgH8KHrELMzqKLHd/S3mFsQQ1otwqIWicNrCSHhGpArr6LmYul5fi
lh34jaX57Qz1M4l2OP9f8eGVQo9XF+mU3icXhzHeLucVn5QUrtFgerDhPweUjRPM
0XtbtPuzu0HQy6KRAE7lZk/6chikmfwaeGs6t+oUeg3OYvxfCL+kcEqdAoGATqzE
lqdov2c00rFUFIODdDCYlP4GveTQPUrqT2P5jFadSkVLEu9qQDeyJEtmPLE5BPck
MFumB0gYED7HIJMuSmoUGyunOIR8hnZKBkJFwom8uPKetE3ZdRq2ga6TRbFO085F
L/j6/fuspxR2oDnmYUHZYwli6cCeM08pbkXTik0CgYEAyaA1jU2/9IYIJzLyckmt
HiNA7UjlSnkgMr4cdQIDZfbrewPguLQaaKlDXte7Pt8r04lw/Hvg/ZMq8Sa+wArj
MgxgpEwLOOhgr6GkpkGHCJQvbVAU6VnWncovkOfNfVUU/S6VL7hXRbXrXntZ34ec
fict34UnfFfDpdLHjxA7AQc=
-----END PRIVATE KEY-----`
}

// ID do arquivo do Google Drive - NPS Reservas
// https://docs.google.com/spreadsheets/d/1HXSsGWum84HrB3yRvuzv-TsPcd8wEywVrOztdFcHna0/edit?resourcekey=&gid=1288620542#gid=1288620542
const FILE_ID = '1HXSsGWum84HrB3yRvuzv-TsPcd8wEywVrOztdFcHna0'

// Gerar JWT para autenticação Google
async function createJWT() {
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

      // Estrutura esperada da planilha de reservas:
      // Col 0: Carimbo de data/hora
      // Col 1: Nome
      // Col 2: Telefone
      // Col 3: Avaliação (0-10)
      // Col 4: Comentários (opcional)
      
      // Extrair data do carimbo (coluna 0)
      let dataFormatada = ''
      const carimbo = String(row[0] || '').trim()
      
      if (carimbo) {
        // Formato esperado: "DD/MM/YYYY HH:MM:SS"
        const dateMatch = carimbo.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
        
        if (dateMatch) {
          const day = dateMatch[1].padStart(2, '0')
          const month = dateMatch[2].padStart(2, '0')
          const year = dateMatch[3]
          dataFormatada = `${year}-${month}-${day}`
          
          if (i <= 5) {
            console.log(`✅ Linha ${i}: "${carimbo}" → ${dataFormatada}`)
          }
        }
      }

      if (!dataFormatada) {
        console.log(`⚠️ Linha ${i}: Data inválida - pulando`)
        continue
      }

      // Extrair avaliação (coluna 3)
      const nps_reservas = parseValue(row[3])
      const comentario = row[4] ? String(row[4]).trim() : ''

      // Buscar se já existe registro nessa data para atualizar apenas nps_reservas
      const { data: existente, error: erroConsulta } = await supabase
        .from('nps')
        .select('id')
        .eq('bar_id', 3) // Ordinário
        .eq('data_pesquisa', dataFormatada)
        .limit(1)
        .maybeSingle()

      if (erroConsulta) {
        console.error(`❌ Erro ao consultar registro ${i}:`, erroConsulta)
        continue
      }

      if (existente) {
        // Atualizar apenas nps_reservas no registro existente
        const { error: erroUpdate } = await supabase
          .from('nps')
          .update({ nps_reservas })
          .eq('id', existente.id)

        if (erroUpdate) {
          console.error(`❌ Erro ao atualizar nps_reservas na linha ${i}:`, erroUpdate)
        } else {
          atualizados++
          if (i <= 5) {
            console.log(`✅ Atualizado: ${dataFormatada} → NPS Reservas: ${nps_reservas}`)
          }
        }
      } else {
        console.log(`⚠️ Registro não encontrado para ${dataFormatada} - criando novo`)
        
        // Se não existe, criar novo registro apenas com reservas
        const novoRegistro = {
          bar_id: 3,
          data_pesquisa: dataFormatada,
          nps_reservas,
          comentarios: comentario,
          nps_geral: 0,
          nps_ambiente: 0,
          nps_atendimento: 0,
          nps_limpeza: 0,
          nps_musica: 0,
          nps_comida: 0,
          nps_drink: 0,
          nps_preco: 0,
          media_geral: 0,
          resultado_percentual: 0
        }

        const { error: erroInsert } = await supabase
          .from('nps')
          .insert(novoRegistro)

        if (erroInsert) {
          console.error(`❌ Erro ao inserir linha ${i}:`, erroInsert)
        } else {
          atualizados++
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

