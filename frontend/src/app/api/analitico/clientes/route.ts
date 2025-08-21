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
			
			// Filtrar por dia da semana se especificado
			if (diaSemanaFiltro && diaSemanaFiltro !== 'todos') {
				// Usar RPC ou filtro manual - Supabase não suporta EXTRACT diretamente
				// Vamos fazer o filtro no JavaScript após buscar os dados
				console.log('🗓️ API Clientes: Filtro por dia da semana será aplicado no JavaScript:', diaSemanaFiltro)
			}
			
			const { data, error } = await query
			if (error) {
				console.error('❌ Erro ao buscar contahub_periodo:', error)
				break
			}
			if (!data || data.length === 0) break

			totalLinhas += data.length

			for (const r of data) {
				// Aplicar filtro por dia da semana se especificado
				if (diaSemanaFiltro && diaSemanaFiltro !== 'todos') {
					const dataGerencial = new Date(r.dt_gerencial as string)
					const diaSemanaData = dataGerencial.getDay() // 0=domingo, 1=segunda, etc.
					if (diaSemanaData.toString() !== diaSemanaFiltro) {
						continue // Pular este registro se não for do dia da semana desejado
					}
				}

				const rawFone = (r.cli_fone || '').toString().trim()
				if (!rawFone) continue
				const fone = rawFone.replace(/\D/g, '')
				if (!fone) continue
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
					if (nome && nome !== 'Sem nome') prev.nome = nome
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

		console.log(`✅ API Clientes: ${clientes.length} no ranking • ${map.size} únicos • ${totalLinhas} visitas`)

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
