import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

    // Buscar dados do Nibo para o ano especificado
    // USANDO DATA_COMPETENCIA e CATEGORIA_NOME conforme estrutura correta
    const { data: niboData, error: niboError } = await supabase
      .from('nibo_agendamentos')
      .select('*')
      .eq('bar_id', bar_id)
      .gte('data_competencia', `${ano}-01-01`)
      .lte('data_competencia', `${ano}-12-31`)
      .not('categoria_nome', 'is', null);

    if (niboError) {
      console.error('Erro ao buscar dados Nibo:', niboError);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar dados do Nibo' },
        { status: 500 }
      );
    }

    // Mapeamento baseado nos dados REAIS encontrados no banco
    // Mapeando categorias "problema" para as que existem no banco
    const categoriasMap = new Map([
      // ✅ FUNCIONÁRIOS -> Existem como SALARIO FUNCIONARIOS 
      ['CUSTO-EMPRESA FUNCIONÁRIOS', 'SALARIO FUNCIONARIOS'],
      ['FUNCIONÁRIOS', 'SALARIO FUNCIONARIOS'],
      ['SALÁRIOS', 'SALARIO FUNCIONARIOS'],
      
      // ✅ IMPOSTOS -> Existe como IMPOSTO
      ['IMPOSTO/TX MAQ/COMISSÃO', 'IMPOSTO'],
      ['IMPOSTOS', 'IMPOSTO'],
      ['COMISSÃO', 'COMISSÃO 10%'], // Existe no banco
      
      // ✅ CMV -> Agrupamento das categorias de custo existentes
      ['CMV', 'CUSTO_AGRUPADO'], // Será tratado especialmente
      
      // ✅ PRO LABORE -> Existe exatamente assim
      ['PRO-LABORE', 'PRO LABORE'],
      ['PROLABORE', 'PRO LABORE'],
      
      // ✅ ESCRITÓRIO CENTRAL -> Existe como Administrativo Ordinário
      ['ESCRITÓRIO CENTRAL', 'Administrativo Ordinário'],
      ['ESCRITORIO CENTRAL', 'Administrativo Ordinário'],
      
      // ✅ ALUGUEL -> Existe exatamente assim
      ['ALUGUEL', 'ALUGUEL/CONDOMÍNIO/IPTU'],
      ['CONDOMÍNIO', 'ALUGUEL/CONDOMÍNIO/IPTU'],
      ['IPTU', 'ALUGUEL/CONDOMÍNIO/IPTU'],
      
      // ✅ Utilidades - MANTER SEPARADAS (não agrupar)
      // Estas são categorias INDIVIDUAIS conforme DRE
      ['INTERNET', 'INTERNET'], // Categoria separada
      ['LUZ', 'LUZ'], // Categoria separada
      ['ÁGUA', 'ÁGUA'], // Categoria separada
      ['GÁS', 'GÁS'], // Categoria separada
      ['MANUTENÇÃO', 'MANUTENÇÃO'], // Categoria separada
      
      // ❌ CONTRATOS não é uma categoria real - remover agrupamento
    ]);
    
    // Função para encontrar categoria normalizada
    const encontrarCategoria = (nomeOriginal: string) => {
      if (!nomeOriginal) return nomeOriginal;
      
      // Correspondência direta no mapa
      if (categoriasMap.has(nomeOriginal)) {
        return categoriasMap.get(nomeOriginal);
      }
      
      // Busca por correspondência parcial
      const nomeUpper = nomeOriginal.toUpperCase();
      
      for (const [busca, destino] of categoriasMap) {
        if (nomeUpper.includes(busca.toUpperCase()) || busca.toUpperCase().includes(nomeUpper)) {
          return destino;
        }
      }
      
      // Casos especiais para CMV (agrupar custos)
      if (nomeOriginal.includes('Custo ') && 
          (nomeOriginal.includes('Bebidas') || nomeOriginal.includes('Comida') || 
           nomeOriginal.includes('Drinks') || nomeOriginal.includes('Outros'))) {
        return 'CMV'; // Agrupa todos os custos como CMV
      }
      
      // ❌ REMOVIDO: Agrupamento incorreto de utilitários
      // INTERNET, LUZ, ÁGUA, GÁS, MANUTENÇÃO são categorias SEPARADAS
      
      return nomeOriginal; // Retorna original se não encontrar
    };
    
    // Agrupar por categoria, subcategoria e mês
    const orcamentoMap = new Map<string, any>();
    
    console.log(`🔍 Processando ${niboData?.length || 0} registros do Nibo...`);
    
    niboData?.forEach(item => {
      const mes = new Date(item.data_competencia).getMonth() + 1;
      const categoriaNormalizada = encontrarCategoria(item.categoria_nome);
      
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
      
      console.log(`📊 Processando: ${item.categoria_nome} → ${categoriaFinal} (Mês: ${mes})`);
      
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
      }
      
      // Para orçamento, usar o valor total como planejado
      orcamento.valor_planejado += Math.abs(parseFloat(item.valor) || 0);
    });
    
    console.log(`📈 Total de categorias agrupadas: ${orcamentoMap.size}`);

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
