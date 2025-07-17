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
      'Stone CrÃ©dito', 'Stone DÃ©bito', 'Stone Pix', 'Pix Direto na Conta', 'Dinheiro', 'Receita de Eventos', 'Outras Receitas'
    ]
  },
  {
    nome: 'Custos VariÃ¡veis',
    categorias: [
      'IMPOSTO', 'COMISSÃƒO 10%', 'TAXA MAQUININHA'
    ]
  },
  {
    nome: 'Custo insumos (CMV)',
    categorias: [
      'Custo Drinks', 'Custo Bebidas', 'Custo Comida', 'Custo Outros'
    ]
  },
  {
    nome: 'MÃ£o-de-Obra',
    categorias: [
      'SALARIO FUNCIONARIOS', 'VALE TRANSPORTE', 'ALIMENTAÃ‡ÃƒO', 'ADICIONAIS', 'FREELA ATENDIMENTO', 'FREELA BAR', 'FREELA COZINHA', 'FREELA LIMPEZA', 'FREELA SEGURANÃ‡A', 'PRO LABORE', 'PROVISÃƒO TRABALHISTA'
    ]
  },
  {
    nome: 'Despesas Comerciais',
    categorias: [
      'Marketing', 'AtraÃ§Ãµes ProgramaÃ§Ã£o', 'ProduÃ§Ã£o Eventos'
    ]
  },
  {
    nome: 'Despesas Administrativas',
    categorias: [
      'Administrativo OrdinÃ¡rio', 'EscritÃ³rio Central', 'Recursos Humanos'
    ]
  },
  {
    nome: 'Despesas Operacionais',
    categorias: [
      'Materiais OperaÃ§Ã£o', 'Materiais de Limpeza e DescartÃ¡veis', 'UtensÃ­lios', 'Estorno', 'Outros OperaÃ§Ã£o'
    ]
  },
  {
    nome: 'Despesas de OcupaÃ§Ã£o (Contas)',
    categorias: [
      'ALUGUEL/CONDOMÃNIO/IPTU', 'ÃGUA', 'MANUTENÃ‡ÃƒO', 'INTERNET', 'GÃS', 'LUZ'
    ]
  },
  {
    nome: 'NÃ£o Operacionais',
    categorias: [
      'Contratos'
    ]
  }
];

