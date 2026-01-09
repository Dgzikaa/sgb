import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = 'gemini-2.0-flash'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// =============================================================================
// TIPOS
// =============================================================================

interface DadosCompletosEvento {
  // Identificação
  data: string
  dia_semana: string
  nome_evento: string
  atracao_principal: string
  
  // Faturamento (ContaHub + Yuzer)
  faturamento_bruto: number
  faturamento_liquido: number
  faturamento_bar: number
  faturamento_entrada: number
  
  // Público
  pax_total: number
  pax_pagante: number
  pax_lista: number
  pax_reserva: number
  
  // Tickets
  ticket_medio: number
  ticket_bebida: number
  ticket_entrada: number
  
  // Custos
  custo_artistico: number
  custo_producao: number
  custo_total_evento: number
  
  // Métricas
  cmv_percentual: number
  margem_contribuicao: number
  percentual_art_sobre_fat: number
  
  // Horários
  hora_pico_faturamento: string
  faturamento_hora_pico: number
  
  // Pagamentos
  pix_percentual: number
  credito_percentual: number
  debito_percentual: number
  dinheiro_percentual: number
}

interface ContextoHistorico {
  media_mesmo_dia_4_semanas: number
  tendencia_mesmo_dia: 'subindo' | 'estavel' | 'caindo'
  melhor_dia_mes: { data: string, faturamento: number }
  pior_dia_mes: { data: string, faturamento: number }
  posicao_no_ranking_mes: number
  total_dias_mes: number
  comparacao_meta: number
  meta_diaria: number
}

// =============================================================================
// FUNÇÕES DE BUSCA DE DADOS
// =============================================================================

