# Tabela de Desempenho - SGB_V2

## Visão Geral
A Tabela de Desempenho é uma página de relatório financeiro avançado, que exibe os principais indicadores agrupados por categoria (Receitas, Custos, Despesas, etc.), integrando dados reais do ContaAzul e metas configuradas pelo usuário.

- **Local:** `/relatorios/tabela-desempenho` (antigo `/financeiro-competencia`)
- **Padrão visual:** 100% alinhado ao sistema (dark mode, grid responsivo, cards, UX refinada)
- **Dados:** Busca dados reais via API `/api/contaazul/tabela-desempenho` e metas via `/api/metas`

## Estrutura da Página
- Filtros de período (data início/fim)
- Paginação (próxima/anterior)
- Tabela agrupada por grupo/categoria
- Colunas: Grupo | Categoria | Valor Real | Meta | %
- Dark mode e responsividade obrigatórios

## Integração com API
### 1. API de Dados Reais
- **Endpoint:** `/api/contaazul/tabela-desempenho` (POST)
- **Body:**
```json
{
  "bar_id": 3,
  "data_inicio": "2024-06-01",
  "data_fim": "2024-06-30",
  "page": 1,
  "pageSize": 100
}
```
- **Resposta:**
```json
{
  "success": true,
  "tabela": [
    { "grupo": "Receitas", "categoria": "Stone Crédito", "valor": 12345.67, "eventos": [...] },
    ...
  ],
  "page": 1,
  "pageSize": 100
}
```
- **Notas:**
  - Os dados já vêm agrupados e mapeados para os grupos/categorias do sistema.
  - Paginação é obrigatória para grandes volumes.

### 2. API de Metas
- **Endpoint:** `/api/metas?ativas=true&categoria=financeiro` (GET)
- **Headers:**
  - `x-user-data`: JSON do usuário autenticado (inclui `bar_id`)
- **Resposta:**
```json
{
  "success": true,
  "data": {
    "financeiro": [
      { "subcategoria": "Stone Crédito", "valor_mensal": 20000, ... },
      ...
    ]
  }
}
```
- **Notas:**
  - O frontend faz o mapeamento entre categoria da tabela e subcategoria/nome_meta da meta.

## Expansão e Manutenção
- Para adicionar novas categorias/grupos, edite o array `GRUPOS` na página e ajuste o mapeamento de categorias na API.
- Para garantir compliance visual, siga sempre as regras de dark mode, grid, spacing e classes utilitárias do projeto.
- Teste sempre em ambos os temas (claro/escuro) e em diferentes tamanhos de tela.

## Exemplo de Uso (Frontend)
```tsx
const valor = typeof linha.valor === 'number' ? linha.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-';
const meta = getMeta(linha.categoria);
const percentual = meta ? ((linha.valor / meta) * 100).toFixed(1) + '%' : '-';
```

---

**Dúvidas ou melhorias:** Consulte o README principal ou abra uma issue. 