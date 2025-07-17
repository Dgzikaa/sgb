import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mapearCategoria } from '@/lib/contaazul-categoria-mapper';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Grupos e categorias conforme briefing
const GRUPOS = [
  {
    nome: 'Receitas',
    categorias: [
      'Stone Cr·©dito', 'Stone D·©bito', 'Stone Pix', 'Pix Direto na Conta', 'Dinheiro', 'Receita de Eventos', 'Outras Receitas'
    ]
  },
  {
    nome: 'Custos Vari·°veis',
    categorias: [
      'IMPOSTO', 'COMISS·ÉO 10%', 'TAXA MAQUININHA'
    ]
  },
  {
    nome: 'Custo insumos (CMV)',
    categorias: [
      'Custo Drinks', 'Custo Bebidas', 'Custo Comida', 'Custo Outros'
    ]
  },
  {
    nome: 'M·£o-de-Obra',
    categorias: [
      'SALARIO FUNCIONARIOS', 'VALE TRANSPORTE', 'ALIMENTA·á·ÉO', 'ADICIONAIS', 'FREELA ATENDIMENTO', 'FREELA BAR', 'FREELA COZINHA', 'FREELA LIMPEZA', 'FREELA SEGURAN·áA', 'PRO LABORE', 'PROVIS·ÉO TRABALHISTA'
    ]
  },
  {
    nome: 'Despesas Comerciais',
    categorias: [
      'Marketing', 'Atra·ß·µes Programa·ß·£o', 'Produ·ß·£o Eventos'
    ]
  },
  {
    nome: 'Despesas Administrativas',
    categorias: [
      'Administrativo Ordin·°rio', 'Escrit·≥rio Central', 'Recursos Humanos'
    ]
  },
  {
    nome: 'Despesas Operacionais',
    categorias: [
      'Materiais Opera·ß·£o', 'Materiais de Limpeza e Descart·°veis', 'Utens·≠lios', 'Estorno', 'Outros Opera·ß·£o'
    ]
  },
  {
    nome: 'Despesas de Ocupa·ß·£o (Contas)',
    categorias: [
      'ALUGUEL/CONDOM·çNIO/IPTU', '·ÅGUA', 'MANUTEN·á·ÉO', 'INTERNET', 'G·ÅS', 'LUZ'
    ]
  },
  {
    nome: 'N·£o Operacionais',
    categorias: [
      'Contratos'
    ]
  }
];