async function buscarDadosCompletosEvento(supabase: any, barId: number, data: string): Promise<DadosCompletosEvento | null> {
  console.log(`📊 Buscando dados completos para ${data}...`)
  
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const dataObj = new Date(data + 'T12:00:00Z')
  const diaSemana = diasSemana[dataObj.getDay()]
  
  // 1. EVENTOS_BASE (dados consolidados)
  const { data: eventoBase } = await supabase
    .from('eventos_base')
    .select('*')
    .eq('bar_id', barId)
    .eq('data_evento', data)
    .single()
  
  // 2. CONTAHUB_ANALITICO (backup)
  const { data: contahub } = await supabase
    .from('contahub_analitico')
    .select('*')
    .eq('bar_id', barId)
    .eq('data_movimento', data)
    .single()
  
  // 3. CONTAHUB_FATPORHORA (faturamento por hora)
  const { data: fatHora } = await supabase
    .from('contahub_fatporhora')
    .select('*')
    .eq('bar_id', barId)
    .eq('data_movimento', data)
    .order('faturamento', { ascending: false })
    .limit(1)
  
  // 4. NIBO_AGENDAMENTOS (custos do dia - buscar por data no formato DD/MM)
  const dia = data.substring(8, 10)
  const mes = data.substring(5, 7)
  const { data: custos } = await supabase
    .from('nibo_agendamentos')
    .select('valor, categoria_nome, descricao')
    .eq('bar_id', barId)
    .or(`descricao.ilike.%${dia}/${mes}%,descricao.ilike.%${dia}.${mes}%`)
  
  // 5. GETIN_RESERVAS (reservas do dia)
  const { data: reservas } = await supabase
    .from('getin_reservas')
    .select('id, quantidade_pessoas')
    .eq('bar_id', barId)
    .eq('data_reserva', data)
  
  // Se não tem dados básicos, retorna null
  if (!eventoBase && !contahub) {
    console.log(`⚠️ Sem dados para ${data}`)
    return null
  }
  
  // Extrair nome da atração do evento
  const nomeEvento = eventoBase?.nome || contahub?.nome_evento || 'Operação Normal'
  const atracao = extrairAtracao(nomeEvento)
  
  // Calcular custos do Nibo (Atrações e Produção)
  const custoArtisticoNibo = custos?.filter((c: any) => 
    c.categoria_nome?.toLowerCase().includes('atra') || 
    c.categoria_nome?.toLowerCase().includes('artista') ||
    c.categoria_nome?.toLowerCase().includes('programa')
  ).reduce((sum: number, c: any) => sum + Math.abs(parseFloat(c.valor) || 0), 0) || 0

  const custoProducaoNibo = custos?.filter((c: any) => 
    c.categoria_nome?.toLowerCase().includes('produ')
  ).reduce((sum: number, c: any) => sum + Math.abs(parseFloat(c.valor) || 0), 0) || 0
  
  // Usar custos do Nibo ou do eventos_base
  const custoArtistico = custoArtisticoNibo > 0 ? custoArtisticoNibo : parseFloat(eventoBase?.c_art) || 0
  const custoProducao = custoProducaoNibo > 0 ? custoProducaoNibo : parseFloat(eventoBase?.c_prod) || 0
  
  // Calcular PAX de reservas
  const paxReserva = reservas?.reduce((sum: number, r: any) => sum + (r.quantidade_pessoas || 0), 0) || 0
  
  // DADOS CORRETOS - usando nomes reais das colunas
  const fatBruto = parseFloat(eventoBase?.real_r) || contahub?.faturamento_bruto || 0
  const fatBar = parseFloat(eventoBase?.faturamento_bar) || contahub?.faturamento_bar || 0
  const fatCouvert = parseFloat(eventoBase?.faturamento_couvert) || 0
  const paxTotal = eventoBase?.cl_real || contahub?.pax_estimado || 0
  const ticketMedio = parseFloat(eventoBase?.t_medio) || contahub?.ticket_medio || 0
  const ticketBebida = parseFloat(eventoBase?.tb_real) || 0
  const ticketEntrada = parseFloat(eventoBase?.te_real) || 0
  const reservasTot = eventoBase?.res_tot || 0
  
  // Percentuais de pagamento (já vem calculados na eventos_base)
  const pixPerc = parseFloat(eventoBase?.percent_b) || 0  // percent_b = PIX
  const creditoPerc = parseFloat(eventoBase?.percent_c) || 0  // percent_c = Crédito
  const debitoPerc = parseFloat(eventoBase?.percent_d) || 0  // percent_d = Débito
  
  // Stockout
  const stockout = parseFloat(eventoBase?.percent_stockout) || 0
  
  // Calcular margem
  const custoTotal = custoArtistico + custoProducao
  const margemContrib = fatBruto > 0 ? ((fatBruto - custoTotal) / fatBruto * 100) : 0
  const percArtFat = fatBruto > 0 ? (custoArtistico / fatBruto * 100) : parseFloat(eventoBase?.percent_art_fat) || 0
  
  return {
    data,
    dia_semana: diaSemana,
    nome_evento: nomeEvento,
    atracao_principal: atracao,
    
    faturamento_bruto: fatBruto,
    faturamento_liquido: parseFloat(eventoBase?.faturamento_liquido) || fatBruto * 0.95,
    faturamento_bar: fatBar,
    faturamento_entrada: fatCouvert,
    
    pax_total: paxTotal,
    pax_pagante: paxTotal - (eventoBase?.lista_r || 0),
    pax_lista: 0, // não temos lista separada
    pax_reserva: reservasTot || paxReserva,
    
    ticket_medio: ticketMedio,
    ticket_bebida: ticketBebida,
    ticket_entrada: ticketEntrada,
    
    custo_artistico: custoArtistico,
    custo_producao: custoProducao,
    custo_total_evento: custoTotal,
    
    cmv_percentual: contahub?.cmv_percentual || 0,
    margem_contribuicao: margemContrib,
    percentual_art_sobre_fat: percArtFat,
    
    hora_pico_faturamento: fatHora?.[0]?.hora_formatada || 'N/A',
    faturamento_hora_pico: fatHora?.[0]?.faturamento || 0,
    
    pix_percentual: pixPerc,
    credito_percentual: creditoPerc,
    debito_percentual: debitoPerc,
    dinheiro_percentual: 100 - pixPerc - creditoPerc - debitoPerc
  }
}

// Calcular tendência baseado em série de valores (do mais antigo pro mais recente)
function calcularTendencia(valores: number[]): 'subindo' | 'caindo' | 'estavel' | 'volatil' {
  if (valores.length < 2) return 'estavel'
  
  const validos = valores.filter(v => v > 0)
  if (validos.length < 2) return 'estavel'
  
  // Calcular variações entre períodos consecutivos
  const variacoes: number[] = []
  for (let i = 1; i < validos.length; i++) {
    const variacao = ((validos[i] - validos[i-1]) / validos[i-1]) * 100
    variacoes.push(variacao)
  }
  
  const mediaVariacao = variacoes.reduce((a, b) => a + b, 0) / variacoes.length
  const positivas = variacoes.filter(v => v > 5).length
  const negativas = variacoes.filter(v => v < -5).length
  
  // Se tem muita oscilação, é volátil
  if (positivas > 0 && negativas > 0 && Math.abs(positivas - negativas) <= 1) {
    return 'volatil'
  }
  
  if (mediaVariacao > 10) return 'subindo'
  if (mediaVariacao < -10) return 'caindo'
  return 'estavel'
}

