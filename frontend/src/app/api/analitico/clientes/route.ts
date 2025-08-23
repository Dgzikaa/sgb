import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Autenticar usuário
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuário não autenticado')
    }
    
    const supabase = await getAdminClient()

		// Buscar dados dos clientes com paginação completa
		const barIdHeader = request.headers.get('x-user-data')
		let barIdFilter: number | null = null
		if (barIdHeader) {
			try {
				const parsed = JSON.parse(barIdHeader)
				if (parsed?.bar_id) barIdFilter = parseInt(String(parsed.bar_id))
			} catch (error) {
				console.warn('Erro ao parsear barIdHeader:', error);
			}
		}

		// Obter filtro de dia da semana da URL
		const { searchParams } = new URL(request.url)
		const diaSemanaFiltro = searchParams.get('dia_semana')

	// Removido teste - implementando paginação SQL direta

	// IMPLEMENTAÇÃO DE PAGINAÇÃO OFFSET/LIMIT com ordenação estável
	const pageSize = 1000
	let offset = 0
	let totalLinhas = 0
	const map = new Map<string, { nome: string; fone: string; visitas: number; ultima: string; totalEntrada: number; totalConsumo: number; totalGasto: number }>()

	const MAX_ITERATIONS = 100 // Aumentar para processar todas as páginas
	let iterations = 0
	let telefonesProcessados = 0
	let telefonesDescartados = 0
	
	const startTime = Date.now()
	const MAX_PROCESSING_TIME = 20000 // 20 segundos máximo para processar todas as páginas
	
	while (iterations < MAX_ITERATIONS) {
		iterations++
		
		// Verificar timeout
		if (Date.now() - startTime > MAX_PROCESSING_TIME) {
			break
		}
		
		// Query Supabase SEM ordenação específica (deixar o Supabase decidir)
		let query = supabase
			.from('contahub_periodo')
			.select('cli_nome, cli_fone, dt_gerencial, bar_id, vr_couvert, vr_pagamentos')
			.not('cli_fone', 'is', null)
			.neq('cli_fone', '')
			.range(offset, offset + pageSize - 1)
		
		// Aplicar filtro de bar_id sempre (padrão bar_id = 3 se não especificado)
		const finalBarId = barIdFilter || 3
		query = query.eq('bar_id', finalBarId)
		
		// Aplicar filtro de dia da semana se especificado (será feito no processamento)
		const { data, error } = await query
		
		if (error) {
			console.error('❌ Erro na consulta SQL:', error)
			return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
		}
		
		if (!data || data.length === 0) {
			break
		}

		// Processar todos os dados
		
		for (const r of data) {
			// Processar data uma única vez
			const dataGerencial = new Date(r.dt_gerencial as string)
			const diaSemanaData = dataGerencial.getDay() // 0=domingo, 1=segunda, etc.
			
			// Aplicar filtro por dia da semana se especificado
			if (diaSemanaFiltro && diaSemanaFiltro !== 'todos') {
				if (diaSemanaData.toString() !== diaSemanaFiltro) {
					continue // Pular este registro se não for do dia da semana desejado
				}
			}
				
			// FILTRO OPERACIONAL: Excluir apenas terças-feiras específicas com dados incorretos
			// Remover filtro geral de terças - estava descartando dados válidos
			// Se necessário, implementar filtro mais específico baseado em outras condições
				
				// Contar linha apenas se passou no filtro
				totalLinhas++

				const rawFone = (r.cli_fone || '').toString().trim()
				if (!rawFone) {
					telefonesDescartados++
					continue
				}
				telefonesProcessados++
				
				// Normalizar telefone: remover todos os caracteres não numéricos
				let fone = rawFone.replace(/\D/g, '')
				if (!fone) {
					telefonesDescartados++
					continue
				}
				
				// Padronizar: se tem 11 dígitos e começa com DDD, manter
				// se tem 10 dígitos, adicionar 9 após o DDD (celular antigo)
				if (fone.length === 10 && ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99'].includes(fone.substring(0, 2))) {
					// Adicionar 9 após o DDD para celulares antigos
					fone = fone.substring(0, 2) + '9' + fone.substring(2)
				}
				
				const nome = (r.cli_nome || '').toString().trim() || 'Sem nome'
				const ultima = r.dt_gerencial as string
				const vrCouvert = parseFloat(r.vr_couvert || '0') || 0
				const vrPagamentos = parseFloat(r.vr_pagamentos || '0') || 0
				

				const vrConsumo = vrPagamentos - vrCouvert

				const prev = map.get(fone)
				if (!prev) {

					map.set(fone, { 
						nome, 
						fone, 
						visitas: 1, 
						ultima,
						totalEntrada: vrCouvert,
						totalConsumo: vrConsumo,
						totalGasto: vrPagamentos
					})
				} else {

					prev.visitas += 1
					prev.totalEntrada += vrCouvert
					prev.totalConsumo += vrConsumo
					prev.totalGasto += vrPagamentos
					if (ultima > prev.ultima) prev.ultima = ultima
					// Usar sempre o nome mais completo (maior length) e que não seja 'Sem nome'
					// Priorizar nomes com acentos e mais completos
					if (nome && nome !== 'Sem nome') {
						const nomeTemAcento = /[àáâãäèéêëìíîïòóôõöùúûüç]/i.test(nome)
						const prevTemAcento = /[àáâãäèéêëìíîïòóôõöùúûüç]/i.test(prev.nome)
						
						// Priorizar: 1) Nome com acento, 2) Nome mais longo
						if ((nomeTemAcento && !prevTemAcento) || 
							(nomeTemAcento === prevTemAcento && nome.length > prev.nome.length)) {
							prev.nome = nome
						}
					}
				}
			}

	
		
		if (data.length < pageSize) break
		offset += pageSize
		
		// Pequeno delay para evitar sobrecarga do Supabase
		if (iterations < MAX_ITERATIONS) {
			await new Promise(resolve => setTimeout(resolve, 50)) // 50ms delay
		}
		}

		const clientes = Array.from(map.values())
			.sort((a, b) => b.visitas - a.visitas)
			.slice(0, 100)
			.map((c) => ({
				identificador_principal: c.fone,
				nome_principal: c.nome,
				telefone: c.fone,
				email: null,
				sistema: 'ContaHub',
				total_visitas: c.visitas,
				valor_total_gasto: c.totalGasto,
				valor_total_entrada: c.totalEntrada,
				valor_total_consumo: c.totalConsumo,
				ticket_medio_geral: c.visitas > 0 ? c.totalGasto / c.visitas : 0,
				ticket_medio_entrada: c.visitas > 0 ? c.totalEntrada / c.visitas : 0,
				ticket_medio_consumo: c.visitas > 0 ? c.totalConsumo / c.visitas : 0,
				ultima_visita: c.ultima,
			}))







		// Calcular estatísticas globais
		const totalEntradaGlobal = Array.from(map.values()).reduce((sum, c) => sum + c.totalEntrada, 0)
		const totalConsumoGlobal = Array.from(map.values()).reduce((sum, c) => sum + c.totalConsumo, 0)
		const totalGastoGlobal = Array.from(map.values()).reduce((sum, c) => sum + c.totalGasto, 0)

		return NextResponse.json({
			clientes,
			estatisticas: {
				total_clientes_unicos: map.size,
				total_visitas_geral: totalLinhas,
				ticket_medio_geral: totalLinhas > 0 ? totalGastoGlobal / totalLinhas : 0,
				ticket_medio_entrada: totalLinhas > 0 ? totalEntradaGlobal / totalLinhas : 0,
				ticket_medio_consumo: totalLinhas > 0 ? totalConsumoGlobal / totalLinhas : 0,
				valor_total_entrada: totalEntradaGlobal,
				valor_total_consumo: totalConsumoGlobal,
			},
		})
  } catch (error) {
    console.error('Erro na API de clientes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
