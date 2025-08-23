import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente do Supabase não encontradas');
}

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
      "CDB/CDI",
      "Outros Investimentos",
      "Despesas Financeiras",
      "Obras",
      "Equipamentos",
      "Equipamentos R",
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
  console.log('🚀 API DRE YEARLY FOI CHAMADA!');
  
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

  try {
    console.log('=== API DRE YEARLY DEBUG ===');
    console.log('Ano solicitado:', year);
    console.log('URL Supabase:', supabaseUrl);
    console.log('Key disponível:', !!supabaseKey);
    
    // Verificar se as variáveis de ambiente estão disponíveis
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Variáveis de ambiente não encontradas');
      return NextResponse.json({ 
        error: 'Configuração do Supabase não encontrada',
        entradasTotais: 0,
        saidasTotais: 0, 
        saldo: 0,
        ebitda: 0,
        year: Number(year)
      }, { status: 500 });
    }
    
    console.log('🔍 Buscando dados do ano', year);
    
    // Buscar TODOS os dados do ano 2025 com paginação
    console.log('🔍 Buscando TODOS os dados do ano 2025...');
    
    let allData: any[] = [];
    let hasMore = true;
    let page = 0;
    const pageSize = 1000; // Máximo por página
    
    while (hasMore) {
      const { data: pageData, error } = await supabase
        .from('nibo_agendamentos')
        .select('categoria_nome, valor, data_competencia')
        .eq('deletado', false)
        .gte('data_competencia', '2025-01-01')
        .lt('data_competencia', '2026-01-01')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) {
        console.error('❌ Erro ao buscar dados anuais:', error);
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

    console.log('✅ Dados encontrados:', data?.length || 0, 'registros');
    
    // Mostrar distribuição por ano
    const dadosPorAno = data?.reduce((acc, item) => {
      const ano = new Date(item.data_competencia).getFullYear();
      acc[ano] = (acc[ano] || 0) + 1;
      return acc;
    }, {} as Record<number, number>) || {};
    
    console.log('📅 Distribuição por ano:', dadosPorAno);
    
    // Mostrar algumas categorias para debug
    const categoriasUnicas = [...new Set(data?.map(d => d.categoria_nome) || [])];
    console.log('📋 Categorias encontradas:', categoriasUnicas.slice(0, 10), '...');

    // Usar todos os dados (já filtrados por 2025)
    const dadosDoAno = data || [];
    
    console.log(`📊 Dados do ano 2025:`, dadosDoAno.length, 'registros');
    
    // Calcular totais com logs detalhados
    const categoriasReceita = ['Stone Crédito', 'Stone Débito', 'Stone Pix', 'Pix Direto na Conta', 'Dinheiro', 'Receita de Eventos', 'Outras Receitas'];
    
    const dadosReceita = dadosDoAno.filter(d => categoriasReceita.includes(d.categoria_nome)) || [];
    console.log('💰 Dados de receita encontrados:', dadosReceita.length, 'registros');
    
    const receitas = dadosReceita.reduce((sum, item) => {
      const valor = parseFloat(item.valor || '0');
      const valorFinal = isNaN(valor) ? 0 : valor;
      console.log(`  ${item.categoria_nome}: R$ ${valorFinal.toLocaleString('pt-BR')}`);
      return sum + valorFinal;
    }, 0);

    const dadosDespesa = dadosDoAno.filter(d => !categoriasReceita.includes(d.categoria_nome)) || [];
    console.log('💸 Dados de despesa encontrados:', dadosDespesa.length, 'registros');
    
    const despesas = dadosDespesa.reduce((sum, item) => {
      const valor = parseFloat(item.valor || '0');
      const valorFinal = isNaN(valor) ? 0 : valor;
      return sum + valorFinal;
    }, 0);

    const ebitda = receitas - despesas;
    const saldoGeral = receitas - despesas;

    console.log('📊 TOTAIS CALCULADOS:');
    console.log('  Receitas: R$', receitas.toLocaleString('pt-BR'));
    console.log('  Despesas: R$', despesas.toLocaleString('pt-BR'));
    console.log('  EBITDA: R$', ebitda.toLocaleString('pt-BR'));
    console.log('  Saldo Geral: R$', saldoGeral.toLocaleString('pt-BR'));
    console.log('=== FIM DEBUG ===');

    return NextResponse.json({ 
      entradasTotais: receitas,
      saidasTotais: despesas, 
      saldo: saldoGeral,
      ebitda,
      year: Number(year)
    });
  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 
