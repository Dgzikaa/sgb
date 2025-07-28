import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Interfaces TypeScript
interface FaceDescriptor {
  id: string;
  user_id: string;
  descriptor: number[];
  confidence_threshold: number;
  usuarios_bar: {
    id: string;
    nome: string;
    email: string;
    role: string;
    modulos_permitidos: string[] | Record<string, any>;
  };
}

interface BestMatch {
  id: string;
  user_id: string;
  descriptor: number[];
  confidence_threshold: number;
  user_nome: string;
  distance: number;
  similarity: number;
  usuarios_bar: {
    id: string;
    nome: string;
    email: string;
    role: string;
    modulos_permitidos: string[] | Record<string, any>;
  };
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Função para calcular distância euclidiana entre dois descritores
function euclideanDistance(desc1: number[], desc2: number[]): number {
  if (desc1.length !== desc2.length) {
    throw new Error('Descritores devem ter o mesmo tamanho');
  }

  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    const diff = desc1[i] - desc2[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

// Função para encontrar a melhor correspondência
function findBestMatch(
  inputDescriptor: number[],
  storedDescriptors: FaceDescriptor[]
): BestMatch | null {
  let bestMatch: BestMatch | null = null;
  let bestDistance = Infinity;

  for (const stored of storedDescriptors) {
    try {
      const distance = euclideanDistance(inputDescriptor, stored.descriptor);

      console.log(
        `📏 Distância para ${stored.usuarios_bar.nome}: ${distance.toFixed(4)} (threshold: ${stored.confidence_threshold})`
      );

      if (distance < stored.confidence_threshold && distance < bestDistance) {
        bestDistance = distance;
        bestMatch = {
          ...stored,
          user_nome: stored.usuarios_bar.nome,
          distance,
          similarity: (1 - distance) * 100, // Porcentagem de similaridade
        };
      }
    } catch (error) {
      console.error(
        `❌ Erro ao calcular distância para usuário ${stored.usuarios_bar.nome}:`,
        error
      );
    }
  }

  return bestMatch;
}

export async function POST(request: NextRequest) {
  console.log('🔍 API de autenticação facial iniciada');

  try {
    const { descriptor, barId } = await request.json();

    console.log('📊 Dados recebidos:', {
      barId,
      descriptorLength: descriptor?.length,
    });

    // Validar dados obrigatórios
    if (!descriptor || !barId) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    // Validar descriptor
    if (!Array.isArray(descriptor) || descriptor.length !== 128) {
      return NextResponse.json(
        { success: false, error: 'Descritor facial inválido' },
        { status: 400 }
      );
    }

    console.log('✅ Validações passaram');

    // Buscar todos os descritores faciais ativos para este bar
    const { data: faceDescriptors, error: faceError } = await supabase
      .from('face_descriptors')
      .select(
        `
        id,
        user_id,
        descriptor,
        confidence_threshold,
        usuarios_bar!inner(
          id,
          nome,
          email,
          role,
          modulos_permitidos
        )
      `
      )
      .eq('usuarios_bar.bar_id', barId)
      .eq('usuarios_bar.ativo', true);

    if (faceError) {
      console.error('❌ Erro ao buscar descritores faciais:', faceError);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar dados de autenticação' },
        { status: 500 }
      );
    }

    if (!faceDescriptors || faceDescriptors.length === 0) {
      console.log('❌ Nenhum descritor facial encontrado para este bar');
      return NextResponse.json(
        {
          success: false,
          error: 'Nenhum usuário cadastrado com reconhecimento facial',
        },
        { status: 404 }
      );
    }

    console.log(`📊 ${faceDescriptors.length} descritores faciais encontrados`);

    // Encontrar a melhor correspondência
    const bestMatch = findBestMatch(
      descriptor,
      faceDescriptors as unknown as FaceDescriptor[]
    );

    if (!bestMatch) {
      console.log('❌ Nenhuma correspondência encontrada');
      return NextResponse.json(
        {
          success: false,
          error:
            'Face não reconhecida. Tente novamente ou use login tradicional.',
        },
        { status: 401 }
      );
    }

    console.log(
      `✅ Face reconhecida: ${bestMatch.user_nome} (similaridade: ${bestMatch.similarity.toFixed(1)}%)`
    );

    // Buscar dados completos do usuário para retorno
    const { data: userData, error: userError } = await supabase
      .from('usuarios_bar')
      .select('*')
      .eq('user_id', bestMatch.user_id)
      .eq('bar_id', barId)
      .eq('ativo', true);

    if (userError || !userData || userData.length === 0) {
      console.error('❌ Erro ao buscar dados do usuário:', userError);
      return NextResponse.json(
        { success: false, error: 'Erro ao recuperar dados do usuário' },
        { status: 500 }
      );
    }

    const user = userData[0];

    // Buscar dados dos bares disponíveis para o usuário
    const { data: allUserBars, error: barsError } = await supabase
      .from('usuarios_bar')
      .select(
        `
        bar_id,
        role,
        modulos_permitidos,
        bars!inner(id, nome, ativo)
      `
      )
      .eq('user_id', bestMatch.user_id)
      .eq('ativo', true)
      .eq('bars.ativo', true);

    if (barsError) {
      console.error('❌ Erro ao buscar bares do usuário:', barsError);
    }

    const availableBars =
      allUserBars?.map(bar => ({
        bar_id: bar.bar_id,
        id: bar.bar_id,
        nome: bar.bars[0]?.nome || 'Bar',
        role: bar.role,
        modulos_permitidos: bar.modulos_permitidos,
      })) || [];

    // Buscar credenciais de APIs se necessário
    const { data: credentials, error: credError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', barId)
      .eq('ativo', true);

    if (credError) {
      console.error('⚠️ Aviso ao buscar credenciais:', credError);
    }

    const credenciais_apis = credentials
      ? [
          {
            bar_id: barId,
            credenciais: credentials,
          },
        ]
      : [];

    // Log de auditoria
    console.log(
      `🎉 LOGIN FACIAL CONCLUÍDO: ${user.nome} (${user.email}) - Bar ${barId}`
    );

    // Montar resposta similar ao login tradicional
    const responseData = {
      success: true,
      message: `Login facial realizado com sucesso! Bem-vindo(a), ${user.nome}`,
      user: {
        ...user,
        availableBars,
        credenciais_apis,
      },
      authentication: {
        method: 'facial_recognition',
        similarity: bestMatch.similarity,
        distance: bestMatch.distance,
        face_id: bestMatch.id,
      },
    };

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    console.error('🔥 Erro fatal na API de autenticação facial:', error);

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
