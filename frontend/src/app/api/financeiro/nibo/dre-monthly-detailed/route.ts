import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic'

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
    ],
  },
  {
    nome: "Não Operacionais",
    tipo: "saida",
    categorias: [
      "Contratos",
    ],
  },
  // NOVAS MACRO-CATEGORIAS (FORA DO EBITDA)
  {
    nome: "Investimentos",
    tipo: "saida",
    categorias: [
      "Despesas Financeiras",
      "Obras",
      "Outros Investimentos",
      "Equipamentos",
    ],
  },
  {
    nome: "Sócios",
    tipo: "saida", 
    categorias: [
      "Empréstimos de Sócios",
      "Outros Sócios",
    ],
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
  const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

  try {
    console.log('🗓️ DRE Monthly Detailed - Ano:', year, 'Mês:', month);
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Configuração do Supabase não encontrada',
        macroCategorias: [],
        entradasTotais: 0,
        saidasTotais: 0, 
        saldo: 0,
        ebitda: 0,
        periodo: { month, year }
      }, { status: 500 });
    }
    
    // Calcular range de datas do mês específico
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = month === 12 
      ? `${year + 1}-01-01` 
      : `${year}-${(month + 1).toString().padStart(2, '0')}-01`;

    console.log('📅 Filtrando dados de:', startDate, 'até:', endDate);
    
    // Buscar dados do mês específico com paginação
    let allData: any[] = [];
    let hasMore = true;
    let page = 0;
    const pageSize = 1000;
    
    while (hasMore) {
      const { data: pageData, error } = await supabase
        .from('nibo_agendamentos')
        .select('categoria_nome, valor, data_competencia')
        .eq('deletado', false)
        .gte('data_competencia', startDate)
        .lt('data_competencia', endDate)
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) {
        console.error('❌ Erro ao buscar dados mensais:', error);
        return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
      }
      
      if (pageData && pageData.length > 0) {
        allData = [...allData, ...pageData];
        console.log(`📄 Página ${page + 1}: ${pageData.length} registros`);
        page++;
      } else {
        hasMore = false;
      }
    }
    
    const data = allData;
    console.log('📊 Total de registros encontrados:', data.length);

    // Processar macro-categorias
    const macroCategoriasProcessadas = MACRO_CATEGORIAS.map(macro => {
      const categoriasEncontradas = data?.filter(item => 
        macro.categorias.includes(item.categoria_nome)
      ) || [];

      // Separar contratos das outras categorias
      const categoriasContratos = categoriasEncontradas.filter(item => item.categoria_nome === 'Contratos');
      const categoriasNormais = categoriasEncontradas.filter(item => item.categoria_nome !== 'Contratos');
      
      const totalEntradas = macro.tipo === 'entrada' 
        ? categoriasNormais.reduce((sum, item) => sum + parseFloat(item.valor || '0'), 0) + 
          categoriasContratos.reduce((sum, item) => sum + parseFloat(item.valor || '0'), 0) // Contratos sempre como entrada
        : categoriasContratos.reduce((sum, item) => sum + parseFloat(item.valor || '0'), 0); // Só contratos se não for entrada

      const totalSaidas = macro.tipo === 'saida'
        ? categoriasNormais.reduce((sum, item) => sum + parseFloat(item.valor || '0'), 0) // Excluir contratos das saídas
        : 0;

      // Processar categorias individuais
      const categoriasDetalhadas = macro.categorias.map(catNome => {
        const dadosCategoria = categoriasEncontradas.filter(item => item.categoria_nome === catNome);
        const total = dadosCategoria.reduce((sum, item) => sum + parseFloat(item.valor || '0'), 0);
        
        // Tratar "Contratos" como receita (entrada) mesmo estando em macro-categoria de saída
        const isContrato = catNome === 'Contratos';
        
        return {
          nome: catNome,
          entradas: (macro.tipo === 'entrada' || isContrato) ? total : 0,
          saidas: (macro.tipo === 'saida' && !isContrato) ? total : 0
        };
      }); // Incluir TODAS as categorias, mesmo com valor 0

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
    const entradasEbitda = macroCategoriasProcessadas
      .filter(macro => macro.tipo === 'entrada')
      .reduce((sum, macro) => sum + macro.total_entradas, 0);

    const saidasEbitda = macroCategoriasProcessadas
      .filter(macro => macro.tipo === 'saida' && !['Investimentos', 'Sócios'].includes(macro.nome))
      .reduce((sum, macro) => sum + macro.total_saidas, 0);

    const ebitda = entradasEbitda - saidasEbitda;

    console.log('✅ Processamento concluído:');
    console.log('💰 Entradas Totais:', entradasTotais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    console.log('💸 Saídas Totais:', saidasTotais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    console.log('📈 EBITDA:', ebitda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

    return NextResponse.json({
      macroCategorias: macroCategoriasProcessadas,
      entradasTotais,
      saidasTotais,
      saldo,
      ebitda,
      periodo: { month, year },
      success: true
    });

  } catch (error) {
    console.error('❌ Erro na API DRE Monthly Detailed:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      macroCategorias: [],
      entradasTotais: 0,
      saidasTotais: 0, 
      saldo: 0,
      ebitda: 0,
      periodo: { month, year }
    }, { status: 500 });
  }
}
