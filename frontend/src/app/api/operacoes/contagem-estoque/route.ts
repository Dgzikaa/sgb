import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ContagemInput {
  categoria: string;
  descricao: string;
  estoque_fechado: number;
  estoque_flutuante: number;
  preco: number;
  produto_id?: string;
  data_contagem?: string;
  observacoes?: string;
  bar_id?: number;
  usuario_id?: number;
  usuario_nome?: string;
}

interface ContagemAnterior {
  estoque_total: number;
  estoque_fechado: number;
  estoque_flutuante: number;
  preco: number;
  data_contagem: string;
}

interface AlertaValidacao {
  tipo: 'erro_digitacao' | 'variacao_alta' | 'variacao_preco' | 'valor_zerado' | 'primeira_contagem';
  severidade: 'critico' | 'alto' | 'medio' | 'info';
  mensagem: string;
  sugestao?: string;
  dados?: any;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContagemInput = await request.json();
    
    // Validação básica
    if (!body.categoria || !body.descricao) {
      return NextResponse.json(
        { success: false, error: 'Categoria e descrição são obrigatórios' },
        { status: 400 }
      );
    }

    const bar_id = body.bar_id || 3;
    const data_contagem = body.data_contagem || new Date().toISOString().split('T')[0];

    // Buscar última contagem do mesmo produto
    const { data: ultimaContagem, error: erroUltima } = await supabase
      .from('contagem_estoque_produtos')
      .select('*')
      .eq('bar_id', bar_id)
      .eq('categoria', body.categoria)
      .eq('descricao', body.descricao)
      .order('data_contagem', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Executar validações
    const alertas: AlertaValidacao[] = [];
    let alerta_preenchimento = false;
    let alerta_variacao = false;
    let variacao_percentual: number | null = null;

    // VALIDAÇÃO 1: Detectar erro de digitação (número muito alto)
    const estoqueTotal = body.estoque_fechado + body.estoque_flutuante;
    
    // Se tem histórico, comparar com média histórica
    if (ultimaContagem) {
      const estoqueAnterior = parseFloat(ultimaContagem.estoque_total || '0');
      const precoAnterior = parseFloat(ultimaContagem.preco || '0');
      
      // Calcular variação percentual do estoque
      if (estoqueAnterior > 0) {
        variacao_percentual = ((estoqueTotal - estoqueAnterior) / estoqueAnterior) * 100;
        
        // ALERTA: Variação muito alta (mais de 500% ou multiplicação por 10)
        if (Math.abs(variacao_percentual ?? 0) > 500) {
          alerta_variacao = true;
          alertas.push({
            tipo: 'variacao_alta',
            severidade: 'critico',
            mensagem: `Variação de ${(variacao_percentual ?? 0).toFixed(1)}% em relação à última contagem (${estoqueAnterior})`,
            sugestao: `Verifique se não digitou ${estoqueTotal} em vez de ${estoqueTotal / 10} ou ${estoqueTotal / 100}`,
            dados: {
              estoque_anterior: estoqueAnterior,
              estoque_novo: estoqueTotal,
              variacao: variacao_percentual ?? 0
            }
          });
        }
        // ALERTA: Variação alta (mais de 200%)
        else if (Math.abs(variacao_percentual ?? 0) > 200) {
          alerta_variacao = true;
          alertas.push({
            tipo: 'variacao_alta',
            severidade: 'alto',
            mensagem: `Variação de ${(variacao_percentual ?? 0).toFixed(1)}% em relação à última contagem`,
            sugestao: 'Variação significativa detectada. Confirme se os valores estão corretos.',
            dados: {
              estoque_anterior: estoqueAnterior,
              estoque_novo: estoqueTotal,
              variacao: variacao_percentual ?? 0
            }
          });
        }
        // ALERTA: Variação moderada (mais de 100%)
        else if (Math.abs(variacao_percentual ?? 0) > 100) {
          alertas.push({
            tipo: 'variacao_alta',
            severidade: 'medio',
            mensagem: `Variação de ${(variacao_percentual ?? 0).toFixed(1)}% em relação à última contagem`,
            dados: {
              estoque_anterior: estoqueAnterior,
              estoque_novo: estoqueTotal
            }
          });
        }
      }

      // ALERTA: Variação de preço
      if (precoAnterior > 0 && body.preco > 0) {
        const variacaoPreco = ((body.preco - precoAnterior) / precoAnterior) * 100;
        
        if (Math.abs(variacaoPreco) > 100) {
          alertas.push({
            tipo: 'variacao_preco',
            severidade: 'alto',
            mensagem: `Preço variou ${variacaoPreco.toFixed(1)}% (de R$ ${precoAnterior.toFixed(2)} para R$ ${body.preco.toFixed(2)})`,
            sugestao: 'Confirme se o novo preço está correto',
            dados: {
              preco_anterior: precoAnterior,
              preco_novo: body.preco,
              variacao: variacaoPreco
            }
          });
        } else if (Math.abs(variacaoPreco) > 50) {
          alertas.push({
            tipo: 'variacao_preco',
            severidade: 'medio',
            mensagem: `Preço variou ${variacaoPreco.toFixed(1)}%`,
            dados: {
              preco_anterior: precoAnterior,
              preco_novo: body.preco
            }
          });
        }
      }

      // Detectar multiplicação suspeita (ex: digitou 15000 em vez de 15)
      if (estoqueTotal > estoqueAnterior * 100 && estoqueAnterior > 0) {
        alerta_preenchimento = true;
        alertas.push({
          tipo: 'erro_digitacao',
          severidade: 'critico',
          mensagem: 'Possível erro de digitação: valor 100x maior que o normal',
          sugestao: `Você quis dizer ${(estoqueTotal / 100).toFixed(2)} ou ${(estoqueTotal / 1000).toFixed(2)}?`,
          dados: {
            valor_digitado: estoqueTotal,
            sugestao_1: estoqueTotal / 100,
            sugestao_2: estoqueTotal / 1000,
            valor_normal: estoqueAnterior
          }
        });
      }
    } else {
      // Primeira contagem
      alertas.push({
        tipo: 'primeira_contagem',
        severidade: 'info',
        mensagem: 'Esta é a primeira contagem deste produto',
        dados: {
          estoque_total: estoqueTotal,
          preco: body.preco
        }
      });
    }

    // VALIDAÇÃO 2: Valores zerados
    if (estoqueTotal === 0 && body.preco === 0) {
      alertas.push({
        tipo: 'valor_zerado',
        severidade: 'medio',
        mensagem: 'Estoque e preço estão zerados',
        sugestao: 'Confirme se o produto realmente não tem estoque e preço'
      });
    }

    // VALIDAÇÃO 3: Números suspeitos (muitos zeros ou padrões)
    const estoqueStr = estoqueTotal.toString();
    if (estoqueStr.length > 4 && /0{3,}/.test(estoqueStr)) {
      alerta_preenchimento = true;
      alertas.push({
        tipo: 'erro_digitacao',
        severidade: 'alto',
        mensagem: 'Valor suspeito: muitos zeros consecutivos',
        sugestao: `Verifique se não digitou ${estoqueTotal} em vez de ${estoqueTotal / 1000}`,
        dados: {
          valor_digitado: estoqueTotal,
          sugestao: estoqueTotal / 1000
        }
      });
    }

    // Preparar dados para inserção
    const dadosContagem = {
      bar_id,
      produto_id: body.produto_id,
      categoria: body.categoria,
      descricao: body.descricao,
      estoque_fechado: body.estoque_fechado,
      estoque_flutuante: body.estoque_flutuante,
      preco: body.preco,
      data_contagem,
      variacao_percentual,
      alerta_variacao,
      alerta_preenchimento,
      observacoes: body.observacoes,
      usuario_id: body.usuario_id,
      usuario_nome: body.usuario_nome || 'Sistema',
    };

    // Verificar se já existe contagem para esta data
    const { data: contagemExistente } = await supabase
      .from('contagem_estoque_produtos')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('categoria', body.categoria)
      .eq('descricao', body.descricao)
      .eq('data_contagem', data_contagem)
      .single();

    let result;
    if (contagemExistente) {
      // Atualizar contagem existente
      const { data, error } = await supabase
        .from('contagem_estoque_produtos')
        .update(dadosContagem)
        .eq('id', contagemExistente.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Criar nova contagem
      const { data, error } = await supabase
        .from('contagem_estoque_produtos')
        .insert(dadosContagem)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      data: result,
      alertas,
      tem_alertas: alertas.length > 0,
      alertas_criticos: alertas.filter(a => a.severidade === 'critico').length,
      message: alertas.length > 0 
        ? 'Contagem salva com alertas de validação' 
        : 'Contagem salva com sucesso'
    });

  } catch (error: any) {
    console.error('❌ Erro ao registrar contagem:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao registrar contagem' },
      { status: 500 }
    );
  }
}

