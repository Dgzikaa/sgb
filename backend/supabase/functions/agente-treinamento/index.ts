import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TreinamentoRequest {
  action: 'faq' | 'glossario' | 'tutorial' | 'ajuda_contextual' | 'dica_do_dia';
  barId?: number;
  contexto?: {
    pagina?: string;
    termo?: string;
    topico?: string;
  };
}

// Base de conhecimento do sistema
const GLOSSARIO: Record<string, { termo: string; definicao: string; exemplo?: string; relacionados?: string[] }> = {
  'cmv': {
    termo: 'CMV (Custo de Mercadoria Vendida)',
    definicao: 'Percentual do faturamento gasto com insumos e produtos vendidos. Meta: < 34%',
    exemplo: 'Se faturou R$100.000 e gastou R$30.000 em insumos, CMV = 30%',
    relacionados: ['cmv_teorico', 'cmv_limpo', 'ficha_tecnica']
  },
  'cmo': {
    termo: 'CMO (Custo de Mão de Obra)',
    definicao: 'Percentual do faturamento gasto com folha de pagamento. Meta: < 20%',
    exemplo: 'Inclui salários, encargos, benefícios e extras',
    relacionados: ['cmv', 'dre']
  },
  'ticket_medio': {
    termo: 'Ticket Médio',
    definicao: 'Valor médio gasto por cliente. Calculado: Faturamento ÷ Nº Clientes',
    exemplo: 'R$50.000 faturamento ÷ 500 clientes = R$100 ticket médio',
    relacionados: ['ticket_entrada', 'ticket_bar', 'publico']
  },
  'ticket_entrada': {
    termo: 'Ticket de Entrada (Couvert)',
    definicao: 'Valor médio cobrado na entrada por cliente. Inclui couvert artístico e consumação mínima',
    relacionados: ['ticket_bar', 'sympla']
  },
  'ticket_bar': {
    termo: 'Ticket Bar (Consumo)',
    definicao: 'Valor médio gasto em consumo (bebidas e comidas) por cliente',
    relacionados: ['ticket_entrada', 'produtos']
  },
  'pax': {
    termo: 'PAX (Público)',
    definicao: 'Número de clientes/pessoas no evento. Pode ser planejado (cl_plan) ou real (cl_real)',
    relacionados: ['lotacao', 'reservas']
  },
  'atingimento': {
    termo: 'Atingimento de Meta',
    definicao: 'Percentual alcançado da meta. 100% = meta batida. Calculado: Real ÷ Meta × 100',
    exemplo: 'Faturou R$90.000 de uma meta de R$100.000 = 90% atingimento'
  },
  'dre': {
    termo: 'DRE (Demonstrativo de Resultado)',
    definicao: 'Relatório financeiro que mostra receitas, custos, despesas e lucro do período',
    relacionados: ['cmv', 'cmo', 'ebitda']
  },
  'nps': {
    termo: 'NPS (Net Promoter Score)',
    definicao: 'Métrica de satisfação do cliente. Varia de -100 a +100. Meta: > 50',
    exemplo: '% Promotores - % Detratores = NPS'
  },
  'sympla': {
    termo: 'Sympla',
    definicao: 'Plataforma de venda de ingressos online. Integrada para importar vendas antecipadas',
    relacionados: ['yuzer', 'getin']
  },
  'contahub': {
    termo: 'ContaHub',
    definicao: 'Sistema de PDV (Ponto de Venda) usado no bar. Fonte principal de dados de vendas',
    relacionados: ['produtos', 'pagamentos']
  },
  'nibo': {
    termo: 'NIBO',
    definicao: 'Sistema financeiro para controle de contas a pagar e receber',
    relacionados: ['dre', 'fluxo_caixa']
  },
  'getin': {
    termo: 'GetIn',
    definicao: 'Sistema de reservas de mesas. Integrado para importar reservas e no-shows',
    relacionados: ['reservas', 'no_show']
  },
  'ficha_tecnica': {
    termo: 'Ficha Técnica',
    definicao: 'Receita detalhada de um produto com ingredientes, quantidades e custos',
    relacionados: ['cmv', 'insumos', 'receitas']
  }
}

