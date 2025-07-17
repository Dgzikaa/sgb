import { NextRequest, NextResponse } from 'next/server'

// Fun·ß·µes dispon·≠veis no sistema
const FUNCOES_DISPONIVEL = [
  {
    id: 'funcionario',
    nome: 'Funcion·°rio',
    descricao: 'Acesso b·°sico ·†s funcionalidades operacionais',
    nivel: 1,
    cor: 'bg-blue-100 text-blue-800 border-blue-200',
    icone: 'üë§'
  },
  {
    id: 'gerente',
    nome: 'Gerente',
    descricao: 'Acesso a relat·≥rios e gest·£o de funcion·°rios',
    nivel: 2,
    cor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icone: 'üë®Äçüíº'
  },
  {
    id: 'admin',
    nome: 'Administrador',
    descricao: 'Acesso completo a todas as funcionalidades',
    nivel: 3,
    cor: 'bg-red-100 text-red-800 border-red-200',
    icone: 'üëë'
  }
]

export async function GET(request: NextRequest) {
  try {
    console.log('üìä GET /api/usuarios/funcoes - Buscando fun·ß·µes dispon·≠veis')
    
    // Aqui voc·™ pode adicionar l·≥gica para buscar fun·ß·µes espec·≠ficas por bar
    // ou implementar diferentes tipos de fun·ß·µes baseadas no plano do bar
    
    return NextResponse.json({
      success: true,
      funcoes: FUNCOES_DISPONIVEL,
      total: FUNCOES_DISPONIVEL.length
    })
    
  } catch (error) {
    console.error('ùå Erro na API de fun·ß·µes:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