// Mapeamento de categorias do ContaAzul para as categorias do briefing
// (Ajuste conforme necess·°rio)
const MAPEAMENTO_CATEGORIAS = {
  // RECEITAS
  'Stone Cr·©dito': 'Stone Cr·©dito',
  'Stone D·©bito': 'Stone D·©bito',
  'Stone Pix': 'Stone Pix',
  'Pix Direto na Conta': 'Pix Direto na Conta',
  'Dinheiro': 'Dinheiro',
  'Receita de Eventos': 'Receita de Eventos',
  'Outras Receitas': 'Outras Receitas',
  'Ifood': 'Outras Receitas',
  'Receitas de Servi·ßos': 'Outras Receitas',
  'Fretes recebidos': 'Outras Receitas',
  'PERSE': 'Outras Receitas',
  'Descontos incondicionais obtidos': 'Outras Receitas',
  'Descontos financeiros obtidos': 'Outras Receitas',
  'Empr·©stimos de S·≥cios': 'Outras Receitas',
  'Outros S·≥cios': 'Outras Receitas',
  'Dividendos': 'Outras Receitas',
  'Outros Investimentos': 'Outras Receitas',
  'Consultoria': 'Outras Receitas',

  // DESPESAS COMERCIAIS
  'Produ·ß·£o Eventos': 'Produ·ß·£o Eventos',
  'Marketing': 'Marketing',
  'Atra·ß·µes Programa·ß·£o': 'Atra·ß·µes Programa·ß·£o',

  // CUSTOS VARI·ÅVEIS
  'IMPOSTO': 'IMPOSTO',
  'COMISS·ÉO 10%': 'COMISS·ÉO 10%',
  'TAXA MAQUININHA': 'TAXA MAQUININHA',

  // CMV
  'Custo Drinks': 'Custo Drinks',
  'Custo Bebidas': 'Custo Bebidas',
  'Custo Comida': 'Custo Comida',
  'Custo Outros': 'Custo Outros',

  // M·ÉO-DE-OBRA
  'SALARIO FUNCIONARIOS': 'SALARIO FUNCIONARIOS',
  'VALE TRANSPORTE': 'VALE TRANSPORTE',
  'ALIMENTA·á·ÉO': 'ALIMENTA·á·ÉO',
  'ADICIONAIS': 'ADICIONAIS',
  'FREELA ATENDIMENTO': 'FREELA ATENDIMENTO',
  'FREELA BAR': 'FREELA BAR',
  'FREELA COZINHA': 'FREELA COZINHA',
  'FREELA LIMPEZA': 'FREELA LIMPEZA',
  'FREELA SEGURAN·áA': 'FREELA SEGURAN·áA',
  'PRO LABORE': 'PRO LABORE',
  'PROVIS·ÉO TRABALHISTA': 'PROVIS·ÉO TRABALHISTA',

  // ADMINISTRATIVAS
  'Administrativo Ordin·°rio': 'Administrativo Ordin·°rio',
  'Escrit·≥rio Central': 'Escrit·≥rio Central',
  'Recursos Humanos': 'Recursos Humanos',

  // OPERACIONAIS
  'Materiais Opera·ß·£o': 'Materiais Opera·ß·£o',
  'Materiais de Limpeza e Descart·°veis': 'Materiais de Limpeza e Descart·°veis',
  'Utens·≠lios': 'Utens·≠lios',
  'Estorno': 'Estorno',
  'Outros Opera·ß·£o': 'Outros Opera·ß·£o',

  // OCUPA·á·ÉO
  'ALUGUEL/CONDOM·çNIO/IPTU': 'ALUGUEL/CONDOM·çNIO/IPTU',
  '·ÅGUA': '·ÅGUA',
  'MANUTEN·á·ÉO': 'MANUTEN·á·ÉO',
  'INTERNET': 'INTERNET',
  'G·ÅS': 'G·ÅS',
  'LUZ': 'LUZ',

  // N·ÉO OPERACIONAIS
  'Contratos': 'Contratos',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bar_id = body.bar_id;
    const data_inicio = body.data_inicio;
    const data_fim = body.data_fim;
    const pageSize = body.pageSize || 1000; // Pega mais por p·°gina para acelerar

    if (!bar_id) {
      return NextResponse.json({ success: false, error: 'Par·¢metro bar_id obrigat·≥rio.' }, { status: 400 });
    }

    // Buscar todas as categorias do bar e criar dicion·°rio {categoria_id: nome}
    const { data: categorias, error: catError } = await supabase
      .from('contaazul_categorias')
      .select('id, nome')
      .eq('bar_id', bar_id);
    if (catError) {
      return NextResponse.json({ success: false, error: catError.message }, { status: 500 });
    }
    const categoriasDict: Record<string, string> = {};
    for (const cat of categorias || []) {
      categoriasDict[cat.id] = cat.nome;
    }

    // PAGINA·á·ÉO: Buscar todos os eventos do per·≠odo
    let eventos: any[] = [];
    let page = 1;
    let fetched = 0;
    let totalReceitas = 0;
    let receitasDescricoes: string[] = [];
    let receitasPorCategoria: Record<string, number> = {};
    while (true) {
      let query = supabase
        .from('contaazul_eventos_financeiros')
        .select('*')
        .eq('bar_id', bar_id);
      if (data_inicio) query = query.gte('data_competencia', data_inicio);
      if (data_fim) query = query.lte('data_competencia', data_fim);
      query = query.order('data_competencia', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);
      const { data, error } = await query;
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      if (!data || data.length === 0) break;
      eventos = eventos.concat(data);
      fetched += data.length;
      // Debug receitas
      for (const evento of data) {
        if ((evento.tipo || '').toLowerCase().includes('receita')) {
          totalReceitas++;
          receitasDescricoes.push(evento.descricao);
          // Mapear categoria
          let nomeCategoria = evento.categoria_id ? categoriasDict[evento.categoria_id] : null;
          let categoriaMapeada = null;
          if (nomeCategoria) {
            categoriaMapeada = (MAPEAMENTO_CATEGORIAS as Record<string, string>)[nomeCategoria];
            if (!categoriaMapeada) {
              categoriaMapeada = 'Outras Receitas';
            }
          } else {
            const mapeado = mapearCategoria(evento.descricao, 'RECEITA', evento.valor);
            categoriaMapeada = (MAPEAMENTO_CATEGORIAS as Record<string, string>)[mapeado.categoria_sugerida] || 'Outras Receitas';
          }
          receitasPorCategoria[categoriaMapeada] = (receitasPorCategoria[categoriaMapeada] || 0) + 1;
        }
      }
      if (data.length < pageSize) break;
      page++;
    }
    console.log('[DEBUG] Total eventos:', eventos.length);
    console.log('[DEBUG] Total receitas:', totalReceitas);
    console.log('[DEBUG] Exemplos descri·ß·µes receitas:', receitasDescricoes.slice(0, 10));
    console.log('[DEBUG] Receitas por categoria:', receitasPorCategoria);

    // Agrupar por grupo/categoria
    const resultado: Record<string, Record<string, { valor: number, eventos: any[] }>> = {};
    for (const grupo of GRUPOS) {
      resultado[grupo.nome] = {};
      for (const cat of grupo.categorias) {
        resultado[grupo.nome][cat] = { valor: 0, eventos: [] };
      }
    }

    for (const evento of eventos || []) {
      // Mapear categoria_id para nome da categoria
      let nomeCategoria = evento.categoria_id ? categoriasDict[evento.categoria_id] : null;
      let categoriaMapeada = null;
      if (nomeCategoria) {
        categoriaMapeada = (MAPEAMENTO_CATEGORIAS as Record<string, string>)[nomeCategoria];
        // Fallback: receitas n·£o mapeadas v·£o para Outras Receitas, despesas para Outros Opera·ß·£o
        if (!categoriaMapeada) {
          categoriaMapeada = evento.tipo === 'receita' ? 'Outras Receitas' : 'Outros Opera·ß·£o';
        }
      } else {
        // Usar utilit·°rio inteligente se n·£o houver categoria
        const mapeado = mapearCategoria(evento.descricao, evento.tipo === 'receita' ? 'RECEITA' : 'DESPESA', evento.valor);
        categoriaMapeada = (MAPEAMENTO_CATEGORIAS as Record<string, string>)[mapeado.categoria_sugerida] || (evento.tipo === 'receita' ? 'Outras Receitas' : 'Outros Opera·ß·£o');
      }
      // Encontrar grupo correspondente
      let grupoNome = null;
      for (const grupo of GRUPOS) {
        if (grupo.categorias.includes(categoriaMapeada)) {
          grupoNome = grupo.nome;
          break;
        }
      }
      if (grupoNome) {
        resultado[grupoNome][categoriaMapeada].valor += Number(evento.valor) || 0;
        resultado[grupoNome][categoriaMapeada].eventos.push(evento);
      }
    }

    // Montar resposta para tabela
    const tabela = [];
    for (const grupo of GRUPOS) {
      for (const cat of grupo.categorias) {
        tabela.push({
          grupo: grupo.nome,
          categoria: cat,
          valor: resultado[grupo.nome][cat].valor,
          eventos: resultado[grupo.nome][cat].eventos
        });
      }
    }

    return NextResponse.json({ success: true, tabela, totalEventos: eventos.length, totalReceitas, receitasPorCategoria, pageSize }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || String(e) }, { status: 500 });
  }
} 
