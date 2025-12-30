# 🎉 Retrospectiva 2025 - Sistema Zykor

## 📋 Visão Geral

Sistema completo de retrospectiva anual com efeitos visuais profissionais, análises detalhadas e visualizações interativas dos dados de 2025.

## ✨ Funcionalidades

### 🎆 Efeitos Visuais
- **Fogos de Artifício Automáticos**: Ativados automaticamente em 01/01/2026
- **Animações Suaves**: Usando Framer Motion para transições profissionais
- **Contadores Animados**: React CountUp para números impactantes
- **Gradientes Dinâmicos**: Design moderno com gradientes e efeitos de brilho

### 📊 Visualizações de Dados

#### Página Principal (`/retrospectiva-2025`)
- **Cards de Estatísticas Principais**:
  - Faturamento Total
  - Total de Clientes
  - Ticket Médio
  - Total de Eventos
  - Faturamento Bebidas
  - Faturamento Comida
  - NPS Médio
  - Felicidade Média
  - Crescimento Instagram
  - Tickets Vendidos

- **Gráficos Interativos**:
  - Evolução Mensal de Faturamento (Line Chart)
  - Clientes Atendidos por Mês (Bar Chart)
  - Top 10 Produtos Mais Vendidos (Horizontal Bar Chart)
  - Distribuição Bebidas vs Comida (Pie Chart)
  - Performance Geral (Radar Chart)

#### Página de Detalhes (`/retrospectiva-2025/detalhes`)
- **Resumo Executivo**: CMV, CMO e métricas financeiras
- **Análise Detalhada**: Bebidas vs Comida com percentuais
- **Evolução Acumulada**: Gráfico de área mostrando crescimento
- **OKRs e Conquistas**: Progresso de objetivos e resultados-chave

### 🎯 Componentes Criados

1. **NewYearFireworks.tsx**
   - Efeito de fogos de artifício com canvas-confetti
   - Detecção automática de ano novo
   - Mensagem animada de boas-vindas
   - Controle via localStorage para não repetir

2. **StatCard.tsx**
   - Card animado para estatísticas
   - CountUp integrado
   - Gradientes customizáveis
   - Efeito hover profissional

3. **ChartCard.tsx**
   - Container para gráficos
   - Design consistente
   - Animações de entrada
   - Dark mode completo

4. **RetrospectiveButton.tsx**
   - Botão flutuante no canto inferior direito
   - Aparece apenas em 2026+
   - Animação de brilho e rotação
   - Link direto para retrospectiva

### 🔧 API Endpoint

**`/api/retrospectiva-2025`**

Consolida dados de múltiplas tabelas:
- `desempenho_semanal` - Dados financeiros e operacionais
- `contahub_analitico` - Vendas por produto e categoria
- `organizador_visao` - Visão estratégica
- `organizador_okrs` - OKRs e metas
- `nps` - Satisfação da equipe
- `pesquisa_felicidade` - Clima organizacional
- `sympla_eventos` / `yuzer_eventos` - Eventos
- `windsor_instagram_followers_daily` - Redes sociais

**Retorna**:
```typescript
{
  financeiro: {
    faturamentoTotal: number
    faturamentoBebidas: number
    faturamentoComida: number
    ticketMedio: number
    totalClientes: number
    cmvMedio: number
    cmoMedio: number
  },
  operacional: {
    totalSemanas: number
    totalEventos: number
    ticketsVendidos: number
  },
  pessoasCultura: {
    npsMedia: number
    felicidadeMedia: number
    totalRespostasNPS: number
    totalRespostasFelicidade: number
  },
  marketing: {
    crescimentoInstagram: number
    seguidoresInicio: number
    seguidoresFinal: number
  },
  metas: {
    visaoGeral: object
    okrs: array
    okrsConcluidos: number
    okrsTotal: number
  },
  evolucaoMensal: array
  topProdutos: array
}
```

## 🎨 Design System

### Cores
- **Primary**: Purple/Pink gradient (`from-purple-600 to-pink-600`)
- **Success**: Green (`from-green-500 to-emerald-600`)
- **Warning**: Yellow/Orange (`from-yellow-500 to-amber-600`)
- **Danger**: Red (`from-red-500 to-rose-600`)
- **Info**: Blue (`from-blue-500 to-cyan-600`)

### Animações
- **Entrada**: `opacity: 0, y: 20` → `opacity: 1, y: 0`
- **Delays**: Escalonados (0.1s, 0.2s, 0.3s...)
- **Duration**: 0.6s - 0.8s
- **Easing**: `easeOut`

### Responsividade
- **Mobile**: 1 coluna
- **Tablet**: 2 colunas
- **Desktop**: 3-4 colunas
- **Gráficos**: ResponsiveContainer com 100% width

## 🚀 Como Funciona

### Ativação Automática
1. Sistema detecta quando é 01/01/2026 ou posterior
2. Verifica localStorage se já mostrou fogos
3. Se não mostrou, exibe efeito completo
4. Marca como visto no localStorage
5. Botão flutuante aparece permanentemente

### Fluxo do Usuário
1. **Entrada no Sistema** (em 2026+)
   - Fogos de artifício automáticos
   - Mensagem de boas-vindas
   - Redirecionamento sugerido

2. **Página Principal**
   - Visão geral com cards animados
   - Gráficos principais
   - Botão "Ver Detalhes"

3. **Página de Detalhes**
   - Análises aprofundadas
   - Métricas específicas
   - OKRs e conquistas

4. **Botão Flutuante**
   - Sempre visível em 2026+
   - Acesso rápido à retrospectiva
   - Animação chamativa

## 📦 Dependências Adicionadas

```json
{
  "framer-motion": "^latest",
  "recharts": "^latest",
  "canvas-confetti": "^latest",
  "@types/canvas-confetti": "^latest",
  "react-countup": "^latest"
}
```

## 🎯 Próximos Passos (Opcional)

1. **Exportar PDF**: Adicionar botão para gerar PDF da retrospectiva
2. **Compartilhamento Social**: Compartilhar conquistas nas redes
3. **Comparação Anual**: Comparar 2025 vs 2024
4. **Metas 2026**: Seção para definir metas do novo ano
5. **Timeline Interativa**: Linha do tempo com eventos marcantes

## 🐛 Troubleshooting

### Fogos não aparecem
- Verificar data do sistema
- Limpar localStorage: `localStorage.removeItem('newyear-fireworks-2026')`
- Verificar console para erros

### Dados não carregam
- Verificar API `/api/retrospectiva-2025`
- Verificar conexão com Supabase
- Verificar dados nas tabelas fonte

### Botão não aparece
- Verificar data do sistema (deve ser >= 01/01/2026)
- Verificar se componente está no layout
- Verificar console para erros

## 📝 Notas Técnicas

- **Performance**: Gráficos otimizados com ResponsiveContainer
- **SEO**: Metadata configurada
- **Acessibilidade**: Cores com contraste adequado
- **Dark Mode**: Totalmente suportado
- **Mobile**: 100% responsivo
- **Build**: Testado e aprovado

---

**Desenvolvido com 💜 para o Sistema Zykor**
