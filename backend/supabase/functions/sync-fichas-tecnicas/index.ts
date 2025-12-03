/**
 * 📋 EDGE FUNCTION - SINCRONIZAÇÃO FICHAS TÉCNICAS
 * 
 * Sincroniza automaticamente fichas técnicas do Google Sheets para o banco de dados.
 * Detecta mudanças, salva histórico e atualiza receitas/produções.
 * 
 * Executada automaticamente via cron job às 16:30 todos os dias.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SPREADSHEET_ID = '1klPn-uVLKeoJ9UA9TkiSYqa7sV7NdUdDEELdgd1q4b8'
const BAR_ID = 3 // Fixo por enquanto

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

interface SheetReceitaRow {
  codigo: string
  nome: string
  insumo_codigo: string
  insumo_nome: string
  quantidade: number
  custo?: number
}

interface SheetProducaoRow {
  codigo: string
  nome: string
  insumo_nome: string
  quantidade: number
}

interface SheetRendimentoRow {
  codigo: string
  nome: string
  rendimento: number
  custo?: number
  valor?: number
  tipo_producao?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Iniciando sincronização de fichas técnicas...')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('✅ Autenticando com Service Account...')

    // Obter token de acesso do Google
    const accessToken = await getAccessToken()
    console.log('✅ Token de acesso obtido')

    const SHEETS_TO_SYNC = [
      { name: 'Base - Cardapio - CMV', range: 'A:G', type: 'receita' },
      { name: 'Base - Preparos - CMV', range: 'A:E', type: 'producao' },
      { name: 'Lista - Preparos', range: 'A:F', type: 'rendimento' }
    ]

    let totalAlteracoes = 0
    let totalErros = 0
    const resumoAlteracoes: any[] = []

    // 3. Processar cada aba
    for (const sheet of SHEETS_TO_SYNC) {
      console.log(`📄 Processando aba: ${sheet.name}`)

      try {
        const sheetData = await fetchSheetData(
          SPREADSHEET_ID,
          sheet.name,
          sheet.range,
          accessToken
        )

        if (sheet.type === 'receita') {
          const resultado = await syncReceitas(sheetData, supabaseClient)
          totalAlteracoes += resultado.alteracoes
          resumoAlteracoes.push({
            aba: sheet.name,
            tipo: 'receitas',
            ...resultado
          })
        } else if (sheet.type === 'producao') {
          const resultado = await syncProducoes(sheetData, supabaseClient)
          totalAlteracoes += resultado.alteracoes
          resumoAlteracoes.push({
            aba: sheet.name,
            tipo: 'producoes',
            ...resultado
          })
        } else if (sheet.type === 'rendimento') {
          const resultado = await syncRendimentos(sheetData, supabaseClient)
          totalAlteracoes += resultado.alteracoes
          resumoAlteracoes.push({
            aba: sheet.name,
            tipo: 'rendimentos',
            ...resultado
          })
        }
      } catch (error) {
        console.error(`❌ Erro ao processar ${sheet.name}:`, error)
        totalErros++
        resumoAlteracoes.push({
          aba: sheet.name,
          erro: error.message
        })
      }
    }

    console.log(`✅ Sincronização concluída: ${totalAlteracoes} alterações, ${totalErros} erros`)

    return new Response(
      JSON.stringify({
        success: true,
        totalAlteracoes,
        totalErros,
        resumo: resumoAlteracoes,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erro na sincronização:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// ========== FUNÇÕES AUXILIARES ==========

/**
 * Obtém Access Token do Google usando Service Account
 */
