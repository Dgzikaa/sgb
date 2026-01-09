import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = 'gemini-1.5-pro-latest'

interface CustosRequest {
  action: 'analise_cmv' | 'comparativo' | 'projecao' | 'otimizacao' | 'alerta_cmv';
  barId?: number;
  periodo?: 'semana' | 'mes' | 'trimestre';
  categoria?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, barId = 3, periodo = 'mes', categoria }: CustosRequest = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const hoje = new Date()
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const inicioSemana = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()))

    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

    switch (action) {
      case 'analise_cmv': {
        // Análise detalhada do CMV por categoria
        const { data: cmvSemanal } = await supabase
          .from('cmv_semanal')
          .select('*')
          .eq('bar_id', barId)
          .order('data_inicio', { ascending: false })
          .limit(8) // Últimas 8 semanas

        const { data: desempenho } = await supabase
          .from('desempenho_semanal')
          .select('numero_semana, ano, cmv, cmv_teorico, cmv_limpo, cmv_global_real, faturamento_total')
          .eq('bar_id', barId)
          .order('ano', { ascending: false })
          .order('numero_semana', { ascending: false })
          .limit(8)

        // Calcular médias e tendências
        const mediaCMV = desempenho?.reduce((acc, d) => acc + (d.cmv_global_real || 0), 0) / (desempenho?.length || 1)
        const cmvAtual = desempenho?.[0]?.cmv_global_real || 0
        const cmvAnterior = desempenho?.[1]?.cmv_global_real || 0
        const variacao = cmvAnterior > 0 ? ((cmvAtual - cmvAnterior) / cmvAnterior * 100) : 0

        // Identificar tendência
        let tendencia = 'estavel'
        if (desempenho && desempenho.length >= 3) {
          const ultimos3 = desempenho.slice(0, 3).map(d => d.cmv_global_real || 0)
          if (ultimos3[0] > ultimos3[1] && ultimos3[1] > ultimos3[2]) tendencia = 'subindo'
          if (ultimos3[0] < ultimos3[1] && ultimos3[1] < ultimos3[2]) tendencia = 'descendo'
        }

        // Status
        const status = cmvAtual <= 30 ? 'excelente' : 
                       cmvAtual <= 34 ? 'bom' : 
                       cmvAtual <= 38 ? 'atencao' : 'critico'

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              resumo: {
                cmvAtual,
                cmvAnterior,
                variacao,
                mediaCMV,
                metaCMV: 34,
                status,
                tendencia,
                economiaSeAtingirMeta: cmvAtual > 34 ? 
                  desempenho?.[0]?.faturamento_total * (cmvAtual - 34) / 100 : 0
              },
              historico: desempenho?.map(d => ({
                semana: d.numero_semana,
                ano: d.ano,
                cmv: d.cmv_global_real,
                cmvTeorico: d.cmv_teorico,
                cmvLimpo: d.cmv_limpo,
                faturamento: d.faturamento_total
              })),
              cmvDetalhado: cmvSemanal?.slice(0, 4),
              alertas: [
                cmvAtual > 34 && `⚠️ CMV acima da meta: ${cmvAtual.toFixed(1)}% (meta: 34%)`,
                tendencia === 'subindo' && '📈 Tendência de alta no CMV nas últimas semanas',
                cmvAtual > 38 && '🚨 CMV crítico! Ação imediata necessária'
              ].filter(Boolean)
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'comparativo': {
        // Comparativo CMV por categoria de produto
        const { data: produtos } = await supabase
          .from('contahub_analitico')
          .select('grp_desc, prd_desc, qtd, valorfinal, custo')
          .eq('bar_id', barId)
          .gte('trn_dtgerencial', inicioMes.toISOString().split('T')[0])

        // Agrupar por categoria
        const porCategoria: Record<string, { 
          categoria: string; 
          faturamento: number; 
          custo: number; 
          cmv: number;
          qtdProdutos: number;
        }> = {}

        produtos?.forEach(p => {
          const cat = p.grp_desc || 'Outros'
          if (!porCategoria[cat]) {
            porCategoria[cat] = { categoria: cat, faturamento: 0, custo: 0, cmv: 0, qtdProdutos: 0 }
          }
          porCategoria[cat].faturamento += p.valorfinal || 0
          porCategoria[cat].custo += (p.custo || 0) * (p.qtd || 1)
          porCategoria[cat].qtdProdutos++
        })

        // Calcular CMV por categoria
        Object.values(porCategoria).forEach(cat => {
          cat.cmv = cat.faturamento > 0 ? (cat.custo / cat.faturamento * 100) : 0
        })

        // Ordenar por CMV (maior primeiro = maior problema)
        const categorias = Object.values(porCategoria).sort((a, b) => b.cmv - a.cmv)

        // Top produtos com maior custo
        const topCustos = produtos
          ?.map(p => ({
            produto: p.prd_desc,
            categoria: p.grp_desc,
            faturamento: p.valorfinal,
            custo: (p.custo || 0) * (p.qtd || 1),
            cmv: p.valorfinal > 0 ? ((p.custo || 0) * (p.qtd || 1) / p.valorfinal * 100) : 0
          }))
          .sort((a, b) => b.cmv - a.cmv)
          .slice(0, 10)

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              porCategoria: categorias,
              topCustos,
              insights: [
                categorias[0]?.cmv > 40 && `🔴 ${categorias[0].categoria} tem CMV de ${categorias[0].cmv.toFixed(1)}% - precisa revisão`,
                topCustos?.[0]?.cmv > 50 && `⚠️ ${topCustos[0].produto} com CMV de ${topCustos[0].cmv.toFixed(1)}%`,
              ].filter(Boolean)
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'projecao': {
        // Projeção de CMV para próximo período
        const { data: historico } = await supabase
          .from('desempenho_semanal')
          .select('numero_semana, ano, cmv_global_real, faturamento_total')
          .eq('bar_id', barId)
          .order('ano', { ascending: false })
          .order('numero_semana', { ascending: false })
          .limit(12)

        const cmvs = historico?.map(h => h.cmv_global_real || 0) || []
        const mediaCMV = cmvs.reduce((a, b) => a + b, 0) / cmvs.length
        
        // Calcular desvio padrão
        const desvioPadrao = Math.sqrt(
          cmvs.reduce((acc, cmv) => acc + Math.pow(cmv - mediaCMV, 2), 0) / cmvs.length
        )

        // Tendência linear simples
        const n = cmvs.length
        const indices = Array.from({ length: n }, (_, i) => i)
        const sumX = indices.reduce((a, b) => a + b, 0)
        const sumY = cmvs.reduce((a, b) => a + b, 0)
        const sumXY = indices.reduce((acc, x, i) => acc + x * cmvs[i], 0)
        const sumX2 = indices.reduce((acc, x) => acc + x * x, 0)
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
        const intercept = (sumY - slope * sumX) / n
        
        // Projeção para próximas 4 semanas
        const projecoes = Array.from({ length: 4 }, (_, i) => ({
          semana: `S+${i + 1}`,
          cmvProjetado: Math.max(0, intercept + slope * (n + i)),
          cmvMinimo: Math.max(0, intercept + slope * (n + i) - desvioPadrao),
          cmvMaximo: intercept + slope * (n + i) + desvioPadrao
        }))

        // Usar IA para sugerir ações
        let sugestoesIA = []
        if (GEMINI_API_KEY && mediaCMV > 32) {
          const prompt = `
          Você é um consultor de custos para bares. Analise:
          
          CMV Médio: ${mediaCMV.toFixed(1)}%
          Tendência: ${slope > 0 ? 'Subindo' : 'Descendo'} ${Math.abs(slope).toFixed(2)}pp/semana
          Meta: 34%
          
          Dê 3 sugestões práticas e específicas para reduzir o CMV.
          Responda em JSON: { "sugestoes": ["sugestao1", "sugestao2", "sugestao3"] }
          `

          try {
            const geminiResponse = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: { temperature: 0.5, maxOutputTokens: 500 }
                })
              }
            )

            if (geminiResponse.ok) {
              const data = await geminiResponse.json()
              const text = data.candidates[0].content.parts[0].text
              const jsonMatch = text.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                sugestoesIA = parsed.sugestoes || []
              }
            }
          } catch (e) {
            console.error('Erro IA:', e)
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              historico: historico?.reverse().map(h => ({
                semana: `S${h.numero_semana}`,
                cmv: h.cmv_global_real,
                faturamento: h.faturamento_total
              })),
              estatisticas: {
                media: mediaCMV,
                desvioPadrao,
                tendencia: slope > 0 ? 'alta' : slope < 0 ? 'baixa' : 'estavel',
                variacaoSemana: slope
              },
              projecoes,
              sugestoesIA,
              alerta: mediaCMV > 34 ? 
                `CMV médio acima da meta em ${(mediaCMV - 34).toFixed(1)}pp` : null
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'otimizacao': {
        // Sugestões de otimização de custos
        const { data: produtos } = await supabase
          .from('contahub_analitico')
          .select('prd_desc, grp_desc, qtd, valorfinal, custo')
          .eq('bar_id', barId)
          .gte('trn_dtgerencial', inicioMes.toISOString().split('T')[0])

        // Produtos com margem baixa
        const produtosAnalise = produtos
          ?.map(p => ({
            produto: p.prd_desc,
            categoria: p.grp_desc,
            qtdVendida: p.qtd,
            faturamento: p.valorfinal,
            custo: (p.custo || 0) * (p.qtd || 1),
            margem: p.valorfinal > 0 ? (1 - ((p.custo || 0) * (p.qtd || 1)) / p.valorfinal) * 100 : 0,
            cmv: p.valorfinal > 0 ? ((p.custo || 0) * (p.qtd || 1)) / p.valorfinal * 100 : 0
          }))
          .filter(p => p.faturamento > 100) // Só produtos relevantes
          .sort((a, b) => a.margem - b.margem) || []

        // Produtos para renegociar (alta venda + baixa margem)
        const paraRenegociar = produtosAnalise
          .filter(p => p.qtdVendida > 10 && p.margem < 50)
          .slice(0, 5)

        // Produtos para retirar do cardápio (baixa venda + baixa margem)
        const paraRetirar = produtosAnalise
          .filter(p => p.qtdVendida < 5 && p.margem < 30)
          .slice(0, 5)

        // Produtos estrela (alta venda + alta margem)
        const estrelas = produtosAnalise
          .filter(p => p.qtdVendida > 10 && p.margem > 60)
          .sort((a, b) => b.faturamento - a.faturamento)
          .slice(0, 5)

        // Calcular impacto potencial
        const impactoRenegociacao = paraRenegociar.reduce((acc, p) => 
          acc + p.custo * 0.15, 0) // Se reduzir 15% do custo

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              resumo: {
                totalProdutosAnalisados: produtosAnalise.length,
                produtosMargemBaixa: produtosAnalise.filter(p => p.margem < 40).length,
                potencialEconomia: formatCurrency(impactoRenegociacao)
              },
              acoes: {
                renegociar: {
                  titulo: '🤝 Renegociar com Fornecedores',
                  descricao: 'Produtos com alto giro e custo elevado',
                  itens: paraRenegociar,
                  impactoEstimado: formatCurrency(impactoRenegociacao)
                },
                retirar: {
                  titulo: '🗑️ Avaliar Retirada do Cardápio',
                  descricao: 'Produtos com baixo giro e baixa margem',
                  itens: paraRetirar
                },
                promover: {
                  titulo: '⭐ Produtos Estrela para Promover',
                  descricao: 'Alto giro e alta margem',
                  itens: estrelas
                }
              },
              dicas: [
                'Renegocie contratos com os 3 principais fornecedores',
                'Avalie receitas para reduzir desperdício',
                'Compare preços com fornecedores alternativos',
                'Otimize porções para manter qualidade com menor custo'
              ]
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'alerta_cmv': {
        // Verificar se CMV precisa de alerta
        const { data: ultimaSemana } = await supabase
          .from('desempenho_semanal')
          .select('numero_semana, ano, cmv_global_real, faturamento_total')
          .eq('bar_id', barId)
          .order('ano', { ascending: false })
          .order('numero_semana', { ascending: false })
          .limit(1)
          .single()

        const cmv = ultimaSemana?.cmv_global_real || 0
        const faturamento = ultimaSemana?.faturamento_total || 0

        const alertas = []
        
        if (cmv > 38) {
          alertas.push({
            nivel: 'critico',
            titulo: '🚨 CMV CRÍTICO',
            mensagem: `CMV em ${cmv.toFixed(1)}% - 4pp acima da meta!`,
            impacto: formatCurrency(faturamento * (cmv - 34) / 100),
            acaoImediata: 'Revisar compras e verificar desperdícios'
          })
        } else if (cmv > 34) {
          alertas.push({
            nivel: 'atencao',
            titulo: '⚠️ CMV Acima da Meta',
            mensagem: `CMV em ${cmv.toFixed(1)}% - ${(cmv - 34).toFixed(1)}pp acima`,
            impacto: formatCurrency(faturamento * (cmv - 34) / 100),
            acao: 'Monitorar e ajustar próxima semana'
          })
        } else if (cmv <= 30) {
          alertas.push({
            nivel: 'sucesso',
            titulo: '✅ CMV Excelente',
            mensagem: `CMV em ${cmv.toFixed(1)}% - ${(34 - cmv).toFixed(1)}pp abaixo da meta!`,
            economia: formatCurrency(faturamento * (34 - cmv) / 100)
          })
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              cmvAtual: cmv,
              meta: 34,
              status: cmv <= 30 ? 'excelente' : cmv <= 34 ? 'bom' : cmv <= 38 ? 'atencao' : 'critico',
              alertas,
              deveSendToDiscord: cmv > 36
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Ação inválida' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

  } catch (error) {
    console.error('Erro no agente de custos:', error)
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
