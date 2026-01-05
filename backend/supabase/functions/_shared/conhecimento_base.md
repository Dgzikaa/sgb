# 🧠 BASE DE CONHECIMENTO - ZYKOR

Este arquivo contém informações estruturadas que o Agente IA usa como contexto em todas as análises.

---

## 📊 INDICADORES SEMANAIS

### 1. CMV (Custo Mercadoria Vendida)
**Fonte de Dados:**
- Tabela: `desempenho_semanal`
- Coluna: `cmv_percentual`
- Fórmula: `(custo_produtos / faturamento_bruto) * 100`

**Metas e Alertas:**
- Meta ideal: 28-30%
- Aceitável: até 31%
- Crítico: > 32% (alertar com urgência)
- Excelente: < 27%

**Contexto:**
- CMV alto indica: desperdício, roubo ou preço de compra alto
- CMV baixo pode indicar: falta de produtos, qualidade inferior

---

### 2. Faturamento por Hora
**Fonte de Dados:**
- Tabela: `contahub_fatporhora`
- Colunas: `valor_total`, `hora`, `dia_semana`

**Metas por Bar:**
- Windsor: R$ 200-250/hora
- Outros: R$ 150-180/hora

**Padrões Importantes:**
- Sexta e Sábado: 60% do faturamento semanal
- Pico: 22h-2h
- Queda crítica: < R$ 100/hora em horário de pico

---

### 3. Estoque Crítico
**Fonte de Dados:**
- Tabela: `estoque_insumos`
- Colunas: `produto`, `quantidade`, `unidade`

**Produtos Críticos (nunca deixar faltar):**
- Heineken: mínimo 100 unidades
- Vodka Absolut: mínimo 10 garrafas
- Energético: mínimo 50 latas

**Alertas:**
- Sextas-feiras: verificar estoque de bebidas
- Sábados: reabastecer urgente se necessário

---

### 4. Checklists Operacionais
**Fonte de Dados:**
- Tabela: `checklist_executions`
- Colunas: `status`, `concluido_em`, `tipo`

**Regras:**
- Limpeza: deve ser concluída até 11h
- Abertura: deve ser feita até 17h
- Fechamento: deve ser feita até 5h

**Alertas:**
- > 3 checklists pendentes: urgência média
- > 5 checklists pendentes: urgência alta
- Checklist não feito há 2 dias: crítico

---

### 5. Desempenho da Equipe
**Fonte de Dados:**
- Tabela: `checklist_funcionario`
- Tabela: `usuarios_bar`

**Métricas:**
- Taxa de conclusão esperada: > 90%
- Tempo médio de execução: < 30 minutos
- Atrasos aceitáveis: até 1h

---

## 🎯 PADRÕES TEMPORAIS

### Dias da Semana
- **Segunda-Quinta**: Faturamento mais baixo (30-40% da média)
- **Sexta-Sábado**: Pico de faturamento (60-70%)
- **Domingo**: Variável por bar

### Horários
- **17h-20h**: Preparação, movimento baixo
- **20h-22h**: Início do movimento
- **22h-2h**: Pico de faturamento (70-80%)
- **2h-5h**: Fechamento

### Sazonalidade
- Fim de ano (Nov-Dez): +30% faturamento
- Carnaval: +50% faturamento
- Verão: +20% faturamento

---

## 🚨 REGRAS DE ALERTAS

### Urgência Crítica
1. CMV > 32%
2. Faturamento < 50% da meta diária
3. Estoque de produto crítico zerado
4. Sistema fora do ar > 1h

### Urgência Alta
1. CMV entre 30-32%
2. Faturamento 60-80% da meta
3. > 5 checklists pendentes
4. Problemas com ContaHub/ContaAzul

### Urgência Média
1. CMV entre 28-30%
2. Faturamento 80-90% da meta
3. 3-5 checklists pendentes

---

## 💡 INSIGHTS ESPERADOS

O agente deve focar em:
1. **Prevenção**: Alertar ANTES de problemas acontecerem
2. **Padrões**: Identificar tendências (ex: CMV sobe toda terça)
3. **Correlações**: CMV alto + estoque baixo = problema de desperdício
4. **Oportunidades**: Sugerir ações para aumentar faturamento

---

## 📝 NOTAS IMPORTANTES

### Como o Agente Deve Usar Este Conhecimento
1. Sempre considerar este contexto nas análises
2. Comparar dados reais com metas aqui definidas
3. Usar padrões temporais para validar anomalias
4. Priorizar alertas conforme urgências definidas

### Atualização Deste Arquivo
- Este arquivo pode ser editado manualmente
- Mudanças são lidas pelo agente na próxima análise
- Manter sempre atualizado com novas regras de negócio

---

**Última atualização:** 2026-01-05
**Versão:** 1.0