async function getAccessToken(): Promise<string> {
  const CREDENTIALS = getCredentials()
  const encoder = new TextEncoder()
  const now = Math.floor(Date.now() / 1000)
  
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: CREDENTIALS.client_email,
    sub: CREDENTIALS.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
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

  // Criar assinatura JWT
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

/**
 * Busca dados de uma aba do Google Sheets
 */
async function fetchSheetData(
  spreadsheetId: string,
  sheetName: string,
  range: string,
  accessToken: string
): Promise<any[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!${range}`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Erro ao buscar dados da planilha ${sheetName}: ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  console.log(`✅ Aba "${sheetName}" lida: ${(data.values || []).length} linhas`)
  return data.values || []
}

async function syncReceitas(sheetData: any[][], supabaseClient: any) {
  let alteracoes = 0
  let novos = 0
  let atualizados = 0
  const detalhes: any[] = []

  // Pular header (primeira linha)
  const rows = sheetData.slice(1)

  // Agrupar por código de receita
  const receitasMap = new Map<string, any>()

  for (const row of rows) {
    if (!row[0] || !row[1]) continue // Pular linhas vazias

    const codigo = String(row[0]).trim()
    const nome = String(row[1]).trim()
    const insumo_codigo = row[2] ? String(row[2]).trim() : ''
    const insumo_nome = row[3] ? String(row[3]).trim() : ''
    const quantidade = row[4] ? parseFloat(String(row[4])) : 0
    const custo = row[6] ? parseFloat(String(row[6])) : null

    if (!receitasMap.has(codigo)) {
      receitasMap.set(codigo, {
        codigo,
        nome,
        custo,
        insumos: []
      })
    }

    if (insumo_codigo || insumo_nome) {
      receitasMap.get(codigo).insumos.push({
        insumo_codigo,
        insumo_nome,
        quantidade
      })
    }
  }

  const bar_id = BAR_ID
  
  // Buscar TODAS as receitas de uma vez (otimização)
  const codigos = Array.from(receitasMap.keys())
  const { data: todasReceitas } = await supabaseClient
    .from('receitas')
    .select('*')
    .in('receita_codigo', codigos)
    .eq('bar_id', bar_id)
  
  // Criar mapa de receitas existentes
  const receitasExistentesMap = new Map()
  if (todasReceitas) {
    for (const r of todasReceitas) {
      receitasExistentesMap.set(r.receita_codigo, r)
    }
  }

  // Processar cada receita
  for (const [codigo, receitaData] of receitasMap) {
    try {
      let receitaExistente = receitasExistentesMap.get(codigo) || null
      
      // Se encontrou, buscar insumos separadamente
      if (receitaExistente) {
        const { data: insumosData } = await supabaseClient
          .from('receitas_insumos')
          .select('*, insumo:insumos(*)')
          .eq('receita_id', receitaExistente.id)
        
        receitaExistente.receitas_insumos = insumosData || []
      }

      if (!receitaExistente) {
        // Criar nova receita
        const { data: novaReceita, error: erroReceita } = await supabaseClient
          .from('receitas')
          .insert({
            bar_id,
            receita_codigo: codigo,
            receita_nome: receitaData.nome,
            ativo: true
          })
          .select()
          .single()

        if (erroReceita) throw erroReceita

        // Inserir insumos
        for (const insumo of receitaData.insumos) {
          const insumoDb = await buscarOuCriarInsumo(
            insumo.insumo_codigo,
            insumo.insumo_nome,
            bar_id,
            supabaseClient
          )

          await supabaseClient
            .from('receitas_insumos')
            .insert({
              receita_id: novaReceita.id,
              insumo_id: insumoDb.id,
              quantidade_necessaria: insumo.quantidade,
              unidade_medida: 'g'
            })
        }

        novos++
        alteracoes++
        detalhes.push({
          tipo: 'NOVA',
          codigo,
          nome: receitaData.nome,
          insumos: receitaData.insumos.length
        })

        console.log(`✅ Nova receita criada: ${codigo} - ${receitaData.nome}`)

      } else {
        // Verificar mudanças
        let houveAlteracao = false
        const mudancas: any[] = []

        // Verificar nome
        if (receitaExistente.receita_nome !== receitaData.nome) {
          houveAlteracao = true
          mudancas.push({
            campo: 'nome',
            anterior: receitaExistente.receita_nome,
            novo: receitaData.nome
          })
        }

        // Verificar insumos
        const insumosAtuais = receitaExistente.receitas_insumos || []
        
        for (const insumoSheet of receitaData.insumos) {
          const insumoDb = await buscarOuCriarInsumo(
            insumoSheet.insumo_codigo,
            insumoSheet.insumo_nome,
            bar_id,
            supabaseClient
          )

          const insumoAtual = insumosAtuais.find(
            (i: any) => i.insumo_id === insumoDb.id
          )

          if (!insumoAtual) {
            // Novo insumo na receita
            await supabaseClient
              .from('receitas_insumos')
              .insert({
                receita_id: receitaExistente.id,
                insumo_id: insumoDb.id,
                quantidade_necessaria: insumoSheet.quantidade,
                unidade_medida: 'g'
              })

            houveAlteracao = true
            mudancas.push({
              campo: 'insumo_adicionado',
              insumo: insumoSheet.insumo_nome,
              quantidade: insumoSheet.quantidade
            })

          } else if (insumoAtual.quantidade_necessaria !== insumoSheet.quantidade) {
            // Quantidade alterada
            await supabaseClient
              .from('receitas_insumos')
              .update({
                quantidade_necessaria: insumoSheet.quantidade
              })
              .eq('id', insumoAtual.id)

            houveAlteracao = true
            mudancas.push({
              campo: 'quantidade_insumo',
              insumo: insumoSheet.insumo_nome,
              anterior: insumoAtual.quantidade_necessaria,
              novo: insumoSheet.quantidade
            })
          }
        }

        if (houveAlteracao) {
          // Atualizar receita
          await supabaseClient
            .from('receitas')
            .update({
              receita_nome: receitaData.nome,
              updated_at: new Date().toISOString()
            })
            .eq('id', receitaExistente.id)

          // Salvar histórico
          await salvarHistoricoReceita(
            receitaExistente.id,
            receitaExistente,
            receitaData.insumos,
            mudancas,
            supabaseClient
          )

          atualizados++
          alteracoes++
          detalhes.push({
            tipo: 'ATUALIZADO',
            codigo,
            nome: receitaData.nome,
            mudancas
          })

          console.log(`🔄 Receita atualizada: ${codigo} - ${mudancas.length} mudanças`)
        }
      }

    } catch (error) {
      console.error(`❌ Erro ao processar receita ${codigo}:`, error)
      detalhes.push({
        tipo: 'ERRO',
        codigo,
        erro: error.message
      })
    }
  }

  return { alteracoes, novos, atualizados, detalhes }
}

/**
 * Sincroniza preparos/produções da aba "Base - Preparos"
 */
async function syncProducoes(sheetData: any[][], supabaseClient: any) {
  let alteracoes = 0
  let novos = 0
  let atualizados = 0
  const detalhes: any[] = []

  // Pular header (primeira linha)
  const rows = sheetData.slice(1)

  // Agrupar por código de produção
  const producoesMap = new Map<string, any>()

  for (const row of rows) {
    if (!row[0] || !row[1]) continue // Pular linhas vazias

    const codigo = String(row[0]).trim()
    const nome = String(row[1]).trim()
    const insumo_nome = row[3] ? String(row[3]).trim() : '' // Coluna D
    const quantidade = row[4] ? parseFloat(String(row[4])) : 0 // Coluna E

    if (!producoesMap.has(codigo)) {
      producoesMap.set(codigo, {
        codigo,
        nome,
        insumos: []
      })
    }

    if (insumo_nome) {
      producoesMap.get(codigo).insumos.push({
        insumo_nome,
        quantidade
      })
    }
  }

  // Processar cada produção
  for (const [codigo, producaoData] of producoesMap) {
    try {
      // Buscar produção existente (usar receitas como base para preparos)
      const { data: receitasExistentes, error: errorBusca } = await supabaseClient
        .from('receitas')
        .select('*')
        .eq('receita_codigo', codigo)
      
      if (errorBusca) {
        console.error(`Erro ao buscar preparo ${codigo}:`, errorBusca)
        throw errorBusca
      }
      
      // Se encontrou múltiplas, pegar a do bar correto ou a primeira
      let receitaExistente = receitasExistentes && receitasExistentes.length > 0
        ? (receitasExistentes.find(r => r.bar_id === BAR_ID) || receitasExistentes[0])
        : null
      
      // Se encontrou, buscar insumos separadamente
      if (receitaExistente) {
        const { data: insumosData } = await supabaseClient
          .from('receitas_insumos')
          .select('*, insumo:insumos(*)')
          .eq('receita_id', receitaExistente.id)
        
        receitaExistente.receitas_insumos = insumosData || []
      }

      if (!receitaExistente) {
        // Criar nova receita/preparo
        const { data: novoPrepa, error: erroReceita } = await supabaseClient
          .from('receitas')
          .insert({
            bar_id: BAR_ID,
            receita_codigo: codigo,
            receita_nome: producaoData.nome,
            receita_categoria: 'preparo',
            ativo: true
          })
          .select()
          .single()

        if (erroReceita) throw erroReceita

        // Inserir insumos
        for (const insumo of producaoData.insumos) {
          const insumoDb = await buscarOuCriarInsumo(
            '',
            insumo.insumo_nome,
            BAR_ID,
            supabaseClient
          )

          await supabaseClient
            .from('receitas_insumos')
            .insert({
              receita_id: novoPrepa.id,
              insumo_id: insumoDb.id,
              quantidade_necessaria: insumo.quantidade,
              unidade_medida: 'g'
            })
        }

        novos++
        alteracoes++
        detalhes.push({
          tipo: 'NOVO_PREPARO',
          codigo,
          nome: producaoData.nome,
          insumos: producaoData.insumos.length
        })

        console.log(`✅ Novo preparo criado: ${codigo} - ${producaoData.nome}`)

      } else {
        // Verificar mudanças nos insumos
        let houveAlteracao = false
        const mudancas: any[] = []

        const insumosAtuais = receitaExistente.receitas_insumos || []
        
        for (const insumoSheet of producaoData.insumos) {
          const insumoDb = await buscarOuCriarInsumo(
            '',
            insumoSheet.insumo_nome,
            BAR_ID,
            supabaseClient
          )

          const insumoAtual = insumosAtuais.find(
            (i: any) => i.insumo_id === insumoDb.id
          )

          if (!insumoAtual) {
            // Novo insumo no preparo
            await supabaseClient
              .from('receitas_insumos')
              .insert({
                receita_id: receitaExistente.id,
                insumo_id: insumoDb.id,
                quantidade_necessaria: insumoSheet.quantidade,
                unidade_medida: 'g'
              })

            houveAlteracao = true
            mudancas.push({
              campo: 'insumo_adicionado',
              insumo: insumoSheet.insumo_nome,
              quantidade: insumoSheet.quantidade
            })

          } else if (insumoAtual.quantidade_necessaria !== insumoSheet.quantidade) {
            // Quantidade alterada
            await supabaseClient
              .from('receitas_insumos')
              .update({
                quantidade_necessaria: insumoSheet.quantidade
              })
              .eq('id', insumoAtual.id)

            houveAlteracao = true
            mudancas.push({
              campo: 'quantidade_insumo',
              insumo: insumoSheet.insumo_nome,
              anterior: insumoAtual.quantidade_necessaria,
              novo: insumoSheet.quantidade
            })
          }
        }

        if (houveAlteracao) {
          // Atualizar receita
          await supabaseClient
            .from('receitas')
            .update({
              receita_nome: producaoData.nome,
              updated_at: new Date().toISOString()
            })
            .eq('id', receitaExistente.id)

          // Salvar histórico
          await salvarHistoricoReceita(
            receitaExistente.id,
            receitaExistente,
            producaoData.insumos,
            mudancas,
            supabaseClient
          )

          atualizados++
          alteracoes++
          detalhes.push({
            tipo: 'PREPARO_ATUALIZADO',
            codigo,
            nome: producaoData.nome,
            mudancas
          })

          console.log(`🔄 Preparo atualizado: ${codigo} - ${mudancas.length} mudanças`)
        }
      }

    } catch (error) {
      console.error(`❌ Erro ao processar preparo ${codigo}:`, error)
      detalhes.push({
        tipo: 'ERRO',
        codigo,
        erro: error.message
      })
    }
  }

  return { alteracoes, novos, atualizados, detalhes }
}

/**
 * Sincroniza rendimentos da aba "Lista Preparos"
 */
async function syncRendimentos(sheetData: any[][], supabaseClient: any) {
  let alteracoes = 0
  let atualizados = 0
  const detalhes: any[] = []

  const rows = sheetData.slice(1)

  for (const row of rows) {
    if (!row[0]) continue

    const codigo = String(row[0]).trim()
    const nome = String(row[1] || '').trim()
    const rendimento = row[2] ? parseFloat(String(row[2])) : null
    const custo = row[3] ? parseFloat(String(row[3])) : null
    const tipo_producao = row[5] ? String(row[5]).trim() : null

    if (rendimento === null || rendimento === 0) continue

    try {
      // Buscar receita pelo código
      const { data: receita } = await supabaseClient
        .from('receitas')
        .select('id, receita_nome, rendimento_esperado, observacoes')
        .eq('receita_codigo', codigo)
        .eq('bar_id', BAR_ID)
        .maybeSingle()

      if (receita) {
        const atualizacoes: any = {}
        let houveAlteracao = false

        if (receita.rendimento_esperado !== rendimento) {
          atualizacoes.rendimento_esperado = rendimento
          houveAlteracao = true

          detalhes.push({
            tipo: 'RENDIMENTO_RECEITA',
            codigo,
            nome: receita.receita_nome,
            anterior: receita.rendimento_esperado,
            novo: rendimento
          })
        }

        // Adicionar tipo de produção nas observações se disponível
        if (tipo_producao && !receita.observacoes?.includes(tipo_producao)) {
          atualizacoes.observacoes = receita.observacoes 
            ? `${receita.observacoes} | Tipo: ${tipo_producao}`
            : `Tipo: ${tipo_producao}`
          houveAlteracao = true
        }

        if (houveAlteracao) {
          await supabaseClient
            .from('receitas')
            .update({
              ...atualizacoes,
              updated_at: new Date().toISOString()
            })
            .eq('id', receita.id)

          alteracoes++
          atualizados++

          console.log(`🔄 Rendimento atualizado: ${codigo} - ${rendimento}g`)
        }
      } else {
        // Receita não encontrada, talvez seja um preparo que ainda não foi criado
        console.log(`⚠️ Receita ${codigo} não encontrada para atualizar rendimento`)
        detalhes.push({
          tipo: 'NAO_ENCONTRADO',
          codigo,
          nome
        })
      }

    } catch (error) {
      console.error(`❌ Erro ao atualizar rendimento ${codigo}:`, error)
      detalhes.push({
        tipo: 'ERRO',
        codigo,
        erro: error.message
      })
    }
  }

  return { alteracoes, novos: 0, atualizados, detalhes }
}

/**
 * Busca insumo existente ou cria um novo
 */
async function buscarOuCriarInsumo(
  codigo: string,
  nome: string,
  bar_id: number,
  supabaseClient: any
) {
  let insumo = null

  // Primeiro tentar buscar por código se fornecido
  if (codigo) {
    const { data } = await supabaseClient
      .from('insumos')
      .select('*')
      .eq('bar_id', bar_id)
      .eq('codigo', codigo)
      .maybeSingle()
    
    insumo = data
  }

  // Se não encontrou por código, buscar por nome (case insensitive)
  if (!insumo && nome) {
    const { data } = await supabaseClient
      .from('insumos')
      .select('*')
      .eq('bar_id', bar_id)
      .ilike('nome', nome)
      .maybeSingle()
    
    insumo = data
  }

  // Se ainda não encontrou, criar novo insumo
  if (!insumo) {
    const codigoFinal = codigo || `AUTO_${Date.now()}`
    
    const { data: novoInsumo, error } = await supabaseClient
      .from('insumos')
      .insert({
        bar_id,
        codigo: codigoFinal,
        nome: nome || 'Insumo sem nome',
        categoria: 'cozinha',
        tipo_local: 'cozinha',
        unidade_medida: 'g',
        custo_unitario: 0,
        ativo: true
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao criar insumo:', error)
      throw error
    }
    
    insumo = novoInsumo
    console.log(`✅ Novo insumo criado: ${codigoFinal} - ${nome}`)
  }

  return insumo
}

/**
 * Salva histórico de alterações na receita
 */
async function salvarHistoricoReceita(
  receita_id: number,
  receitaExistente: any,
  insumosNovos: any[],
  mudancas: any[],
  supabaseClient: any
) {
  const timestamp = Date.now()
  const versao = `v${timestamp}`
  const dataAtualizacao = new Date().toISOString()

  // Formatar insumos para o histórico
  const insumosFormatados = insumosNovos.map((insumo: any) => ({
    insumo_codigo: insumo.insumo_codigo || '',
    insumo_nome: insumo.insumo_nome,
    quantidade: insumo.quantidade,
    unidade: 'g'
  }))

  // Montar observações com as mudanças
  const observacoesHistorico = [
    receitaExistente.observacoes || '',
    '\n--- Mudanças desta versão ---',
    ...mudancas.map((m: any) => {
      if (m.campo === 'quantidade_insumo') {
        return `• ${m.insumo}: ${m.anterior}g → ${m.novo}g`
      } else if (m.campo === 'insumo_adicionado') {
        return `• Adicionado: ${m.insumo} (${m.quantidade}g)`
      } else if (m.campo === 'nome') {
        return `• Nome alterado: ${m.anterior} → ${m.novo}`
      }
      return `• ${JSON.stringify(m)}`
    })
  ].join('\n')

  const { error } = await supabaseClient
    .from('receitas_historico')
    .insert({
      receita_id,
      bar_id: receitaExistente.bar_id,
      receita_codigo: receitaExistente.receita_codigo,
      receita_nome: receitaExistente.receita_nome,
      receita_categoria: receitaExistente.receita_categoria,
      tipo_local: receitaExistente.tipo_local,
      rendimento_esperado: receitaExistente.rendimento_esperado,
      observacoes: observacoesHistorico,
      insumo_chefe_id: receitaExistente.insumo_chefe_id,
      insumos: insumosFormatados,
      versao,
      data_atualizacao: dataAtualizacao,
      origem: 'sheets',
      usuario_id: null
    })

  if (error) {
    console.error('❌ Erro ao salvar histórico:', error)
  } else {
    console.log(`📝 Histórico salvo: ${receitaExistente.receita_codigo} - ${versao} (${mudancas.length} mudanças)`)
  }
}

