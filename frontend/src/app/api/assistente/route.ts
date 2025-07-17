import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { getVendasData, getClientesData, getProdutoMaisVendido, getAnaliseCompleta, getDadosSemana, getHistoricoDiaSemana } from '@/lib/database'

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Mensagem Ã© obrigatÃ³ria' }, { status: 400 })
    }

    // ðŸš€ BUSCAR DADOS REAIS usando as funÃ§Ãµes jÃ¡ existentes do frontend
    let contextoDados = ''
    let vendasData = null
    let clientesData = null
    let produtoMaisVendido = null
    
    try {
      console.log('ðŸ“Š Buscando dados do sistema usando funÃ§Ãµes existentes...')
      
      // Usar as funÃ§Ãµes jÃ¡ testadas e em produÃ§Ã£o + anÃ¡lises avanÃ§adas
      const hoje = new Date().toISOString().split('T')[0]
      
      const dados = await Promise.all([
        getVendasData().catch(err => {
          console.warn('âš ï¸ Erro ao buscar vendas:', err.message)
          return null
        }),
        getClientesData().catch(err => {
          console.warn('âš ï¸ Erro ao buscar clientes:', err.message)
          return null
        }),
        getProdutoMaisVendido().catch(err => {
          console.warn('âš ï¸ Erro ao buscar produto mais vendido:', err.message)
          return null
        }),
        getAnaliseCompleta('semana').catch(err => {
          console.warn('âš ï¸ Erro ao buscar anÃ¡lise completa:', err.message)
          return null
        })
      ])
      
      vendasData = dados[0]
      clientesData = dados[1]
      produtoMaisVendido = dados[2]
      const analiseCompleta = dados[3]

      console.log('ðŸ“ˆ Dados obtidos:', {
        vendas: vendasData ? 'OK' : 'ERRO',
        clientes: clientesData ? 'OK' : 'ERRO', 
        produto: produtoMaisVendido ? 'OK' : 'ERRO',
        analiseCompleta: analiseCompleta ? 'OK' : 'ERRO'
      })

      // Montar contexto com dados reais
      contextoDados = `
ðŸ“Š DADOS ATUAIS DO BAR ORDINÃRIO (usando sistema de produÃ§Ã£o):

ðŸ’° VENDAS:
${vendasData ? `
- Vendas hoje: R$ ${vendasData.vendas_hoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Vendas da semana: R$ ${vendasData.vendas_semana.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Total de pedidos hoje: ${vendasData.total_pedidos}
- Ticket mÃ©dio: R$ ${vendasData.ticket_medio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
` : '- Dados de vendas indisponÃ­veis no momento'}

ðŸ‘¥ CLIENTES:
${clientesData ? `
- Total de clientes hoje: ${clientesData.total_clientes_hoje}
- Novos clientes: ${clientesData.novos_clientes}
- Clientes recorrentes: ${clientesData.clientes_recorrentes}
` : '- Dados de clientes indisponÃ­veis no momento'}

ðŸ† PRODUTO MAIS VENDIDO:
${produtoMaisVendido ? `
- Produto: ${produtoMaisVendido.produto}
- Categoria: ${produtoMaisVendido.grupo}
- Quantidade vendida: ${produtoMaisVendido.quantidade}
- Valor total: R$ ${produtoMaisVendido.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
` : '- Dados de produtos indisponÃ­veis no momento'}

ðŸ“Š ANÃLISE AVANÃ‡ADA DA SEMANA:
${analiseCompleta ? `
- ðŸ† MELHOR DIA: ${analiseCompleta.melhorDiaSemana.dia} (R$ ${analiseCompleta.melhorDiaSemana.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
- ðŸ“ˆ PERFORMANCE DA SEMANA: ${(analiseCompleta.insights.performanceSemana * 100).toFixed(0)}% acima da mÃ©dia
- ðŸŽ¯ CONSISTÃŠNCIA: ${(analiseCompleta.insights.consistencia * 100).toFixed(0)}% dos dias acima de 80% da mÃ©dia
- ðŸ“Š MÃ‰DIA DIÃRIA: R$ ${analiseCompleta.medias.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- ðŸ‘¥ MÃ‰DIA CLIENTES/DIA: ${analiseCompleta.medias.clientes.toFixed(0)} pessoas

ðŸ‘¥ TOTAL CLIENTES DA SEMANA: ${analiseCompleta.dadosSemana.reduce((sum, dia) => sum + dia.clientes, 0)}
ðŸ’° TOTAL FATURAMENTO DA SEMANA: R$ ${analiseCompleta.dadosSemana.reduce((sum, dia) => sum + dia.faturamento, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

DADOS POR DIA DA SEMANA:
${analiseCompleta.dadosSemana.map((dia: any) => 
  `  ${dia.dia}: R$ ${dia.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${dia.clientes} pessoas)`
).join('\n')}
` : '- AnÃ¡lise avanÃ§ada indisponÃ­vel no momento'}

ðŸª INFORMAÃ‡Ã•ES DO BAR:
- Nome: Bar OrdinÃ¡rio
- Sistema: SGB (Sistema de GestÃ£o de Bares)
- Dados em tempo real via Supabase
- IntegraÃ§Ã£o com mÃºltiplas fontes (Contahub, Sympla, Yuzer)

ðŸ’¡ INSTRUÃ‡Ã•ES AVANÃ‡ADAS:
- Use SEMPRE os dados acima para responder perguntas sobre vendas, clientes e produtos
- RESPONDA ANÃLISES COMPLEXAS como "qual foi o melhor dia da semana" usando os dados detalhados
- COMPARE DIAS: Use os dados por dia da semana para identificar padrÃµes e tendÃªncias
- ANÃLISE DE PERFORMANCE: Use os insights de consistÃªncia e performance para dar sugestÃµes
- IDENTIFIQUE OPORTUNIDADES: Dias com performance abaixo da mÃ©dia sÃ£o oportunidades de melhoria
- Os valores mostram o desempenho real do estabelecimento em tempo real
- Se algum dado estiver indisponÃ­vel, informe e sugira verificar mais tarde
- Mantenha tom profissional mas amigÃ¡vel e seja especÃ­fico com nÃºmeros
- DÃª insights ACTIONABLES baseados nos dados reais
      `.trim()

    } catch (error) {
      console.error('âŒ Erro ao buscar dados para contexto:', error)
      contextoDados = `
âš ï¸ DADOS TEMPORARIAMENTE INDISPONÃVEIS

NÃ£o foi possÃ­vel acessar os dados em tempo real do sistema neste momento.
Posso ainda ajudar com:
- InformaÃ§Ãµes gerais sobre gestÃ£o de bares
- AnÃ¡lise de tendÃªncias e estratÃ©gias
- DÃºvidas sobre o sistema SGB
- Planejamento e metas

Por favor, tente novamente em alguns minutos para dados atualizados.
      `.trim()
    }

    // Prompt do sistema para o assistente
    const systemPrompt = `
VocÃª Ã© o assistente inteligente do SGB (Sistema de GestÃ£o de Bares), especializado no Bar OrdinÃ¡rio.

${contextoDados}

PAPEL:
VocÃª Ã© um consultor especialista em gestÃ£o de bares que tem acesso aos dados reais do estabelecimento. 
Suas respostas devem ser:
- Baseadas nos dados reais fornecidos acima
- PrÃ¡ticas e actionÃ¡veis para gestores de bar
- Profissionais mas com tom amigÃ¡vel
- Focadas em insights que ajudem na tomada de decisÃ£o

CAPACIDADES:
- AnÃ¡lise de vendas e performance
- IdentificaÃ§Ã£o de tendÃªncias e oportunidades
- SugestÃµes de melhorias operacionais
- ComparaÃ§Ãµes com benchmarks do setor
- ExplicaÃ§Ã£o clara de mÃ©tricas importantes

Sempre mencione a fonte dos dados (sistema SGB) e seja especÃ­fico nos nÃºmeros quando relevante.
    `.trim()

    // Chamar OpenAI com contexto real
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: systemPrompt
        },
        { 
          role: "user", 
          content: message 
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    const resposta = completion.choices[0]?.message?.content || 'Desculpe, nÃ£o consegui processar sua solicitaÃ§Ã£o.'

    return NextResponse.json({ 
      message: resposta,
      dados_utilizados: {
        vendas_disponivel: vendasData !== null,
        clientes_disponivel: clientesData !== null,
        produto_disponivel: produtoMaisVendido !== null,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('âŒ Erro na API do assistente:', error)
    
    return NextResponse.json({ 
      message: 'Desculpe, ocorreu um erro interno. Tente novamente em alguns instantes.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Erro interno'
    }, { status: 500 })
  }
} 
