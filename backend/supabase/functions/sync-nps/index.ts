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

// ID do arquivo do Google Drive - NPS
// https://docs.google.com/spreadsheets/d/1GSsU3G2uEl6RHkQUop_WDWjzLBsMVomJN-rf-_J8Sx4/edit?resourcekey=&pli=1&gid=38070213#gid=38070213
const FILE_ID = '1GSsU3G2uEl6RHkQUop_WDWjzLBsMVomJN-rf-_J8Sx4'
const SHEET_NAME = 'Respostas ao formulário 1'

interface NPSRow {
  bar_id: number
  data_pesquisa: string
  setor: string
  quorum: number
  qual_sua_area_atuacao: number
  sinto_me_motivado: number
  empresa_se_preocupa: number
  conectado_colegas: number
  relacionamento_positivo: number
  quando_identifico: number
  media_geral: number
  resultado_percentual: number
  funcionario_nome: string
}

// Função para obter Access Token usando Service Account
async function getAccessToken(): Promise<string> {
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

    console.log(`📊 ${jsonData.length} linhas encontradas`)

    // 4. Processar dados (pular cabeçalho - linha 0)
    const registros: NPSRow[] = []
    
    // Google Forms geralmente tem: Carimbo de data/hora + perguntas
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      
      if (!row[0] || String(row[0]).trim() === '') continue

      try {
        // Processar carimbo de data/hora do Google Forms
        let dataFormatada = ''
        let timestampCompleto = ''
        if (row[0]) {
          if (typeof row[0] === 'number') {
            // Data Excel
            const date = new Date((row[0] - 25569) * 86400 * 1000)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            dataFormatada = `${year}-${month}-${day}`
            timestampCompleto = row[0].toString() // Usar número como timestamp único
          } else {
            // String do Google Forms: "DD/MM/YYYY HH:MM:SS" ou "MM/DD/YYYY HH:MM:SS"
            const dateStr = String(row[0])
            timestampCompleto = dateStr // Salvar timestamp completo
            const dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
            if (dateMatch) {
              const day = dateMatch[1].padStart(2, '0')
              const month = dateMatch[2].padStart(2, '0')
              const year = dateMatch[3]
              dataFormatada = `${year}-${month}-${day}`
            }
          }
        }

        if (!dataFormatada) {
          console.warn(`⚠️ Linha ${i + 1}: Data inválida - ${row[0]}`)
          continue
        }

        // Converter valores (podem ser números 1-5 ou percentuais)
        const parseValue = (val: any): number => {
          if (!val) return 0
          const str = String(val).replace('%', '').replace(',', '.')
          const num = parseFloat(str)
          
          // Se já está na escala 1-5, retornar direto
          if (num >= 1 && num <= 5) {
            return num
          }
          
          // Se é percentual (0-100), converter para escala 1-5
          if (num > 5 && num <= 100) {
            const escala = Math.ceil((num / 100) * 5)
            return Math.max(1, Math.min(5, escala))
          }
          
          return num
        }

        // Estrutura do Google Forms NPS:
        // Col 0: Carimbo | Cols 1-6: 6 perguntas
        const pergunta1 = parseValue(row[1])
        const pergunta2 = parseValue(row[2])
        const pergunta3 = parseValue(row[3])
        const pergunta4 = parseValue(row[4])
        const pergunta5 = parseValue(row[5])
        const pergunta6 = parseValue(row[6])
        
        // Calcular média geral (média das 6 perguntas)
        const mediaGeral = (pergunta1 + pergunta2 + pergunta3 + pergunta4 + pergunta5 + pergunta6) / 6
        
        // Calcular resultado percentual (média / 5 * 100)
        const resultadoPercentual = (mediaGeral / 5) * 100

        const registro: NPSRow = {
          bar_id: 3,
          data_pesquisa: dataFormatada,
          setor: 'TODOS', // Google Forms geralmente não tem setor
          quorum: 1, // 1 resposta por linha
          qual_sua_area_atuacao: pergunta1,
          sinto_me_motivado: pergunta2,
          empresa_se_preocupa: pergunta3,
          conectado_colegas: pergunta4,
          relacionamento_positivo: pergunta5,
          quando_identifico: pergunta6,
          media_geral: parseFloat(mediaGeral.toFixed(2)),
          resultado_percentual: parseFloat(resultadoPercentual.toFixed(2)),
          funcionario_nome: `Cliente_${timestampCompleto.substring(0, 20)}`, // Identificador único baseado em timestamp
        }

        registros.push(registro)
      } catch (error) {
        console.error(`⚠️ Erro ao processar linha ${i + 1}:`, error)
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

    // 5. Inserir no Supabase
    console.log('💾 Inserindo no Supabase...')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: insertedData, error: insertError } = await supabaseClient
      .from('nps')
      .upsert(registros, {
        onConflict: 'bar_id,data_pesquisa,funcionario_nome,setor',
        ignoreDuplicates: false
      })
      .select()

    if (insertError) {
      console.error('❌ Erro ao inserir dados:', insertError)
      throw insertError
    }

    console.log(`✅ ${insertedData?.length || 0} registros inseridos/atualizados`)

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

