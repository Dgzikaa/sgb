import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 segundos para processar

interface ProdutoFavorito {
  produto: string
  categoria: string
  quantidade: number
  vezes_pediu: number
}

interface CategoriaFavorita {
  categoria: string
  quantidade: number
  valor_total: number
}

interface PerfilCliente {
  telefone: string
  nome: string
  email: string | null
  total_visitas: number
  total_itens_consumidos: number
  valor_total_consumo: number
  primeira_visita: string
  ultima_visita: string
  produtos_favoritos: ProdutoFavorito[]
  categorias_favoritas: CategoriaFavorita[]
  tags: string[]
  ticket_medio_consumo: number
  frequencia_mensal: number
  dias_preferidos: string[]
}

export async function POST(request: NextRequest) {
  try {
    // Autenticar usuário
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuário não autenticado')
    }

    const supabase = await getAdminClient()
    const body = await request.json().catch(() => ({}))
    const barId = body.bar_id

    if (!barId) {
      return NextResponse.json(
        { error: 'bar_id é obrigatório' },
        { status: 400 }
      )
    }

    console.log(`🚀 Iniciando sync de perfil de consumo para bar_id=${barId}`)
    const startTime = Date.now()

    // 1. Buscar clientes com telefone identificado que têm consumo
    const { data: clientesComConsumo, error: clientesError } = await supabase.rpc(
      'get_clientes_com_perfil_consumo',
      { p_bar_id: barId }
    )

    // Se a função não existir, criar ela primeiro
    if (clientesError?.message?.includes('does not exist')) {
      console.log('📝 Função RPC não existe, executando query direta...')
      
      // Query direta para buscar clientes com consumo identificado
      const { data: perfisRaw, error: perfisError } = await supabase
        .from('contahub_vendas')
        .select(`
          cli_fone,
          cli_nome,
          cli_email,
          dt_gerencial,
          vd_mesadesc
        `)
        .eq('bar_id', barId)
        .not('cli_fone', 'is', null)
        .neq('cli_fone', '')
        .order('cli_fone')

      if (perfisError) {
        console.error('❌ Erro ao buscar clientes:', perfisError)
        return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 })
      }

      // Agrupar por telefone
      const clientesMap = new Map<string, {
        telefone: string
        nome: string
        email: string | null
        comandas: Set<string>
        datas: Set<string>
      }>()

      for (const row of perfisRaw || []) {
        const telefone = normalizarTelefone(row.cli_fone)
        if (!telefone) continue

        if (!clientesMap.has(telefone)) {
          clientesMap.set(telefone, {
            telefone,
            nome: row.cli_nome || 'Cliente',
            email: row.cli_email || null,
            comandas: new Set(),
            datas: new Set()
          })
        }

        const cliente = clientesMap.get(telefone)!
        if (row.vd_mesadesc) cliente.comandas.add(row.vd_mesadesc)
        if (row.dt_gerencial) cliente.datas.add(row.dt_gerencial)
        
        // Atualizar nome se for mais completo
        if (row.cli_nome && row.cli_nome.length > cliente.nome.length) {
          cliente.nome = row.cli_nome
        }
      }

      console.log(`📊 ${clientesMap.size} clientes únicos encontrados`)

      // 2. Para cada cliente, buscar o consumo detalhado
      const perfisProcessados: PerfilCliente[] = []
      let processados = 0

      for (const [telefone, cliente] of clientesMap.entries()) {
        if (cliente.comandas.size === 0) continue

        // Buscar consumo para as comandas deste cliente
        const comandasArray = Array.from(cliente.comandas)
        const datasArray = Array.from(cliente.datas)

        // Buscar itens consumidos nessas comandas/datas
        const { data: itensConsumo, error: itensError } = await supabase
          .from('contahub_analitico')
          .select('prd_desc, grp_desc, qtd, valorfinal, trn_dtgerencial')
          .eq('bar_id', barId)
          .in('comandaorigem', comandasArray)
          .in('trn_dtgerencial', datasArray)

        if (itensError) {
          console.warn(`⚠️ Erro ao buscar itens para ${telefone}:`, itensError)
          continue
        }

        if (!itensConsumo || itensConsumo.length === 0) continue

        // Processar itens consumidos
        const produtosMap = new Map<string, { categoria: string; quantidade: number; vezes: number; valor: number }>()
        const categoriasMap = new Map<string, { quantidade: number; valor: number }>()
        const diasMap = new Map<string, number>()
        
        let totalItens = 0
        let totalValor = 0
        const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

        for (const item of itensConsumo) {
          const produto = item.prd_desc || 'Produto'
          const categoria = item.grp_desc || 'Outros'
          const qtd = parseFloat(item.qtd) || 0
          const valor = parseFloat(item.valorfinal) || 0

          // Ignorar insumos (produtos com [IN])
          if (produto.startsWith('[IN]') || produto.startsWith('[PD]') || produto.startsWith('[DD]')) continue

          totalItens += qtd
          totalValor += valor

          // Produtos
          if (!produtosMap.has(produto)) {
            produtosMap.set(produto, { categoria, quantidade: 0, vezes: 0, valor: 0 })
          }
          const p = produtosMap.get(produto)!
          p.quantidade += qtd
          p.vezes += 1
          p.valor += valor

          // Categorias
          if (!categoriasMap.has(categoria)) {
            categoriasMap.set(categoria, { quantidade: 0, valor: 0 })
          }
          const c = categoriasMap.get(categoria)!
          c.quantidade += qtd
          c.valor += valor

          // Dias da semana
          if (item.trn_dtgerencial) {
            const data = new Date(item.trn_dtgerencial + 'T12:00:00Z')
            const dia = diasSemana[data.getUTCDay()]
            diasMap.set(dia, (diasMap.get(dia) || 0) + 1)
          }
        }

        // Ordenar e pegar top 10 produtos
        const produtosFavoritos: ProdutoFavorito[] = Array.from(produtosMap.entries())
          .sort((a, b) => b[1].quantidade - a[1].quantidade)
          .slice(0, 10)
          .map(([produto, data]) => ({
            produto,
            categoria: data.categoria,
            quantidade: Math.round(data.quantidade * 100) / 100,
            vezes_pediu: data.vezes
          }))

        // Ordenar e pegar top 5 categorias
        const categoriasFavoritas: CategoriaFavorita[] = Array.from(categoriasMap.entries())
          .sort((a, b) => b[1].quantidade - a[1].quantidade)
          .slice(0, 5)
          .map(([categoria, data]) => ({
            categoria,
            quantidade: Math.round(data.quantidade * 100) / 100,
            valor_total: Math.round(data.valor * 100) / 100
          }))

        // Top 2 dias preferidos
        const diasPreferidos = Array.from(diasMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([dia]) => dia)

        // Gerar tags automáticas
        const tags: string[] = []
        
        // Tag baseada em categoria principal
        if (categoriasFavoritas.length > 0) {
          const catPrincipal = categoriasFavoritas[0].categoria.toLowerCase()
          if (catPrincipal.includes('cerveja')) tags.push('cervejeiro')
          if (catPrincipal.includes('drink') || catPrincipal.includes('coquetel')) tags.push('drink_lover')
          if (catPrincipal.includes('shot') || catPrincipal.includes('dose')) tags.push('destilados')
          if (catPrincipal.includes('comida') || catPrincipal.includes('prato') || catPrincipal.includes('petisco')) tags.push('foodie')
        }

        // Tag baseada em produto favorito
        if (produtosFavoritos.length > 0) {
          const prodPrincipal = produtosFavoritos[0].produto.toLowerCase()
          if (prodPrincipal.includes('spaten')) tags.push('prefere_spaten')
          if (prodPrincipal.includes('corona')) tags.push('prefere_corona')
          if (prodPrincipal.includes('stella')) tags.push('prefere_stella')
          if (prodPrincipal.includes('original')) tags.push('prefere_original')
          if (prodPrincipal.includes('gin')) tags.push('prefere_gin')
          if (prodPrincipal.includes('whisky') || prodPrincipal.includes('chivas')) tags.push('prefere_whisky')
        }

        // Tag de frequência
        const totalVisitas = cliente.datas.size
        if (totalVisitas >= 20) tags.push('cliente_vip')
        else if (totalVisitas >= 10) tags.push('cliente_frequente')
        else if (totalVisitas >= 5) tags.push('cliente_regular')

        // Tag de dia preferido
        if (diasPreferidos.length > 0) {
          tags.push(`frequenta_${diasPreferidos[0].toLowerCase()}`)
        }

        // Calcular métricas
        const datasOrdenadas = Array.from(cliente.datas).sort()
        const primeiraVisita = datasOrdenadas[0]
        const ultimaVisita = datasOrdenadas[datasOrdenadas.length - 1]
        
        // Frequência mensal (visitas / meses de relacionamento)
        const mesesRelacionamento = Math.max(1, 
          Math.ceil((new Date(ultimaVisita).getTime() - new Date(primeiraVisita).getTime()) / (30 * 24 * 60 * 60 * 1000))
        )
        const frequenciaMensal = Math.round((totalVisitas / mesesRelacionamento) * 100) / 100

        const perfil: PerfilCliente = {
          telefone,
          nome: cliente.nome,
          email: cliente.email,
          total_visitas: totalVisitas,
          total_itens_consumidos: Math.round(totalItens),
          valor_total_consumo: Math.round(totalValor * 100) / 100,
          primeira_visita: primeiraVisita,
          ultima_visita: ultimaVisita,
          produtos_favoritos: produtosFavoritos,
          categorias_favoritas: categoriasFavoritas,
          tags,
          ticket_medio_consumo: totalVisitas > 0 ? Math.round((totalValor / totalVisitas) * 100) / 100 : 0,
          frequencia_mensal: frequenciaMensal,
          dias_preferidos: diasPreferidos
        }

        perfisProcessados.push(perfil)
        processados++

        // Log de progresso
        if (processados % 100 === 0) {
          console.log(`📈 Processados ${processados}/${clientesMap.size} clientes...`)
        }
      }

      console.log(`✅ ${perfisProcessados.length} perfis processados`)

      // 3. Upsert dos perfis no banco
      if (perfisProcessados.length > 0) {
        // Processar em batches de 100
        const batchSize = 100
        let inseridos = 0

        for (let i = 0; i < perfisProcessados.length; i += batchSize) {
          const batch = perfisProcessados.slice(i, i + batchSize)
          
          const { error: upsertError } = await supabase
            .from('cliente_perfil_consumo')
            .upsert(
              batch.map(p => ({
                bar_id: barId,
                telefone: p.telefone,
                nome: p.nome,
                email: p.email,
                total_visitas: p.total_visitas,
                total_itens_consumidos: p.total_itens_consumidos,
                valor_total_consumo: p.valor_total_consumo,
                primeira_visita: p.primeira_visita,
                ultima_visita: p.ultima_visita,
                produtos_favoritos: p.produtos_favoritos,
                categorias_favoritas: p.categorias_favoritas,
                tags: p.tags,
                ticket_medio_consumo: p.ticket_medio_consumo,
                frequencia_mensal: p.frequencia_mensal,
                dias_preferidos: p.dias_preferidos,
                updated_at: new Date().toISOString()
              })),
              { onConflict: 'bar_id,telefone' }
            )

          if (upsertError) {
            console.error('❌ Erro no upsert:', upsertError)
          } else {
            inseridos += batch.length
          }
        }

        console.log(`💾 ${inseridos} perfis salvos no banco`)
      }

      const tempoMs = Date.now() - startTime
      console.log(`🎉 Sync concluído em ${tempoMs}ms`)

      return NextResponse.json({
        success: true,
        clientes_processados: perfisProcessados.length,
        tempo_ms: tempoMs
      })
    }

    // Se chegou aqui, a função RPC existe
    console.log(`✅ ${clientesComConsumo?.length || 0} clientes encontrados via RPC`)
    
    return NextResponse.json({
      success: true,
      clientes_processados: clientesComConsumo?.length || 0
    })

  } catch (error) {
    console.error('❌ Erro no sync de perfil de consumo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para normalizar telefone
function normalizarTelefone(telefone: string | null): string | null {
  if (!telefone) return null
  
  let fone = telefone.toString().replace(/\D/g, '')
  if (!fone || fone.length < 10) return null
  
  // Adicionar 9 se necessário
  if (fone.length === 10) {
    const ddds = ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', 
                  '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', 
                  '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', 
                  '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', 
                  '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99']
    
    if (ddds.includes(fone.substring(0, 2))) {
      fone = fone.substring(0, 2) + '9' + fone.substring(2)
    }
  }
  
  return fone
}

