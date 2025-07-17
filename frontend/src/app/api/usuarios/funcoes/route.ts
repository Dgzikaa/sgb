import { NextRequest, NextResponse } from 'next/server'

// FunÃ§Ãµes disponÃ­veis no sistema
const FUNCOES_DISPONIVEL = [
  {
    id: 'funcionario',
    nome: 'FuncionÃ¡rio',
    descricao: 'Acesso bÃ¡sico Ã s funcionalidades operacionais',
    nivel: 1,
    cor: 'bg-blue-100 text-blue-800 border-blue-200',
    icone: 'ðŸ‘¤'
  },
  {
    id: 'gerente',
    nome: 'Gerente',
    descricao: 'Acesso a relatÃ³rios e gestÃ£o de funcionÃ¡rios',
    nivel: 2,
    cor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icone: 'ðŸ‘¨â€ðŸ’¼'
  },
  {
    id: 'admin',
    nome: 'Administrador',
    descricao: 'Acesso completo a todas as funcionalidades',
    nivel: 3,
    cor: 'bg-red-100 text-red-800 border-red-200',
    icone: 'ðŸ‘‘'
  }
]

export async function GET(request: NextRequest) {
  try {
    console.log('ðŸ“Š GET /api/usuarios/funcoes - Buscando funÃ§Ãµes disponÃ­veis')
    
    // Aqui vocÃª pode adicionar lÃ³gica para buscar funÃ§Ãµes especÃ­ficas por bar
    // ou implementar diferentes tipos de funÃ§Ãµes baseadas no plano do bar
    
    return NextResponse.json({
      success: true,
      funcoes: FUNCOES_DISPONIVEL,
      total: FUNCOES_DISPONIVEL.length
    })
    
  } catch (error) {
    console.error('âŒ Erro na API de funÃ§Ãµes:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
