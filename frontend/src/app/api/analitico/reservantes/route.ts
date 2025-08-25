import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Reservantes: Iniciando busca...')
    
    // Autenticar usuário
    const user = await authenticateUser(request)
    if (!user) {
      console.log('❌ API Reservantes: Usuário não autenticado')
      return authErrorResponse('Usuário não autenticado')
    }
    
    console.log('✅ API Reservantes: Usuário autenticado:', user.nome)
    
    const supabase = await getAdminClient()
    console.log('✅ API Reservantes: Cliente administrativo Supabase obtido')

		// Buscar dados dos reservantes com paginação completa
		console.log('📊 API Reservantes: Buscando dados dos reservantes (paginação completa)...')
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
		console.log('📅 API Reservantes: Filtro dia da semana:', diaSemanaFiltro)

		const pageSize = 1000
		let from = 0
		let totalLinhas = 0
		const map = new Map<string, { 
			nome: string; 
			fone: string; 
			totalReservas: number;
			totalVisitas: number;
			seated: number;
			confirmed: number;
			pending: number;
			cancelled: number;
			noshow: number;
			ultimaReserva: string;
		}>()
		
		// Mapa para contar visitas totais (da tabela contahub_periodo)
		const mapVisitas = new Map<string, number>()

		const MAX_ITERATIONS = 100; // Prevenir loop infinito
		let iterations = 0;
		while (iterations < MAX_ITERATIONS) {
			iterations++;
			let query = supabase
				.from('getin_reservations')
				.select('customer_name, customer_phone, reservation_date, bar_id, status, no_show')
				.not('customer_phone', 'is', null)
				.neq('customer_phone', '')
				.range(from, from + pageSize - 1)
				.order('reservation_date', { ascending: false })
			
			if (barIdFilter) query = query.eq('bar_id', barIdFilter)
			
			// Filtrar por dia da semana se especificado
			if (diaSemanaFiltro && diaSemanaFiltro !== 'todos') {
				// Filtro será aplicado no JavaScript após buscar os dados
				console.log('🗓️ API Reservantes: Filtro por dia da semana será aplicado no JavaScript:', diaSemanaFiltro)
			}
			
			const { data, error } = await query
			if (error) {
				console.error('❌ Erro ao buscar getin_reservations:', error)
				break
			}
			if (!data || data.length === 0) break

			totalLinhas += data.length

			for (const r of data) {
				// Aplicar filtro por dia da semana se especificado
				if (diaSemanaFiltro && diaSemanaFiltro !== 'todos') {
					const dataReserva = new Date(r.reservation_date as string)
					const diaSemanaData = dataReserva.getDay() // 0=domingo, 1=segunda, etc.
					if (diaSemanaData.toString() !== diaSemanaFiltro) {
						continue // Pular este registro se não for do dia da semana desejado
					}
				}

				const rawFone = (r.customer_phone || '').toString().trim()
				if (!rawFone) continue
				let fone = rawFone.replace(/\D/g, '')
				if (!fone) continue
				
				// Padronizar telefone: se tem 10 dígitos, adicionar 9 após o DDD (celular antigo)
				if (fone.length === 10 && ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99'].includes(fone.substring(0, 2))) {
					// Adicionar 9 após o DDD para celulares antigos
					fone = fone.substring(0, 2) + '9' + fone.substring(2)
				}
				const nome = (r.customer_name || '').toString().trim() || 'Sem nome'
				const ultimaReserva = r.reservation_date as string
				
				// Determinar status final baseado no status e no_show
				let statusFinal = r.status
				if (r.no_show) {
					statusFinal = 'no-show'
				}

				const prev = map.get(fone)
				if (!prev) {
					map.set(fone, { 
						nome, 
						fone, 
						totalReservas: 1,
						seated: statusFinal === 'seated' ? 1 : 0,
						confirmed: statusFinal === 'confirmed' ? 1 : 0,
						pending: statusFinal === 'pending' ? 1 : 0,
						cancelled: (statusFinal === 'canceled-user' || statusFinal === 'canceled-agent') ? 1 : 0,
						noshow: statusFinal === 'no-show' ? 1 : 0,
						ultimaReserva
					})
				} else {
					prev.totalReservas += 1
					if (statusFinal === 'seated') prev.seated += 1
					else if (statusFinal === 'confirmed') prev.confirmed += 1
					else if (statusFinal === 'pending') prev.pending += 1
					else if (statusFinal === 'canceled-user' || statusFinal === 'canceled-agent') prev.cancelled += 1
					else if (statusFinal === 'no-show') prev.noshow += 1
					
					if (ultimaReserva > prev.ultimaReserva) prev.ultimaReserva = ultimaReserva
					if (nome && nome !== 'Sem nome') prev.nome = nome
				}
			}

			if (data.length < pageSize) break
			from += pageSize
		}

		// Buscar TODAS as visitas do bar e depois fazer match com os reservantes
		console.log('🔍 API Reservantes: Buscando todas as visitas do bar...')
		
		let offsetVisitas = 0
		const pageSizeVisitas = 1000
		let totalVisitasProcessadas = 0
		
		while (true) {
			const { data: visitasData, error: visitasError } = await supabase
				.from('contahub_periodo')
				.select('cli_fone')
				.not('cli_fone', 'is', null)
				.neq('cli_fone', '')
				.eq('bar_id', barIdFilter || 3)
				.range(offsetVisitas, offsetVisitas + pageSizeVisitas - 1)
			
			if (visitasError) {
				console.error('❌ Erro ao buscar visitas:', visitasError)
				break
			}
			
			if (!visitasData || visitasData.length === 0) break
			
			totalVisitasProcessadas += visitasData.length
			
			visitasData.forEach(visita => {
				let foneNormalizado = (visita.cli_fone || '').replace(/\D/g, '')
				if (!foneNormalizado) return
				
				// Aplicar a mesma normalização usada nos reservantes
				if (foneNormalizado.length === 10 && ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99'].includes(foneNormalizado.substring(0, 2))) {
					foneNormalizado = foneNormalizado.substring(0, 2) + '9' + foneNormalizado.substring(2)
				}
				
				mapVisitas.set(foneNormalizado, (mapVisitas.get(foneNormalizado) || 0) + 1)
			})
			
			if (visitasData.length < pageSizeVisitas) break
			offsetVisitas += pageSizeVisitas
		}

		console.log(`📊 API Reservantes: ${totalVisitasProcessadas} visitas processadas, ${mapVisitas.size} telefones únicos com visitas`)

		// Fazer match entre reservantes e visitas
		console.log('🔗 API Reservantes: Fazendo match entre reservantes e visitas...')
		let matchesEncontrados = 0
		
		const reservantes = Array.from(map.values())
			.map(r => {
				const visitas = mapVisitas.get(r.fone) || 0
				if (visitas > 0) matchesEncontrados++
				
				// Log para os primeiros 5 reservantes para debug
				if (matchesEncontrados <= 5) {
					console.log(`🔍 Match: ${r.nome} (${r.fone}) -> ${visitas} visitas`)
				}
				
				return {
					...r,
					totalVisitas: visitas
				}
			})
			.sort((a, b) => {
				// Ordenar por total de reservas (decrescente)
				return b.totalReservas - a.totalReservas
			})
			.slice(0, 100)
			.map((r) => {
				// Calcular percentual de presença (seated / total)
				const percentualPresenca = r.totalReservas > 0 ? (r.seated / r.totalReservas) * 100 : 0
				// Calcular percentual de reservas (reservas / visitas totais)
				const percentualReservas = r.totalVisitas > 0 ? (r.totalReservas / r.totalVisitas) * 100 : 0
				
				return {
					identificador_principal: r.fone,
					nome_principal: r.nome,
					telefone: r.fone,
					total_reservas: r.totalReservas,
					total_visitas: r.totalVisitas,
					percentual_reservas: Math.round(percentualReservas * 100) / 100, // Arredondar para 2 casas decimais
					reservas_seated: r.seated,
					reservas_confirmed: r.confirmed,
					reservas_pending: r.pending,
					reservas_cancelled: r.cancelled,
					reservas_noshow: r.noshow,
					ultima_reserva: r.ultimaReserva,
					percentual_presenca: Math.round(percentualPresenca * 100) / 100, // Arredondar para 2 casas decimais
				}
			})

		console.log(`✅ API Reservantes: ${reservantes.length} no ranking • ${map.size} únicos • ${totalLinhas} reservas • ${matchesEncontrados} matches com visitas`)

		return NextResponse.json({
			reservantes,
			estatisticas: {
				total_reservantes_unicos: map.size,
				total_reservas_geral: totalLinhas,
				total_seated: Array.from(map.values()).reduce((sum, r) => sum + r.seated, 0),
				total_confirmed: Array.from(map.values()).reduce((sum, r) => sum + r.confirmed, 0),
				total_pending: Array.from(map.values()).reduce((sum, r) => sum + r.pending, 0),
				total_cancelled: Array.from(map.values()).reduce((sum, r) => sum + r.cancelled, 0),
				total_noshow: Array.from(map.values()).reduce((sum, r) => sum + r.noshow, 0),
			},
		})
  } catch (error) {
    console.error('Erro na API de reservantes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
