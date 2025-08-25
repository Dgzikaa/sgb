import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bar_id, ano } = body;

    if (!bar_id || !ano) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Buscar dados do Nibo para o ano especificado COM PAGINAÇÃO
    // USANDO DATA_COMPETENCIA e CATEGORIA_NOME conforme estrutura correta
    console.log(`🔍 Buscando dados NIBO para bar_id: ${bar_id}, ano: ${ano}`);
    
    // Buscar todos os dados com paginação
    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000; // Buscar 1000 registros por vez
    let hasMore = true;

    while (hasMore) {
      console.log(`📄 Buscando página ${Math.floor(from / pageSize) + 1} (registros ${from + 1}-${from + pageSize})...`);
      
      const { data: pageData, error: pageError } = await supabase
        .from('nibo_agendamentos')
        .select('*')
        .eq('bar_id', parseInt(bar_id))
        .gte('data_competencia', `${ano}-01-01`)
        .lte('data_competencia', `${ano}-12-31`)
        .not('categoria_nome', 'is', null)
        .range(from, from + pageSize - 1);

      if (pageError) {
        console.error('❌ Erro ao buscar página de dados NIBO:', pageError);
        return NextResponse.json(
          { success: false, error: 'Erro ao buscar dados do NIBO' },
          { status: 500 }
        );
      }

      if (pageData && pageData.length > 0) {
        allData = allData.concat(pageData);
        from += pageSize;
        hasMore = pageData.length === pageSize; // Se retornou menos que pageSize, não há mais dados
        console.log(`✅ Página carregada: ${pageData.length} registros (total acumulado: ${allData.length})`);
      } else {
        hasMore = false;
        console.log(`🏁 Fim da paginação - nenhum registro na página atual`);
      }
    }

    const niboData = allData;
    console.log(`📊 TOTAL de dados NIBO encontrados: ${niboData?.length || 0} registros`);

    // Log de amostra dos dados para debug
    if (niboData && niboData.length > 0) {
      console.log('📋 Amostra dos dados NIBO (primeiros 3):');
      niboData.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. Categoria: ${item.categoria_nome}, Status: ${item.status}, Valor: ${item.valor}, Data: ${item.data_competencia}`);
      });
    } else {
      console.log('⚠️ Nenhum dado NIBO encontrado para os critérios especificados');
    }

    // Mapeamento expandido baseado nas categorias reais do orçamento
    const categoriasMap = new Map([
      // ✅ DESPESAS VARIÁVEIS
      ['IMPOSTO/TX MAQ/COMISSAO', 'IMPOSTO/TX MAQ/COMISSAO'],
      ['IMPOSTO', 'IMPOSTO/TX MAQ/COMISSAO'],
      ['IMPOSTOS', 'IMPOSTO/TX MAQ/COMISSAO'],
      ['COMISSÃO', 'IMPOSTO/TX MAQ/COMISSAO'],
      ['COMISSAO', 'IMPOSTO/TX MAQ/COMISSAO'],
      ['TX MAQ', 'IMPOSTO/TX MAQ/COMISSAO'],
      
      // ✅ CMV
      ['CMV', 'CMV'],
      ['CUSTO MERCADORIA', 'CMV'],
      ['CUSTO PRODUTO', 'CMV'],
      ['INSUMOS', 'CMV'],
      
      // ✅ PESSOAL
      ['CUSTO-EMPRESA FUNCIONÁRIOS', 'CUSTO-EMPRESA FUNCIONÁRIOS'],
      ['FUNCIONÁRIOS', 'CUSTO-EMPRESA FUNCIONÁRIOS'],
      ['SALÁRIOS', 'CUSTO-EMPRESA FUNCIONÁRIOS'],
      ['SALARIO', 'CUSTO-EMPRESA FUNCIONÁRIOS'],
      ['FOLHA PAGAMENTO', 'CUSTO-EMPRESA FUNCIONÁRIOS'],
      
      ['ADICIONAIS', 'ADICIONAIS'],
      ['ADICIONAL', 'ADICIONAIS'],
      ['HORA EXTRA', 'ADICIONAIS'],
      
      ['FREELA ATENDIMENTO', 'FREELA ATENDIMENTO'],
      ['FREELANCER ATENDIMENTO', 'FREELA ATENDIMENTO'],
      
      ['FREELA BAR', 'FREELA BAR'],
      ['FREELANCER BAR', 'FREELA BAR'],
      
      ['FREELA COZINHA', 'FREELA COZINHA'],
      ['FREELANCER COZINHA', 'FREELA COZINHA'],
      
      ['FREELA LIMPEZA', 'FREELA LIMPEZA'],
      ['FREELANCER LIMPEZA', 'FREELA LIMPEZA'],
      
      ['FREELA SEGURANÇA', 'FREELA SEGURANÇA'],
      ['FREELA SEGURANCA', 'FREELA SEGURANÇA'],
      ['FREELANCER SEGURANÇA', 'FREELA SEGURANÇA'],
      ['FREELANCER SEGURANCA', 'FREELA SEGURANÇA'],
      
      ['PRO LABORE', 'PRO LABORE'],
      ['PRO-LABORE', 'PRO LABORE'],
      ['PROLABORE', 'PRO LABORE'],
      
      // ✅ ADMINISTRATIVAS
      ['Escritório Central', 'Escritório Central'],
      ['ESCRITÓRIO CENTRAL', 'Escritório Central'],
      ['ESCRITORIO CENTRAL', 'Escritório Central'],
      
      ['Administrativo Ordinário', 'Administrativo Ordinário'],
      ['ADMINISTRATIVO ORDINÁRIO', 'Administrativo Ordinário'],
      ['ADMINISTRATIVO ORDINARIO', 'Administrativo Ordinário'],
      
      ['RECURSOS HUMANOS', 'RECURSOS HUMANOS'],
      ['RH', 'RECURSOS HUMANOS'],
      
      // ✅ MARKETING E EVENTOS
      ['Marketing', 'Marketing'],
      ['MARKETING', 'Marketing'],
      ['PUBLICIDADE', 'Marketing'],
      
      ['Atrações Programação', 'Atrações Programação'],
      ['ATRAÇÕES PROGRAMAÇÃO', 'Atrações Programação'],
      ['ATRACOES PROGRAMACAO', 'Atrações Programação'],
      ['ATRACAO', 'Atrações Programação'],
      ['SHOW', 'Atrações Programação'],
      
      ['Produção Eventos', 'Produção Eventos'],
      ['PRODUÇÃO EVENTOS', 'Produção Eventos'],
      ['PRODUCAO EVENTOS', 'Produção Eventos'],
      ['EVENTO', 'Produção Eventos'],
      
      // ✅ OPERACIONAIS
      ['Materiais Operação', 'Materiais Operação'],
      ['MATERIAIS OPERAÇÃO', 'Materiais Operação'],
      ['MATERIAIS OPERACAO', 'Materiais Operação'],
      ['MATERIAL OPERACAO', 'Materiais Operação'],
      
      ['Estorno', 'Estorno'],
      ['ESTORNO', 'Estorno'],
      
      ['Equipamentos Operação', 'Equipamentos Operação'],
      ['EQUIPAMENTOS OPERAÇÃO', 'Equipamentos Operação'],
      ['EQUIPAMENTOS OPERACAO', 'Equipamentos Operação'],
      ['EQUIPAMENTO', 'Equipamentos Operação'],
      
      ['Materiais de Limpeza e Descartáveis', 'Materiais de Limpeza e Descartáveis'],
      ['MATERIAIS LIMPEZA', 'Materiais de Limpeza e Descartáveis'],
      ['LIMPEZA', 'Materiais de Limpeza e Descartáveis'],
      ['DESCARTÁVEIS', 'Materiais de Limpeza e Descartáveis'],
      ['DESCARTAVEIS', 'Materiais de Limpeza e Descartáveis'],
      
      ['Utensílios', 'Utensílios'],
      ['UTENSÍLIOS', 'Utensílios'],
      ['UTENSILIOS', 'Utensílios'],
      ['UTENSILIO', 'Utensílios'],
      
      ['Outros Operação', 'Outros Operação'],
      ['OUTROS OPERAÇÃO', 'Outros Operação'],
      ['OUTROS OPERACAO', 'Outros Operação'],
      
      // ✅ OCUPAÇÃO
      ['ALUGUEL/CONDOMÍNIO/IPTU', 'ALUGUEL/CONDOMÍNIO/IPTU'],
      ['ALUGUEL', 'ALUGUEL/CONDOMÍNIO/IPTU'],
      ['CONDOMÍNIO', 'ALUGUEL/CONDOMÍNIO/IPTU'],
      ['CONDOMINIO', 'ALUGUEL/CONDOMÍNIO/IPTU'],
      ['IPTU', 'ALUGUEL/CONDOMÍNIO/IPTU'],
      
      ['ÁGUA', 'ÁGUA'],
      ['AGUA', 'ÁGUA'],
      
      ['GÁS', 'GÁS'],
      ['GAS', 'GÁS'],
      
      ['INTERNET', 'INTERNET'],
      ['NET', 'INTERNET'],
      ['WIFI', 'INTERNET'],
      
      ['Manutenção', 'Manutenção'],
      ['MANUTENÇÃO', 'Manutenção'],
      ['MANUTENCAO', 'Manutenção'],
      ['REPARO', 'Manutenção'],
      
      ['LUZ', 'LUZ'],
      ['ENERGIA', 'LUZ'],
      ['ENERGIA ELÉTRICA', 'LUZ'],
      ['ENERGIA ELETRICA', 'LUZ'],
      
      // ✅ RECEITAS
      ['RECEITA BRUTA', 'RECEITA BRUTA'],
      ['RECEITA', 'RECEITA BRUTA'],
      ['FATURAMENTO', 'RECEITA BRUTA'],
      ['VENDAS', 'RECEITA BRUTA'],
      
      // ✅ NÃO OPERACIONAIS
      ['CONTRATOS', 'CONTRATOS'],
      ['CONTRATO', 'CONTRATOS'],
    ]);
    
    // Função para encontrar categoria normalizada (melhorada)
    const encontrarCategoria = (nomeOriginal: string) => {
      if (!nomeOriginal) return nomeOriginal;
      
      // 1. Correspondência direta no mapa
      if (categoriasMap.has(nomeOriginal)) {
        return categoriasMap.get(nomeOriginal);
      }
      
      // 2. Busca case-insensitive
      const nomeUpper = nomeOriginal.toUpperCase().trim();
      for (const [busca, destino] of categoriasMap) {
        if (busca.toUpperCase() === nomeUpper) {
          return destino;
        }
      }
      
      // 3. Busca por correspondência parcial (contém)
      for (const [busca, destino] of categoriasMap) {
        const buscaUpper = busca.toUpperCase();
        if (nomeUpper.includes(buscaUpper) || buscaUpper.includes(nomeUpper)) {
          return destino;
        }
      }
      
      // 4. Casos especiais para CMV (agrupar custos de produtos)
      if (nomeOriginal.toLowerCase().includes('custo') && 
          (nomeOriginal.toLowerCase().includes('bebida') || 
           nomeOriginal.toLowerCase().includes('comida') || 
           nomeOriginal.toLowerCase().includes('drink') || 
           nomeOriginal.toLowerCase().includes('produto') ||
           nomeOriginal.toLowerCase().includes('mercadoria'))) {
        return 'CMV';
      }
      
      // 5. Casos especiais para freelancers
      if (nomeOriginal.toLowerCase().includes('freela') || 
          nomeOriginal.toLowerCase().includes('freelancer')) {
        if (nomeOriginal.toLowerCase().includes('bar')) return 'FREELA BAR';
        if (nomeOriginal.toLowerCase().includes('cozinha')) return 'FREELA COZINHA';
        if (nomeOriginal.toLowerCase().includes('atendimento')) return 'FREELA ATENDIMENTO';
        if (nomeOriginal.toLowerCase().includes('limpeza')) return 'FREELA LIMPEZA';
        if (nomeOriginal.toLowerCase().includes('segur')) return 'FREELA SEGURANÇA';
      }
      
      // 6. Casos especiais para utilidades
      if (nomeOriginal.toLowerCase().includes('energia') || 
          nomeOriginal.toLowerCase().includes('eletric')) return 'LUZ';
      if (nomeOriginal.toLowerCase().includes('agua') || 
          nomeOriginal.toLowerCase().includes('água')) return 'ÁGUA';
      if (nomeOriginal.toLowerCase().includes('gas') || 
          nomeOriginal.toLowerCase().includes('gás')) return 'GÁS';
      if (nomeOriginal.toLowerCase().includes('internet') || 
          nomeOriginal.toLowerCase().includes('wifi')) return 'INTERNET';
      if (nomeOriginal.toLowerCase().includes('manut') || 
          nomeOriginal.toLowerCase().includes('reparo')) return 'Manutenção';
      
      // 7. Retorna original se não encontrar correspondência
      return nomeOriginal;
    };
    
    // Agrupar por categoria, subcategoria e mês
    const orcamentoMap = new Map<string, any>();
    
    console.log(`🔍 Processando ${niboData?.length || 0} registros do Nibo...`);
    
    niboData?.forEach((item, index) => {
      const mes = new Date(item.data_competencia).getMonth() + 1;
      const categoriaNormalizada = encontrarCategoria(item.categoria_nome);
      
      // Log detalhado para debug
      if (index < 5) { // Log apenas os primeiros 5 para não poluir
        console.log(`🔍 Item ${index + 1}:`, {
          categoria_original: item.categoria_nome,
          categoria_normalizada: categoriaNormalizada,
          status: item.status,
          valor: item.valor,
          mes: mes,
          data: item.data_competencia
        });
      }
      
      // Tratamento especial para agrupamentos
      let categoriaFinal = categoriaNormalizada;
      let subcategoriaFinal = item.subcategoria;
      
      // Agrupar CMV
      if (categoriaNormalizada === 'CMV') {
        categoriaFinal = 'CMV';
        subcategoriaFinal = item.categoria_nome; // Manter subcategoria como categoria original
      }
      
      // ❌ REMOVIDO: Agrupamento CONTRATOS incorreto
      // Mantendo categorias individuais conforme DRE
      
      const key = `${categoriaFinal}-${subcategoriaFinal || ''}-${mes}`;
      
      if (index < 5) {
        console.log(`📊 Processando: ${item.categoria_nome} → ${categoriaFinal} (Mês: ${mes}, Key: ${key})`);
      }
      
      if (!orcamentoMap.has(key)) {
        orcamentoMap.set(key, {
          bar_id,
          ano,
          mes,
          categoria_nome: categoriaFinal,
          subcategoria: subcategoriaFinal,
          valor_planejado: 0,
          valor_realizado: 0,
          tipo: item.tipo === 'Payable' ? 'despesa' : 'receita'
        });
      }
      
      const orcamento = orcamentoMap.get(key);
      
      // Somar valores realizados (status: Paid)
      if (item.status === 'Paid') {
        orcamento.valor_realizado += Math.abs(parseFloat(item.valor) || 0);
        if (index < 5) {
          console.log(`💰 Valor realizado adicionado: ${Math.abs(parseFloat(item.valor) || 0)} (Total: ${orcamento.valor_realizado})`);
        }
      }
      
      // Para orçamento, usar o valor total como planejado
      orcamento.valor_planejado += Math.abs(parseFloat(item.valor) || 0);
    });
    
    console.log(`📈 Total de categorias agrupadas: ${orcamentoMap.size}`);
    
    // Log das categorias processadas para debug
    if (orcamentoMap.size > 0) {
      console.log('📋 Resumo das categorias processadas:');
      Array.from(orcamentoMap.entries()).slice(0, 10).forEach(([key, orcamento]) => {
        console.log(`  ${key}: Planejado: ${orcamento.valor_planejado}, Realizado: ${orcamento.valor_realizado}`);
      });
    }

    // Verificar registros existentes e atualizar/inserir
    let importados = 0;
    let atualizados = 0;
    
    for (const [key, orcamento] of orcamentoMap) {
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('orcamentacao')
        .select('id')
        .eq('bar_id', orcamento.bar_id)
        .eq('ano', orcamento.ano)
        .eq('mes', orcamento.mes)
        .eq('categoria_nome', orcamento.categoria_nome)
        .eq('subcategoria', orcamento.subcategoria || null)
        .single();

      if (existing) {
        // Atualizar valor realizado apenas
        await supabase
          .from('orcamentacao')
          .update({
            valor_realizado: orcamento.valor_realizado,
            atualizado_em: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        atualizados++;
      } else {
        // Inserir novo registro
        await supabase
          .from('orcamentacao')
          .insert({
            ...orcamento,
            criado_em: new Date().toISOString(),
            atualizado_em: new Date().toISOString()
          });
        
        importados++;
      }
    }

    console.log(`✅ Sync concluída: ${importados} importados, ${atualizados} atualizados`);
    
    return NextResponse.json({
      success: true,
      importados,
      atualizados,
      total: importados + atualizados,
      categorias_processadas: Array.from(orcamentoMap.keys())
    });

  } catch (error) {
    console.error('Erro na sincronização Nibo:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao sincronizar com Nibo' },
      { status: 500 }
    );
  }
}
