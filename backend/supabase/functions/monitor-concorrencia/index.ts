import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ========================================
// ARTISTAS FAMOSOS DE PAGODE/SAMBA
// ========================================
const ARTISTAS_FAMOSOS = [
  'Thiaguinho', 'Ferrugem', 'Dilsinho', 'Péricles', 'Sorriso Maroto',
  'Menos é Mais', 'Turma do Pagode', 'Belo', 'Xande de Pilares', 'Rodriguinho',
  'Mumuzinho', 'Pixote', 'Revelação', 'Exaltasamba', 'Raça Negra',
  'Alexandre Pires', 'Grupo Clareou', 'Imaginasamba', 'Jeito Moleque',
  'Zeca Pagodinho', 'Jorge Aragão', 'Alcione', 'Diogo Nogueira', 'Maria Rita',
  'Seu Jorge', 'Arlindo Cruz', 'Beth Carvalho', 'Martinho da Vila',
  'R2 na Praia', 'Pagode do Adame', 'É o Tchan', 'Harmonia do Samba',
  'Parangolé', 'Psirico', 'Léo Santana', 'La Fúria'
]

// Casas de show famosas em Brasília
const CASAS_BRASILIA = [
  'Funn', 'Arena BRB Mané Garrincha', 'Estádio Nacional', 'Centro de Convenções',
  'Pontão do Lago Sul', 'Pier 21', 'Villa Mix', 'Quiosque', 'Iate Clube',
  'Minas Brasília', 'Nilópolis Clube', 'SESI', 'Parque da Cidade',
  'Parque Ana Lídia', 'Ulysses Guimarães'
]

// ========================================
// FUNÇÃO PARA BUSCAR NO SYMPLA
// ========================================
async function buscarSympla(termo: string, pagina = 1): Promise<any[]> {
  try {
    // Sympla API pública de descoberta
    const url = `https://www.sympla.com.br/api/v1/events/search?q=${encodeURIComponent(termo)}&state=DF&city=Brasília&page=${pagina}&limit=50`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      console.log(`Sympla search API returned ${response.status} for "${termo}"`)
      return []
    }
    
    const data = await response.json()
    return data.events || data.data || []
  } catch (error) {
    console.error(`Erro ao buscar Sympla para "${termo}":`, error)
    return []
  }
}

// ========================================
// FUNÇÃO PARA BUSCAR NO SYMPLA VIA SCRAPING
// ========================================
async function buscarSympláScraping(termo: string): Promise<any[]> {
  try {
    const url = `https://www.sympla.com.br/eventos/brasilia-df?s=${encodeURIComponent(termo)}`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) return []
    
    const html = await response.text()
    
    // Extrair dados do JSON embutido na página
    const jsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)
    const eventos: any[] = []
    
    if (jsonMatch) {
      for (const match of jsonMatch) {
        try {
          const jsonStr = match.replace(/<script type="application\/ld\+json">/, '').replace(/<\/script>/, '')
          const data = JSON.parse(jsonStr)
          if (data['@type'] === 'Event' || data['@type'] === 'MusicEvent') {
            eventos.push(data)
          }
        } catch (e) {
          // Ignorar erros de parse
        }
      }
    }
    
    // Também tentar extrair do __NEXT_DATA__
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1])
        const pageProps = nextData?.props?.pageProps
        if (pageProps?.events) {
          eventos.push(...pageProps.events)
        }
      } catch (e) {
        // Ignorar
      }
    }
    
    return eventos
  } catch (error) {
    console.error(`Erro no scraping Sympla para "${termo}":`, error)
    return []
  }
}

// ========================================
// FUNÇÃO PARA BUSCAR NO INGRESSE
// ========================================
async function buscarIngresse(termo: string): Promise<any[]> {
  try {
    const url = `https://www.ingresse.com/api/search?term=${encodeURIComponent(termo)}&state=DF&size=50`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      console.log(`Ingresse API returned ${response.status} for "${termo}"`)
      return []
    }
    
    const data = await response.json()
    return data.data || data.events || []
  } catch (error) {
    console.error(`Erro ao buscar Ingresse para "${termo}":`, error)
    return []
  }
}