function extrairAtracao(nomeEvento: string): string {
  // Remove prefixos comuns e extrai nome da atração
  const prefixos = [
    'Quarta de Bamba -', 'Quinta do Forró -', 'Sexta na Roça -', 
    'Sábado -', 'Domingo -', 'Pé no Ordi -', 'Happy Hour -',
    '-', 'com', 'feat.', 'feat', '&', 'e Dj', 'Dj'
  ]
  
  let atracao = nomeEvento
  for (const prefixo of prefixos) {
    if (atracao.includes(prefixo)) {
      const partes = atracao.split(prefixo)
      atracao = partes.length > 1 ? partes[1].trim() : partes[0].trim()
    }
  }
  
  return atracao || nomeEvento
}

async function buscarContextoHistorico(supabase: any, barId: number, data: string): Promise<ContextoHistorico> {
  console.log(`📈 Buscando contexto histórico...`)
  
  const dataObj = new Date(data + 'T12:00:00Z')
  const diaSemana = dataObj.getDay()
  
  // Últimas 4 semanas do mesmo dia da semana
  const datasHistorico: string[] = []
  for (let i = 1; i <= 4; i++) {
    const d = new Date(dataObj)
    d.setDate(d.getDate() - (i * 7))
    datasHistorico.push(d.toISOString().split('T')[0])
  }
  
  // Buscar dados históricos
  const { data: historico } = await supabase
    .from('eventos_base')
    .select('data_evento, real_r')
    .eq('bar_id', barId)
    .in('data_evento', datasHistorico)
    .gt('real_r', 0)
    .order('data_evento', { ascending: false })
  
  // Calcular média e tendência
  const valores = historico?.map((h: any) => h.real_r) || []
  const media = valores.length > 0 ? valores.reduce((a: number, b: number) => a + b, 0) / valores.length : 0
  
  let tendencia: 'subindo' | 'estavel' | 'caindo' = 'estavel'
  if (valores.length >= 2) {
    const diff = valores[0] - valores[valores.length - 1]
    if (diff > media * 0.1) tendencia = 'subindo'
    else if (diff < -media * 0.1) tendencia = 'caindo'
  }
  
  // Buscar melhor e pior dia do mês
  const inicioMes = `${data.substring(0, 7)}-01`
  const { data: diasMes } = await supabase
    .from('eventos_base')
    .select('data_evento, real_r')
    .eq('bar_id', barId)
    .gte('data_evento', inicioMes)
    .lte('data_evento', data)
    .gt('real_r', 0)
    .order('real_r', { ascending: false })
  
  const melhor = diasMes?.[0] || { data_evento: data, real_r: 0 }
  const pior = diasMes?.[diasMes.length - 1] || { data_evento: data, real_r: 0 }
  
  // Posição no ranking
  const posicao = diasMes?.findIndex((d: any) => d.data_evento === data) || 0
  
  // Meta diária (baseada em médias - ajustar conforme seu negócio)
  const metasPorDia: Record<number, number> = {
    0: 58000, // Domingo
    1: 5000,  // Segunda
    2: 0,     // Terça
    3: 35000, // Quarta
    4: 25000, // Quinta
    5: 70000, // Sexta
    6: 60000  // Sábado
  }
  const metaDiaria = metasPorDia[diaSemana] || 30000
  
  return {
    media_mesmo_dia_4_semanas: media,
    tendencia_mesmo_dia: tendencia,
    melhor_dia_mes: { data: melhor.data_evento, faturamento: melhor.real_r },
    pior_dia_mes: { data: pior.data_evento, faturamento: pior.real_r },
    posicao_no_ranking_mes: posicao + 1,
    total_dias_mes: diasMes?.length || 0,
    comparacao_meta: metaDiaria > 0 ? ((diasMes?.find((d: any) => d.data_evento === data)?.real_r || 0) - metaDiaria) / metaDiaria * 100 : 0,
    meta_diaria: metaDiaria
  }
}

async function buscarAtracoesAnteriores(supabase: any, barId: number, atracao: string): Promise<any[]> {
  // Buscar histórico da mesma atração
  const { data: historico } = await supabase
    .from('eventos_base')
    .select('data_evento, nome, real_r, clientes_r, te_r')
    .eq('bar_id', barId)
    .ilike('nome', `%${atracao}%`)
    .gt('real_r', 0)
    .order('data_evento', { ascending: false })
    .limit(5)
  
  return historico || []
}

// =============================================================================
// ANÁLISE COM IA (GEMINI)
// =============================================================================

interface EstatisticasMesmoDia {
  datas_comparadas: string[]
  media_faturamento: number
  media_pax: number
  melhor: { data_evento: string; real_r: number; nome: string } | null
  pior: { data_evento: string; real_r: number; nome: string } | null
  tendencia: 'subindo' | 'caindo' | 'estavel' | 'volatil'
}

