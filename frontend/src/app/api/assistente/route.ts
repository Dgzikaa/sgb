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
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })
    }

    // 🚀 BUSCAR DADOS REAIS usando as funções já existentes do frontend
    let contextoDados = ''
    let vendasData = null
    let clientesData = null
    let produtoMaisVendido = null
    
    try {
      console.log('📊 Buscando dados do sistema usando funções existentes...')
      
      // Usar as funções já testadas e em produção + análises avançadas
      const hoje = new Date().toISOString().split('T')[0]
      
      const dados = await Promise.all([
        getVendasData().catch(err => {
          console.warn('⚠️ Erro ao buscar vendas:', err.message)
          return null
        }),
        getClientesData().catch(err => {
          console.warn('⚠️ Erro ao buscar clientes:', err.message)
          return null
        }),
        getProdutoMaisVendido().catch(err => {
          console.warn('⚠️ Erro ao buscar produto mais vendido:', err.message)
          return null
        }),
        getAnaliseCompleta('semana').catch(err => {
          console.warn('⚠️ Erro ao buscar análise completa:', err.message)
          return null
        })
      ])
      
      vendasData = dados[0]
      clientesData = dados[1]
      produtoMaisVendido = dados[2]
      const analiseCompleta = dados[3]

      console.log('📈 Dados obtidos:', {
        vendas: vendasData ? 'OK' : 'ERRO',
        clientes: clientesData ? 'OK' : 'ERRO', 
        produto: produtoMaisVendido ? 'OK' : 'ERRO',
        analiseCompleta: analiseCompleta ? 'OK' : 'ERRO'
      })

      // Montar contexto com dados reais
      contextoDados = `
📊 DADOS ATUAIS DO BAR ORDINÁRIO (usando sistema de produção):

💰 VENDAS:
${vendasData ? `
- Vendas hoje: R$ ${vendasData.vendas_hoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Vendas da semana: R$ ${vendasData.vendas_semana.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Total de pedidos hoje: ${vendasData.total_pedidos}
- Ticket médio: R$ ${vendasData.ticket_medio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
` : '- Dados de vendas indisponíveis no momento'}

👥 CLIENTES:
${clientesData ? `
- Total de clientes hoje: ${clientesData.total_clientes_hoje}
- Novos clientes: ${clientesData.novos_clientes}
- Clientes recorrentes: ${clientesData.clientes_recorrentes}
` : '- Dados de clientes indisponíveis no momento'}

🏆 PRODUTO MAIS VENDIDO:
${produtoMaisVendido ? `
- Produto: ${produtoMaisVendido.produto}
- Categoria: ${produtoMaisVendido.grupo}
- Quantidade vendida: ${produtoMaisVendido.quantidade}
- Valor total: R$ ${produtoMaisVendido.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
` : '- Dados de produtos indisponíveis no momento'}

📊 ANÁLISE AVANÇADA DA SEMANA:
${analiseCompleta ? `
- 🏆 MELHOR DIA: ${analiseCompleta.melhorDiaSemana.dia} (R$ ${analiseCompleta.melhorDiaSemana.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
- 📈 PERFORMANCE DA SEMANA: ${(analiseCompleta.insights.performanceSemana * 100).toFixed(0)}% acima da média
- 🎯 CONSISTÊNCIA: ${(analiseCompleta.insights.consistencia * 100).toFixed(0)}% dos dias acima de 80% da média
- 📊 MÉDIA DIÁRIA: R$ ${analiseCompleta.medias.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- 👥 MÉDIA CLIENTES/DIA: ${analiseCompleta.medias.clientes.toFixed(0)} pessoas

👥 TOTAL CLIENTES DA SEMANA: ${analiseCompleta.dadosSemana.reduce((sum, dia) => sum + dia.clientes, 0)}
💰 TOTAL FATURAMENTO DA SEMANA: R$ ${analiseCompleta.dadosSemana.reduce((sum, dia) => sum + dia.faturamento, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

DADOS POR DIA DA SEMANA:
${analiseCompleta.dadosSemana.map((dia: any) => 
  `  ${dia.dia}: R$ ${dia.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${dia.clientes} pessoas)`
).join('\n')}
` : '- Análise avançada indisponível no momento'}

🏪 INFORMAÇÕES DO BAR:
- Nome: Bar Ordinário
- Sistema: SGB (Sistema de Gestão de Bares)
- Dados em tempo real via Supabase
- Integração com múltiplas fontes (Contahub, Sympla, Yuzer)

💡 INSTRUÇÕES AVANÇADAS:
- Use SEMPRE os dados acima para responder perguntas sobre vendas, clientes e produtos
- RESPONDA ANÁLISES COMPLEXAS como "qual foi o melhor dia da semana" usando os dados detalhados
- COMPARE DIAS: Use os dados por dia da semana para identificar padrões e tendências
- ANÁLISE DE PERFORMANCE: Use os insights de consistência e performance para dar sugestões
- IDENTIFIQUE OPORTUNIDADES: Dias com performance abaixo da média são oportunidades de melhoria
- Os valores mostram o desempenho real do estabelecimento em tempo real
- Se algum dado estiver indisponível, informe e sugira verificar mais tarde
- Mantenha tom profissional mas amigável e seja específico com números
- Dê insights ACTIONABLES baseados nos dados reais
      `.trim()

    } catch (error) {
      console.error('❌ Erro ao buscar dados para contexto:', error)
      contextoDados = `
⚠️ DADOS TEMPORARIAMENTE INDISPONÍVEIS

Não foi possível acessar os dados em tempo real do sistema neste momento.
Posso ainda ajudar com:
- Informações gerais sobre gestão de bares
- Análise de tendências e estratégias
- Dúvidas sobre o sistema SGB
- Planejamento e metas

Por favor, tente novamente em alguns minutos para dados atualizados.
      `.trim()
    }

    // Prompt do sistema para o assistente
    const systemPrompt = `
Você é o assistente inteligente do SGB (Sistema de Gestão de Bares), especializado no Bar Ordinário.

${contextoDados}

PAPEL:
Você é um consultor especialista em gestão de bares que tem acesso aos dados reais do estabelecimento. 
Suas respostas devem ser:
- Baseadas nos dados reais fornecidos acima
- Práticas e actionáveis para gestores de bar
- Profissionais mas com tom amigável
- Focadas em insights que ajudem na tomada de decisão

CAPACIDADES:
- Análise de vendas e performance
- Identificação de tendências e oportunidades
- Sugestões de melhorias operacionais
- Comparações com benchmarks do setor
- Explicação clara de métricas importantes

Sempre mencione a fonte dos dados (sistema SGB) e seja específico nos números quando relevante.
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

    const resposta = completion.choices[0]?.message?.content || 'Desculpe, não consegui processar sua solicitação.'

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
    console.error('❌ Erro na API do assistente:', error)
    
    return NextResponse.json({ 
      message: 'Desculpe, ocorreu um erro interno. Tente novamente em alguns instantes.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Erro interno'
    }, { status: 500 })
  }
} 
