import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========================================
// CONFIGURAÇÃO DO AGENTE
// ========================================

// Palavras-chave para identificar eventos de samba/pagode
const KEYWORDS_SAMBA_PAGODE = [
  'samba', 'pagode', 'roda de samba', 'pagodinho', 'pagodão',
  'samba rock', 'samba de raiz', 'samba enredo', 'boteco',
  'feijoada', 'chorinho', 'choro', 'mpb ao vivo',
  'samba da', 'samba do', 'pagode do', 'pagode da',
  'bloco de', 'bloco do', 'bloco da', 'batuque',
  'grupo revelação', 'fundo de quintal', 'zeca pagodinho',
  'thiaguinho', 'ferrugem', 'mumuzinho', 'dilsinho',
  'péricles', 'turma do pagode', 'sorriso maroto'
];

// Palavras que indicam que NÃO é concorrência (falso positivo)
const KEYWORDS_IGNORAR = [
  'aula de', 'curso de', 'workshop', 'oficina',
  'infantil', 'kids', 'criança', 'família',
  'gospel', 'igreja', 'religioso'
];

// Locais em Brasília/DF para filtrar
const LOCAIS_BRASILIA = [
  'brasília', 'brasilia', 'df', 'distrito federal',
  'asa sul', 'asa norte', 'lago sul', 'lago norte',
  'sudoeste', 'noroeste', 'guará', 'taguatinga',
  'ceilândia', 'ceilandia', 'samambaia', 'águas claras',
  'vicente pires', 'riacho fundo', 'núcleo bandeirante',
  'gama', 'santa maria', 'recanto das emas', 'sobradinho',
  'planaltina', 'paranoá', 'são sebastião', 'jardim botânico'
];

// ========================================
// FUNÇÕES DE BUSCA
// ========================================

// Buscar eventos públicos do Sympla (sem autenticação)
async function buscarEventosSympla(): Promise<any[]> {
  console.log('🔍 Buscando eventos no Sympla...');
  
  const eventos: any[] = [];
  
  try {
    // Sympla tem uma página de busca pública que podemos acessar
    // Vamos buscar por categorias relevantes em Brasília
    const categorias = ['shows', 'festas', 'bares'];
    
    for (const categoria of categorias) {
      const url = `https://www.sympla.com.br/api/v1/search?city=Bras%C3%ADlia&category=${categoria}&size=50`;
      
      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; ZykorBot/1.0)'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.events) {
            eventos.push(...data.events.map((e: any) => ({
              ...e,
              fonte: 'sympla'
            })));
          }
        }
      } catch (err) {
        console.log(`   ⚠️ Erro ao buscar categoria ${categoria}:`, err);
      }
    }
    
    console.log(`   ✅ ${eventos.length} eventos encontrados no Sympla`);
  } catch (error) {
    console.error('❌ Erro ao buscar Sympla:', error);
  }
  
  return eventos;
}

// Buscar eventos do Ingresse
async function buscarEventosIngresse(): Promise<any[]> {
  console.log('🔍 Buscando eventos no Ingresse...');
  
  const eventos: any[] = [];
  
  try {
    // API pública do Ingresse para buscar eventos em Brasília
    const url = 'https://api.ingresse.com/search?state=DF&size=50&orderBy=sessions.dateTime';
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; ZykorBot/1.0)'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.data) {
        eventos.push(...data.data.map((e: any) => ({
          id: e.id,
          name: e.title,
          description: e.description,
          venue: e.venue?.name,
          address: e.venue?.address,
          city: e.venue?.city,
          date: e.sessions?.[0]?.dateTime,
          url: e.link,
          image: e.poster,
          fonte: 'ingresse'
        })));
      }
    }
    
    console.log(`   ✅ ${eventos.length} eventos encontrados no Ingresse`);
  } catch (error) {
    console.error('❌ Erro ao buscar Ingresse:', error);
  }
  
  return eventos;
}

