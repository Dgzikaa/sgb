import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const MACRO_CATEGORIAS = [
  {
    nome: "Receita",
    tipo: "entrada",
    categorias: [
      "Stone Crédito",
      "Stone Débito", 
      "Stone Pix",
      "Pix Direto na Conta",
      "Dinheiro",
      "Receita de Eventos",
      "Outras Receitas",
    ],
  },
  {
    nome: "Custos Variáveis",
    tipo: "saida",
    categorias: ["IMPOSTO", "COMISSÃO 10%", "TAXA MAQUININHA"],
  },
  {
    nome: "Custo insumos (CMV)",
    tipo: "saida",
    categorias: [
      "Custo Drinks",
      "Custo Bebidas", 
      "Custo Comida",
      "Custo Outros",
      "Custo teste",
    ],
  },
  {
    nome: "Mão-de-Obra",
    tipo: "saida",
    categorias: [
      "SALARIO FUNCIONARIOS",
      "VALE TRANSPORTE",
      "ALIMENTAÇÃO",
      "ADICIONAIS",
      "FREELA ATENDIMENTO",
      "FREELA BAR",
      "FREELA COZINHA", 
      "FREELA LIMPEZA",
      "FREELA SEGURANÇA",
      "PRO LABORE",
      "PROVISÃO TRABALHISTA",
      "Recursos Humanos",
    ],
  },
  {
    nome: "Despesas Comerciais",
    tipo: "saida",
    categorias: [
      "Marketing",
      "Atrações Programação",
      "Produção Eventos",
    ],
  },
  {
    nome: "Despesas Administrativas",
    tipo: "saida",
    categorias: [
      "Administrativo Ordinário",
      "Escritório Central",
      "Recursos Humanos",
      "Consultoria",
    ],
  },
  {
    nome: "Despesas Operacionais",
    tipo: "saida",
    categorias: [
      "Materiais Operação",
      "Materiais de Limpeza e Descartáveis",
      "Utensílios",
      "Estorno",
      "Outros Operação",
    ],
  },
  {
    nome: "Despesas de Ocupação (Contas)",
    tipo: "saida",
    categorias: [
      "ALUGUEL/CONDOMÍNIO/IPTU",
      "ÁGUA",
      "MANUTENÇÃO",
      "INTERNET",
      "GÁS",
      "LUZ",
      "TELEFONE",
      "SEGURO",
      "IPTU",
      "CONDOMÍNIO",
    ],
  },
  {
    nome: "Investimentos",
    tipo: "saida",
    categorias: [
      "EQUIPAMENTOS",
      "MÓVEIS",
      "DECORAÇÃO",
      "REFORMAS",
      "TECNOLOGIA",
    ],
  },
  {
    nome: "Sócios",
    tipo: "saida",
    categorias: [
      "PRÓ-LABORE",
      "DISTRIBUIÇÃO DE LUCROS",
      "RETIRADA DE SÓCIOS",
    ],
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

  try {
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Configuração do Supabase não encontrada',
        macroCategorias: [],
        entradasTotais: 0,
        saidasTotais: 0, 
        saldo: 0,
        ebitda: 0,
        year: Number(year)
      }, { status: 500 });
    }
    
    // Buscar TODOS os dados do ano 2025 com paginação
    
    let allData: any[] = [];
    let hasMore = true;
    let page = 0;
    const pageSize = 1000;
    
    while (hasMore) {
      const { data: pageData, error } = await supabase
        .from('nibo_agendamentos')
        .select('categoria_nome, valor, data_vencimento')
        .eq('deletado', false)
        .gte('data_vencimento', '2025-01-01')
        .lt('data_vencimento', '2026-01-01')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) {
        return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
      }
      
      if (pageData && pageData.length > 0) {
        allData = [...allData, ...pageData];
        page++;
      } else {
        hasMore = false;
      }
    }
    
    const data = allData;

    // Processar macro-categorias
    const macroCategoriasProcessadas = MACRO_CATEGORIAS.map(macro => {
      const categoriasEncontradas = data?.filter(item => 
        macro.categorias.includes(item.categoria_nome)
      ) || [];

      const totalEntradas = macro.tipo === 'entrada' 
        ? categoriasEncontradas.reduce((sum, item) => sum + parseFloat(item.valor || '0'), 0)
        : 0;

      const totalSaidas = macro.tipo === 'saida'
        ? categoriasEncontradas.reduce((sum, item) => sum + parseFloat(item.valor || '0'), 0)
        : 0;

      // Processar categorias individuais
      const categoriasDetalhadas = macro.categorias.map(catNome => {
        const dadosCategoria = categoriasEncontradas.filter(item => item.categoria_nome === catNome);
        const total = dadosCategoria.reduce((sum, item) => sum + parseFloat(item.valor || '0'), 0);
        
        return {
          nome: catNome,
          entradas: macro.tipo === 'entrada' ? total : 0,
          saidas: macro.tipo === 'saida' ? total : 0
        };
      }).filter(cat => cat.entradas > 0 || cat.saidas > 0); // Só incluir categorias com valores

      return {
        nome: macro.nome,
        tipo: macro.tipo,
        total_entradas: totalEntradas,
        total_saidas: totalSaidas,
        categorias: categoriasDetalhadas
      };
    });

    // Calcular totais
    const entradasTotais = macroCategoriasProcessadas
      .filter(macro => macro.tipo === 'entrada')
      .reduce((sum, macro) => sum + macro.total_entradas, 0);

    const saidasTotais = macroCategoriasProcessadas
      .filter(macro => macro.tipo === 'saida')
      .reduce((sum, macro) => sum + macro.total_saidas, 0);

    const saldo = entradasTotais - saidasTotais;
    
    // Calcular EBITDA (excluindo Investimentos e Sócios)
    const ebitda = entradasTotais - macroCategoriasProcessadas
      .filter(macro => macro.tipo === 'saida' && macro.nome !== 'Investimentos' && macro.nome !== 'Sócios')
      .reduce((sum, macro) => sum + macro.total_saidas, 0);



    return NextResponse.json({ 
      macroCategorias: macroCategoriasProcessadas,
      entradasTotais,
      saidasTotais, 
      saldo,
      ebitda,
      year: Number(year)
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      macroCategorias: [],
      entradasTotais: 0,
      saidasTotais: 0, 
      saldo: 0,
      ebitda: 0,
      year: Number(year)
    }, { status: 500 });
  }
} 