import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserAuth, isAdmin } from '@/lib/auth-helper'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ========================================
// 📊 SINCRONIZAR DIRETAMENTE COM GOOGLE SHEETS
// ========================================
export async function POST(request: NextRequest) {
  try {
    const user = await getUserAuth(request)

    if (!user || !isAdmin(user)) {
      return NextResponse.json({ 
        error: 'Apenas administradores podem sincronizar dados' 
      }, { status: 403 })
    }

    const { bar_id } = user
    const body = await request.json()
    const { planilha_url, substituir_existentes = true } = body

    if (!planilha_url) {
      return NextResponse.json({ 
        error: 'URL da planilha é obrigatória' 
      }, { status: 400 })
    }

    console.log('📊 Sincronizando com Google Sheets:', { planilha_url })

    // Extrair ID e GID da planilha da URL
    const sheetId = extrairIdPlanilha(planilha_url)
    const gid = extrairGidPlanilha(planilha_url)
    
    if (!sheetId) {
      return NextResponse.json({ 
        error: 'URL da planilha inválida' 
      }, { status: 400 })
    }

    console.log('📊 Planilha extraída:', { sheetId, gid })

    // Fazer requisição para Google Sheets API
    const dadosPlanilha = await buscarDadosGoogleSheets(sheetId, gid)
    
    if (!dadosPlanilha || dadosPlanilha.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhum dado encontrado na planilha' 
      }, { status: 404 })
    }

    // Processar dados da planilha
    const dadosProcessados = processarDadosPlanilha(dadosPlanilha, bar_id)
    
    if (dadosProcessados.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhum dado válido encontrado para importar' 
      }, { status: 400 })
    }

    // Salvar no banco
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    let dadosImportados = 0
    let dadosAtualizados = 0
    let erros = []

    for (const semana of dadosProcessados) {
      try {
        // Verificar se já existe
        const { data: existente } = await supabase
          .from('desempenho_semanal')
          .select('id')
          .eq('bar_id', bar_id)
          .eq('ano', semana.ano)
          .eq('numero_semana', semana.numero_semana)
          .single()

        if (existente && !substituir_existentes) {
          continue
        }

        // Inserir ou atualizar
        const { error } = await supabase
          .from('desempenho_semanal')
          .upsert(semana, {
            onConflict: 'bar_id,ano,numero_semana'
          })

        if (error) {
          erros.push(`Semana ${semana.numero_semana}: ${error.message}`)
          continue
        }

        if (existente) {
          dadosAtualizados++
        } else {
          dadosImportados++
        }

      } catch (error: any) {
        erros.push(`Semana ${semana.numero_semana}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sincronização com Google Sheets concluída',
      resultados: {
        dados_importados: dadosImportados,
        dados_atualizados: dadosAtualizados,
        total_processados: dadosImportados + dadosAtualizados,
        erros: erros.length,
        detalhes_erros: erros,
        planilha_id: sheetId,
        total_linhas_planilha: dadosPlanilha.length
      }
    })

  } catch (error: any) {
    console.error('❌ Erro na sincronização:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// ========================================
// 🔧 FUNÇÕES AUXILIARES
// ========================================

function extrairIdPlanilha(url: string): string | null {
  try {
    // Extrair ID de URLs como:
    // https://docs.google.com/spreadsheets/d/SHEET_ID/edit...
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

function extrairGidPlanilha(url: string): string {
  try {
    // Extrair GID de URLs como:
    // https://docs.google.com/spreadsheets/d/SHEET_ID/edit?gid=972882162#gid=972882162
    const match = url.match(/[?&#]gid=([0-9]+)/)
    return match ? match[1] : '0'
  } catch {
    return '0'
  }
}

async function buscarDadosGoogleSheets(sheetId: string, gid: string = '0'): Promise<any[]> {
  try {
    // Verificar se a API key está configurada
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY
    
    if (!apiKey) {
      console.log('⚠️ API key não configurada, usando método alternativo...')
      return await buscarDadosAlternativo(sheetId, gid)
    }

    // URL da Google Sheets API
    const range = 'A:Z' // Buscar todas as colunas
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`
    
    console.log('🔗 Buscando dados da planilha:', url.replace(apiKey, 'API_KEY_HIDDEN'))
    console.log('🔑 API key configurada:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NÃO')

    const response = await fetch(url)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Erro na API do Google Sheets: ${response.status}`, errorText)
      
      // Se der erro de autenticação, tentar método alternativo
      if (response.status === 403 || response.status === 401) {
        console.log('⚠️ Erro de autenticação, tentando método alternativo...')
        return await buscarDadosAlternativo(sheetId, gid)
      }
      
      throw new Error(`Erro na API do Google Sheets: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ Dados recebidos da API:', data.values?.length || 0, 'linhas')
    return data.values || []

  } catch (error) {
    console.error('❌ Erro ao buscar Google Sheets:', error)
    throw error
  }
}

async function buscarDadosAlternativo(sheetId: string, gid: string = '0'): Promise<any[]> {
  try {
    // Método alternativo usando CSV export (funciona para planilhas públicas)
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
    
    console.log('🔗 Tentando CSV export:', csvUrl)
    
    const response = await fetch(csvUrl)
    console.log('📊 Status da resposta CSV:', response.status)
    
    if (!response.ok) {
      // Se der erro com GID específico, tentar com GID 0 (primeira aba)
      if (gid !== '0') {
        console.log('⚠️ Erro com GID específico, tentando GID 0...')
        return await buscarDadosAlternativo(sheetId, '0')
      }
      throw new Error(`Erro ao acessar planilha: ${response.status}`)
    }

    const csvText = await response.text()
    console.log('✅ CSV recebido:', csvText.length, 'caracteres')
    
    // Verificar se é realmente CSV e não HTML de erro
    if (csvText.includes('<html>') || csvText.includes('<!DOCTYPE')) {
      throw new Error('Planilha não está pública ou não existe')
    }
    
    return csvParaArray(csvText)

  } catch (error) {
    console.error('❌ Erro no método alternativo:', error)
    throw error
  }
}

function csvParaArray(csvText: string): any[] {
  const linhas = csvText.trim().split('\n')
  return linhas.map(linha => 
    linha.split(',').map(cel => cel.replace(/"/g, '').trim())
  )
}

function processarDadosPlanilha(dados: any[], barId: number): any[] {
  const semanas = []
  
  try {
    console.log('🔍 Processando planilha com', dados.length, 'linhas')
    
    // Mapeamento das linhas baseado na estrutura da planilha
    const linhaMap: {[key: string]: number} = {}
    
    // Encontrar as linhas importantes
    for (let i = 0; i < dados.length; i++) {
      const linha = dados[i]
      if (!linha || !Array.isArray(linha)) continue
      
      const primeiraColuna = linha[0]?.toString().toLowerCase() || ''
      
      if (primeiraColuna.includes('faturamento total')) {
        linhaMap['faturamento_total'] = i
      } else if (primeiraColuna.includes('faturamento entrada')) {
        linhaMap['faturamento_entrada'] = i
      } else if (primeiraColuna.includes('faturamento bar')) {
        linhaMap['faturamento_bar'] = i
      } else if (primeiraColuna.includes('clientes atendidos')) {
        linhaMap['clientes_atendidos'] = i
      } else if (primeiraColuna.includes('reservas totais')) {
        linhaMap['reservas_totais'] = i
      } else if (primeiraColuna.includes('reservas presentes')) {
        linhaMap['reservas_presentes'] = i
      } else if (primeiraColuna.includes('ticket médio contahub')) {
        linhaMap['ticket_medio'] = i
      } else if (primeiraColuna.includes('cmv teórico')) {
        linhaMap['cmv_teorico'] = i
      } else if (primeiraColuna.includes('cmv limpo')) {
        linhaMap['cmv_limpo'] = i
      }
    }

    console.log('📊 Linhas mapeadas:', linhaMap)

    // Verificar se encontrou pelo menos faturamento total
    if (!linhaMap['faturamento_total']) {
      console.log('❌ Não encontrou linha de Faturamento Total')
      return []
    }

    // Pegar linha de cabeçalhos com nomes das semanas (linha 3 - índice 2)
    const linhaCabecalhos = dados[2] || []
    console.log('📋 Cabeçalhos encontrados:', linhaCabecalhos)

    // Pegar linha de datas (linha 5 - índice 4)  
    const linhaDatas = dados[4] || []
    console.log('📅 Datas encontradas:', linhaDatas)

    // Função helper para limpar e converter valores monetários
    const limparValorMonetario = (valor: string): number => {
      if (!valor) return 0
      return parseFloat(
        valor.toString()
          .replace(/[R$\s]/g, '')
          .replace(/\./g, '')
          .replace(',', '.')
      ) || 0
    }

    // Função helper para limpar e converter números
    const limparNumero = (valor: string): number => {
      if (!valor) return 0
      return parseInt(valor.toString().replace(/[^0-9]/g, '')) || 0
    }

    // Processar cada semana (a partir da coluna C = índice 2)
    const maxColunas = Math.max(
      dados[linhaMap['faturamento_total']]?.length || 0,
      linhaCabecalhos.length || 0
    )

    for (let coluna = 2; coluna < maxColunas && coluna < 50; coluna++) { // Máximo 50 colunas para cobrir todas as semanas
      // Pegar nome da semana do cabeçalho
      const nomeSemanaBruto = linhaCabecalhos[coluna]?.toString() || ''
      if (!nomeSemanaBruto.toLowerCase().includes('semana')) continue

      // Extrair número da semana (ex: "Semana 05" -> 5)
      const matchSemana = nomeSemanaBruto.match(/semana\s*(\d+)/i)
      if (!matchSemana) continue
      
      const numeroSemana = parseInt(matchSemana[1])
      
      // Pegar faturamento total
      const faturamentoTotal = limparValorMonetario(
        dados[linhaMap['faturamento_total']]?.[coluna] || '0'
      )
      
      if (faturamentoTotal <= 0) continue // Pular semanas sem faturamento

      // Pegar outros dados
      const faturamentoEntrada = limparValorMonetario(
        dados[linhaMap['faturamento_entrada']]?.[coluna] || '0'
      )
      
      const faturamentoBar = limparValorMonetario(
        dados[linhaMap['faturamento_bar']]?.[coluna] || '0'
      )
      
      const clientesAtendidos = limparNumero(
        dados[linhaMap['clientes_atendidos']]?.[coluna] || '0'
      )
      
      const reservasTotais = limparNumero(
        dados[linhaMap['reservas_totais']]?.[coluna] || '0'
      )
      
      const reservasPresentes = limparNumero(
        dados[linhaMap['reservas_presentes']]?.[coluna] || '0'
      )
      
      const ticketMedio = limparValorMonetario(
        dados[linhaMap['ticket_medio']]?.[coluna] || '0'
      )
      
      const cmvTeorico = parseFloat(
        dados[linhaMap['cmv_teorico']]?.[coluna]?.toString().replace('%', '') || '0'
      )
      
      const cmvLimpo = parseFloat(
        dados[linhaMap['cmv_limpo']]?.[coluna]?.toString().replace('%', '') || '0'
      )

      // Pegar data da semana
      const dataString = linhaDatas[coluna]?.toString() || ''
      let dataInicio = `2025-01-${27 + ((numeroSemana - 5) * 7)}` // Fallback
      let dataFim = `2025-01-${27 + ((numeroSemana - 5) * 7) + 6}` // Fallback
      
      // Tentar parser data real se disponível
      if (dataString) {
        try {
          const partesData = dataString.split(/[\/\-]/)
          if (partesData.length >= 2) {
            const dia = parseInt(partesData[0])
            const mes = parseInt(partesData[1])
            const ano = partesData[2] ? parseInt(partesData[2]) : 2025
            
            if (dia && mes) {
              const dataObj = new Date(ano, mes - 1, dia)
              dataInicio = dataObj.toISOString().split('T')[0]
              
              const dataFimObj = new Date(dataObj.getTime() + (6 * 24 * 60 * 60 * 1000))
              dataFim = dataFimObj.toISOString().split('T')[0]
            }
          }
        } catch (e) {
          console.log('⚠️ Erro ao parser data:', dataString)
        }
      }

      console.log(`✅ Semana ${numeroSemana}:`, {
        faturamentoTotal,
        clientesAtendidos,
        ticketMedio,
        reservasTotais
      })

      semanas.push({
        bar_id: barId,
        ano: 2025,
        numero_semana: numeroSemana,
        data_inicio: dataInicio,
        data_fim: dataFim,
        faturamento_total: faturamentoTotal,
        faturamento_entrada: faturamentoEntrada,
        faturamento_bar: faturamentoBar || faturamentoTotal, // Se não tem bar específico, usar total
        clientes_atendidos: clientesAtendidos,
        reservas_totais: reservasTotais,
        reservas_presentes: reservasPresentes,
        ticket_medio: ticketMedio,
        cmv_teorico: cmvTeorico,
        cmv_limpo: cmvLimpo,
        meta_semanal: 200000, // Meta padrão
        observacoes: `Importado do Google Sheets - ${nomeSemanaBruto}`
      })
    }

    console.log(`✅ Processadas ${semanas.length} semanas`)
    return semanas

  } catch (error) {
    console.error('❌ Erro ao processar dados:', error)
    return []
  }
}



// ========================================
// 📋 INFO SOBRE CONFIGURAÇÃO
// ========================================
export async function GET() {
  return NextResponse.json({
    info: "Sincronização automática com Google Sheets",
    configuracao_necessaria: {
      planilha_publica: "A planilha deve estar configurada como pública ou 'qualquer pessoa com o link'",
      google_api_key: process.env.GOOGLE_SHEETS_API_KEY ? "✅ Configurada" : "❌ Não configurada",
      formato_url: "https://docs.google.com/spreadsheets/d/SHEET_ID/edit..."
    },
    exemplo_uso: {
      method: "POST",
      body: {
        planilha_url: "https://docs.google.com/spreadsheets/d/13LL8q0iEBFU_aboB_uMw5NE8RYh20PoEwm_JYrg5MyI/edit",
        substituir_existentes: true
      }
    }
  })
} 