async function gerarAnaliseInteligente(
  dados: DadosCompletosEvento, 
  contexto: ContextoHistorico,
  historicoAtracao: any[],
  dadosSemanaPassada: DadosCompletosEvento | null,
  estatisticas: EstatisticasMesmoDia
): Promise<string> {
  
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY não configurada!')
    return gerarAnaliseFallback(dados, contexto, dadosSemanaPassada, estatisticas)
  }
  
  console.log('🤖 Gerando análise inteligente com Gemini...')
  
  // Calcular métricas derivadas para análise mais profunda
  const ticketIdeal = 120 // Meta de ticket médio
  const cmvIdeal = 28 // CMV ideal para bares
  const margemIdeal = 65 // Margem ideal
  
  const gapTicket = ((dados.ticket_medio - ticketIdeal) / ticketIdeal * 100)
  const gapCMV = dados.cmv_percentual - cmvIdeal
  const gapMargem = dados.margem_contribuicao - margemIdeal
  
  // Eficiência da atração
  const custoArtPorPax = dados.pax_total > 0 ? dados.custo_artistico / dados.pax_total : 0
  const faturamentoPorPax = dados.pax_total > 0 ? dados.faturamento_bruto / dados.pax_total : 0
  const roiAtracao = dados.custo_artistico > 0 ? ((dados.faturamento_bruto - dados.custo_artistico) / dados.custo_artistico * 100) : 0
  
  // Comparação com estatísticas históricas
  const variacaoVsMedia = estatisticas.media_faturamento > 0 
    ? ((dados.faturamento_bruto - estatisticas.media_faturamento) / estatisticas.media_faturamento * 100) 
    : 0
  
  const prompt = `Você é um consultor SÊNIOR especialista em bares e casas noturnas no Brasil, com 20 anos de experiência. 
Analise os dados abaixo com PROFUNDIDADE e gere insights que realmente façam diferença no negócio.

═══════════════════════════════════════════════════════════════
📅 ANÁLISE: ${dados.dia_semana.toUpperCase()} ${dados.data}
🎭 EVENTO: ${dados.nome_evento}
🎤 ATRAÇÃO: ${dados.atracao_principal}
═══════════════════════════════════════════════════════════════

## 💰 RESULTADOS FINANCEIROS

| Métrica | Valor | Meta/Ideal | Gap |
|---------|-------|------------|-----|
| Faturamento Bruto | R$ ${dados.faturamento_bruto.toFixed(2)} | R$ ${contexto.meta_diaria.toFixed(2)} | ${contexto.comparacao_meta >= 0 ? '+' : ''}${contexto.comparacao_meta.toFixed(1)}% |
| Faturamento Bar | R$ ${dados.faturamento_bar.toFixed(2)} | - | ${(dados.faturamento_bar/dados.faturamento_bruto*100).toFixed(1)}% do total |
| Faturamento Entrada | R$ ${dados.faturamento_entrada.toFixed(2)} | - | ${(dados.faturamento_entrada/dados.faturamento_bruto*100).toFixed(1)}% do total |

## 👥 PÚBLICO E CONVERSÃO

| Métrica | Valor | Análise |
|---------|-------|---------|
| PAX Total | ${dados.pax_total} | ${dados.pax_total > estatisticas.media_pax ? '✅ Acima da média' : '⚠️ Abaixo da média'} (média: ${estatisticas.media_pax.toFixed(0)}) |
| Pagantes | ${dados.pax_pagante} | ${(dados.pax_pagante/dados.pax_total*100).toFixed(1)}% do público |
| Reservas | ${dados.pax_reserva} | Taxa conversão reserva |

## 🎫 TICKETS (EFICIÊNCIA DE CONSUMO)

| Ticket | Valor | vs Ideal (R$ ${ticketIdeal}) |
|--------|-------|------------------------------|
| Médio Total | R$ ${dados.ticket_medio.toFixed(2)} | ${gapTicket >= 0 ? '✅' : '⚠️'} ${gapTicket >= 0 ? '+' : ''}${gapTicket.toFixed(1)}% |
| Bebida | R$ ${dados.ticket_bebida.toFixed(2)} | - |
| Entrada | R$ ${dados.ticket_entrada.toFixed(2)} | - |

## 💸 CUSTOS E MARGENS

| Métrica | Valor | Ideal | Status |
|---------|-------|-------|--------|
| Custo Artístico | R$ ${dados.custo_artistico.toFixed(2)} | - | ${dados.percentual_art_sobre_fat.toFixed(1)}% do fat. |
| Custo Produção | R$ ${dados.custo_producao.toFixed(2)} | - | - |
| CMV | ${dados.cmv_percentual.toFixed(1)}% | ${cmvIdeal}% | ${gapCMV <= 0 ? '✅' : '⚠️'} Gap: ${gapCMV >= 0 ? '+' : ''}${gapCMV.toFixed(1)}pp |
| Margem | ${dados.margem_contribuicao.toFixed(1)}% | ${margemIdeal}% | ${gapMargem >= 0 ? '✅' : '⚠️'} Gap: ${gapMargem >= 0 ? '+' : ''}${gapMargem.toFixed(1)}pp |

## 🎤 ROI DA ATRAÇÃO

| Métrica | Valor | Interpretação |
|---------|-------|---------------|
| Custo por PAX | R$ ${custoArtPorPax.toFixed(2)} | Quanto cada cliente "custou" em atração |
| Faturamento por PAX | R$ ${faturamentoPorPax.toFixed(2)} | Retorno por cliente |
| ROI Atração | ${roiAtracao.toFixed(0)}% | ${roiAtracao > 300 ? '🔥 Excelente' : roiAtracao > 150 ? '✅ Bom' : roiAtracao > 50 ? '⚠️ Mediano' : '❌ Ruim'} |

## 💳 MIX DE PAGAMENTO

- PIX: ${dados.pix_percentual.toFixed(1)}%
- Crédito: ${dados.credito_percentual.toFixed(1)}%
- Débito: ${dados.debito_percentual.toFixed(1)}%

## 📊 CONTEXTO HISTÓRICO - ÚLTIMAS ${estatisticas.datas_comparadas.length} ${dados.dia_semana.toUpperCase()}S

| Data | Evento | Resultado |
|------|--------|-----------|
${estatisticas.datas_comparadas.map(d => `| ${d} | - | - |`).join('\n')}

**Estatísticas:**
- Média histórica: R$ ${estatisticas.media_faturamento.toFixed(2)}
- Variação vs média: ${variacaoVsMedia >= 0 ? '+' : ''}${variacaoVsMedia.toFixed(1)}%
- Tendência: ${estatisticas.tendencia === 'subindo' ? '📈 SUBINDO' : estatisticas.tendencia === 'caindo' ? '📉 CAINDO' : estatisticas.tendencia === 'volatil' ? '📊 VOLÁTIL' : '➡️ ESTÁVEL'}
- Melhor ${dados.dia_semana} recente: ${estatisticas.melhor?.data_evento || 'N/A'} (R$ ${estatisticas.melhor?.real_r?.toFixed(2) || 0})
- Pior ${dados.dia_semana} recente: ${estatisticas.pior?.data_evento || 'N/A'} (R$ ${estatisticas.pior?.real_r?.toFixed(2) || 0})

${dadosSemanaPassada ? `
## 🔄 COMPARAÇÃO DIRETA: ${dadosSemanaPassada.data} → ${dados.data}

