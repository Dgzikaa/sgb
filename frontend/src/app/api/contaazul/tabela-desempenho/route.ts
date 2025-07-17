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
      'Stone CrÃ¡Â©dito', 'Stone DÃ¡Â©bito', 'Stone Pix', 'Pix Direto na Conta', 'Dinheiro', 'Receita de Eventos', 'Outras Receitas'
    ]
  },
  {
    nome: 'Custos VariÃ¡Â¡veis',
    categorias: [
      'IMPOSTO', 'COMISSÃ¡Æ’O 10%', 'TAXA MAQUININHA'
    ]
  },
  {
    nome: 'Custo insumos (CMV)',
    categorias: [
      'Custo Drinks', 'Custo Bebidas', 'Custo Comida', 'Custo Outros'
    ]
  },
  {
    nome: 'MÃ¡Â£o-de-Obra',
    categorias: [
      'SALARIO FUNCIONARIOS', 'VALE TRANSPORTE', 'ALIMENTAÃ¡â€¡Ã¡Æ’O', 'ADICIONAIS', 'FREELA ATENDIMENTO', 'FREELA BAR', 'FREELA COZINHA', 'FREELA LIMPEZA', 'FREELA SEGURANÃ¡â€¡A', 'PRO LABORE', 'PROVISÃ¡Æ’O TRABALHISTA'
    ]
  },
  {
    nome: 'Despesas Comerciais',
    categorias: [
      'Marketing', 'AtraÃ¡Â§Ã¡Âµes ProgramaÃ¡Â§Ã¡Â£o', 'ProduÃ¡Â§Ã¡Â£o Eventos'
    ]
  },
  {
    nome: 'Despesas Administrativas',
    categorias: [
      'Administrativo OrdinÃ¡Â¡rio', 'EscritÃ¡Â³rio Central', 'Recursos Humanos'
    ]
  },
  {
    nome: 'Despesas Operacionais',
    categorias: [
      'Materiais OperaÃ¡Â§Ã¡Â£o', 'Materiais de Limpeza e DescartÃ¡Â¡veis', 'UtensÃ¡Â­lios', 'Estorno', 'Outros OperaÃ¡Â§Ã¡Â£o'
    ]
  },
  {
    nome: 'Despesas de OcupaÃ¡Â§Ã¡Â£o (Contas)',
    categorias: [
      'ALUGUEL/CONDOMÃ¡ÂNIO/IPTU', 'Ã¡ÂGUA', 'MANUTENÃ¡â€¡Ã¡Æ’O', 'INTERNET', 'GÃ¡ÂS', 'LUZ'
    ]
  },
  {
    nome: 'NÃ¡Â£o Operacionais',
    categorias: [
      'Contratos'
    ]
  }
];

