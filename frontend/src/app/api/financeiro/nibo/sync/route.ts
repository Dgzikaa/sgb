import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const NIBO_BASE_URL = 'https://api.nibo.com.br/empresas/v1';

// Buscar credenciais do NIBO para um bar
async function getNiboCredentials(barId: number) {
  const { data: credencial, error } = await supabase
    .from('api_credentials')
    .select('api_token, empresa_id')
    .eq('sistema', 'nibo')
    .eq('bar_id', barId)
    .eq('ativo', true)
    .single();

  if (error || !credencial?.api_token) {
    return null;
  }

  return credencial;
}

// POST - Sincronizar dados do NIBO para um bar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bar_id, sync_type } = body; // sync_type: 'all' | 'categories' | 'costcenters' | 'stakeholders'

    if (!bar_id) {
      return NextResponse.json({
        success: false,
        error: 'bar_id é obrigatório'
      }, { status: 400 });
    }

    console.log(`[NIBO-SYNC] Iniciando sincronização para bar_id=${bar_id}, tipo=${sync_type || 'all'}`);

    const credencial = await getNiboCredentials(bar_id);
    
    if (!credencial) {
      return NextResponse.json({
        success: false,
        error: 'Credenciais NIBO não encontradas para este bar'
      }, { status: 400 });
    }

    const resultados: any = {
      categorias: null,
      centrosCusto: null,
      stakeholders: null
    };

    const syncType = sync_type || 'all';

    // Sincronizar Categorias
    if (syncType === 'all' || syncType === 'categories') {
      try {
        const categoriasResponse = await fetch(
          `${NIBO_BASE_URL}/categories?apitoken=${credencial.api_token}`,
          {
            headers: {
              'accept': 'application/json',
              'apitoken': credencial.api_token
            }
          }
        );

        if (categoriasResponse.ok) {
          const categoriasData = await categoriasResponse.json();
          const categorias = categoriasData.items || categoriasData || [];
          
          let inseridos = 0;
          let atualizados = 0;

          for (const cat of categorias) {
            // Verificar se já existe
            const { data: existente } = await supabase
              .from('nibo_categorias')
              .select('id')
              .eq('nibo_id', cat.id)
              .eq('bar_id', bar_id)
              .single();

            if (existente) {
              // Atualizar
              await supabase
                .from('nibo_categorias')
                .update({
                  categoria_nome: cat.name || cat.description,
                  categoria_macro: cat.group?.name || cat.parentName || 'Outros',
                  ativo: cat.isActive !== false,
                  atualizado_em: new Date().toISOString()
                })
                .eq('id', existente.id);
              atualizados++;
            } else {
              // Inserir
              await supabase
                .from('nibo_categorias')
                .insert({
                  nibo_id: cat.id,
                  bar_id: bar_id,
                  categoria_nome: cat.name || cat.description,
                  categoria_macro: cat.group?.name || cat.parentName || 'Outros',
                  ativo: cat.isActive !== false,
                  criado_em: new Date().toISOString(),
                  atualizado_em: new Date().toISOString()
                });
              inseridos++;
            }
          }

          resultados.categorias = {
            total: categorias.length,
            inseridos,
            atualizados
          };
          console.log(`[NIBO-SYNC] Categorias: ${categorias.length} total, ${inseridos} novos, ${atualizados} atualizados`);
        }
      } catch (err) {
        console.error('[NIBO-SYNC] Erro ao sincronizar categorias:', err);
        resultados.categorias = { error: 'Erro ao sincronizar categorias' };
      }
    }

    // Sincronizar Centros de Custo
    if (syncType === 'all' || syncType === 'costcenters') {
      try {
        const centrosResponse = await fetch(
          `${NIBO_BASE_URL}/costcenters?apitoken=${credencial.api_token}`,
          {
            headers: {
              'accept': 'application/json',
              'apitoken': credencial.api_token
            }
          }
        );

        if (centrosResponse.ok) {
          const centrosData = await centrosResponse.json();
          const centros = centrosData.items || centrosData || [];
          
          let inseridos = 0;
          let atualizados = 0;

          for (const centro of centros) {
            // Verificar se já existe
            const { data: existente } = await supabase
              .from('nibo_centros_custo')
              .select('id')
              .eq('nibo_id', centro.id)
              .eq('bar_id', bar_id)
              .single();

            if (existente) {
              // Atualizar
              await supabase
                .from('nibo_centros_custo')
                .update({
                  nome: centro.name || centro.description,
                  codigo: centro.code || null,
                  ativo: centro.isActive !== false,
                  atualizado_em: new Date().toISOString()
                })
                .eq('id', existente.id);
              atualizados++;
            } else {
              // Inserir
              await supabase
                .from('nibo_centros_custo')
                .insert({
                  nibo_id: centro.id,
                  bar_id: bar_id,
                  nome: centro.name || centro.description,
                  codigo: centro.code || null,
                  ativo: centro.isActive !== false,
                  criado_em: new Date().toISOString(),
                  atualizado_em: new Date().toISOString()
                });
              inseridos++;
            }
          }

          resultados.centrosCusto = {
            total: centros.length,
            inseridos,
            atualizados
          };
          console.log(`[NIBO-SYNC] Centros de Custo: ${centros.length} total, ${inseridos} novos, ${atualizados} atualizados`);
        }
      } catch (err) {
        console.error('[NIBO-SYNC] Erro ao sincronizar centros de custo:', err);
        resultados.centrosCusto = { error: 'Erro ao sincronizar centros de custo' };
      }
    }

    // Sincronizar Stakeholders (fornecedores)
    if (syncType === 'all' || syncType === 'stakeholders') {
      try {
        const stakeholdersResponse = await fetch(
          `${NIBO_BASE_URL}/stakeholders?$filter=isSupplier eq true&apitoken=${credencial.api_token}`,
          {
            headers: {
              'accept': 'application/json',
              'apitoken': credencial.api_token
            }
          }
        );

        if (stakeholdersResponse.ok) {
          const stakeholdersData = await stakeholdersResponse.json();
          const stakeholders = stakeholdersData.items || stakeholdersData || [];
          
          // Apenas contamos, não salvamos stakeholders localmente por enquanto
          // pois eles podem ser compartilhados entre bares no NIBO
          resultados.stakeholders = {
            total: stakeholders.length,
            nota: 'Stakeholders são buscados diretamente da API quando necessário'
          };
          console.log(`[NIBO-SYNC] Stakeholders: ${stakeholders.length} encontrados`);
        }
      } catch (err) {
        console.error('[NIBO-SYNC] Erro ao sincronizar stakeholders:', err);
        resultados.stakeholders = { error: 'Erro ao sincronizar stakeholders' };
      }
    }

    return NextResponse.json({
      success: true,
      bar_id,
      resultados,
      sincronizado_em: new Date().toISOString()
    });

  } catch (error) {
    console.error('[NIBO-SYNC] Erro:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno ao sincronizar dados do NIBO'
    }, { status: 500 });
  }
}

// GET - Verificar status da sincronização de um bar
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('bar_id');

    if (!barId) {
      return NextResponse.json({
        success: false,
        error: 'bar_id é obrigatório'
      }, { status: 400 });
    }

    // Contar categorias
    const { count: categoriasCount } = await supabase
      .from('nibo_categorias')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', parseInt(barId));

    // Contar centros de custo
    const { count: centrosCount } = await supabase
      .from('nibo_centros_custo')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', parseInt(barId));

    // Verificar credenciais
    const credencial = await getNiboCredentials(parseInt(barId));

    return NextResponse.json({
      success: true,
      bar_id: parseInt(barId),
      tem_credencial_nibo: !!credencial,
      dados_locais: {
        categorias: categoriasCount || 0,
        centros_custo: centrosCount || 0
      },
      precisa_sincronizar: (categoriasCount || 0) === 0 || (centrosCount || 0) === 0
    });

  } catch (error) {
    console.error('[NIBO-SYNC] Erro:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar status de sincronização'
    }, { status: 500 });
  }
}
