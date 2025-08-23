import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    // Autenticar usuário
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuário não autenticado')
    }
    
    const supabase = await getAdminClient()

    // Obter parâmetros da URL
    const { searchParams } = new URL(request.url)
    const telefone = searchParams.get('telefone')

    if (!telefone) {
      return NextResponse.json({ error: 'Telefone é obrigatório' }, { status: 400 })
    }

    // Obter bar_id do header
    const barIdHeader = request.headers.get('x-user-data')
    let barIdFilter: number | null = null
    if (barIdHeader) {
      try {
        const parsed = JSON.parse(barIdHeader)
        if (parsed?.bar_id) barIdFilter = parseInt(String(parsed.bar_id))
      } catch (error) {
        console.warn('Erro ao parsear barIdHeader:', error)
      }
    }

    // Aplicar filtro de bar_id sempre (padrão bar_id = 3 se não especificado)
    const finalBarId = barIdFilter || 3

    // Normalizar telefone para busca e gerar variações
    let telefoneNormalizado = telefone.replace(/\D/g, '')
    
    // Gerar todas as variações possíveis do telefone para busca
    const variacoesTelefone = new Set<string>()
    
    // Adicionar o telefone original
    variacoesTelefone.add(telefone)
    variacoesTelefone.add(telefoneNormalizado)
    
    // Se tem 11 dígitos, criar versão sem o 9
    if (telefoneNormalizado.length === 11 && telefoneNormalizado.charAt(2) === '9') {
      const semNove = telefoneNormalizado.substring(0, 2) + telefoneNormalizado.substring(3)
      variacoesTelefone.add(semNove)
    }
    
    // Se tem 10 dígitos, criar versão com o 9
    if (telefoneNormalizado.length === 10 && ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99'].includes(telefoneNormalizado.substring(0, 2))) {
      const comNove = telefoneNormalizado.substring(0, 2) + '9' + telefoneNormalizado.substring(2)
      variacoesTelefone.add(comNove)
    }
    
    // Adicionar versões com formatação comum
    if (telefoneNormalizado.length === 11) {
      const formatado = `${telefoneNormalizado.substring(0, 2)}-${telefoneNormalizado.substring(2)}`
      variacoesTelefone.add(formatado)
      const formatado2 = `(${telefoneNormalizado.substring(0, 2)}) ${telefoneNormalizado.substring(2, 7)}-${telefoneNormalizado.substring(7)}`
      variacoesTelefone.add(formatado2)
    }
    
    const listaVariacoes = Array.from(variacoesTelefone)
    console.log(`🔍 Buscando visitas para telefone: ${telefone}`)
    console.log(`📱 Variações de busca: ${listaVariacoes.join(', ')}`)

    // Buscar diretamente por todas as variações do telefone usando OR
    let query = supabase
      .from('contahub_periodo')
      .select('cli_nome, cli_fone, dt_gerencial, vr_couvert, vr_pagamentos')
      .eq('bar_id', finalBarId)
      .order('dt_gerencial', { ascending: false })

    // Aplicar filtro OR para todas as variações do telefone
    const orConditions = listaVariacoes.map(variacao => `cli_fone.eq.${variacao}`).join(',')
    query = query.or(orConditions)

    const { data, error } = await query

    if (error) {
      console.error('❌ Erro na consulta SQL:', error)
      return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
    }

    const visitasCliente = data || []
    console.log(`✅ Total de visitas encontradas: ${visitasCliente.length}`)

    // Transformar dados para o formato esperado pelo frontend
    const visitas = visitasCliente.map(registro => {
      const couvert = parseFloat(registro.vr_couvert || '0') || 0
      const pagamentos = parseFloat(registro.vr_pagamentos || '0') || 0
      const consumo = pagamentos - couvert

      return {
        data: registro.dt_gerencial,
        couvert,
        consumo,
        total: pagamentos
      }
    })

    // Calcular dia da semana mais frequentado
    const diasSemanaCount = new Map<number, number>()
    const diasSemanaLabels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    
    visitasCliente.forEach(registro => {
      const data = new Date(registro.dt_gerencial)
      const diaSemana = data.getDay() // 0=domingo, 1=segunda, etc.
      diasSemanaCount.set(diaSemana, (diasSemanaCount.get(diaSemana) || 0) + 1)
    })

    // Encontrar o dia mais frequentado
    let diaDestaque = 'Não definido'
    let maxVisitas = 0
    
    diasSemanaCount.forEach((count, dia) => {
      if (count > maxVisitas) {
        maxVisitas = count
        diaDestaque = diasSemanaLabels[dia]
      }
    })

    return NextResponse.json({
      visitas,
      total_visitas: visitas.length,
      dia_destaque: diaDestaque,
      cliente: {
        nome: visitasCliente[0]?.cli_nome || 'Cliente',
        telefone: telefone
      }
    })

  } catch (error) {
    console.error('Erro na API de detalhes do cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
