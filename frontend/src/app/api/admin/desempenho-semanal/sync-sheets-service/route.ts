import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserAuth, isAdmin } from '@/lib/auth-helper'
import { JWT } from 'google-auth-library'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ========================================
// 📊 SINCRONIZAR COM GOOGLE SHEETS USANDO SERVICE ACCOUNT
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

    console.log('📊 Sincronizando com Google Sheets (Service Account):', { planilha_url })

    // Extrair ID e GID da planilha da URL
    const sheetId = extrairIdPlanilha(planilha_url)
    const gid = extrairGidPlanilha(planilha_url)
    
    if (!sheetId) {
      return NextResponse.json({ 
        error: 'URL da planilha inválida' 
      }, { status: 400 })
    }

    console.log('📊 Planilha extraída:', { sheetId, gid })

    // Fazer requisição usando Service Account
    const dadosPlanilha = await buscarDadosComServiceAccount(sheetId, gid)
    
    if (!dadosPlanilha || dadosPlanilha.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhum dado encontrado na planilha' 
      }, { status: 404 })
    }

    console.log('📊 DADOS BRUTOS RECEBIDOS:')
    console.log(`   Total de linhas: ${dadosPlanilha.length}`)
    console.log(`   Primeira linha: [${dadosPlanilha[0]?.slice(0, 8).join(', ') || 'vazio'}]`)
    console.log(`   Segunda linha: [${dadosPlanilha[1]?.slice(0, 8).join(', ') || 'vazio'}]`)
    console.log(`   Terceira linha: [${dadosPlanilha[2]?.slice(0, 8).join(', ') || 'vazio'}]`)

    // Processar dados da planilha
    console.log('🔄 Iniciando processamento dos dados...')
    const dadosProcessados = processarDadosPlanilha(dadosPlanilha, bar_id)
    
    console.log(`📋 RESULTADO DO PROCESSAMENTO: ${dadosProcessados.length} semanas processadas`)
    
    if (dadosProcessados.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhum dado válido encontrado para importar',
        debug: {
          linhas_recebidas: dadosPlanilha.length,
          primeira_linha: dadosPlanilha[0]?.slice(0, 10) || 'vazio',
          amostra: dadosPlanilha.slice(0, 5)
        }
      }, { status: 400 })
    }

    // Salvar no banco
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    let dadosImportados = 0
    let dadosAtualizados = 0
    let erros = []

    console.log(`💾 Salvando ${dadosProcessados.length} semanas no banco...`)

    for (const semana of dadosProcessados) {
      try {
        console.log(`💾 Processando semana ${semana.numero_semana}...`)
        
        // Verificar se já existe
        const { data: existente, error: erroConsulta } = await supabase
          .from('desempenho_semanal')
          .select('id')
          .eq('bar_id', bar_id)
          .eq('ano', semana.ano)
          .eq('numero_semana', semana.numero_semana)
          .single()

        if (erroConsulta && erroConsulta.code !== 'PGRST116') {
          console.log(`❌ Erro consulta semana ${semana.numero_semana}:`, erroConsulta)
          erros.push(`Semana ${semana.numero_semana} - Consulta: ${erroConsulta.message}`)
          continue
        }

        if (existente && !substituir_existentes) {
          console.log(`⏭️ Semana ${semana.numero_semana} já existe, pulando...`)
          continue
        }

        // Inserir ou atualizar
        console.log(`💾 Salvando semana ${semana.numero_semana} com ${Object.keys(semana).length} campos...`)
        const { error } = await supabase
          .from('desempenho_semanal')
          .upsert(semana, {
            onConflict: 'bar_id,ano,numero_semana'
          })

        if (error) {
          console.log(`❌ Erro salvamento semana ${semana.numero_semana}:`, error)
          erros.push(`Semana ${semana.numero_semana} - Salvamento: ${error.message}`)
          continue
        }

        if (existente) {
          dadosAtualizados++
          console.log(`✅ Semana ${semana.numero_semana} atualizada`)
        } else {
          dadosImportados++
          console.log(`✅ Semana ${semana.numero_semana} criada`)
        }

      } catch (error: any) {
        console.log(`❌ Exceção semana ${semana.numero_semana}:`, error)
        erros.push(`Semana ${semana.numero_semana} - Exceção: ${error.message}`)
      }
    }

    console.log(`🏁 SINCRONIZAÇÃO CONCLUÍDA:`)
    console.log(`   📥 Importados: ${dadosImportados}`)
    console.log(`   🔄 Atualizados: ${dadosAtualizados}`)
    console.log(`   ❌ Erros: ${erros.length}`)
    
    if (erros.length > 0) {
      console.log(`📋 DETALHES DOS ERROS:`)
      erros.forEach((erro, index) => {
        console.log(`   ${index + 1}. ${erro}`)
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Sincronização com Google Sheets (Service Account) concluída',
      resultados: {
        dados_importados: dadosImportados,
        dados_atualizados: dadosAtualizados,
        total_processados: dadosImportados + dadosAtualizados,
        erros: erros.length,
        detalhes_erros: erros,
        planilha_id: sheetId,
        total_linhas_planilha: dadosPlanilha.length,
        semanas_encontradas: dadosProcessados.length
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
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

function extrairGidPlanilha(url: string): string {
  try {
    const match = url.match(/[?&#]gid=([0-9]+)/)
    return match ? match[1] : '0'
  } catch {
    return '0'
  }
}

async function buscarDadosComServiceAccount(sheetId: string, gid: string = '0'): Promise<any[]> {
  try {
    // Ler o arquivo JSON das credenciais da service account
    const fs = require('fs')
    const path = require('path')
    
    const serviceAccountPath = path.join(process.cwd(), '..', 'sgbv2-465213-fcc2bcd8ebbf.json')
    
    console.log('🔍 DEBUG CAMINHOS:')
    console.log('   process.cwd():', process.cwd())
    console.log('   serviceAccountPath:', serviceAccountPath)
    console.log('   Arquivo existe?:', fs.existsSync(serviceAccountPath))
    
    // Tentar outros caminhos possíveis
    const alternativePaths = [
      'F:\\SGB_V2\\sgbv2-465213-fcc2bcd8ebbf.json', // Caminho absoluto primeiro
      path.join(process.cwd(), '..', 'sgbv2-465213-fcc2bcd8ebbf.json'),
      path.join(process.cwd(), 'sgbv2-465213-fcc2bcd8ebbf.json'),
      path.join(process.cwd(), '..', '..', 'sgbv2-465213-fcc2bcd8ebbf.json')
    ]
    
    let validPath = null
    for (const testPath of alternativePaths) {
      console.log(`   Testando: ${testPath} - ${fs.existsSync(testPath) ? '✅' : '❌'}`)
      if (fs.existsSync(testPath)) {
        validPath = testPath
        break
      }
    }
    
    if (!validPath) {
      throw new Error(`Arquivo de credenciais não encontrado em nenhum dos caminhos testados. Último testado: ${serviceAccountPath}`)
    }
    
    console.log('✅ Usando caminho válido:', validPath)

    const serviceAccountKey = fs.readFileSync(validPath, 'utf8')
    
    // Parsear as credenciais JSON
    const credentials = JSON.parse(serviceAccountKey)
    
    // Criar cliente JWT para autenticação
    const jwtClient = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    })

    // Obter token de acesso
    const tokens = await jwtClient.authorize()
    const accessToken = tokens.access_token

    console.log('🔑 Service Account autenticada:', credentials.client_email)

    // Fazer requisição à API do Google Sheets - range correto identificado pelo teste
    const range = "'Tab Desemp ContaHub'!A1:Z100"
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro na API do Google Sheets: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ Dados recebidos via Service Account:', data.values?.length || 0, 'linhas')
    
    return data.values || []

  } catch (error) {
    console.error('❌ Erro com Service Account:', error)
    throw error
  }
}

function processarDadosPlanilha(dados: any[], barId: number): any[] {
  const semanas: any[] = []
  
  try {
    console.log('🔍 Processando planilha de DESEMPENHO SEMANAL com', dados.length, 'linhas')
    
    // ========================================
    // 🛠️ FUNÇÕES HELPER PARA LIMPEZA DE DADOS
    // ========================================
    const limparValorMonetario = (valor: string): number => {
      if (!valor || valor.toString().trim() === '') return 0
      const valorStr = valor.toString()
        .replace(/[R$\s]/g, '')  // Remove R$, espaços
        .replace(/\./g, '')      // Remove pontos (milhares)
        .replace(',', '.')       // Vírgula vira ponto decimal
      return parseFloat(valorStr) || 0
    }

    const limparNumero = (valor: string): number => {
      if (!valor || valor.toString().trim() === '') return 0
      const valorStr = valor.toString().trim()
      
      // Se tem ponto ou vírgula, tratar como decimal
      if (valorStr.includes('.') || valorStr.includes(',')) {
        const numeroStr = valorStr.replace(/\./g, '').replace(',', '.')
        return parseFloat(numeroStr) || 0
      }
      
      // Se é só número, converter diretamente
      const numeroStr = valorStr.replace(/[^0-9]/g, '')
      return parseInt(numeroStr) || 0
    }

    const limparPercentual = (valor: string): number => {
      if (!valor || valor.toString().trim() === '') return 0
      const percentStr = valor.toString()
        .replace('%', '')        // Remove %
        .replace(',', '.')       // Vírgula vira ponto
      return parseFloat(percentStr) || 0
    }

    const limparDecimal = (valor: string): number => {
      if (!valor || valor.toString().trim() === '') return 0
      const decimalStr = valor.toString()
        .replace(',', '.')       // Vírgula vira ponto
      return parseFloat(decimalStr) || 0
    }

    // ========================================
    // 🗂️ MAPEAR ESTRUTURA DA PLANILHA DE DESEMPENHO
    // ========================================
    
    // A planilha tem SEMANAS COMO COLUNAS e INDICADORES COMO LINHAS
    // Com base no teste real, identificamos que:
    // - Dados começam na coluna C (índice 2)
    // - Linha 0: Anos (2025, 2025, ...)
    // - Precisa mapear dinamicamente as outras linhas
    
    if (dados.length < 10) {
      throw new Error('Planilha não possui dados suficientes')
    }

    // Identificar as linhas principais automaticamente
    let cabecalhoSemanas: any[] = []
    let numerosSemanas: any[] = []
    let datasInicio: any[] = []
    let datasFim: any[] = []
    
    // Procurar pelas linhas que contêm semanas
    for (let i = 0; i < Math.min(10, dados.length); i++) {
      const linha = dados[i] || []
      
      // Linha com "Semana XX"
      if (linha.some((cell: any) => cell?.toString().includes('Semana') && /\d+/.test(cell?.toString()))) {
        cabecalhoSemanas = linha
        console.log(`  📋 Linha de semanas encontrada: ${i + 1}`)
      }
      
      // Linha com números de semana (só números)
      if (linha.some((cell: any) => /^0?\d{1,2}$/.test(cell?.toString())) && cabecalhoSemanas.length === 0) {
        numerosSemanas = linha
        console.log(`  📋 Linha de números encontrada: ${i + 1}`)
      }
    }
    
    // Se não encontrou semanas nas linhas, usar estrutura padrão
    if (cabecalhoSemanas.length === 0) {
      cabecalhoSemanas = dados[2] || [] // Linha 3: "Semana 05", "Semana 06", etc.
      numerosSemanas = dados[1] || []   // Linha 2: "05", "06", "07", etc.
      datasInicio = dados[3] || []      // Linha 4: datas de início
      datasFim = dados[4] || []         // Linha 5: datas de fim
    }
    
    console.log('📋 Cabeçalho das semanas:', cabecalhoSemanas.slice(2, 8))
    console.log('📋 Números das semanas:', numerosSemanas.slice(2, 8))
    
    // MAPEAMENTO FIXO E DIRETO - baseado na estrutura real confirmada
    const colunasSemanais: Array<{
      indice: number
      numero: number
      nome: string
      dataInicio: string
      dataFim: string
    }> = [
      { indice: 3, numero: 5, nome: 'Semana 05', dataInicio: '', dataFim: '' },   // D
      { indice: 4, numero: 6, nome: 'Semana 06', dataInicio: '', dataFim: '' },   // E
      { indice: 5, numero: 7, nome: 'Semana 07', dataInicio: '', dataFim: '' },   // F
      { indice: 6, numero: 8, nome: 'Semana 08', dataInicio: '', dataFim: '' },   // G
      { indice: 7, numero: 9, nome: 'Semana 09', dataInicio: '', dataFim: '' },   // H
      { indice: 8, numero: 10, nome: 'Semana 10', dataInicio: '', dataFim: '' },  // I
      { indice: 9, numero: 11, nome: 'Semana 11', dataInicio: '', dataFim: '' },  // J
      { indice: 10, numero: 12, nome: 'Semana 12', dataInicio: '', dataFim: '' }, // K
      { indice: 11, numero: 13, nome: 'Semana 13', dataInicio: '', dataFim: '' }, // L
      { indice: 12, numero: 14, nome: 'Semana 14', dataInicio: '', dataFim: '' }, // M
      { indice: 13, numero: 15, nome: 'Semana 15', dataInicio: '', dataFim: '' }, // N
      { indice: 14, numero: 16, nome: 'Semana 16', dataInicio: '', dataFim: '' }, // O
      { indice: 15, numero: 17, nome: 'Semana 17', dataInicio: '', dataFim: '' }, // P
      { indice: 16, numero: 18, nome: 'Semana 18', dataInicio: '', dataFim: '' }, // Q
      { indice: 17, numero: 19, nome: 'Semana 19', dataInicio: '', dataFim: '' }, // R
      { indice: 18, numero: 20, nome: 'Semana 20', dataInicio: '', dataFim: '' }, // S
      { indice: 19, numero: 21, nome: 'Semana 21', dataInicio: '', dataFim: '' }, // T
      { indice: 20, numero: 22, nome: 'Semana 22', dataInicio: '', dataFim: '' }, // U
      { indice: 21, numero: 23, nome: 'Semana 23', dataInicio: '', dataFim: '' }, // V
      { indice: 22, numero: 24, nome: 'Semana 24', dataInicio: '', dataFim: '' }, // W
      { indice: 23, numero: 25, nome: 'Semana 25', dataInicio: '', dataFim: '' }, // X
      { indice: 24, numero: 26, nome: 'Semana 26', dataInicio: '', dataFim: '' }, // Y
    ]
    
    console.log('🎯 USANDO MAPEAMENTO FIXO E DIRETO baseado na estrutura confirmada')
    colunasSemanais.forEach(semana => {
      console.log(`  ✅ Semana ${semana.numero} = Coluna ${String.fromCharCode(65 + semana.indice)} (índice ${semana.indice})`)
    })
    
    console.log(`📊 Encontradas ${colunasSemanais.length} semanas:`, colunasSemanais.map(s => `${s.numero}`).join(', '))
    
    if (colunasSemanais.length === 0) {
      console.log('❌ NENHUMA SEMANA ENCONTRADA! Analisando problema...')
      console.log('   Cabeçalho das semanas:', cabecalhoSemanas.slice(0, 10))
      console.log('   Números das semanas:', numerosSemanas.slice(0, 10))
      return []
    }

    // ========================================
    // 📊 MAPEAR DADOS POR LINHA ESPECÍFICA
    // ========================================
    
    // Com base na análise da estrutura real da planilha:
    // Linha 6: Faturamento Total
    // Linha 7: Faturamento Entrada  
    // Linha 8: Faturamento Bar
    // Linha 10: Número de Clientes Atendidos (CORRIGIDO!)
    // Linha 11: Reservas Totais
    // Linha 14: Ticket Médio
    // Linha 17, 18, 19, 20: CMV percentuais
    
    console.log('📊 Mapeando dados por linhas específicas identificadas na estrutura...')
    
    // Função para buscar valor em uma linha e coluna específica
    const buscarValorPorLinha = (numeroLinha: number, indiceSemana: number): number => {
      const linha = dados[numeroLinha - 1] // Converter para índice 0-based
      if (!linha || !Array.isArray(linha)) return 0
      
      const valor = linha[indiceSemana]
      if (!valor) return 0
      
      // Detectar tipo do valor e limpar adequadamente
      const valorStr = valor.toString().trim()
      
      if (valorStr === '-' || valorStr === '') return 0
      
      // Log para debug específico
      console.log(`🔍 BUSCAR VALOR: Linha ${numeroLinha}, Coluna ${indiceSemana}, Valor: "${valorStr}"`)
      
      if (valorStr.includes('R$')) {
        console.log(`  → Detectado como MONETÁRIO`)
        return limparValorMonetario(valorStr)
      } else if (valorStr.includes('%')) {
        console.log(`  → Detectado como PERCENTUAL`)
        return limparPercentual(valorStr)
      } else if (valorStr.match(/^\d+$/)) {
        console.log(`  → Detectado como NÚMERO INTEIRO`)
        return limparNumero(valorStr)
      } else if (valorStr.match(/^\d+\.\d+$/)) {
        console.log(`  → Detectado como NÚMERO COM PONTO (milhares)`)
        return limparNumero(valorStr)
      } else if (valorStr.match(/^\d+,\d+$/)) {
        console.log(`  → Detectado como DECIMAL (vírgula)`)
        return limparDecimal(valorStr)
      }
      
      console.log(`  → Detectado como DECIMAL (default)`)
      return limparDecimal(valorStr)
    }

    // Log das linhas mapeadas para debug
    console.log('🔍 Analisando estrutura real da planilha:')
    console.log(`  Total de linhas: ${dados.length}`)
    console.log(`  Total de colunas: ${dados[0]?.length || 0}`)
    console.log(`  Primeira linha (headers): [${dados[0]?.slice(0, 10).join(', ') || 'vazio'}]`)
    console.log(`  Segunda linha: [${dados[1]?.slice(0, 10).join(', ') || 'vazio'}]`)
    console.log(`  Terceira linha: [${dados[2]?.slice(0, 10).join(', ') || 'vazio'}]`)
    
    // Identificar automaticamente onde estão as semanas
    let linhaSemanas = -1
    let linhaAnos = -1
    
    for (let i = 0; i < Math.min(10, dados.length); i++) {
      const linha = dados[i] || []
      
      // Procurar linha com "Semana 05", "Semana 06", etc.
      const temSemanas = linha.some((cell: any) => 
        cell?.toString().toLowerCase().includes('semana') && 
        /\d+/.test(cell?.toString())
      )
      
      // Procurar linha com anos "2025"
      const temAnos = linha.some((cell: any) => 
        cell?.toString() === '2025'
      )
      
      if (temSemanas && linhaSemanas === -1) {
        linhaSemanas = i
        console.log(`  ✅ Linha de semanas encontrada: ${i + 1}`)
      }
      
      if (temAnos && linhaAnos === -1) {
        linhaAnos = i
        console.log(`  ✅ Linha de anos encontrada: ${i + 1}`)
      }
    }
    
    console.log('🔍 Verificando dados das linhas-chave:')
    console.log(`  Linha 6 (Faturamento Total): [${dados[5]?.slice(2, 8).join(', ') || 'não encontrada'}]`)
    console.log(`  Linha 7 (Faturamento Entrada): [${dados[6]?.slice(2, 8).join(', ') || 'não encontrada'}]`)
    console.log(`  Linha 8 (Faturamento Bar): [${dados[7]?.slice(2, 8).join(', ') || 'não encontrada'}]`)
    console.log(`  Linha 10 (Clientes Atendidos): [${dados[9]?.slice(2, 8).join(', ') || 'não encontrada'}]`)
    console.log(`  Linha 11 (Reservas Totais): [${dados[10]?.slice(2, 8).join(', ') || 'não encontrada'}]`)
    console.log(`  Linha 14 (Ticket Médio): [${dados[13]?.slice(2, 8).join(', ') || 'não encontrada'}]`)

    // ========================================
    // 🔄 PROCESSAR CADA SEMANA IDENTIFICADA
    // ========================================
    
    // Agora processar cada semana encontrada nas colunas
    colunasSemanais.forEach(semanaInfo => {
      const { indice, numero, nome, dataInicio, dataFim } = semanaInfo
      
      console.log(`\n📊 Processando ${nome} (coluna ${indice}) - SEMANA ${numero}...`)
      console.log(`🔍 DEBUG ESPECÍFICO: Linha 11, Coluna ${indice} = "${dados[10][indice]}"`)
      
      // Gerar datas válidas se não estiverem na planilha
      const calcularDatasSemana = (numeroSemana: number, ano: number) => {
        // Calcular data de início da semana (segunda-feira)
        const primeiroDiaAno = new Date(ano, 0, 1) // 1 de janeiro
        const diasParaPrimeiraDomingo = (7 - primeiroDiaAno.getDay()) % 7
        const primeiraDomingo = new Date(ano, 0, 1 + diasParaPrimeiraDomingo)
        
        // Calcular semana específica
        const inicioSemana = new Date(primeiraDomingo)
        inicioSemana.setDate(primeiraDomingo.getDate() + (numeroSemana - 1) * 7 + 1) // +1 para segunda-feira
        
        const fimSemana = new Date(inicioSemana)
        fimSemana.setDate(inicioSemana.getDate() + 6) // Domingo
        
        return {
          inicio: inicioSemana.toISOString().split('T')[0], // YYYY-MM-DD
          fim: fimSemana.toISOString().split('T')[0] // YYYY-MM-DD
        }
      }
      
      const datasCalculadas = calcularDatasSemana(numero, 2025)
      const dataInicioValida = dataInicio && dataInicio.trim() !== '' ? dataInicio : datasCalculadas.inicio
      const dataFimValida = dataFim && dataFim.trim() !== '' ? dataFim : datasCalculadas.fim
      
      // Buscar valores dos indicadores para esta semana
      const dadosSemana = {
        // ===== IDENTIFICAÇÃO =====
        bar_id: barId,
        ano: 2025,
        numero_semana: numero,
        data_inicio: dataInicioValida,
        data_fim: dataFimValida,
        
        // ===== FATURAMENTO (linhas específicas) =====
        faturamento_total: buscarValorPorLinha(6, indice), // Linha 6: R$ 75.314,54
        faturamento_entrada: buscarValorPorLinha(7, indice), // Linha 7: R$ 0,00
        faturamento_bar: buscarValorPorLinha(8, indice), // Linha 8: R$ 75.314,54
        faturamento_cmovivel: buscarValorPorLinha(9, indice), // Linha 9: R$ 74.329,88
        
        // ===== CLIENTES E RESERVAS =====
        clientes_atendidos: (() => {
          const valorRaw = buscarValorPorLinha(11, indice);
          const valorFinal = Math.round(valorRaw) || 0;
          console.log(`🔍 CLIENTES DEBUG: Semana ${numero}, Coluna ${indice}, Valor Raw: "${dados[10][indice]}", Processado: ${valorRaw}, Final: ${valorFinal}`);
          return valorFinal;
        })(), // Linha 11 - CORRETO: 133, 849, 1624
        reservas_totais: Math.round(buscarValorPorLinha(12, indice)) || 0, // Linha 12 - Reservas Totais
        reservas_presentes: Math.round(buscarValorPorLinha(13, indice)) || 0, // Linha 13 - Reservas Presentes
        
        // ===== TICKET MÉDIO =====
        ticket_medio: buscarValorPorLinha(14, indice), // Linha 14: R$ 99,11
        tm_entrada: buscarValorPorLinha(15, indice), // Linha 15: TM Entrada
        tm_bar: buscarValorPorLinha(16, indice), // Linha 16: TM Bar
        
        // ===== CMV E CUSTOS =====
        cmv_rs: buscarValorPorLinha(10, indice), // Linha 10: R$ 8.318,11 (CMV em R$)
        cmv_teorico: buscarValorPorLinha(17, indice), // Linha 17: CMV Teórico %
        cmv_limpo: buscarValorPorLinha(18, indice), // Linha 18: CMV Limpo %
        cmv_global_real: buscarValorPorLinha(19, indice), // Linha 19: CMV Global Real %
        cmo: buscarValorPorLinha(20, indice), // Linha 20: CMO %
        custo_atracao_faturamento: buscarValorPorLinha(21, indice), // Linha 21: Custo Atração %
        
        // ===== LUCRO E RESULTADO =====
        lucro_rs: 0, // Será calculado posteriormente
        imposto: buscarValorPorLinha(26, indice), // Linha 26: Imposto
        comissao: buscarValorPorLinha(27, indice), // Linha 27: Comissão
        cmv: buscarValorPorLinha(28, indice), // Linha 28: CMV (monetário)
        cmo_custo: buscarValorPorLinha(29, indice), // Linha 29: CMO (monetário)
        pro_labore: buscarValorPorLinha(30, indice), // Linha 30: PRO LABORE
        
        // ===== MARKETING ORGÂNICO (mapear depois) =====
        o_num_posts: 0, // Mapear linha correta depois
        o_alcance: 0, // Mapear linha correta depois
        o_interacao: 0, // Mapear linha correta depois
        o_engajamento: 0, // Mapear linha correta depois
        
        // ===== MARKETING PAGO (mapear depois) =====
        m_valor_investido: 0, // Mapear linha correta depois
        m_alcance: 0, // Mapear linha correta depois
        m_cliques: 0, // Mapear linha correta depois
        m_ctr: 0, // Mapear linha correta depois
        
        // ===== AVALIAÇÕES =====
        avaliacoes_5_google_trip: Math.round(buscarValorPorLinha(23, indice)) || 0, // Linha 23: 43, 74, 35, 60
        media_avaliacoes_google: buscarValorPorLinha(24, indice), // Linha 24: 5,00, 4,92, 4,29, 4,97
        nota_felicidade_equipe: buscarValorPorLinha(25, indice), // Linha 25: Nota Felicidade
        
        // ===== STOCKOUT =====
        stockout_comidas: 0, // Não identificada ainda
        stockout_drinks: 0, // Não identificada ainda
        
        // ===== PERCENTUAIS =====
        perc_bebidas: 0, // Não identificada ainda
        perc_drinks: 0, // Não identificada ainda
        perc_comida: 0, // Não identificada ainda
        
        // ===== RETENÇÃO =====
        retencao_1m: 0, // Não identificada ainda
        retencao_2m: 0, // Não identificada ainda
        
        // ===== META E ATINGIMENTO =====
        meta_semanal: 200000, // Meta padrão
        atingimento: 0, // Será calculado abaixo
        observacoes: `Importado da aba "${nome}" em ${new Date().toLocaleDateString('pt-BR')}`
      }
      
      // Calcular atingimento (% meta alcançada)
      if (dadosSemana.faturamento_total > 0 && dadosSemana.meta_semanal > 0) {
        dadosSemana.atingimento = (dadosSemana.faturamento_total / dadosSemana.meta_semanal) * 100
      }

      console.log(`✅ Semana ${numero} processada:`, {
        faturamento_total: dadosSemana.faturamento_total,
        clientes_atendidos: dadosSemana.clientes_atendidos,
        ticket_medio: dadosSemana.ticket_medio,
        atingimento: dadosSemana.atingimento?.toFixed(1) + '%'
      })

      // Só adicionar se tiver dados relevantes
      if (dadosSemana.faturamento_total > 0 || dadosSemana.clientes_atendidos > 0) {
        semanas.push(dadosSemana)
      }
    })



    console.log(`✅ Processamento concluído: ${semanas.length} semanas encontradas`)
    console.log(`🔧 Estrutura analisada automaticamente baseada nos dados reais`)
    return semanas

  } catch (error) {
    console.error('❌ Erro ao processar dados completos:', error)
    return []
  }
}

// ========================================
// 📋 INFO SOBRE CONFIGURAÇÃO
// ========================================
export async function GET() {
  const serviceAccountConfigured = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  
  return NextResponse.json({
    info: "Sincronização com Google Sheets usando Service Account",
    configuracao_necessaria: {
      service_account: serviceAccountConfigured ? "✅ Configurada" : "❌ Não configurada",
      google_api_key: process.env.GOOGLE_SHEETS_API_KEY ? "✅ Configurada (backup)" : "❌ Não configurada",
      formato_url: "https://docs.google.com/spreadsheets/d/SHEET_ID/edit..."
    },
    exemplo_uso: {
      method: "POST",
      body: {
        planilha_url: "https://docs.google.com/spreadsheets/d/1WRnwl_F_tgqvQmHIyQUFtiWQVujTBk2TDL-ii0JjfAY/edit",
        substituir_existentes: true
      }
    },
    passos_configuracao: [
      "1. Criar Service Account no Google Cloud Console",
      "2. Baixar arquivo JSON das credenciais",
      "3. Adicionar GOOGLE_SERVICE_ACCOUNT_KEY no .env.local",
      "4. Compartilhar planilha com o email da service account"
    ]
  })
} 