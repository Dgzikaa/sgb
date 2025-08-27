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
		
		console.log('🔍 API: Filtro dia da semana recebido:', diaSemanaFiltro)
		
		let contadorLauraGalvao = 0 // Contador específico para Laura Galvão (61992053013)

	// Removido teste - implementando paginação SQL direta

	// IMPLEMENTAÇÃO DE PAGINAÇÃO OFFSET/LIMIT com ordenação estável
	const pageSize = 1000
	let offset = 0
	let totalLinhas = 0
	const map = new Map<string, { nome: string; fone: string; visitas: number; visitasTotal: number; ultima: string; totalEntrada: number; totalConsumo: number; totalGasto: number; temposEstadia: number[]; tempoMedioEstadia: number }>()
	const mapTotal = new Map<string, number>() // Mapa para contar total de visitas (sem filtro)

	const MAX_ITERATIONS = 500 // Aumentar drasticamente para garantir processamento completo
	let iterations = 0
	let telefonesProcessados = 0
	let telefonesDescartados = 0
	
	const startTime = Date.now()
	const MAX_PROCESSING_TIME = 60000 // 60 segundos máximo - tempo suficiente para processar tudo
	
	// Aplicar filtro de bar_id sempre (padrão bar_id = 3 se não especificado)
	const finalBarId = barIdFilter || 3
	
	while (iterations < MAX_ITERATIONS) {
		iterations++
		
		// Verificar timeout
		if (Date.now() - startTime > MAX_PROCESSING_TIME) {
			console.log(`⏰ TIMEOUT: Processamento interrompido após ${iterations} páginas por limite de tempo`)
			break
		}
		
		// Query Supabase SEM ordenação específica - deixar o Supabase decidir
		let query = supabase
			.from('contahub_periodo')
			.select('cli_nome, cli_fone, dt_gerencial, bar_id, vr_couvert, vr_pagamentos, vd_mesadesc')
			.not('cli_fone', 'is', null)
			.neq('cli_fone', '')
			.range(offset, offset + pageSize - 1)
		
		// Aplicar filtro de bar_id
		query = query.eq('bar_id', finalBarId)
		
		// Não aplicar filtro aqui - será feito no processamento JavaScript
		// para manter a mesma lógica de "todos os dias"
		
		const { data, error } = await query
		
		if (error) {
			console.error('❌ Erro na consulta SQL:', error)
			return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
		}
		
		if (!data || data.length === 0) {
			console.log(`✅ PROCESSAMENTO COMPLETO: Todas as páginas processadas após ${iterations} iterações`)
			break
		}
		
		// Remover logs excessivos - manter apenas contador Laura Galvão

		// Processar todos os dados
		
		for (const r of data) {
			// Primeiro, processar telefone para contar no total ANTES de qualquer filtro
			const rawFone = (r.cli_fone || '').toString().trim()
			if (!rawFone) {
				continue // Pular registros sem telefone
			}
			
			// Normalizar telefone: remover todos os caracteres não numéricos
			let fone = rawFone.replace(/\D/g, '')
			if (!fone) {
				continue // Pular telefones inválidos
			}
			
			// Padronizar: se tem 11 dígitos e começa com DDD, manter
			// se tem 10 dígitos, adicionar 9 após o DDD (celular antigo)
			if (fone.length === 10 && ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99'].includes(fone.substring(0, 2))) {
				// Adicionar 9 após o DDD para celulares antigos
				fone = fone.substring(0, 2) + '9' + fone.substring(2)
			}
			
			// SEMPRE contar no total (sem filtro de dia) - ANTES de qualquer filtro
			mapTotal.set(fone, (mapTotal.get(fone) || 0) + 1)
			
			// Agora processar data e aplicar filtro de dia da semana
			const dataGerencial = new Date(r.dt_gerencial + 'T12:00:00Z') // Forçar UTC
			const diaSemanaData = dataGerencial.getUTCDay() // 0=domingo, 1=segunda, etc. - UTC
			
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
			telefonesProcessados++
			
			const nome = (r.cli_nome || '').toString().trim() || 'Sem nome'
			const ultima = r.dt_gerencial as string
			const vrCouvert = parseFloat(r.vr_couvert || '0') || 0
			const vrPagamentos = parseFloat(r.vr_pagamentos || '0') || 0
			
			// Contador específico para Laura Galvão (61992053013)
			if (rawFone === '61-992053013') {
				contadorLauraGalvao++
			}
				

				const vrConsumo = vrPagamentos - vrCouvert

				const prev = map.get(fone)
				if (!prev) {

					map.set(fone, { 
						nome, 
						fone, 
						visitas: 1, 
						visitasTotal: mapTotal.get(fone) || 1,
						ultima,
						totalEntrada: vrCouvert,
						totalConsumo: vrConsumo,
						totalGasto: vrPagamentos,
						temposEstadia: [],
						tempoMedioEstadia: 0
					})
					
					// Remover log desnecessário
				} else {

					prev.visitas += 1
					prev.visitasTotal = mapTotal.get(fone) || prev.visitas
					prev.totalEntrada += vrCouvert
					prev.totalConsumo += vrConsumo
					prev.totalGasto += vrPagamentos
					if (ultima > prev.ultima) prev.ultima = ultima
					
					// Remover log desnecessário
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

		// Buscar tempos de estadia para todos os clientes usando query SQL direta
		console.log('🕐 Buscando tempos de estadia para', map.size, 'clientes únicos...')
		
		try {
			// Usar método manual direto com paginação completa
			{
				// PAGINAÇÃO PARA PERÍODOS
				let offsetPeriodos = 0
				const pageSizePeriodos = 1000
				const todosPeriodos = []
				
				console.log('📄 Buscando todos os períodos com paginação...')
				
				while (true) {
					const { data: temposDataSQL, error: temposErrorSQL } = await supabase
						.from('contahub_periodo')
						.select('cli_nome, cli_fone, dt_gerencial, vd_mesadesc')
						.eq('bar_id', finalBarId)
						.not('cli_fone', 'is', null)
						.neq('cli_fone', '')
						.range(offsetPeriodos, offsetPeriodos + pageSizePeriodos - 1)
					
					if (temposErrorSQL) {
						console.warn('⚠️ Erro ao buscar dados do período:', temposErrorSQL)
						break
					}
					
					if (!temposDataSQL || temposDataSQL.length === 0) {
						console.log(`✅ Períodos: Processadas todas as páginas (${Math.ceil(todosPeriodos.length / pageSizePeriodos)} páginas)`)
						break
					}
					
					todosPeriodos.push(...temposDataSQL)
					offsetPeriodos += pageSizePeriodos
					
					// Log de progresso a cada 10 páginas
					if (Math.ceil(offsetPeriodos / pageSizePeriodos) % 10 === 0) {
						console.log(`📄 Períodos: Processadas ${Math.ceil(offsetPeriodos / pageSizePeriodos)} páginas, ${todosPeriodos.length} registros`)
					}
					
					if (temposDataSQL.length < pageSizePeriodos) break
				}
				
				// PAGINAÇÃO PARA PAGAMENTOS
				let offsetPagamentos = 0
				const pageSizePagamentos = 2000
				const todosPagamentos = []
				
				console.log('💳 Buscando todos os pagamentos com paginação...')
				
				let paginasPagamentos = 0
				while (paginasPagamentos < 200) { // Máximo 200 páginas = 400k registros
					const { data: pagamentosData, error: pagamentosError } = await supabase
						.from('contahub_pagamentos')
						.select('cliente, mesa, hr_lancamento, hr_transacao, dt_gerencial')
						.eq('bar_id', finalBarId)
						.not('hr_transacao', 'is', null)
						.neq('hr_transacao', '')
						.range(offsetPagamentos, offsetPagamentos + pageSizePagamentos - 1)
					
					if (pagamentosError) {
						console.warn('⚠️ Erro ao buscar pagamentos:', pagamentosError)
						break
					}
					
					if (!pagamentosData || pagamentosData.length === 0) {
						console.log(`✅ Pagamentos: Processadas todas as páginas (${paginasPagamentos + 1} páginas)`)
						break
					}
					
					todosPagamentos.push(...pagamentosData)
					offsetPagamentos += pageSizePagamentos
					paginasPagamentos++
					
					// Log de progresso a cada 5 páginas
					if (paginasPagamentos % 5 === 0) {
						console.log(`💳 Pagamentos: Processadas ${paginasPagamentos} páginas, ${todosPagamentos.length} registros`)
					}
					
					if (pagamentosData.length < pageSizePagamentos) {
						console.log(`✅ Pagamentos: Última página com ${pagamentosData.length} registros`)
						break
					}
				}
				
				if (paginasPagamentos >= 200) {
					console.log(`⚠️ Pagamentos: Atingiu limite máximo de páginas (${paginasPagamentos})`)
				}
				
				console.log(`🔄 Iniciando cruzamento: ${todosPeriodos.length} períodos × ${todosPagamentos.length} pagamentos`)
				
				// DEBUG: Verificar se temos dados da Laura Galvão
				const lauraData = todosPeriodos.filter(p => p.cli_nome && p.cli_nome.toLowerCase().includes('laura') && p.cli_nome.toLowerCase().includes('galv'))
				if (lauraData.length > 0) {
					console.log(`🔍 DEBUG: Encontrados ${lauraData.length} registros da Laura Galvão`)
					console.log(`🔍 DEBUG: Primeiro registro:`, JSON.stringify(lauraData[0], null, 2))
					
					// Verificar normalização do telefone
					const foneNormalizado = (lauraData[0].cli_fone || '').toString().trim().replace(/\D/g, '')
					let fone = foneNormalizado
					if (fone.length === 10 && ['61'].includes(fone.substring(0, 2))) {
						fone = fone.substring(0, 2) + '9' + fone.substring(2)
					}
					console.log(`🔍 DEBUG: Telefone original: ${lauraData[0].cli_fone}, normalizado: ${fone}`)
					console.log(`🔍 DEBUG: Cliente está no mapa? ${map.has(fone)}`)
				}
				
				// Fazer cruzamento manual dos dados
				const temposPorCliente = new Map<string, number[]>()
				let cruzamentosEncontrados = 0
				let temposValidos = 0
				let matchesPorTipo = {
					nomeExato: 0,
					mesaExata: 0,
					mesaContida: 0,
					primeiroNome: 0,
					numeroMesa: 0
				}
				
				let processedLaura = false
				
				for (const periodo of todosPeriodos) {
					const foneNormalizado = (periodo.cli_fone || '').toString().trim().replace(/\D/g, '')
					if (!foneNormalizado) continue
					
					// Normalizar telefone igual à lógica principal
					let fone = foneNormalizado
					if (fone.length === 10 && ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99'].includes(fone.substring(0, 2))) {
						fone = fone.substring(0, 2) + '9' + fone.substring(2)
					}
					
					// DEBUG específico para Laura Galvão
					if (!processedLaura && periodo.cli_nome && periodo.cli_nome.toLowerCase().includes('laura') && periodo.cli_nome.toLowerCase().includes('galv')) {
						console.log(`🔍 DEBUG Laura: Processando ${periodo.cli_nome}, fone: ${fone}, no mapa: ${map.has(fone)}`)
						processedLaura = true
					}
					
					// Verificar se é um cliente que temos no mapa
					if (!map.has(fone)) continue
					
					// Buscar pagamentos correspondentes com lógica melhorada
					const pagamentosCorrespondentes = []
					
					for (const pag of todosPagamentos) {
						// Deve ser da mesma data
						if (pag.dt_gerencial !== periodo.dt_gerencial) continue
						
						// Normalizar strings para comparação
						const periodoNome = (periodo.cli_nome || '').toLowerCase().trim()
						const periodoMesa = (periodo.vd_mesadesc || '').toLowerCase().trim()
						const pagamentoCliente = (pag.cliente || '').toLowerCase().trim()
						const pagamentoMesa = (pag.mesa || '').toLowerCase().trim()
						
						let matchEncontrado = false
						
						// 1. Match exato por nome
						if (periodoNome && pagamentoCliente && periodoNome === pagamentoCliente) {
							matchesPorTipo.nomeExato++
							matchEncontrado = true
						}
						// 2. Match exato por mesa
						else if (periodoMesa && pagamentoMesa && periodoMesa === pagamentoMesa) {
							matchesPorTipo.mesaExata++
							matchEncontrado = true
						}
						// 3. Mesa contém descrição (qualquer direção)
						else if (periodoMesa && pagamentoMesa && 
								(periodoMesa.includes(pagamentoMesa) || pagamentoMesa.includes(periodoMesa))) {
							matchesPorTipo.mesaContida++
							matchEncontrado = true
						}
						// 4. Nome parcial (primeiro nome)
						else if (periodoNome && pagamentoCliente) {
							const primeiroNomePeriodo = periodoNome.split(' ')[0]
							const primeiroNomePagamento = pagamentoCliente.split(' ')[0]
							if (primeiroNomePeriodo.length > 3 && primeiroNomePagamento.length > 3 && 
								primeiroNomePeriodo === primeiroNomePagamento) {
								matchesPorTipo.primeiroNome++
								matchEncontrado = true
							}
						}
						// 5. Extrair números da mesa para comparação
						else if (periodoMesa && pagamentoMesa) {
							const numerosPeriodo = periodoMesa.match(/\d+/g)
							const numerosPagamento = pagamentoMesa.match(/\d+/g)
							if (numerosPeriodo && numerosPagamento) {
								// Verificar se algum número coincide
								for (const numP of numerosPeriodo) {
									for (const numPg of numerosPagamento) {
										if (numP === numPg && numP.length >= 2) { // Números com pelo menos 2 dígitos
											matchesPorTipo.numeroMesa++
											matchEncontrado = true
											break
										}
									}
									if (matchEncontrado) break
								}
							}
						}
						
						if (matchEncontrado) {
							pagamentosCorrespondentes.push(pag)
						}
					}
					
					if (pagamentosCorrespondentes.length > 0) {
						cruzamentosEncontrados++
					}
					
					for (const pagamento of pagamentosCorrespondentes) {
						if (pagamento.hr_lancamento && pagamento.hr_transacao) {
							try {
								const hrLancamento = new Date(pagamento.hr_lancamento)
								const hrTransacao = new Date(pagamento.hr_transacao)
								const tempoMinutos = (hrTransacao.getTime() - hrLancamento.getTime()) / (1000 * 60)
								
								// Filtrar tempos válidos (15 minutos a 12 horas)
								if (tempoMinutos > 15 && tempoMinutos < 720) {
									if (!temposPorCliente.has(fone)) {
										temposPorCliente.set(fone, [])
									}
									temposPorCliente.get(fone)!.push(tempoMinutos)
									temposValidos++
								}
							} catch (error) {
								console.warn('Erro ao calcular tempo:', error)
							}
						}
					}
				}
				
				// Atualizar clientes com tempos de estadia
				for (const [fone, tempos] of temposPorCliente.entries()) {
					const cliente = map.get(fone)
					if (cliente && tempos.length > 0) {
						cliente.temposEstadia = tempos
						cliente.tempoMedioEstadia = tempos.reduce((sum, t) => sum + t, 0) / tempos.length
					}
				}
				
				console.log(`✅ Processamento completo:`)
				console.log(`   📊 ${todosPeriodos.length} períodos processados`)
				console.log(`   💳 ${todosPagamentos.length} pagamentos processados`)
				console.log(`   🔗 ${cruzamentosEncontrados} cruzamentos encontrados`)
				console.log(`   ⏱️ ${temposValidos} tempos válidos calculados`)
				console.log(`   👥 ${temposPorCliente.size} clientes com tempo de estadia`)
				console.log(`   📈 Matches por tipo:`)
				console.log(`      🎯 Nome exato: ${matchesPorTipo.nomeExato}`)
				console.log(`      🏠 Mesa exata: ${matchesPorTipo.mesaExata}`)
				console.log(`      📝 Mesa contida: ${matchesPorTipo.mesaContida}`)
				console.log(`      👤 Primeiro nome: ${matchesPorTipo.primeiroNome}`)
				console.log(`      🔢 Número mesa: ${matchesPorTipo.numeroMesa}`)
			}
		} catch (error) {
			console.warn('⚠️ Erro ao processar tempos de estadia:', error)
		}

		const clientes = Array.from(map.values())
			.sort((a, b) => b.visitas - a.visitas)
			.slice(0, 100)
			
		// Remover logs de debug - problema resolvido
		
		const clientesFormatados = clientes.map((c) => ({
				identificador_principal: c.fone,
				nome_principal: c.nome,
				telefone: c.fone,
				email: null,
				sistema: 'ContaHub',
				total_visitas: c.visitas,
				total_visitas_geral: c.visitasTotal, // Total sem filtro
				visitas_formatadas: diaSemanaFiltro && diaSemanaFiltro !== 'todos' 
					? `${c.visitas}/${c.visitasTotal}` 
					: c.visitas.toString(),
				valor_total_gasto: c.totalGasto,
				valor_total_entrada: c.totalEntrada,
				valor_total_consumo: c.totalConsumo,
				ticket_medio_geral: c.visitas > 0 ? c.totalGasto / c.visitas : 0,
				ticket_medio_entrada: c.visitas > 0 ? c.totalEntrada / c.visitas : 0,
				ticket_medio_consumo: c.visitas > 0 ? c.totalConsumo / c.visitas : 0,
				ultima_visita: c.ultima,
				tempo_medio_estadia_minutos: c.tempoMedioEstadia,
				tempo_medio_estadia_formatado: c.tempoMedioEstadia > 0 
					? `${Math.floor(c.tempoMedioEstadia / 60)}h ${Math.round(c.tempoMedioEstadia % 60)}min`
					: 'N/A',
				tempos_estadia_detalhados: c.temposEstadia,
				total_visitas_com_tempo: c.temposEstadia.length
			}))







		// Calcular estatísticas globais
		const totalEntradaGlobal = Array.from(map.values()).reduce((sum, c) => sum + c.totalEntrada, 0)
		const totalConsumoGlobal = Array.from(map.values()).reduce((sum, c) => sum + c.totalConsumo, 0)
		const totalGastoGlobal = Array.from(map.values()).reduce((sum, c) => sum + c.totalGasto, 0)

		return NextResponse.json({
			clientes: clientesFormatados,
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