const FAQ: { pergunta: string; resposta: string; categoria: string }[] = [
  {
    pergunta: 'Como é calculado o CMV?',
    resposta: 'CMV = (Custo dos Produtos Vendidos ÷ Faturamento Bruto) × 100. A meta é ficar abaixo de 34%.',
    categoria: 'custos'
  },
  {
    pergunta: 'Como adicionar um novo evento?',
    resposta: 'Acesse Planejamento Comercial > clique em um dia no calendário > preencha os dados do evento.',
    categoria: 'eventos'
  },
  {
    pergunta: 'Por que os dados do ContaHub não estão aparecendo?',
    resposta: 'Verifique se: 1) O sync está ativo em Configurações, 2) A data está correta, 3) Aguarde até 15 minutos após o fechamento.',
    categoria: 'integrações'
  },
  {
    pergunta: 'Como interpretar o ticket médio?',
    resposta: 'O ticket médio é dividido em: Ticket Entrada (couvert) + Ticket Bar (consumo). Analise separadamente para identificar oportunidades.',
    categoria: 'metricas'
  },
  {
    pergunta: 'Como funciona o sync com Sympla?',
    resposta: 'O Sympla sincroniza automaticamente a cada hora. Dados incluem: ingressos vendidos, valor líquido, participantes e check-ins.',
    categoria: 'integrações'
  },
  {
    pergunta: 'O que significa "ativo" em um evento?',
    resposta: 'Eventos ativos são considerados nos cálculos e relatórios. Eventos inativos são ignorados (útil para cancelamentos).',
    categoria: 'eventos'
  },
  {
    pergunta: 'Como alterar metas mensais?',
    resposta: 'Acesse Configurações > Metas > selecione o mês > edite os valores de faturamento, CMV, CMO etc.',
    categoria: 'configuracoes'
  },
  {
    pergunta: 'Por que o faturamento não bate com o ContaHub?',
    resposta: 'Verifique: 1) Data gerencial vs data real, 2) Descontos aplicados, 3) Taxas de cartão deduzidas. O sistema usa o valor líquido.',
    categoria: 'financeiro'
  }
]