| Métrica | ${dadosSemanaPassada.data} | ${dados.data} | Variação |
|---------|---------------------------|---------------|----------|
| Faturamento | R$ ${dadosSemanaPassada.faturamento_bruto.toFixed(2)} | R$ ${dados.faturamento_bruto.toFixed(2)} | ${((dados.faturamento_bruto - dadosSemanaPassada.faturamento_bruto) / dadosSemanaPassada.faturamento_bruto * 100).toFixed(1)}% |
| PAX | ${dadosSemanaPassada.pax_total} | ${dados.pax_total} | ${dadosSemanaPassada.pax_total > 0 ? ((dados.pax_total - dadosSemanaPassada.pax_total) / dadosSemanaPassada.pax_total * 100).toFixed(1) : 0}% |
| Ticket | R$ ${dadosSemanaPassada.ticket_medio.toFixed(2)} | R$ ${dados.ticket_medio.toFixed(2)} | ${dadosSemanaPassada.ticket_medio > 0 ? ((dados.ticket_medio - dadosSemanaPassada.ticket_medio) / dadosSemanaPassada.ticket_medio * 100).toFixed(1) : 0}% |
| Atração | ${dadosSemanaPassada.atracao_principal} | ${dados.atracao_principal} | - |
` : `
## ⚠️ SEM COMPARAÇÃO DIRETA
Não há ${dados.dia_semana} anterior com operação para comparar diretamente.
`}

${historicoAtracao.length > 0 ? `
## 🎤 HISTÓRICO DA ATRAÇÃO: ${dados.atracao_principal}

${historicoAtracao.map(h => `| ${h.data_evento} | R$ ${h.real_r?.toFixed(2) || 0} | ${h.clientes_r || 0} PAX |`).join('\n')}