// ========================================
// FUNÇÃO PARA BUSCAR NO EVENTBRITE
// ========================================
async function buscarEventbrite(termo: string): Promise<any[]> {
  try {
    const url = `https://www.eventbrite.com.br/api/v3/destination/search/?q=${encodeURIComponent(termo)}&place=Brasília&dates=future`
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) return []
    
    const data = await response.json()
    return data.events?.results || []
  } catch (error) {
    console.error(`Erro ao buscar Eventbrite para "${termo}":`, error)
    return []
  }
}

// ========================================
// ANALISAR IMPACTO DO EVENTO
// ========================================
function analisarImpacto(evento: any): 'alto' | 'medio' | 'baixo' {
  const nome = (evento.nome || evento.name || evento.title || '').toLowerCase()
  const descricao = (evento.descricao || evento.description || '').toLowerCase()
  const local = (evento.local_nome || evento.venue?.name || evento.location?.name || '').toLowerCase()
  const textoCompleto = `${nome} ${descricao} ${local}`
  
  // Verificar artistas famosos
  for (const artista of ARTISTAS_FAMOSOS) {
    if (textoCompleto.includes(artista.toLowerCase())) {
      return 'alto'
    }
  }
  
  // Verificar casas grandes
  for (const casa of CASAS_BRASILIA) {
    if (textoCompleto.includes(casa.toLowerCase())) {
      // Se for em casa grande, pelo menos médio
      return 'medio'
    }
  }
  
  // Verificar palavras-chave de eventos grandes
  const palavrasAlto = ['festival', 'arena', 'estádio', 'show nacional', 'mega', 'grande']
  for (const palavra of palavrasAlto) {
    if (textoCompleto.includes(palavra)) {
      return 'alto'
    }
  }
  
  return 'baixo'
}

// ========================================
// EXTRAIR DATA DO EVENTO
// ========================================
function extrairData(evento: any): string | null {
  const possiveisData = [
    evento.data_evento,
    evento.date,
    evento.start_date,
    evento.startDate,
    evento.data,
    evento.event_date,
    evento.datetime,
    evento.start?.dateTime,
    evento.start?.date
  ]
  
  for (const data of possiveisData) {
    if (data) {
      try {
        const parsed = new Date(data)
        if (!isNaN(parsed.getTime())) {
          // Verificar se é em 2026
          const year = parsed.getFullYear()
          if (year === 2026) {
            return parsed.toISOString().split('T')[0]
          }
        }
      } catch (e) {
        continue
      }
    }
  }
  
  return null
}

// ========================================
// NORMALIZAR EVENTO
// ========================================
function normalizarEvento(evento: any, fonte: string): any {
  const nome = evento.nome || evento.name || evento.title || 'Evento sem nome'
  const dataEvento = extrairData(evento)
  
  if (!dataEvento) return null
  
  return {
    nome,
    descricao: evento.descricao || evento.description || '',
    local_nome: evento.local_nome || evento.venue?.name || evento.location?.name || evento.place || '',
    local_endereco: evento.local_endereco || evento.venue?.address || evento.location?.address || '',
    cidade: 'Brasília',
    data_evento: dataEvento,
    tipo: 'pagode',
    impacto: analisarImpacto(evento),
    fonte,
    url_fonte: evento.url || evento.link || evento.eventUrl || '',
    id_externo: evento.id?.toString() || evento.eventId?.toString() || '',
    imagem_url: evento.image || evento.imageUrl || evento.poster || '',
    preco_minimo: evento.preco_minimo || evento.price?.min || null,
    preco_maximo: evento.preco_maximo || evento.price?.max || null,
    status: 'ativo'
  }
}

