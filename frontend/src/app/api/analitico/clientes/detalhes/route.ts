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

    // Normalizar telefone para busca
    let telefoneNormalizado = telefone.replace(/\D/g, '')
    
    // Padronizar: se tem 10 dígitos, adicionar 9 após o DDD (celular antigo)
    if (telefoneNormalizado.length === 10 && ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99'].includes(telefoneNormalizado.substring(0, 2))) {
      // Adicionar 9 após o DDD para celulares antigos
      telefoneNormalizado = telefoneNormalizado.substring(0, 2) + '9' + telefoneNormalizado.substring(2)
    }

    // Buscar todas as visitas do cliente
    const { data, error } = await supabase
      .from('contahub_periodo')
      .select('cli_nome, cli_fone, dt_gerencial, vr_couvert, vr_pagamentos')
      .eq('bar_id', finalBarId)
      .not('cli_fone', 'is', null)
      .neq('cli_fone', '')
      .order('dt_gerencial', { ascending: false })

    if (error) {
      console.error('❌ Erro na consulta SQL:', error)
      return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
    }

    // Filtrar registros que correspondem ao telefone normalizado
    const visitasCliente = data.filter(registro => {
      const foneRegistro = (registro.cli_fone || '').toString().replace(/\D/g, '')
      
      // Normalizar telefone do registro da mesma forma
      let foneNormalizado = foneRegistro
      if (foneNormalizado.length === 10 && ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99'].includes(foneNormalizado.substring(0, 2))) {
        foneNormalizado = foneNormalizado.substring(0, 2) + '9' + foneNormalizado.substring(2)
      }
      
      return foneNormalizado === telefoneNormalizado
    })

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

    return NextResponse.json({
      visitas,
      total_visitas: visitas.length,
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