Média desta atração: R$ ${(historicoAtracao.reduce((sum, h) => sum + (h.real_r || 0), 0) / historicoAtracao.length).toFixed(2)}
` : `
## 🎤 ATRAÇÃO NOVA
${dados.atracao_principal} não tem histórico anterior nesta casa.
`}

═══════════════════════════════════════════════════════════════
## 🎯 SUA ANÁLISE PROFUNDA
═══════════════════════════════════════════════════════════════

Responda em português brasileiro, formatado para Discord (use **negrito**, emojis, etc):

### 1. 📋 RESUMO EXECUTIVO (máx 3 linhas)
Síntese do resultado: foi bom ou ruim? Por quê? O que define esse resultado?

### 2. 🔍 ANÁLISE DE CAUSA-RAIZ
Para cada ponto abaixo, explique O QUE aconteceu, POR QUE aconteceu, e O QUE FAZER:

a) **PÚBLICO**: A casa encheu ou não? O mix pagante/lista estava bom?
b) **CONSUMO**: O ticket bebida estava alto? As pessoas consumiram bem?
c) **ATRAÇÃO**: Valeu o investimento? O ROI foi bom? A atração atraiu público?
d) **OPERAÇÃO**: Houve problemas? Fila, stockout, demora no bar?

### 3. ⚠️ ALERTAS CRÍTICOS
Liste APENAS se houver algo realmente preocupante que precisa de ação imediata.

### 4. 💡 OPORTUNIDADES IDENTIFICADAS
O que poderia ter sido melhor? Onde está o dinheiro "deixado na mesa"?

### 5. 📈 RECOMENDAÇÕES PARA PRÓXIMA ${dados.dia_semana.toUpperCase()}
Ações CONCRETAS e ESPECÍFICAS (não genéricas) para melhorar o resultado.

### 6. 🎯 META AJUSTADA
Baseado nos dados históricos, qual deveria ser a meta realista para a próxima ${dados.dia_semana}?

Seja DIRETO, use DADOS para embasar, e dê insights que REALMENTE ajudem a tomar decisões.`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY || ''
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.7, 
            maxOutputTokens: 1500,
            topP: 0.9
          }
        })
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro Gemini:', response.status, errorText)
      return gerarAnaliseFallback(dados, contexto, dadosSemanaPassada, estatisticas)
    }
    
    const result = await response.json()
    const analise = result.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!analise) {
      console.error('❌ Resposta Gemini vazia')
      return gerarAnaliseFallback(dados, contexto, dadosSemanaPassada, estatisticas)
    }
    
    console.log('✅ Análise Gemini gerada com sucesso')
    return analise
    
  } catch (error) {
    console.error('❌ Erro ao chamar Gemini:', error)
    return gerarAnaliseFallback(dados, contexto, dadosSemanaPassada, estatisticas)
  }
}

