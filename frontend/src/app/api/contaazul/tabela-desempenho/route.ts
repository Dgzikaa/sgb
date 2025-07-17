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
      'Stone Crá©dito', 'Stone Dá©bito', 'Stone Pix', 'Pix Direto na Conta', 'Dinheiro', 'Receita de Eventos', 'Outras Receitas'
    ]
  },
  {
    nome: 'Custos Variá¡veis',
    categorias: [
      'IMPOSTO', 'COMISSáƒO 10%', 'TAXA MAQUININHA'
    ]
  },
  {
    nome: 'Custo insumos (CMV)',
    categorias: [
      'Custo Drinks', 'Custo Bebidas', 'Custo Comida', 'Custo Outros'
    ]
  },
  {
    nome: 'Má£o-de-Obra',
    categorias: [
      'SALARIO FUNCIONARIOS', 'VALE TRANSPORTE', 'ALIMENTAá‡áƒO', 'ADICIONAIS', 'FREELA ATENDIMENTO', 'FREELA BAR', 'FREELA COZINHA', 'FREELA LIMPEZA', 'FREELA SEGURANá‡A', 'PRO LABORE', 'PROVISáƒO TRABALHISTA'
    ]
  },
  {
    nome: 'Despesas Comerciais',
    categorias: [
      'Marketing', 'Atraá§áµes Programaá§á£o', 'Produá§á£o Eventos'
    ]
  },
  {
    nome: 'Despesas Administrativas',
    categorias: [
      'Administrativo Ordiná¡rio', 'Escritá³rio Central', 'Recursos Humanos'
    ]
  },
  {
    nome: 'Despesas Operacionais',
    categorias: [
      'Materiais Operaá§á£o', 'Materiais de Limpeza e Descartá¡veis', 'Utensá­lios', 'Estorno', 'Outros Operaá§á£o'
    ]
  },
  {
    nome: 'Despesas de Ocupaá§á£o (Contas)',
    categorias: [
      'ALUGUEL/CONDOMáNIO/IPTU', 'áGUA', 'MANUTENá‡áƒO', 'INTERNET', 'GáS', 'LUZ'
    ]
  },
  {
    nome: 'Ná£o Operacionais',
    categorias: [
      'Contratos'
    ]
  }
];

// Mapeamento de categorias do ContaAzul para as categorias do briefing
// (Ajuste conforme necessá¡rio)
const MAPEAMENTO_CATEGORIAS = {
  // RECEITAS
  'Stone Crá©dito': 'Stone Crá©dito',
  'Stone Dá©bito': 'Stone Dá©bito',
  'Stone Pix': 'Stone Pix',
  'Pix Direto na Conta': 'Pix Direto na Conta',
  'Dinheiro': 'Dinheiro',
  'Receita de Eventos': 'Receita de Eventos',
  'Outras Receitas': 'Outras Receitas',
  'Ifood': 'Outras Receitas',
  'Receitas de Serviá§os': 'Outras Receitas',
  'Fretes recebidos': 'Outras Receitas',
  'PERSE': 'Outras Receitas',
  'Descontos incondicionais obtidos': 'Outras Receitas',
  'Descontos financeiros obtidos': 'Outras Receitas',
  'Emprá©stimos de Sá³cios': 'Outras Receitas',
  'Outros Sá³cios': 'Outras Receitas',
  'Dividendos': 'Outras Receitas',
  'Outros Investimentos': 'Outras Receitas',
  'Consultoria': 'Outras Receitas',

  // DESPESAS COMERCIAIS
  'Produá§á£o Eventos': 'Produá§á£o Eventos',
  'Marketing': 'Marketing',
  'Atraá§áµes Programaá§á£o': 'Atraá§áµes Programaá§á£o',

  // CUSTOS VARIáVEIS
  'IMPOSTO': 'IMPOSTO',
  'COMISSáƒO 10%': 'COMISSáƒO 10%',
  'TAXA MAQUININHA': 'TAXA MAQUININHA',

  // CMV
  'Custo Drinks': 'Custo Drinks',
  'Custo Bebidas': 'Custo Bebidas',
  'Custo Comida': 'Custo Comida',
  'Custo Outros': 'Custo Outros',

  // MáƒO-DE-OBRA
  'SALARIO FUNCIONARIOS': 'SALARIO FUNCIONARIOS',
  'VALE TRANSPORTE': 'VALE TRANSPORTE',
  'ALIMENTAá‡áƒO': 'ALIMENTAá‡áƒO',
  'ADICIONAIS': 'ADICIONAIS',
  'FREELA ATENDIMENTO': 'FREELA ATENDIMENTO',
  'FREELA BAR': 'FREELA BAR',
  'FREELA COZINHA': 'FREELA COZINHA',
  'FREELA LIMPEZA': 'FREELA LIMPEZA',
  'FREELA SEGURANá‡A': 'FREELA SEGURANá‡A',
  'PRO LABORE': 'PRO LABORE',
  'PROVISáƒO TRABALHISTA': 'PROVISáƒO TRABALHISTA',

  // ADMINISTRATIVAS
  'Administrativo Ordiná¡rio': 'Administrativo Ordiná¡rio',
  'Escritá³rio Central': 'Escritá³rio Central',
  'Recursos Humanos': 'Recursos Humanos',

  // OPERACIONAIS
  'Materiais Operaá§á£o': 'Materiais Operaá§á£o',
  'Materiais de Limpeza e Descartá¡veis': 'Materiais de Limpeza e Descartá¡veis',
  'Utensá­lios': 'Utensá­lios',
  'Estorno': 'Estorno',
  'Outros Operaá§á£o': 'Outros Operaá§á£o',

  // OCUPAá‡áƒO
  'ALUGUEL/CONDOMáNIO/IPTU': 'ALUGUEL/CONDOMáNIO/IPTU',
  'áGUA': 'áGUA',
  'MANUTENá‡áƒO': 'MANUTENá‡áƒO',
  'INTERNET': 'INTERNET',
  'GáS': 'GáS',
  'LUZ': 'LUZ',

  // NáƒO OPERACIONAIS
  'Contratos': 'Contratos',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bar_id = body.bar_id;
    const data_inicio = body.data_inicio;
    const data_fim = body.data_fim;
    const pageSize = body.pageSize || 1000; // Pega mais por pá¡gina para acelerar

    if (!bar_id) {
      return NextResponse.json({ success: false, error: 'Pará¢metro bar_id obrigatá³rio.' }, { status: 400 });
    }

    // Buscar todas as categorias do bar e criar dicioná¡rio {categoria_id: nome}
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

    // PAGINAá‡áƒO: Buscar todos os eventos do perá­odo
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
    console.log('[DEBUG] Exemplos descriá§áµes receitas:', receitasDescricoes.slice(0, 10));
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
        // Fallback: receitas ná£o mapeadas vá£o para Outras Receitas, despesas para Outros Operaá§á£o
        if (!categoriaMapeada) {
          categoriaMapeada = evento.tipo === 'receita' ? 'Outras Receitas' : 'Outros Operaá§á£o';
        }
      } else {
        // Usar utilitá¡rio inteligente se ná£o houver categoria
        const mapeado = mapearCategoria(evento.descricao, evento.tipo === 'receita' ? 'RECEITA' : 'DESPESA', evento.valor);
        categoriaMapeada = (MAPEAMENTO_CATEGORIAS as Record<string, string>)[mapeado.categoria_sugerida] || (evento.tipo === 'receita' ? 'Outras Receitas' : 'Outros Operaá§á£o');
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
