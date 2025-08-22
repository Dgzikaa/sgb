import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Clientes: Iniciando busca...')
    
    // Autenticar usuário
    const user = await authenticateUser(request)
    if (!user) {
      console.log('❌ API Clientes: Usuário não autenticado')
      return authErrorResponse('Usuário não autenticado')
    }
    
    console.log('✅ API Clientes: Usuário autenticado:', user.nome)
    
    const supabase = await getAdminClient()
    console.log('✅ API Clientes: Cliente administrativo Supabase obtido')

		// Buscar dados dos clientes com paginação completa
		console.log('📊 API Clientes: Buscando dados dos clientes (paginaçao completa)...')
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
		console.log('📅 API Clientes: Filtro dia da semana:', diaSemanaFiltro)

		const pageSize = 1000
		let from = 0
		let totalLinhas = 0
		const map = new Map<string, { nome: string; fone: string; visitas: number; ultima: string; totalEntrada: number; totalConsumo: number; totalGasto: number }>()

		const MAX_ITERATIONS = 100; // Prevenir loop infinito
		let iterations = 0;
		while (iterations < MAX_ITERATIONS) {
			iterations++;
			let query = supabase
				.from('contahub_periodo')
				.select('cli_nome, cli_fone, dt_gerencial, bar_id, vr_couvert, vr_pagamentos')
				.not('cli_fone', 'is', null)
				.neq('cli_fone', '')
				.range(from, from + pageSize - 1)
				.order('dt_gerencial', { ascending: false })
			
			if (barIdFilter) query = query.eq('bar_id', barIdFilter)
			
			const { data, error } = await query
			if (error) {
				console.error('❌ Erro ao buscar contahub_periodo:', error)
				break
			}
			if (!data || data.length === 0) break

			// Processar todos os dados e aplicar filtro por dia da semana
			for (const r of data) {
				// Aplicar filtro por dia da semana se especificado
				if (diaSemanaFiltro && diaSemanaFiltro !== 'todos') {
					const dataGerencial = new Date(r.dt_gerencial as string)
					const diaSemanaData = dataGerencial.getDay() // 0=domingo, 1=segunda, etc.
					if (diaSemanaData.toString() !== diaSemanaFiltro) {
						continue // Pular este registro se não for do dia da semana desejado
					}
				}
				
				// Contar linha apenas se passou no filtro
				totalLinhas++

				const rawFone = (r.cli_fone || '').toString().trim()
				if (!rawFone) continue
				
				// Normalizar telefone: remover todos os caracteres não numéricos
				let fone = rawFone.replace(/\D/g, '')
				if (!fone) continue
				
				// Debug: Log da normalização para telefones específicos
				if (rawFone.includes('61992053013') || rawFone.includes('61-992053013')) {
					console.log(`🔍 DEBUG: Normalizando Laura - Original: ${rawFone} → Normalizado: ${fone}`)
				}
				
				// Padronizar: se tem 11 dígitos e começa com DDD, manter
				// se tem 10 dígitos, adicionar 9 após o DDD (celular antigo)
				if (fone.length === 10 && ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99'].includes(fone.substring(0, 2))) {
					// Adicionar 9 após o DDD para celulares antigos
					fone = fone.substring(0, 2) + '9' + fone.substring(2)
					console.log(`🔍 DEBUG: Telefone ${rawFone} padronizado de 10 para 11 dígitos: ${fone}`)
				}
				const nome = (r.cli_nome || '').toString().trim() || 'Sem nome'
				const ultima = r.dt_gerencial as string
				const vrCouvert = parseFloat(r.vr_couvert || '0') || 0
				const vrPagamentos = parseFloat(r.vr_pagamentos || '0') || 0
				const vrConsumo = vrPagamentos - vrCouvert

				const prev = map.get(fone)
				if (!prev) {
					// Debug: Log quando Laura é adicionada pela primeira vez
					if (fone === '61992053013') {
						console.log(`🔍 DEBUG: Adicionando Laura ao Map - Nome: ${nome}, Fone: ${fone}, Visitas: 1, Valor: R$ ${vrPagamentos}`)
					}
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
					// Debug: Log quando Laura é atualizada
					if (fone === '61992053013') {
						console.log(`🔍 DEBUG: Atualizando Laura - Visitas: ${prev.visitas} → ${prev.visitas + 1}, Valor: R$ ${prev.totalGasto} → R$ ${prev.totalGasto + vrPagamentos}`)
					}
					prev.visitas += 1
					prev.totalEntrada += vrCouvert
					prev.totalConsumo += vrConsumo
					prev.totalGasto += vrPagamentos
					if (ultima > prev.ultima) prev.ultima = ultima
					// Usar sempre o nome mais completo (maior length) e que não seja 'Sem nome'
					if (nome && nome !== 'Sem nome' && nome.length > prev.nome.length) {
						prev.nome = nome
					}
				}
			}

			if (data.length < pageSize) break
			from += pageSize
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

		// Debug: Mostrar top 5 clientes para análise
		if (diaSemanaFiltro && diaSemanaFiltro !== 'todos') {
			console.log('🔍 DEBUG: Top 5 clientes filtrados por dia da semana:')
			clientes.slice(0, 5).forEach((cliente, index) => {
				const valorGasto = cliente.valor_total_gasto || 0
				console.log(`  ${index + 1}º: ${cliente.nome_principal} - ${cliente.total_visitas} visitas - R$ ${valorGasto.toFixed(2)} (${cliente.telefone})`)
			})
			
					// Debug específico para Gabriela e Laura
		const gabrielaClientes = clientes.filter(c => c.nome_principal.toLowerCase().includes('gabriela'))
		const lauraClientes = clientes.filter(c => c.nome_principal.toLowerCase().includes('laura'))
		
		if (gabrielaClientes.length > 0) {
			console.log('🔍 DEBUG: Gabrielas encontradas:')
			gabrielaClientes.forEach((cliente, index) => {
				console.log(`  Gabriela ${index + 1}: ${cliente.total_visitas} visitas - R$ ${(cliente.valor_total_gasto || 0).toFixed(2)} - ${cliente.telefone}`)
			})
		}
		
		if (lauraClientes.length > 0) {
			console.log('🔍 DEBUG: Lauras encontradas:')
			lauraClientes.forEach((cliente, index) => {
				console.log(`  Laura ${index + 1}: ${cliente.total_visitas} visitas - R$ ${(cliente.valor_total_gasto || 0).toFixed(2)} - ${cliente.telefone}`)
			})
		}
		
		// Debug: Verificar se Laura 61992053013 está no Map
		const lauraMap = map.get('61992053013')
		if (lauraMap) {
			console.log(`🔍 DEBUG: Laura no Map: ${lauraMap.nome} - ${lauraMap.visitas} visitas - R$ ${lauraMap.totalGasto.toFixed(2)}`)
		} else {
			console.log('🔍 DEBUG: Laura 61992053013 NÃO encontrada no Map!')
		}
		}

		console.log(`✅ API Clientes: ${clientes.length} no ranking • ${map.size} únicos • ${totalLinhas} visitas${diaSemanaFiltro && diaSemanaFiltro !== 'todos' ? ` • Filtrado por ${diaSemanaFiltro === '0' ? 'Domingo' : diaSemanaFiltro === '1' ? 'Segunda' : diaSemanaFiltro === '2' ? 'Terça' : diaSemanaFiltro === '3' ? 'Quarta' : diaSemanaFiltro === '4' ? 'Quinta' : diaSemanaFiltro === '5' ? 'Sexta' : 'Sábado'}` : ''}`)

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
