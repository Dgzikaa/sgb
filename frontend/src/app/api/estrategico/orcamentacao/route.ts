import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('bar_id');
    const ano = searchParams.get('ano');
    const mes = searchParams.get('mes');

    if (!barId || !ano) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. Buscar dados planejados da tabela orcamentacao
    let queryPlanejado = supabase
      .from('orcamentacao')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('ano', parseInt(ano));

    if (mes && mes !== 'todos') {
      queryPlanejado = queryPlanejado.eq('mes', parseInt(mes));
    }

    const { data: dadosPlanejados, error: errorPlanejado } = await queryPlanejado;

    if (errorPlanejado) {
      console.error('Erro ao buscar dados planejados:', errorPlanejado);
    }

    // 2. Buscar dados realizados do NIBO
    let queryNibo = supabase
      .from('nibo_agendamentos')
      .select('categoria_nome, status, valor, data_competencia')
      .eq('bar_id', parseInt(barId))
      .gte('data_competencia', `${ano}-01-01`)
      .lte('data_competencia', `${ano}-12-31`)
      .eq('status', 'Paid'); // Apenas pagos

    if (mes && mes !== 'todos') {
      const mesFormatado = mes.padStart(2, '0');
      queryNibo = queryNibo
        .gte('data_competencia', `${ano}-${mesFormatado}-01`)
        .lte('data_competencia', `${ano}-${mesFormatado}-31`);
    }

    const { data: dadosNibo, error: errorNibo } = await queryNibo;

    if (errorNibo) {
      console.error('Erro ao buscar dados NIBO:', errorNibo);
    }

    // 3. Mapear categorias NIBO para categorias do orçamento
    const categoriasMap = new Map([
      // Despesas Variáveis
      ['IMPOSTO/TX MAQ/COMISSAO', 'IMPOSTO/TX MAQ/COMISSAO'],
      ['TAXA MAQUININHA', 'IMPOSTO/TX MAQ/COMISSAO'],
      ['COMISSÃO', 'IMPOSTO/TX MAQ/COMISSAO'],
      ['COMISSAO', 'IMPOSTO/TX MAQ/COMISSAO'],
      
      // CMV
      ['Custo Comida', 'CMV'],
      ['Custo Drinks', 'CMV'],
      ['Custo Bebidas', 'CMV'],
      ['CUSTO COMIDA', 'CMV'],
      ['CUSTO DRINKS', 'CMV'],
      ['CUSTO BEBIDAS', 'CMV'],
      
      // Pessoal
      ['CUSTO-EMPRESA FUNCIONÁRIOS', 'CUSTO-EMPRESA FUNCIONARIOS'],
      ['CUSTO-EMPRESA FUNCIONARIOS', 'CUSTO-EMPRESA FUNCIONARIOS'],
      ['SALARIO FUNCIONARIOS', 'CUSTO-EMPRESA FUNCIONARIOS'],
      ['PROVISÃO TRABALHISTA', 'PROVISÃO TRABALHISTA'],
      ['FREELA SEGURANÇA', 'FREELA SEGURANÇA'],
      ['FREELA ATENDIMENTO', 'FREELA ATENDIMENTO'],
      ['FREELA COZINHA', 'FREELA COZINHA'],
      ['ADICIONAIS', 'ADICIONAIS'],
      
      // Administrativas
      ['RECURSOS HUMANOS', 'RECURSOS HUMANOS'],
      ['Administrativo Ordinário', 'Administrativo Ordinário'],
      
      // Ocupação
      ['ALUGUEL/CONDOMÍNIO/IPTU', 'ALUGUEL/CONDOMÍNIO/IPTU'],
      ['LUZ', 'LUZ'],
      ['ÁGUA', 'ÁGUA'],
      ['AGUA', 'ÁGUA'],
      ['GÁS', 'GÁS'],
      ['GAS', 'GÁS'],
      ['INTERNET', 'INTERNET'],
      
      // Operacionais
      ['Manutenção', 'Manutenção'],
      ['MANUTENÇÃO', 'Manutenção'],
      ['Materiais de Limpeza e Descartáveis', 'Materiais de Limpeza e Descartáveis'],
      ['Materiais Operação', 'Materiais Operação'],
      ['Equipamentos Operação', 'Equipamentos Operação'],
      ['Utensílios', 'Utensílios'],
      
      // Marketing e Eventos
      ['Marketing', 'Marketing'],
      ['Produção Eventos', 'Produção Eventos'],
      ['Atrações Programação', 'Atrações Programação'],
      
      // Receitas
      ['RECEITA BRUTA', 'RECEITA BRUTA'],
      ['RECEITA', 'RECEITA BRUTA'],
      ['FATURAMENTO', 'RECEITA BRUTA'],
      ['VENDAS', 'RECEITA BRUTA'],
      
      // Não Operacionais
      ['CONTRATOS', 'CONTRATOS'],
      ['CONTRATO', 'CONTRATOS'],
      ['PRO LABORE', 'PRO LABORE'],
      ['Despesas Financeiras', 'Despesas Financeiras'],
      ['Outros Sócios', 'Outros Sócios'],
      ['Aporte de capital', 'Aporte de capital'],
      ['Empréstimos de Sócios', 'Empréstimos de Sócios'],
      ['Outros Investimentos', 'Outros Investimentos'],
      ['Escritório Central', 'Escritório Central'],
      ['VALE TRANSPORTE', 'VALE TRANSPORTE']
    ]);

    // 4. Calcular valores realizados por categoria
    const valoresRealizados = new Map<string, number>();
    
    dadosNibo?.forEach(item => {
      if (!item.categoria_nome) return;
      
      const categoriaNormalizada = categoriasMap.get(item.categoria_nome) || item.categoria_nome;
      const valor = Math.abs(parseFloat(item.valor) || 0);
      
      if (!valoresRealizados.has(categoriaNormalizada)) {
        valoresRealizados.set(categoriaNormalizada, 0);
      }
      
      valoresRealizados.set(categoriaNormalizada, 
        valoresRealizados.get(categoriaNormalizada)! + valor
      );
    });

    // 5. Estrutura base das categorias (caso não existam dados planejados)
    const estruturaBase = [
      // Despesas Variáveis
      { categoria: 'IMPOSTO/TX MAQ/COMISSAO', tipo: 'despesa' },
      
      // CMV
      { categoria: 'CMV', tipo: 'despesa' },
      
      // Pessoal
      { categoria: 'CUSTO-EMPRESA FUNCIONARIOS', tipo: 'despesa' },
      { categoria: 'PROVISÃO TRABALHISTA', tipo: 'despesa' },
      { categoria: 'FREELA SEGURANÇA', tipo: 'despesa' },
      { categoria: 'FREELA ATENDIMENTO', tipo: 'despesa' },
      { categoria: 'FREELA COZINHA', tipo: 'despesa' },
      { categoria: 'ADICIONAIS', tipo: 'despesa' },
      
      // Administrativas
      { categoria: 'RECURSOS HUMANOS', tipo: 'despesa' },
      { categoria: 'Administrativo Ordinário', tipo: 'despesa' },
      
      // Ocupação
      { categoria: 'ALUGUEL/CONDOMÍNIO/IPTU', tipo: 'despesa' },
      { categoria: 'LUZ', tipo: 'despesa' },
      { categoria: 'ÁGUA', tipo: 'despesa' },
      { categoria: 'GÁS', tipo: 'despesa' },
      { categoria: 'INTERNET', tipo: 'despesa' },
      
      // Operacionais
      { categoria: 'Manutenção', tipo: 'despesa' },
      { categoria: 'Materiais de Limpeza e Descartáveis', tipo: 'despesa' },
      { categoria: 'Materiais Operação', tipo: 'despesa' },
      { categoria: 'Equipamentos Operação', tipo: 'despesa' },
      { categoria: 'Utensílios', tipo: 'despesa' },
      
      // Marketing e Eventos
      { categoria: 'Marketing', tipo: 'despesa' },
      { categoria: 'Produção Eventos', tipo: 'despesa' },
      { categoria: 'Atrações Programação', tipo: 'despesa' },
      
      // Receitas
      { categoria: 'RECEITA BRUTA', tipo: 'receita' },
      
      // Não Operacionais
      { categoria: 'CONTRATOS', tipo: 'despesa' },
      { categoria: 'PRO LABORE', tipo: 'despesa' },
      { categoria: 'Despesas Financeiras', tipo: 'despesa' },
      { categoria: 'Outros Sócios', tipo: 'despesa' },
      { categoria: 'Aporte de capital', tipo: 'receita' },
      { categoria: 'Empréstimos de Sócios', tipo: 'receita' },
      { categoria: 'Outros Investimentos', tipo: 'despesa' },
      { categoria: 'Escritório Central', tipo: 'despesa' },
      { categoria: 'VALE TRANSPORTE', tipo: 'despesa' }
    ];

    // 6. Combinar dados planejados + realizados
    const dadosFinais = [];
    const categoriasProcessadas = new Set();

    // Processar dados planejados existentes
    dadosPlanejados?.forEach(item => {
      const valorRealizado = valoresRealizados.get(item.categoria_nome) || 0;
      
      dadosFinais.push({
        id: item.id,
        bar_id: item.bar_id,
        ano: item.ano,
        mes: item.mes,
        categoria: item.categoria_nome,
        subcategoria: item.subcategoria,
        valor_planejado: Number(item.valor_planejado) || 0,
        valor_realizado: valorRealizado,
        percentual_realizado: item.valor_planejado > 0 ? (valorRealizado / item.valor_planejado) * 100 : 0,
        observacoes: item.observacoes,
        criado_em: item.criado_em,
        atualizado_em: item.atualizado_em
      });
      
      categoriasProcessadas.add(item.categoria_nome);
    });

    // Processar categorias que só têm dados realizados (sem planejamento)
    estruturaBase.forEach(base => {
      if (!categoriasProcessadas.has(base.categoria)) {
        const valorRealizado = valoresRealizados.get(base.categoria) || 0;
        
        if (valorRealizado > 0) { // Só incluir se tiver valor realizado
          dadosFinais.push({
            id: null,
            bar_id: parseInt(barId),
            ano: parseInt(ano),
            mes: mes ? parseInt(mes) : null,
            categoria: base.categoria,
            subcategoria: null,
            valor_planejado: 0,
            valor_realizado: valorRealizado,
            percentual_realizado: 0,
            observacoes: null,
            criado_em: null,
            atualizado_em: null
          });
        }
      }
    });

    console.log(`📊 Dados finais: ${dadosFinais.length} categorias processadas`);
    console.log(`💰 Valores realizados encontrados: ${valoresRealizados.size} categorias`);

    return NextResponse.json({
      success: true,
      data: dadosFinais
    });

  } catch (error) {
    console.error('Erro na API de orçamento:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bar_id, ano, mes, categoria_nome, subcategoria, valor_planejado, observacoes } = body;

    if (!bar_id || !ano || !categoria_nome) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Inserir ou atualizar planejamento
    const { data, error } = await supabase
      .from('orcamentacao')
      .upsert({
        bar_id,
        ano,
        mes,
        categoria_nome,
        subcategoria,
        valor_planejado: Number(valor_planejado) || 0,
        observacoes,
        tipo: valor_planejado >= 0 ? 'receita' : 'despesa'
      })
      .select();

    if (error) {
      console.error('Erro ao salvar orçamento:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar dados do orçamento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data[0]
    });

  } catch (error) {
    console.error('Erro na API de orçamento (POST):', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, valor_planejado, observacoes } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório para atualização' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('orcamentacao')
      .update({
        valor_planejado: Number(valor_planejado),
        observacoes
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Erro ao atualizar orçamento:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar dados do orçamento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data[0]
    });

  } catch (error) {
    console.error('Erro na API de orçamento (PUT):', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}