// Mapeamento de categorias do ContaAzul para as categorias do briefing
// (Ajuste conforme necessÃ¡rio)
const MAPEAMENTO_CATEGORIAS = {
  // RECEITAS
  'Stone CrÃ©dito': 'Stone CrÃ©dito',
  'Stone DÃ©bito': 'Stone DÃ©bito',
  'Stone Pix': 'Stone Pix',
  'Pix Direto na Conta': 'Pix Direto na Conta',
  'Dinheiro': 'Dinheiro',
  'Receita de Eventos': 'Receita de Eventos',
  'Outras Receitas': 'Outras Receitas',
  'Ifood': 'Outras Receitas',
  'Receitas de ServiÃ§os': 'Outras Receitas',
  'Fretes recebidos': 'Outras Receitas',
  'PERSE': 'Outras Receitas',
  'Descontos incondicionais obtidos': 'Outras Receitas',
  'Descontos financeiros obtidos': 'Outras Receitas',
  'EmprÃ©stimos de SÃ³cios': 'Outras Receitas',
  'Outros SÃ³cios': 'Outras Receitas',
  'Dividendos': 'Outras Receitas',
  'Outros Investimentos': 'Outras Receitas',
  'Consultoria': 'Outras Receitas',

  // DESPESAS COMERCIAIS
  'ProduÃ§Ã£o Eventos': 'ProduÃ§Ã£o Eventos',
  'Marketing': 'Marketing',
  'AtraÃ§Ãµes ProgramaÃ§Ã£o': 'AtraÃ§Ãµes ProgramaÃ§Ã£o',

  // CUSTOS VARIÃVEIS
  'IMPOSTO': 'IMPOSTO',
  'COMISSÃƒO 10%': 'COMISSÃƒO 10%',
  'TAXA MAQUININHA': 'TAXA MAQUININHA',

  // CMV
  'Custo Drinks': 'Custo Drinks',
  'Custo Bebidas': 'Custo Bebidas',
  'Custo Comida': 'Custo Comida',
  'Custo Outros': 'Custo Outros',

  // MÃƒO-DE-OBRA
  'SALARIO FUNCIONARIOS': 'SALARIO FUNCIONARIOS',
  'VALE TRANSPORTE': 'VALE TRANSPORTE',
  'ALIMENTAÃ‡ÃƒO': 'ALIMENTAÃ‡ÃƒO',
  'ADICIONAIS': 'ADICIONAIS',
  'FREELA ATENDIMENTO': 'FREELA ATENDIMENTO',
  'FREELA BAR': 'FREELA BAR',
  'FREELA COZINHA': 'FREELA COZINHA',
  'FREELA LIMPEZA': 'FREELA LIMPEZA',
  'FREELA SEGURANÃ‡A': 'FREELA SEGURANÃ‡A',
  'PRO LABORE': 'PRO LABORE',
  'PROVISÃƒO TRABALHISTA': 'PROVISÃƒO TRABALHISTA',

  // ADMINISTRATIVAS
  'Administrativo OrdinÃ¡rio': 'Administrativo OrdinÃ¡rio',
  'EscritÃ³rio Central': 'EscritÃ³rio Central',
  'Recursos Humanos': 'Recursos Humanos',

  // OPERACIONAIS
  'Materiais OperaÃ§Ã£o': 'Materiais OperaÃ§Ã£o',
  'Materiais de Limpeza e DescartÃ¡veis': 'Materiais de Limpeza e DescartÃ¡veis',
  'UtensÃ­lios': 'UtensÃ­lios',
  'Estorno': 'Estorno',
  'Outros OperaÃ§Ã£o': 'Outros OperaÃ§Ã£o',

  // OCUPAÃ‡ÃƒO
  'ALUGUEL/CONDOMÃNIO/IPTU': 'ALUGUEL/CONDOMÃNIO/IPTU',
  'ÃGUA': 'ÃGUA',
  'MANUTENÃ‡ÃƒO': 'MANUTENÃ‡ÃƒO',
  'INTERNET': 'INTERNET',
  'GÃS': 'GÃS',
  'LUZ': 'LUZ',

  // NÃƒO OPERACIONAIS
  'Contratos': 'Contratos',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bar_id = body.bar_id;
    const data_inicio = body.data_inicio;
    const data_fim = body.data_fim;
    const pageSize = body.pageSize || 1000; // Pega mais por pÃ¡gina para acelerar

    if (!bar_id) {
      return NextResponse.json({ success: false, error: 'ParÃ¢metro bar_id obrigatÃ³rio.' }, { status: 400 });
    }

    // Buscar todas as categorias do bar e criar dicionÃ¡rio {categoria_id: nome}
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

    // PAGINAÃ‡ÃƒO: Buscar todos os eventos do perÃ­odo
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
    console.log('[DEBUG] Exemplos descriÃ§Ãµes receitas:', receitasDescricoes.slice(0, 10));
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
        // Fallback: receitas nÃ£o mapeadas vÃ£o para Outras Receitas, despesas para Outros OperaÃ§Ã£o
        if (!categoriaMapeada) {
          categoriaMapeada = evento.tipo === 'receita' ? 'Outras Receitas' : 'Outros OperaÃ§Ã£o';
        }
      } else {
        // Usar utilitÃ¡rio inteligente se nÃ£o houver categoria
        const mapeado = mapearCategoria(evento.descricao, evento.tipo === 'receita' ? 'RECEITA' : 'DESPESA', evento.valor);
        categoriaMapeada = (MAPEAMENTO_CATEGORIAS as Record<string, string>)[mapeado.categoria_sugerida] || (evento.tipo === 'receita' ? 'Outras Receitas' : 'Outros OperaÃ§Ã£o');
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
