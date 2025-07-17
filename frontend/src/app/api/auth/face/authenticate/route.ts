import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// FunÃ¡Â§Ã¡Â£o para calcular distÃ¡Â¢ncia euclidiana entre dois descritores
function euclideanDistance(desc1: number[], desc2: number[]): number {
  if (desc1.length !== desc2.length) {
    throw new Error('Descritores devem ter o mesmo tamanho')
  }
  
  let sum = 0
  for (let i = 0; i < desc1.length; i++) {
    const diff = desc1[i] - desc2[i]
    sum += diff * diff
  }
  
  return Math.sqrt(sum)
}

// FunÃ¡Â§Ã¡Â£o para encontrar a melhor correspondÃ¡Âªncia
function findBestMatch(inputDescriptor: number[], storedDescriptors: any[]) {
  let bestMatch = null
  let bestDistance = Infinity
  
  for (const stored of storedDescriptors) {
    try {
      const distance = euclideanDistance(inputDescriptor, stored.descriptor)
      
      console.log(`Ã°Å¸â€œÂ DistÃ¡Â¢ncia para ${stored.user_nome}: ${distance.toFixed(4)} (threshold: ${stored.confidence_threshold})`)
      
      if (distance < stored.confidence_threshold && distance < bestDistance) {
        bestDistance = distance
        bestMatch = {
          ...stored,
          distance,
          similarity: (1 - distance) * 100 // Porcentagem de similaridade
        }
      }
    } catch (error) {
      console.error(`ÂÅ’ Erro ao calcular distÃ¡Â¢ncia para usuÃ¡Â¡rio ${stored.user_nome}:`, error)
    }
  }
  
  return bestMatch
}

export async function POST(request: NextRequest) {
  console.log('Ã°Å¸â€Â API de autenticaÃ¡Â§Ã¡Â£o facial iniciada')
  
  try {
    const { descriptor, barId } = await request.json()

    console.log('Ã°Å¸â€œÅ  Dados recebidos:', { 
      barId, 
      descriptorLength: descriptor?.length 
    })

    // Validar dados obrigatÃ³rios
    if (!descriptor || !barId) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatÃ³rios nÃ£o fornecidos' },
        { status: 400 }
      )
    }

    // Validar descriptor
    if (!Array.isArray(descriptor) || descriptor.length !== 128) {
      return NextResponse.json(
        { success: false, error: 'Descritor facial invÃ¡lido' },
        { status: 400 }
      )
    }

    console.log('Å“â€¦ ValidaÃ§Ãµes passaram')

    // Buscar todos os descritores faciais ativos para este bar
    const { data: faceDescriptors, error: faceError } = await supabase
      .from('face_descriptors')
      .select(`
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
      `)
      .eq('bar_id', barId)
      .eq('active', true)
      .eq('usuarios_bar.ativo', true)

    if (faceError) {
      console.error('ÂÅ’ Erro ao buscar descritores faciais:', faceError)
      return NextResponse.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    if (!faceDescriptors || faceDescriptors.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhuma face registrada encontrada para este bar' },
        { status: 404 }
      )
    }

    console.log(`Ã°Å¸â€Â Comparando com ${faceDescriptors.length} faces registradas`)

    // Preparar dados para comparaÃ§Ã£o
    const storedDescriptors = faceDescriptors.map((face: any) => ({
      user_id: face.user_id,
      user_nome: face.usuarios_bar.nome,
      user_email: face.usuarios_bar.email,
      user_role: face.usuarios_bar.role,
      user_modulos: face.usuarios_bar.modulos_permitidos,
      descriptor: face.descriptor,
      confidence_threshold: face.confidence_threshold,
      face_id: face.id
    }))

    // Encontrar a melhor correspondÃªncia
    const bestMatch = findBestMatch(descriptor, storedDescriptors)

    if (!bestMatch) {
      console.log('ÂÅ’ Nenhuma correspondÃªncia encontrada')
      return NextResponse.json(
        { success: false, error: 'Face nÃ£o reconhecida. Tente novamente ou use login tradicional.' },
        { status: 401 }
      )
    }

    console.log(`Å“â€¦ Face reconhecida: ${bestMatch.user_nome} (similaridade: ${bestMatch.similarity.toFixed(1)}%)`)

    // Buscar dados completos do usuÃ¡rio para retorno
    const { data: userData, error: userError } = await supabase
      .from('usuarios_bar')
      .select('*')
      .eq('user_id', bestMatch.user_id)
      .eq('bar_id', barId)
      .eq('ativo', true)

    if (userError || !userData || userData.length === 0) {
      console.error('ÂÅ’ Erro ao buscar dados do usuÃ¡rio:', userError)
      return NextResponse.json(
        { success: false, error: 'Erro ao recuperar dados do usuÃ¡rio' },
        { status: 500 }
      )
    }

    const user = userData[0]

    // Buscar dados dos bares disponÃveis para o usuÃ¡rio
    const { data: allUserBars, error: barsError } = await supabase
      .from('usuarios_bar')
      .select(`
        bar_id,
        role,
        modulos_permitidos,
        bars!inner(id, nome, ativo)
      `)
      .eq('user_id', bestMatch.user_id)
      .eq('ativo', true)
      .eq('bars.ativo', true)

    if (barsError) {
      console.error('ÂÅ’ Erro ao buscar bares do usuÃ¡rio:', barsError)
    }

    const availableBars = allUserBars?.map((bar: any) => ({
      bar_id: bar.bar_id,
      id: bar.bar_id,
      nome: bar.bars.nome,
      role: bar.role,
      modulos_permitidos: bar.modulos_permitidos
    })) || []

    // Buscar credenciais de APIs se necessÃ¡rio
    const { data: credentials, error: credError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', barId)
      .eq('ativo', true)

    if (credError) {
      console.error('Å¡Â Ã¯Â¸Â Aviso ao buscar credenciais:', credError)
    }

    const credenciais_apis = credentials ? [{
      bar_id: barId,
      credenciais: credentials
    }] : []

    // Log de auditoria
    console.log(`Ã°Å¸Å½â€° LOGIN FACIAL CONCLUÃ©DO: ${user.nome} (${user.email}) - Bar ${barId}`)

    // Montar resposta similar ao login tradicional
    const responseData = {
      success: true,
      message: `Login facial realizado com sucesso! Bem-vindo(a), ${user.nome}`,
      user: {
        ...user,
        availableBars,
        credenciais_apis
      },
      authentication: {
        method: 'facial_recognition',
        similarity: bestMatch.similarity,
        distance: bestMatch.distance,
        face_id: bestMatch.face_id
      }
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Ã°Å¸â€Â¥ Erro fatal na API de autenticaÃ§Ã£o facial:', error)
    
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 