// Mapeamento de categorias do ContaAzul para as categorias do briefing
// (Ajuste conforme necessÃ¡Â¡rio)
const MAPEAMENTO_CATEGORIAS = {
  // RECEITAS
  'Stone CrÃ¡Â©dito': 'Stone CrÃ¡Â©dito',
  'Stone DÃ¡Â©bito': 'Stone DÃ¡Â©bito',
  'Stone Pix': 'Stone Pix',
  'Pix Direto na Conta': 'Pix Direto na Conta',
  'Dinheiro': 'Dinheiro',
  'Receita de Eventos': 'Receita de Eventos',
  'Outras Receitas': 'Outras Receitas',
  'Ifood': 'Outras Receitas',
  'Receitas de ServiÃ¡Â§os': 'Outras Receitas',
  'Fretes recebidos': 'Outras Receitas',
  'PERSE': 'Outras Receitas',
  'Descontos incondicionais obtidos': 'Outras Receitas',
  'Descontos financeiros obtidos': 'Outras Receitas',
  'EmprÃ¡Â©stimos de SÃ¡Â³cios': 'Outras Receitas',
  'Outros SÃ¡Â³cios': 'Outras Receitas',
  'Dividendos': 'Outras Receitas',
  'Outros Investimentos': 'Outras Receitas',
  'Consultoria': 'Outras Receitas',

  // DESPESAS COMERCIAIS
  'ProduÃ¡Â§Ã¡Â£o Eventos': 'ProduÃ¡Â§Ã¡Â£o Eventos',
  'Marketing': 'Marketing',
  'AtraÃ¡Â§Ã¡Âµes ProgramaÃ¡Â§Ã¡Â£o': 'AtraÃ¡Â§Ã¡Âµes ProgramaÃ¡Â§Ã¡Â£o',

  // CUSTOS VARIÃ¡ÂVEIS
  'IMPOSTO': 'IMPOSTO',
  'COMISSÃ¡Æ’O 10%': 'COMISSÃ¡Æ’O 10%',
  'TAXA MAQUININHA': 'TAXA MAQUININHA',

  // CMV
  'Custo Drinks': 'Custo Drinks',
  'Custo Bebidas': 'Custo Bebidas',
  'Custo Comida': 'Custo Comida',
  'Custo Outros': 'Custo Outros',

  // MÃ¡Æ’O-DE-OBRA
  'SALARIO FUNCIONARIOS': 'SALARIO FUNCIONARIOS',
  'VALE TRANSPORTE': 'VALE TRANSPORTE',
  'ALIMENTAÃ¡â€¡Ã¡Æ’O': 'ALIMENTAÃ¡â€¡Ã¡Æ’O',
  'ADICIONAIS': 'ADICIONAIS',
  'FREELA ATENDIMENTO': 'FREELA ATENDIMENTO',
  'FREELA BAR': 'FREELA BAR',
  'FREELA COZINHA': 'FREELA COZINHA',
  'FREELA LIMPEZA': 'FREELA LIMPEZA',
  'FREELA SEGURANÃ¡â€¡A': 'FREELA SEGURANÃ¡â€¡A',
  'PRO LABORE': 'PRO LABORE',
  'PROVISÃ¡Æ’O TRABALHISTA': 'PROVISÃ¡Æ’O TRABALHISTA',

  // ADMINISTRATIVAS
  'Administrativo OrdinÃ¡Â¡rio': 'Administrativo OrdinÃ¡Â¡rio',
  'EscritÃ¡Â³rio Central': 'EscritÃ¡Â³rio Central',
  'Recursos Humanos': 'Recursos Humanos',

  // OPERACIONAIS
  'Materiais OperaÃ¡Â§Ã¡Â£o': 'Materiais OperaÃ¡Â§Ã¡Â£o',
  'Materiais de Limpeza e DescartÃ¡Â¡veis': 'Materiais de Limpeza e DescartÃ¡Â¡veis',
  'UtensÃ¡Â­lios': 'UtensÃ¡Â­lios',
  'Estorno': 'Estorno',
  'Outros OperaÃ¡Â§Ã¡Â£o': 'Outros OperaÃ¡Â§Ã¡Â£o',

  // OCUPAÃ¡â€¡Ã¡Æ’O
  'ALUGUEL/CONDOMÃ¡ÂNIO/IPTU': 'ALUGUEL/CONDOMÃ¡ÂNIO/IPTU',
  'Ã¡ÂGUA': 'Ã¡ÂGUA',
  'MANUTENÃ¡â€¡Ã¡Æ’O': 'MANUTENÃ¡â€¡Ã¡Æ’O',
  'INTERNET': 'INTERNET',
  'GÃ¡ÂS': 'GÃ¡ÂS',
  'LUZ': 'LUZ',

  // NÃ¡Æ’O OPERACIONAIS
  'Contratos': 'Contratos',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bar_id = body.bar_id;
    const data_inicio = body.data_inicio;
    const data_fim = body.data_fim;
    const pageSize = body.pageSize || 1000; // Pega mais por pÃ¡Â¡gina para acelerar

    if (!bar_id) {
      return NextResponse.json({ success: false, error: 'ParÃ¡Â¢metro bar_id obrigatÃ¡Â³rio.' }, { status: 400 });
    }

    // Buscar todas as categorias do bar e criar dicionÃ¡Â¡rio {categoria_id: nome}
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

    // PAGINAÃ¡â€¡Ã¡Æ’O: Buscar todos os eventos do perÃ¡Â­odo
    let eventos: any[] = [];
    let page = 1;
    let fetched = 0;
    let totalReceitas = 0;
    const receitasDescricoes: string[] = [];
    const receitasPorCategoria: Record<string, number> = {};
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
          const nomeCategoria = evento.categoria_id ? categoriasDict[evento.categoria_id] : null;
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
    console.log('[DEBUG] Exemplos descriÃ¡Â§Ã¡Âµes receitas:', receitasDescricoes.slice(0, 10));
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
      const nomeCategoria = evento.categoria_id ? categoriasDict[evento.categoria_id] : null;
      let categoriaMapeada = null;
      if (nomeCategoria) {
        categoriaMapeada = (MAPEAMENTO_CATEGORIAS as Record<string, string>)[nomeCategoria];
        // Fallback: receitas nÃ¡Â£o mapeadas vÃ¡Â£o para Outras Receitas, despesas para Outros OperaÃ¡Â§Ã¡Â£o
        if (!categoriaMapeada) {
          categoriaMapeada = evento.tipo === 'receita' ? 'Outras Receitas' : 'Outros OperaÃ¡Â§Ã¡Â£o';
        }
      } else {
        // Usar utilitÃ¡Â¡rio inteligente se nÃ¡Â£o houver categoria
        const mapeado = mapearCategoria(evento.descricao, evento.tipo === 'receita' ? 'RECEITA' : 'DESPESA', evento.valor);
        categoriaMapeada = (MAPEAMENTO_CATEGORIAS as Record<string, string>)[mapeado.categoria_sugerida] || (evento.tipo === 'receita' ? 'Outras Receitas' : 'Outros OperaÃ¡Â§Ã¡Â£o');
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
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as any).message || String(e) }, { status: 500 });
  }
} 