const TUTORIAIS: Record<string, { titulo: string; passos: string[]; dicas: string[] }> = {
  'planejamento_comercial': {
    titulo: 'Como usar o Planejamento Comercial',
    passos: [
      'Acesse o menu Estratégico > Planejamento Comercial',
      'Use o calendário para navegar entre os meses',
      'Clique em um dia para ver/editar o evento',
      'Preencha metas de faturamento, público e custos',
      'Os valores realizados são preenchidos automaticamente após o sync'
    ],
    dicas: [
      'Compare sempre planejado vs realizado para ajustar futuras metas',
      'Use eventos passados como referência para planejar eventos similares'
    ]
  },
  'analise_cmv': {
    titulo: 'Como analisar e reduzir o CMV',
    passos: [
      'Acesse Ferramentas > Análise de CMV',
      'Verifique o CMV atual vs meta (34%)',
      'Identifique categorias com maior CMV',
      'Analise produtos específicos com margem baixa',
      'Tome ações: renegociar, revisar porções, ou remover itens'
    ],
    dicas: [
      'CMV alto em uma categoria pode indicar desperdício',
      'Revise fichas técnicas regularmente',
      'Compare preços com fornecedores alternativos'
    ]
  },
  'fechamento_dia': {
    titulo: 'Como fazer o fechamento do dia',
    passos: [
      'Aguarde o sync automático do ContaHub (meia-noite)',
      'Verifique em Dashboard se os dados aparecem',
      'Confira faturamento, público e ticket no Planejamento',
      'Registre custos artísticos se não estiverem automáticos',
      'Valide os dados em Visão Geral'
    ],
    dicas: [
      'Faça conferência diária para identificar problemas cedo',
      'Dados inconsistentes? Verifique horário de fechamento do caixa'
    ]
  },
  'configurar_metas': {
    titulo: 'Como configurar metas',
    passos: [
      'Acesse Configurações > Metas e KPIs',
      'Selecione o período (mês/trimestre/ano)',
      'Defina meta de faturamento baseada no histórico',
      'Configure metas de CMV (recomendado: 34%)',
      'Configure metas de CMO (recomendado: 20%)',
      'Salve e monitore semanalmente'
    ],
    dicas: [
      'Use o histórico do ano anterior como base',
      'Considere sazonalidade ao definir metas mensais',
      'Revise metas trimestralmente'
    ]
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, barId = 3, contexto }: TreinamentoRequest = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    switch (action) {
      case 'faq': {
        // Retornar FAQ, opcionalmente filtrado por categoria
        const { topico } = contexto || {}
        
        let faqFiltrado = FAQ
        if (topico) {
          faqFiltrado = FAQ.filter(f => 
            f.categoria === topico || 
            f.pergunta.toLowerCase().includes(topico.toLowerCase()) ||
            f.resposta.toLowerCase().includes(topico.toLowerCase())
          )
        }

        // Agrupar por categoria
        const porCategoria = faqFiltrado.reduce((acc: Record<string, typeof FAQ>, f) => {
          if (!acc[f.categoria]) acc[f.categoria] = []
          acc[f.categoria].push(f)
          return acc
        }, {})

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              total: faqFiltrado.length,
              porCategoria,
              categorias: ['custos', 'eventos', 'integrações', 'metricas', 'configuracoes', 'financeiro']
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'glossario': {
        // Retornar glossário ou termo específico
        const { termo } = contexto || {}
        
        if (termo) {
          const termoBusca = termo.toLowerCase().replace(/[- ]/g, '_')
          const encontrado = GLOSSARIO[termoBusca]
          
          if (encontrado) {
            // Buscar termos relacionados
            const relacionados = encontrado.relacionados?.map(r => GLOSSARIO[r]).filter(Boolean) || []
            
            return new Response(
              JSON.stringify({
                success: true,
                data: {
                  termo: encontrado,
                  relacionados
                }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Buscar por texto
          const encontrados = Object.values(GLOSSARIO).filter(g =>
            g.termo.toLowerCase().includes(termo.toLowerCase()) ||
            g.definicao.toLowerCase().includes(termo.toLowerCase())
          )

          return new Response(
            JSON.stringify({
              success: true,
              data: {
                busca: termo,
                resultados: encontrados,
                total: encontrados.length
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Retornar glossário completo
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              glossario: Object.values(GLOSSARIO),
              total: Object.keys(GLOSSARIO).length
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'tutorial': {
        // Retornar tutorial específico ou lista
        const { topico } = contexto || {}
        
        if (topico) {
          const tutorial = TUTORIAIS[topico.toLowerCase().replace(/[- ]/g, '_')]
          
          if (tutorial) {
            return new Response(
              JSON.stringify({
                success: true,
                data: { tutorial }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify({
              success: false,
              error: 'Tutorial não encontrado',
              disponiveis: Object.keys(TUTORIAIS)
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          )
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              tutoriais: Object.entries(TUTORIAIS).map(([key, value]) => ({
                id: key,
                titulo: value.titulo,
                qtdPassos: value.passos.length
              })),
              total: Object.keys(TUTORIAIS).length
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'ajuda_contextual': {
        // Ajuda baseada na página atual
        const { pagina } = contexto || {}
        
        const ajudasPorPagina: Record<string, { titulo: string; dicas: string[]; acoes: string[] }> = {
          'planejamento-comercial': {
            titulo: 'Planejamento Comercial',
            dicas: [
              'Clique em um dia para editar ou criar evento',
              'Cores indicam: verde = meta batida, amarelo = parcial, vermelho = abaixo',
              'Use as setas para navegar entre meses'
            ],
            acoes: ['Ver tutorial', 'Exportar dados', 'Configurar metas']
          },
          'visao-geral': {
            titulo: 'Visão Geral Estratégica',
            dicas: [
              'KPIs mostram performance vs meta e vs período anterior',
              'Setas indicam tendência: ↑ melhorando, ↓ piorando',
              'Clique nos cards para ver detalhes'
            ],
            acoes: ['Filtrar período', 'Exportar relatório', 'Ver histórico']
          },
          'desempenho': {
            titulo: 'Desempenho Semanal',
            dicas: [
              'Cada linha representa uma semana do ano',
              'Métricas são calculadas automaticamente',
              'Edite valores manuais clicando no ícone de lápis'
            ],
            acoes: ['Ver CMV detalhado', 'Comparar semanas', 'Gerar relatório']
          },
          'analitico-produtos': {
            titulo: 'Análise de Produtos',
            dicas: [
              'Ordene por diferentes métricas clicando nos cabeçalhos',
              'Use os filtros para ver categorias específicas',
              'Identifique produtos estrela (alto giro + alta margem)'
            ],
            acoes: ['Exportar', 'Ver categorias', 'Análise ABC']
          }
        }

        const ajuda = pagina ? ajudasPorPagina[pagina] : null

        if (ajuda) {
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                pagina,
                ajuda,
                faqRelacionado: FAQ.filter(f => 
                  f.pergunta.toLowerCase().includes(pagina.split('-')[0]) ||
                  f.resposta.toLowerCase().includes(pagina.split('-')[0])
                ).slice(0, 3)
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              paginasDisponiveis: Object.keys(ajudasPorPagina),
              dicaGeral: 'Navegue pelo menu lateral para acessar todas as funcionalidades'
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'dica_do_dia': {
        // Dica aleatória baseada no dia/contexto
        const dicas = [
          { texto: 'Verifique o CMV semanalmente para identificar tendências', categoria: 'custos' },
          { texto: 'Compare eventos do mesmo dia da semana para análises mais precisas', categoria: 'analise' },
          { texto: 'Revise fichas técnicas trimestralmente para manter o CMV controlado', categoria: 'custos' },
          { texto: 'Use o ranking de artistas para escolher atrações com melhor ROI', categoria: 'eventos' },
          { texto: 'Configure alertas para ser notificado quando métricas saírem do esperado', categoria: 'alertas' },
          { texto: 'Exporte relatórios semanais para reuniões com sócios', categoria: 'relatorios' },
          { texto: 'Analise horários de pico para otimizar escalas de equipe', categoria: 'operacional' },
          { texto: 'Produtos com baixa margem e baixo giro podem ser removidos do cardápio', categoria: 'produtos' }
        ]

        // Selecionar dica baseada no dia do ano (para ser consistente no mesmo dia)
        const diaDoAno = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
        const dicaDoDia = dicas[diaDoAno % dicas.length]

        // Buscar insight relevante do banco
        const { data: ultimoInsight } = await supabase
          .from('agente_insights')
          .select('titulo, descricao')
          .eq('bar_id', barId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              dicaDoDia,
              insightRecente: ultimoInsight || null,
              proximaDica: dicas[(diaDoAno + 1) % dicas.length]
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
    console.error('Erro no agente de treinamento:', error)
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
