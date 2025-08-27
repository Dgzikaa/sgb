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
			// Usar método manual direto seguindo padrão da API principal
			{
				// PAGINAÇÃO PARA PAGAMENTOS (seguindo padrão da API principal)
				let offsetPagamentos = 0
				const pageSizePagamentos = 1000
				const todosPagamentos = []
				
				console.log('💳 Buscando todos os pagamentos com paginação...')
				
				const MAX_ITERATIONS_PAG = 100
				let iterationsPag = 0
				
				while (iterationsPag < MAX_ITERATIONS_PAG) {
					iterationsPag++
					
					let queryPag = supabase
						.from('contahub_pagamentos')
						.select('cliente, mesa, hr_lancamento, hr_transacao, dt_gerencial')
						.not('hr_transacao', 'is', null)
						.neq('hr_transacao', '')
						.range(offsetPagamentos, offsetPagamentos + pageSizePagamentos - 1)
					
					queryPag = queryPag.eq('bar_id', finalBarId)
					
					const { data: pagamentosData, error: pagamentosError } = await queryPag
					
					if (pagamentosError) {
						console.warn('⚠️ Erro ao buscar pagamentos:', pagamentosError)
						break
					}
					
					if (!pagamentosData || pagamentosData.length === 0) {
						console.log(`✅ Pagamentos: Processadas todas as páginas após ${iterationsPag} iterações`)
						break
					}
					
					todosPagamentos.push(...pagamentosData)
					offsetPagamentos += pageSizePagamentos
					
					// Log de progresso a cada 10 páginas
					if (iterationsPag % 10 === 0) {
						console.log(`💳 Pagamentos: Processadas ${iterationsPag} páginas, ${todosPagamentos.length} registros`)
					}
					
					if (pagamentosData.length < pageSizePagamentos) {
						console.log(`✅ Pagamentos: Última página com ${pagamentosData.length} registros`)
						break
					}
				}
				
				// Nova lógica otimizada: buscar períodos em lotes
				console.log('📄 Buscando períodos para todos os clientes do mapa...')
				
				// Criar lista de telefones com hífen para busca
				const telefonesComHifen = Array.from(map.keys()).map(fone => 
					fone.length === 11 ? `${fone.substring(0, 2)}-${fone.substring(2)}` : fone
				)
				
				console.log(`📞 Buscando períodos para ${telefonesComHifen.length} telefones únicos`)
				
				// Buscar períodos em lotes para evitar 414 Request-URI Too Large
				const todosPeriodos = []
				const loteSize = 1000 // Lotes de 1000 telefones
				
				for (let i = 0; i < telefonesComHifen.length; i += loteSize) {
					const lote = telefonesComHifen.slice(i, i + loteSize)
					
					const { data: periodosLote, error: errorLote } = await supabase
						.from('contahub_periodo')
						.select('cli_nome, cli_fone, dt_gerencial, vd_mesadesc')
						.eq('bar_id', finalBarId)
						.in('cli_fone', lote)
					
					if (errorLote) {
						console.warn(`⚠️ Erro ao buscar lote ${i}-${i + loteSize}:`, errorLote)
						continue
					}
					
					if (periodosLote && periodosLote.length > 0) {
						todosPeriodos.push(...periodosLote)
					}
					
					// Log de progresso a cada 10 lotes
					if ((i / loteSize + 1) % 10 === 0) {
						console.log(`📄 Processados ${i + loteSize} telefones, ${todosPeriodos.length} períodos encontrados`)
					}
				}
				
				console.log(`📄 Total: ${todosPeriodos.length} períodos encontrados para processar`)
				
				// Nova lógica: Match por NOME + VALOR (mais preciso)
				console.log('🎯 Implementando match por NOME + VALOR...')
				
				// Agrupar períodos por telefone normalizado
				const periodosPorTelefone = new Map()
				
				for (const periodo of todosPeriodos || []) {
					const foneNormalizado = (periodo.cli_fone || '').toString().trim().replace(/\D/g, '')
					if (!foneNormalizado) continue
					
					// Normalizar telefone igual à lógica principal
					let fone = foneNormalizado
					if (fone.length === 10 && ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99'].includes(fone.substring(0, 2))) {
						fone = fone.substring(0, 2) + '9' + fone.substring(2)
					}
					
					if (!periodosPorTelefone.has(fone)) {
						periodosPorTelefone.set(fone, [])
					}
					periodosPorTelefone.get(fone).push(periodo)
				}
				
				console.log(`👥 Processando tempos para ${periodosPorTelefone.size} clientes com períodos`)
				
				// DEBUG para Laura Galvão
				const lauraFone = '61992053013'
				if (periodosPorTelefone.has(lauraFone)) {
					const lauraPeríodos = periodosPorTelefone.get(lauraFone)
					console.log(`🔍 DEBUG Laura: ${lauraPeríodos.length} períodos encontrados`)
					console.log(`🔍 DEBUG Laura: Nomes únicos:`, [...new Set(lauraPeríodos.map(p => p.cli_nome))])
				}
				
				let totalTemposEncontrados = 0
				let clientesProcessados = 0
				let matchesPorTipo = {
					nomeValor: 0,
					nomeApenas: 0,
					valorApenas: 0,
					mesa: 0,
					semMatch: 0
				}
				
				// Processar cada cliente
				for (const [fone, cliente] of map.entries()) {
					clientesProcessados++
					
					const periodosCliente = periodosPorTelefone.get(fone) || []
					if (periodosCliente.length === 0) continue
					
					const temposDesteCliente = []
					const periodosProcessados = new Set() // Evitar duplicatas
					
					// Para cada período deste cliente
					for (const periodo of periodosCliente) {
						// Criar chave única para evitar duplicatas
						const chaveUnica = `${periodo.dt_gerencial}-${periodo.cli_nome}-${periodo.vd_mesadesc}`
						if (periodosProcessados.has(chaveUnica)) continue
						periodosProcessados.add(chaveUnica)
						
						// Valores do período
						const periodoNome = (periodo.cli_nome || '').toLowerCase().trim()
						const periodoValor = parseFloat(periodo.vr_pagamentos || 0)
						
						// Buscar pagamento correspondente com PRIORIDADE para NOME + VALOR
						const pagamentoCorrespondente = todosPagamentos.find(pag => {
							if (pag.dt_gerencial !== periodo.dt_gerencial) return false
							
							const pagamentoCliente = (pag.cliente || '').toLowerCase().trim()
							const pagamentoValor = parseFloat(pag.valor || 0)
							
							// 🎯 PRIORIDADE 1: Match NOME + VALOR (mais preciso)
							if (periodoNome && pagamentoCliente && periodoValor > 0 && pagamentoValor > 0) {
								// Match por primeiro nome + valor exato
								const primeiroNomePeriodo = periodoNome.split(' ')[0]
								const primeiroNomePagamento = pagamentoCliente.split(' ')[0]
								
								if (primeiroNomePeriodo.length > 2 && 
									primeiroNomePagamento.includes(primeiroNomePeriodo) &&
									Math.abs(periodoValor - pagamentoValor) < 0.01) {
									matchesPorTipo.nomeValor++
									return true
								}
							}
							
							return false
						})
						
						// Se não encontrou match por NOME+VALOR, tentar outras estratégias
						let pagamentoFinal = pagamentoCorrespondente
						
						if (!pagamentoFinal) {
							pagamentoFinal = todosPagamentos.find(pag => {
								if (pag.dt_gerencial !== periodo.dt_gerencial) return false
								
								const pagamentoCliente = (pag.cliente || '').toLowerCase().trim()
								const pagamentoMesa = (pag.mesa || '').toLowerCase().trim()
								const periodoMesa = (periodo.vd_mesadesc || '').toLowerCase().trim()
								
								// 2. Match por nome apenas
								if (periodoNome && pagamentoCliente) {
									const primeiroNomePeriodo = periodoNome.split(' ')[0]
									const primeiroNomePagamento = pagamentoCliente.split(' ')[0]
									if (primeiroNomePeriodo.length > 3 && primeiroNomePagamento.length > 3 && 
										primeiroNomePeriodo === primeiroNomePagamento) {
										matchesPorTipo.nomeApenas++
										return true
									}
								}
								
								// 3. Match por mesa
								if (periodoMesa && pagamentoMesa && periodoMesa === pagamentoMesa) {
									matchesPorTipo.mesa++
									return true
								}
								
								return false
							})
						}
						
						// Calcular tempo (apenas UM tempo por período)
						if (pagamentoFinal?.hr_lancamento && pagamentoFinal?.hr_transacao) {
							try {
								const hrLancamento = new Date(pagamentoFinal.hr_lancamento)
								const hrTransacao = new Date(pagamentoFinal.hr_transacao)
								const tempoMinutos = (hrTransacao.getTime() - hrLancamento.getTime()) / (1000 * 60)
								
								if (tempoMinutos > 15 && tempoMinutos < 720) {
									temposDesteCliente.push(tempoMinutos)
									totalTemposEncontrados++
								}
							} catch (error) {
								console.warn('Erro ao calcular tempo:', error)
							}
						} else {
							matchesPorTipo.semMatch++
						}
					}
					
					// Atualizar cliente
					if (temposDesteCliente.length > 0) {
						cliente.temposEstadia = temposDesteCliente
						cliente.tempoMedioEstadia = temposDesteCliente.reduce((sum, t) => sum + t, 0) / temposDesteCliente.length
						
						// DEBUG para Laura Galvão
						if (cliente.nome.toLowerCase().includes('laura') && cliente.nome.toLowerCase().includes('galv')) {
							console.log(`🔍 DEBUG Laura: ${periodosCliente.length} períodos → ${temposDesteCliente.length} tempos únicos`)
							console.log(`🔍 DEBUG Laura: Média: ${cliente.tempoMedioEstadia.toFixed(1)} min`)
						}
					}
				}
				
				console.log(`✅ Processamento completo:`)
				console.log(`   👥 ${clientesProcessados} clientes processados`)
				console.log(`   💳 ${todosPagamentos.length} pagamentos processados`)
				console.log(`   ⏱️ ${totalTemposEncontrados} tempos válidos calculados`)
				console.log(`📈 Matches por tipo:`)
				console.log(`   🎯 Nome + Valor: ${matchesPorTipo.nomeValor}`)
				console.log(`   👤 Nome apenas: ${matchesPorTipo.nomeApenas}`)
				console.log(`   🏠 Mesa: ${matchesPorTipo.mesa}`)
				console.log(`   ❌ Sem match: ${matchesPorTipo.semMatch}`)
				
				// Contar clientes com tempo de estadia
				const clientesComTempo = Array.from(map.values()).filter(c => c.temposEstadia && c.temposEstadia.length > 0)
				console.log(`   🎯 ${clientesComTempo.length} clientes com tempo de estadia`)
			}
		} catch (error) {
			console.warn('⚠️ Erro ao processar tempos de estadia:', error)
			// Continuar mesmo com erro nos tempos de estadia
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
