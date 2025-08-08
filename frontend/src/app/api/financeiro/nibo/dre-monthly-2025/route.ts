import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const CATEGORIAS_RECEITA = [
  'Stone Crédito', 'Stone Débito', 'Stone Pix', 'Pix Direto na Conta', 
  'Dinheiro', 'Receita de Eventos', 'Outras Receitas'
];

export async function GET(request: Request) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Configuração do Supabase não encontrada',
        monthlyData: []
      }, { status: 500 });
    }
    
    // Buscar TODOS os dados de 2025 com paginação
    
    let allData: any[] = [];
    let hasMore = true;
    let page = 0;
    const pageSize = 1000;
    
    while (hasMore) {
      const { data: pageData, error } = await supabase
        .from('nibo_agendamentos')
        .select('id, categoria_nome, valor, data_competencia')
        .eq('deletado', false)
        .gte('data_competencia', '2025-01-01')
        .lt('data_competencia', '2026-01-01')
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
    
    // Verificar se os totais batem com a API yearly
    const totalReceitas = allData
      .filter(item => CATEGORIAS_RECEITA.includes(item.categoria_nome))
      .reduce((sum, item) => sum + parseFloat(item.valor || '0'), 0);
    
    const totalDespesas = allData
      .filter(item => !CATEGORIAS_RECEITA.includes(item.categoria_nome))
      .reduce((sum, item) => sum + parseFloat(item.valor || '0'), 0);

    // Ordenar todos os dados por data e ID para garantir consistência absoluta
    const sortedData = allData.sort((a, b) => {
      const dateCompare = a.data_competencia.localeCompare(b.data_competencia);
      if (dateCompare !== 0) return dateCompare;
      return (a.id || 0) - (b.id || 0);
    });
    
    // Processar dados por mês
    const monthlyData: any[] = [];
    
    for (let month = 1; month <= 12; month++) {
      const startDate = `2025-${month.toString().padStart(2, '0')}-01`;
      const endDate = month === 12 
        ? '2026-01-01' 
        : `2025-${(month + 1).toString().padStart(2, '0')}-01`;
      
      // Filtrar dados do mês usando string comparison (mais preciso)
      const dadosDoMes = sortedData.filter(item => {
        const itemDate = item.data_competencia;
        return itemDate >= startDate && itemDate < endDate;
      });
      
      // Calcular receitas do mês
      const receitasDoMes = dadosDoMes
        .filter(item => CATEGORIAS_RECEITA.includes(item.categoria_nome))
        .reduce((sum, item) => sum + parseFloat(item.valor || '0'), 0);
      
      // Calcular despesas do mês (excluindo apenas Investimentos e Sócios como na API yearly)
      const categoriasInvestimentos = ['EQUIPAMENTOS', 'MÓVEIS', 'DECORAÇÃO', 'REFORMAS', 'TECNOLOGIA', 'Obras', 'Outros Investimentos', 'Empréstimos de Sócios'];
      const categoriasSocios = ['PRÓ-LABORE', 'DISTRIBUIÇÃO DE LUCROS', 'RETIRADA DE SÓCIOS', 'Outros Sócios'];
      const categoriasExcluidas = [...categoriasInvestimentos, ...categoriasSocios];
      

      
      const despesasDoMes = dadosDoMes
        .filter(item => !CATEGORIAS_RECEITA.includes(item.categoria_nome) && !categoriasExcluidas.includes(item.categoria_nome))
        .reduce((sum, item) => sum + parseFloat(item.valor || '0'), 0);
      
      // Calcular EBITDA do mês (mesma lógica da API yearly)
      const despesasEBITDA = dadosDoMes
        .filter(item => !CATEGORIAS_RECEITA.includes(item.categoria_nome) && !categoriasExcluidas.includes(item.categoria_nome))
        .reduce((sum, item) => sum + parseFloat(item.valor || '0'), 0);
      
      const ebitdaDoMes = receitasDoMes - despesasEBITDA;
      
      monthlyData.push({
        month,
        year: 2025,
        monthName: MESES[month - 1],
        receitas: receitasDoMes,
        custos: despesasDoMes,
        ebitda: ebitdaDoMes,
        registros: dadosDoMes.length
      });
      

    }
    


    return NextResponse.json({ 
      monthlyData,
      totalRecords: allData.length
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      monthlyData: []
    }, { status: 500 });
  }
} 