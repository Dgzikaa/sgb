import { NextRequest, NextResponse } from 'next/server'

// FunÃ¡Â§Ã¡Âµes disponÃ¡Â­veis no sistema
const FUNCOES_DISPONIVEL = [
  {
    id: 'funcionario',
    nome: 'FuncionÃ¡Â¡rio',
    descricao: 'Acesso bÃ¡Â¡sico Ã¡Â s funcionalidades operacionais',
    nivel: 1,
    cor: 'bg-blue-100 text-blue-800 border-blue-200',
    icone: 'Ã°Å¸â€˜Â¤'
  },
  {
    id: 'gerente',
    nome: 'Gerente',
    descricao: 'Acesso a relatÃ¡Â³rios e gestÃ¡Â£o de funcionÃ¡Â¡rios',
    nivel: 2,
    cor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icone: 'Ã°Å¸â€˜Â¨â‚¬ÂÃ°Å¸â€™Â¼'
  },
  {
    id: 'admin',
    nome: 'Administrador',
    descricao: 'Acesso completo a todas as funcionalidades',
    nivel: 3,
    cor: 'bg-red-100 text-red-800 border-red-200',
    icone: 'Ã°Å¸â€˜â€˜'
  }
]

export async function GET(request: NextRequest) {
  try {
    console.log('Ã°Å¸â€œÅ  GET /api/usuarios/funcoes - Buscando funÃ¡Â§Ã¡Âµes disponÃ¡Â­veis')
    
    // Aqui vocÃ¡Âª pode adicionar lÃ¡Â³gica para buscar funÃ¡Â§Ã¡Âµes especÃ¡Â­ficas por bar
    // ou implementar diferentes tipos de funÃ¡Â§Ã¡Âµes baseadas no plano do bar
    
    return NextResponse.json({
      success: true,
      funcoes: FUNCOES_DISPONIVEL,
      total: FUNCOES_DISPONIVEL.length
    })
    
  } catch (error) {
    console.error('ÂÅ’ Erro na API de funÃ¡Â§Ã¡Âµes:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 

