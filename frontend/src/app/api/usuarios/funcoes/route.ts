import { NextRequest, NextResponse } from 'next/server'

// Funá§áµes disponá­veis no sistema
const FUNCOES_DISPONIVEL = [
  {
    id: 'funcionario',
    nome: 'Funcioná¡rio',
    descricao: 'Acesso bá¡sico á s funcionalidades operacionais',
    nivel: 1,
    cor: 'bg-blue-100 text-blue-800 border-blue-200',
    icone: 'ðŸ‘¤'
  },
  {
    id: 'gerente',
    nome: 'Gerente',
    descricao: 'Acesso a relatá³rios e gestá£o de funcioná¡rios',
    nivel: 2,
    cor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icone: 'ðŸ‘¨€ðŸ’¼'
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
    console.log('ðŸ“Š GET /api/usuarios/funcoes - Buscando funá§áµes disponá­veis')
    
    // Aqui vocáª pode adicionar lá³gica para buscar funá§áµes especá­ficas por bar
    // ou implementar diferentes tipos de funá§áµes baseadas no plano do bar
    
    return NextResponse.json({
      success: true,
      funcoes: FUNCOES_DISPONIVEL,
      total: FUNCOES_DISPONIVEL.length
    })
    
  } catch (error) {
    console.error('Œ Erro na API de funá§áµes:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