// Buscar eventos do Eventim
async function buscarEventosEventim(): Promise<any[]> {
  console.log('🔍 Buscando eventos no Eventim...');
  
  const eventos: any[] = [];
  
  try {
    // API/página do Eventim para Brasília
    const url = 'https://www.eventim.com.br/city/brasilia-55/';
    
    // Eventim não tem API pública fácil, então vamos apenas logar
    console.log('   ⚠️ Eventim requer scraping mais avançado - pulando por agora');
  } catch (error) {
    console.error('❌ Erro ao buscar Eventim:', error);
  }
  
  return eventos;
}

// ========================================
// FUNÇÕES DE ANÁLISE
// ========================================

// Verificar se o evento é de samba/pagode
function ehEventoSambaPagode(evento: any): { match: boolean; tipo: string; score: number } {
  const texto = `${evento.name || ''} ${evento.description || ''} ${evento.title || ''}`.toLowerCase();
  
  // Verificar se tem palavras para ignorar
  for (const keyword of KEYWORDS_IGNORAR) {
    if (texto.includes(keyword)) {
      return { match: false, tipo: '', score: 0 };
    }
  }
  
  // Contar matches de keywords
  let score = 0;
  let tipoEncontrado = 'outro';
  
  for (const keyword of KEYWORDS_SAMBA_PAGODE) {
    if (texto.includes(keyword)) {
      score++;
      
      // Determinar tipo principal
      if (keyword.includes('samba') && tipoEncontrado === 'outro') {
        tipoEncontrado = 'samba';
      } else if (keyword.includes('pagode')) {
        tipoEncontrado = 'pagode';
      } else if (keyword.includes('forro') || keyword.includes('forró')) {
        tipoEncontrado = 'forro';
      }
    }
  }
  
  return {
    match: score > 0,
    tipo: tipoEncontrado,
    score
  };
}

// Verificar se o evento é em Brasília/DF
function ehEmBrasilia(evento: any): boolean {
  const texto = `${evento.city || ''} ${evento.address || ''} ${evento.venue || ''} ${evento.local || ''}`.toLowerCase();
  
  return LOCAIS_BRASILIA.some(local => texto.includes(local));
}

// Determinar nível de impacto baseado no evento
function determinarImpacto(evento: any, score: number): 'alto' | 'medio' | 'baixo' {
  // Score alto + fim de semana = impacto alto
  if (score >= 3) return 'alto';
  if (score >= 2) return 'medio';
  return 'baixo';
}

// Extrair data do evento
function extrairDataEvento(evento: any): string | null {
  try {
    const possiveisCampos = [
      evento.date,
      evento.start_date,
      evento.startDate,
      evento.sessions?.[0]?.dateTime,
      evento.datetime
    ];
    
    for (const campo of possiveisCampos) {
      if (campo) {
        const data = new Date(campo);
        if (!isNaN(data.getTime())) {
          return data.toISOString().split('T')[0];
        }
      }
    }
  } catch {
    // Ignorar erros de parsing
  }
  
  return null;
}

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================

