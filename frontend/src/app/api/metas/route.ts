import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Buscar todas as metas da base de dados
    const { data, error } = await supabase
      .from('metas')
      .select('*')
      .eq('meta_ativa', true)
      .order('ordem_exibicao');

    if (error) {
      console.error('Erro ao buscar metas:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      }, { status: 500 });
    }

    // Metas padrão de marketing caso não existam na base
    const metasMarketingPadrao = [
      {
        id: 1001,
        categoria: 'marketing',
        subcategoria: 'seguidores',
        nome_meta: 'Meta de Seguidores',
        tipo_valor: 'numero',
        valor_semanal: 2500,
        valor_mensal: 10000,
        valor_unico: null,
        valor_diario: null,
        unidade: 'seguidores',
        meta_ativa: true,
        descricao: 'Crescimento de seguidores nas redes sociais',
        ordem_exibicao: 1,
        cor_categoria: '#3b82f6',
        icone_categoria: 'Users'
      },
      {
        id: 1002,
        categoria: 'marketing',
        subcategoria: 'engajamento',
        nome_meta: 'Taxa de Engajamento',
        tipo_valor: 'percentual',
        valor_semanal: 6.0,
        valor_mensal: 6.0,
        valor_unico: null,
        valor_diario: null,
        unidade: '%',
        meta_ativa: true,
        descricao: 'Taxa de engajamento média nas publicações',
        ordem_exibicao: 2,
        cor_categoria: '#10b981',
        icone_categoria: 'Heart'
      },
      {
        id: 1003,
        categoria: 'marketing',
        subcategoria: 'alcance',
        nome_meta: 'Alcance Mensal',
        tipo_valor: 'numero',
        valor_semanal: 12500,
        valor_mensal: 50000,
        valor_unico: null,
        valor_diario: null,
        unidade: 'pessoas',
        meta_ativa: true,
        descricao: 'Alcance total das publicações por mês',
        ordem_exibicao: 3,
        cor_categoria: '#f59e0b',
        icone_categoria: 'Eye'
      },
      {
        id: 1004,
        categoria: 'marketing',
        subcategoria: 'posts',
        nome_meta: 'Posts Mensais',
        tipo_valor: 'numero',
        valor_semanal: 15,
        valor_mensal: 60,
        valor_unico: null,
        valor_diario: 2,
        unidade: 'posts',
        meta_ativa: true,
        descricao: 'Quantidade de posts publicados mensalmente',
        ordem_exibicao: 4,
        cor_categoria: '#8b5cf6',
        icone_categoria: 'MessageSquare'
      },
      {
        id: 1005,
        categoria: 'marketing',
        subcategoria: 'roi',
        nome_meta: 'ROI Marketing',
        tipo_valor: 'percentual',
        valor_semanal: 100.0,
        valor_mensal: 400.0,
        valor_unico: null,
        valor_diario: null,
        unidade: '%',
        meta_ativa: true,
        descricao: 'Retorno sobre investimento em marketing',
        ordem_exibicao: 5,
        cor_categoria: '#ef4444',
        icone_categoria: 'TrendingUp'
      },
      {
        id: 1006,
        categoria: 'marketing',
        subcategoria: 'campanhas',
        nome_meta: 'Campanhas Ativas',
        tipo_valor: 'numero',
        valor_semanal: 2,
        valor_mensal: 8,
        valor_unico: null,
        valor_diario: null,
        unidade: 'campanhas',
        meta_ativa: true,
        descricao: 'Número de campanhas publicitárias ativas',
        ordem_exibicao: 6,
        cor_categoria: '#06b6d4',
        icone_categoria: 'Target'
      }
    ];

    // Verificar se já existem metas de marketing na base
    const metasMarketingExistentes = data.filter(meta => meta.categoria === 'marketing');
    
    // Se não existirem metas de marketing, adicionar as padrão
    if (metasMarketingExistentes.length === 0) {
      console.log('📊 Adicionando metas de marketing padrão...');
      
      // Inserir metas padrão de marketing
      const { error: insertError } = await supabase
        .from('metas')
        .insert(metasMarketingPadrao);
      
      if (insertError) {
        console.error('Erro ao inserir metas de marketing:', insertError);
        // Mesmo com erro, continuar com as metas existentes
      } else {
        console.log('✅ Metas de marketing padrão inseridas com sucesso!');
        // Buscar novamente todas as metas após inserir as de marketing
        const { data: novasMetas, error: novoError } = await supabase
          .from('metas')
          .select('*')
          .eq('meta_ativa', true)
          .order('ordem_exibicao');
        
        if (!novoError) {
          return NextResponse.json({ 
            success: true, 
            data: novasMetas,
            message: 'Metas carregadas com sucesso (metas de marketing criadas)'
          });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: data || [],
      message: 'Metas carregadas com sucesso'
    });
    
  } catch (error) {
    console.error('Erro na API de metas:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...valores } = await request.json();
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID da meta é obrigatório' 
      }, { status: 400 });
    }

    // Atualizar meta
    const { error } = await supabase
      .from('metas')
      .update(valores)
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar meta:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao atualizar meta' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Meta atualizada com sucesso' 
    });
    
  } catch (error) {
    console.error('Erro na API de metas (PUT):', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 