function gerarAnaliseFallback(
  dados: DadosCompletosEvento, 
  contexto: ContextoHistorico, 
  semanaPassada: DadosCompletosEvento | null,
  estatisticas: EstatisticasMesmoDia
): string {
  const linhas: string[] = []
  
  linhas.push(`📊 **ANÁLISE ${dados.dia_semana.toUpperCase()} ${dados.data}**`)
  linhas.push(`🎭 ${dados.nome_evento}`)
  linhas.push(`🎤 Atração: ${dados.atracao_principal}`)
  linhas.push('')
  
  // Resumo vs Meta
  const varMeta = contexto.comparacao_meta
  if (varMeta >= 10) {
    linhas.push(`✅ **ACIMA DA META** (+${varMeta.toFixed(1)}%)`)
  } else if (varMeta >= -10) {
    linhas.push(`➡️ **NA META** (${varMeta >= 0 ? '+' : ''}${varMeta.toFixed(1)}%)`)
  } else {
    linhas.push(`⚠️ **ABAIXO DA META** (${varMeta.toFixed(1)}%)`)
  }
  
  // Resumo vs Histórico
  const varVsMedia = estatisticas.media_faturamento > 0 
    ? ((dados.faturamento_bruto - estatisticas.media_faturamento) / estatisticas.media_faturamento * 100) 
    : 0
  if (Math.abs(varVsMedia) > 5) {
    linhas.push(`${varVsMedia >= 0 ? '📈' : '📉'} **vs Média histórica:** ${varVsMedia >= 0 ? '+' : ''}${varVsMedia.toFixed(1)}%`)
  }
  
  linhas.push('')
  linhas.push(`**💰 FATURAMENTO**`)
  linhas.push(`• Bruto: R$ ${dados.faturamento_bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  linhas.push(`• Bar: R$ ${dados.faturamento_bar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${(dados.faturamento_bar/dados.faturamento_bruto*100).toFixed(0)}%)`)
  linhas.push(`• Entrada: R$ ${dados.faturamento_entrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  
  linhas.push('')
  linhas.push(`**👥 PÚBLICO**`)
  linhas.push(`• PAX: ${dados.pax_total} (${dados.pax_pagante} pagantes)`)
  linhas.push(`• Reservas: ${dados.pax_reserva}`)
  
  linhas.push('')
  linhas.push(`**🎫 TICKETS**`)
  linhas.push(`• Médio: R$ ${dados.ticket_medio.toFixed(2)}`)
  linhas.push(`• Bebida: R$ ${dados.ticket_bebida.toFixed(2)}`)
  linhas.push(`• Entrada: R$ ${dados.ticket_entrada.toFixed(2)}`)
  
  if (dados.custo_artistico > 0) {
    const roiAtracao = ((dados.faturamento_bruto - dados.custo_artistico) / dados.custo_artistico * 100)
    linhas.push('')
    linhas.push(`**🎤 ATRAÇÃO**`)
    linhas.push(`• Custo: R$ ${dados.custo_artistico.toLocaleString('pt-BR')} (${dados.percentual_art_sobre_fat.toFixed(1)}% do fat.)`)
    linhas.push(`• ROI: ${roiAtracao.toFixed(0)}% ${roiAtracao > 200 ? '🔥' : roiAtracao > 100 ? '✅' : '⚠️'}`)
  }
  
  linhas.push('')
  linhas.push(`**📊 HISTÓRICO (últimas ${estatisticas.datas_comparadas.length} ${dados.dia_semana}s)**`)
  linhas.push(`• Média: R$ ${estatisticas.media_faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  linhas.push(`• Tendência: ${estatisticas.tendencia === 'subindo' ? '📈 Subindo' : estatisticas.tendencia === 'caindo' ? '📉 Caindo' : estatisticas.tendencia === 'volatil' ? '📊 Volátil' : '➡️ Estável'}`)
  if (estatisticas.melhor) {
    linhas.push(`• Melhor: ${estatisticas.melhor.data_evento} (R$ ${estatisticas.melhor.real_r.toLocaleString('pt-BR')})`)
  }
  
  if (semanaPassada && semanaPassada.faturamento_bruto > 0) {
    const varFat = ((dados.faturamento_bruto - semanaPassada.faturamento_bruto) / semanaPassada.faturamento_bruto * 100)
    const varPax = semanaPassada.pax_total > 0 ? ((dados.pax_total - semanaPassada.pax_total) / semanaPassada.pax_total * 100) : 0
    linhas.push('')
    linhas.push(`**🔄 vs ${semanaPassada.data} (${semanaPassada.atracao_principal})**`)
    linhas.push(`• Faturamento: ${varFat >= 0 ? '+' : ''}${varFat.toFixed(1)}%`)
    linhas.push(`• PAX: ${varPax >= 0 ? '+' : ''}${varPax.toFixed(1)}%`)
  }
  
  linhas.push('')
  linhas.push(`⚠️ *Análise detalhada indisponível (quota IA esgotada)*`)
  
  return linhas.join('\n')
}

// =============================================================================
// ENVIAR PARA DISCORD
// =============================================================================

async function enviarDiscord(titulo: string, mensagem: string) {
  try {
    const webhookUrl = Deno.env.get('DISCORD_CONTAHUB_WEBHOOK')
    if (!webhookUrl) {
      console.log('⚠️ Discord webhook não configurado')
      return false
    }
    
    // Dividir mensagem se for muito grande
    const maxLength = 4000
    let descricao = mensagem
    if (descricao.length > maxLength) {
      descricao = descricao.substring(0, maxLength) + '\n\n...(análise completa salva no banco)'
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: titulo,
          description: descricao,
          color: 3447003,
          timestamp: new Date().toISOString(),
          footer: { text: 'SGB Agente IA - Análise Diária Profunda' }
        }]
      })
    })
    
    return response.ok
  } catch (error) {
    console.error('❌ Erro ao enviar Discord:', error)
    return false
  }
}

// =============================================================================
// HANDLER PRINCIPAL
// =============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bar_id, data_analise } = await req.json()
    
    const barId = bar_id || 3
    
    // Calcular data de ontem
    const hoje = new Date()
    hoje.setHours(hoje.getHours() - 3) // Ajuste Brasília
    
    const ontem = data_analise 
      ? new Date(data_analise + 'T12:00:00Z')
      : new Date(hoje.getTime() - 24 * 60 * 60 * 1000)
    
    const dataOntem = ontem.toISOString().split('T')[0]
    
    console.log(`🎯 Análise profunda para bar_id=${barId}`)
    console.log(`📅 Data análise: ${dataOntem}`)
    
    // Conectar ao Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // 1. Buscar dados completos do evento de ontem
    const dadosOntem = await buscarDadosCompletosEvento(supabase, barId, dataOntem)
    
    if (!dadosOntem) {
      const msg = `⚠️ Sem dados disponíveis para ${dataOntem}`
      console.log(msg)
      return new Response(JSON.stringify({ success: false, message: msg }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    
    // 2. BUSCAR ÚLTIMA OPERAÇÃO DO MESMO DIA DA SEMANA COM FATURAMENTO > 0
    // Isso evita comparar com dias fechados (ex: 01/01)
    const diaSemanaNum = ontem.getDay() // 0=Dom, 1=Seg, etc
    const { data: ultimasOperacoes } = await supabase
      .from('eventos')
      .select('data_evento, real_r, nome, cl_real')
      .eq('bar_id', barId)
      .lt('data_evento', dataOntem) // Antes de ontem
      .gt('real_r', 1000) // Só dias com faturamento significativo (> R$ 1000)
      .order('data_evento', { ascending: false })
      .limit(30) // Últimos 30 dias com operação
    
    // Filtrar para pegar só o mesmo dia da semana
    const mesmosDiasSemana = ultimasOperacoes?.filter((op: any) => {
      const dataOp = new Date(op.data_evento + 'T12:00:00Z')
      return dataOp.getDay() === diaSemanaNum
    }) || []
    
    console.log(`📊 Encontradas ${mesmosDiasSemana.length} ${dadosOntem.dia_semana}s anteriores com operação`)
    
    // Pegar a mais recente para comparação direta
    const ultimaMesmoDia = mesmosDiasSemana[0]
    let dadosSemanaPassada = null
    
    if (ultimaMesmoDia) {
      console.log(`🔄 Comparando com ${ultimaMesmoDia.data_evento} (última ${dadosOntem.dia_semana} com operação)`)
      dadosSemanaPassada = await buscarDadosCompletosEvento(supabase, barId, ultimaMesmoDia.data_evento)
    } else {
      console.log(`⚠️ Nenhuma ${dadosOntem.dia_semana} anterior encontrada com operação`)
    }
    
    // 3. Calcular estatísticas das últimas 4 operações do mesmo dia
    const ultimas4 = mesmosDiasSemana.slice(0, 4)
    const estatisticasMesmoDia = {
      datas_comparadas: ultimas4.map((op: any) => op.data_evento),
      media_faturamento: ultimas4.length > 0 
        ? ultimas4.reduce((sum: number, op: any) => sum + (op.real_r || 0), 0) / ultimas4.length 
        : 0,
      media_pax: ultimas4.length > 0 
        ? ultimas4.reduce((sum: number, op: any) => sum + (op.cl_real || 0), 0) / ultimas4.length 
        : 0,
      melhor: ultimas4.length > 0 
        ? ultimas4.reduce((best: any, op: any) => (!best || op.real_r > best.real_r) ? op : best, null)
        : null,
      pior: ultimas4.length > 0 
        ? ultimas4.reduce((worst: any, op: any) => (!worst || op.real_r < worst.real_r) ? op : worst, null)
        : null,
      tendencia: calcularTendencia(ultimas4.map((op: any) => op.real_r).reverse())
    }
    
    // 3. Buscar contexto histórico
    const contexto = await buscarContextoHistorico(supabase, barId, dataOntem)
    
    // 4. Buscar histórico da atração
    const historicoAtracao = await buscarAtracoesAnteriores(supabase, barId, dadosOntem.atracao_principal)
    
    // 5. Gerar análise inteligente (agora com estatísticas do mesmo dia da semana)
    const analise = await gerarAnaliseInteligente(dadosOntem, contexto, historicoAtracao, dadosSemanaPassada, estatisticasMesmoDia)
    
    // 6. Enviar para Discord
    const titulo = `🤖 Análise ${dadosOntem.dia_semana} ${dataOntem}`
    const discordOk = await enviarDiscord(titulo, analise)
    
    // 7. Salvar no banco
    await supabase.from('agente_insights').insert({
      bar_id: barId,
      tipo: 'analise_diaria_profunda',
      titulo: `${dadosOntem.dia_semana} ${dataOntem} - ${dadosOntem.nome_evento}`,
      descricao: analise,
      criticidade: contexto.comparacao_meta < -20 ? 'alta' : contexto.comparacao_meta < -10 ? 'media' : 'baixa',
      dados: { 
        evento: dadosOntem, 
        contexto, 
        semana_passada: dadosSemanaPassada,
        historico_atracao: historicoAtracao
      },
      origem_ia: true
    })
    
    console.log('✅ Análise diária profunda concluída')
    console.log(`📢 Discord: ${discordOk ? 'Enviado' : 'Falhou'}`)
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        evento: dadosOntem,
        contexto,
        semana_passada: dadosSemanaPassada,
        analise_enviada: discordOk,
        insights_ia: true
      }
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
    
  } catch (error) {
    console.error('❌ Erro na análise diária:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