// GET - Buscar contagens
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bar_id = parseInt(searchParams.get('bar_id') || '3');
    const categoria = searchParams.get('categoria');
    const data_inicio = searchParams.get('data_inicio');
    const data_fim = searchParams.get('data_fim');
    const apenas_com_alertas = searchParams.get('alertas') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('contagem_estoque_produtos')
      .select('*')
      .eq('bar_id', bar_id)
      .order('data_contagem', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    if (data_inicio) {
      query = query.gte('data_contagem', data_inicio);
    }

    if (data_fim) {
      query = query.lte('data_contagem', data_fim);
    }

    if (apenas_com_alertas) {
      query = query.or('alerta_variacao.eq.true,alerta_preenchimento.eq.true');
    }

    const { data, error } = await query;

    if (error) throw error;

    // Buscar estatísticas
    const { data: stats } = await supabase
      .from('contagem_estoque_produtos')
      .select('categoria, estoque_total, valor_total, alerta_variacao, alerta_preenchimento')
      .eq('bar_id', bar_id);

    const estatisticas = {
      total_contagens: data?.length || 0,
      total_alertas: stats?.filter(s => s.alerta_variacao || s.alerta_preenchimento).length || 0,
      valor_total: stats?.reduce((sum, s) => sum + (parseFloat(s.valor_total || '0')), 0) || 0,
      categorias: [...new Set(stats?.map(s => s.categoria))].length || 0
    };

    return NextResponse.json({
      success: true,
      data,
      estatisticas
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar contagens:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar contagens' },
      { status: 500 }
    );
  }
}