async function processarEventos(supabase: any): Promise<{
  total_buscados: number;
  total_relevantes: number;
  novos_adicionados: number;
  fontes: { [key: string]: number };
}> {
  const resultado = {
    total_buscados: 0,
    total_relevantes: 0,
    novos_adicionados: 0,
    fontes: {} as { [key: string]: number }
  };
  
  // Buscar eventos de todas as fontes
  const [eventosSympla, eventosIngresse, eventosEventim] = await Promise.all([
    buscarEventosSympla(),
    buscarEventosIngresse(),
    buscarEventosEventim()
  ]);
  
  const todosEventos = [
    ...eventosSympla,
    ...eventosIngresse,
    ...eventosEventim
  ];
  
  resultado.total_buscados = todosEventos.length;
  resultado.fontes = {
    sympla: eventosSympla.length,
    ingresse: eventosIngresse.length,
    eventim: eventosEventim.length
  };
  
  console.log(`\n📊 Total de eventos buscados: ${todosEventos.length}`);
  
  // Filtrar e processar eventos relevantes
  const eventosRelevantes: any[] = [];
  
  for (const evento of todosEventos) {
    // Verificar se é samba/pagode
    const analise = ehEventoSambaPagode(evento);
    
    if (!analise.match) continue;
    
    // Verificar se é em Brasília
    if (!ehEmBrasilia(evento)) continue;
    
    // Extrair data
    const dataEvento = extrairDataEvento(evento);
    if (!dataEvento) continue;
    
    // Verificar se é futuro
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataEventoObj = new Date(dataEvento);
    if (dataEventoObj < hoje) continue;
    
    // Evento relevante encontrado!
    eventosRelevantes.push({
      nome: evento.name || evento.title,
      descricao: evento.description?.substring(0, 500),
      local_nome: evento.venue || evento.local || 'Local não especificado',
      local_endereco: evento.address,
      cidade: 'Brasília',
      data_evento: dataEvento,
      tipo: analise.tipo,
      impacto: determinarImpacto(evento, analise.score),
      fonte: evento.fonte,
      url_fonte: evento.url || evento.link,
      id_externo: String(evento.id),
      preco_minimo: evento.price?.min || evento.lowestPrice,
      preco_maximo: evento.price?.max || evento.highestPrice,
      imagem_url: evento.image || evento.poster,
      status: 'ativo',
      verificado: false
    });
  }
  
  resultado.total_relevantes = eventosRelevantes.length;
  console.log(`\n🎯 Eventos de samba/pagode em Brasília: ${eventosRelevantes.length}`);
  
  // Inserir no banco (upsert para evitar duplicatas)
  if (eventosRelevantes.length > 0) {
    console.log('\n💾 Salvando eventos no banco...');
    
    for (const evento of eventosRelevantes) {
      try {
        const { data, error } = await supabase
          .from('eventos_concorrencia')
          .upsert(evento, {
            onConflict: 'fonte,id_externo',
            ignoreDuplicates: false
          })
          .select('id');
        
        if (error) {
          if (!error.message.includes('duplicate')) {
            console.log(`   ⚠️ Erro ao inserir ${evento.nome}:`, error.message);
          }
        } else if (data && data.length > 0) {
          resultado.novos_adicionados++;
          console.log(`   ✅ Novo: ${evento.nome} (${evento.data_evento})`);
        }
      } catch (err) {
        console.log(`   ⚠️ Erro ao processar ${evento.nome}:`, err);
      }
    }
  }
  
  return resultado;
}

// ========================================
// HANDLER PRINCIPAL
// ========================================

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔍 INICIANDO MONITOR DE CONCORRÊNCIA');
    console.log(`📅 Data/Hora: ${new Date().toISOString()}`);
    
    // Supabase connection
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Processar eventos
    const resultado = await processarEventos(supabase);
    
    // Limpar eventos antigos (passados há mais de 7 dias)
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 7);
    
    const { data: eventosRemovidos, error: erroRemocao } = await supabase
      .from('eventos_concorrencia')
      .update({ status: 'encerrado' })
      .lt('data_evento', dataLimite.toISOString().split('T')[0])
      .eq('status', 'ativo')
      .select('id');
    
    const totalEncerrados = eventosRemovidos?.length || 0;
    if (totalEncerrados > 0) {
      console.log(`\n🗑️ ${totalEncerrados} eventos antigos marcados como encerrados`);
    }
    
    // Resumo
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO DO MONITORAMENTO');
    console.log('='.repeat(50));
    console.log(`   🔍 Eventos buscados: ${resultado.total_buscados}`);
    console.log(`   🎯 Eventos relevantes: ${resultado.total_relevantes}`);
    console.log(`   ✅ Novos adicionados: ${resultado.novos_adicionados}`);
    console.log(`   🗑️ Encerrados: ${totalEncerrados}`);
    console.log(`   📊 Por fonte:`);
    Object.entries(resultado.fontes).forEach(([fonte, count]) => {
      console.log(`      - ${fonte}: ${count}`);
    });
    
    return Response.json({
      success: true,
      message: 'Monitoramento de concorrência concluído',
      resultado: {
        ...resultado,
        eventos_encerrados: totalEncerrados
      },
      timestamp: new Date().toISOString()
    }, { headers: corsHeaders });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('💥 Erro no monitor de concorrência:', error);

    return Response.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
});