// ========================================
// HANDLER PRINCIPAL
// ========================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔍 Iniciando busca de eventos de concorrência...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Termos de busca específicos para pagode/samba em Brasília
    const termosBusca = [
      'pagode brasilia 2026',
      'samba brasilia 2026',
      'pagode df 2026',
      'samba df',
      'show pagode brasilia',
      'show samba brasilia',
      // Artistas específicos
      ...ARTISTAS_FAMOSOS.slice(0, 15).map(a => `${a} brasilia`),
      // Casas de show
      'funn brasilia',
      'villa mix brasilia',
      'arena brb'
    ]
    
    const eventosEncontrados: any[] = []
    const idsProcessados = new Set<string>()
    
    // Buscar em todas as fontes
    for (const termo of termosBusca) {
      console.log(`📡 Buscando: "${termo}"...`)
      
      // Sympla API
      const symplaApi = await buscarSympla(termo)
      console.log(`  Sympla API: ${symplaApi.length} resultados`)
      
      // Sympla Scraping
      const symplaScrap = await buscarSympláScraping(termo)
      console.log(`  Sympla Scraping: ${symplaScrap.length} resultados`)
      
      // Ingresse
      const ingresse = await buscarIngresse(termo)
      console.log(`  Ingresse: ${ingresse.length} resultados`)
      
      // Eventbrite
      const eventbrite = await buscarEventbrite(termo)
      console.log(`  Eventbrite: ${eventbrite.length} resultados`)
      
      // Processar todos os resultados
      const todosEventos = [
        ...symplaApi.map(e => normalizarEvento(e, 'sympla')),
        ...symplaScrap.map(e => normalizarEvento(e, 'sympla')),
        ...ingresse.map(e => normalizarEvento(e, 'ingresse')),
        ...eventbrite.map(e => normalizarEvento(e, 'eventbrite'))
      ].filter(e => e !== null)
      
      for (const evento of todosEventos) {
        // Evitar duplicatas
        const chave = `${evento.nome}-${evento.data_evento}`.toLowerCase()
        if (!idsProcessados.has(chave)) {
          idsProcessados.add(chave)
          eventosEncontrados.push(evento)
        }
      }
      
      // Pequeno delay para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    console.log(`\n✅ Total de eventos únicos encontrados: ${eventosEncontrados.length}`)
    
    // Filtrar apenas eventos de alto e médio impacto para 2026
    const eventosRelevantes = eventosEncontrados.filter(e => 
      e.impacto === 'alto' || e.impacto === 'medio'
    )
    
    console.log(`🎯 Eventos relevantes (alto/médio impacto): ${eventosRelevantes.length}`)
    
    // Inserir no banco de dados
    if (eventosRelevantes.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('eventos_concorrencia')
        .upsert(
          eventosRelevantes.map(e => ({
            ...e,
            encontrado_em: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })),
          { 
            onConflict: 'id_externo',
            ignoreDuplicates: true 
          }
        )
        .select()
      
      if (insertError) {
        console.error('Erro ao inserir eventos:', insertError)
      } else {
        console.log(`💾 Eventos salvos no banco: ${inserted?.length || 0}`)
      }
    }
    
    // Buscar todos os eventos atuais do banco para retornar
    const { data: eventosAtuais, error: selectError } = await supabase
      .from('eventos_concorrencia')
      .select('*')
      .eq('status', 'ativo')
      .gte('data_evento', '2026-01-01')
      .lte('data_evento', '2026-12-31')
      .order('data_evento', { ascending: true })
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Busca concluída! ${eventosRelevantes.length} eventos encontrados.`,
        eventos_novos: eventosRelevantes.length,
        eventos_totais: eventosAtuais?.length || 0,
        eventos: eventosAtuais || [],
        termos_buscados: termosBusca.length,
        fontes: ['sympla', 'ingresse', 'eventbrite'],
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
    
  } catch (error) {
    console.error('❌ Erro na execução:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
