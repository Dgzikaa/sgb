# Regras para Textos da Interface - SGB_V2

## REGRA OBRIGATÓRIA: NUNCA DEIXAR TEXTOS EM BRANCO VISUALMENTE

### Problema Identificado
Textos que ficam **visualmente em branco** na interface por falta de cor definida ou conflitos CSS.

### Soluções Implementadas

#### 1. CSS Global Aplicado (globals.css)
- Regras CSS específicas para conteúdo principal (`main`, `.container`, `.card`)
- **NÃO afeta sidebar, header, footer** (mantém estilos originais)
- Cores definidas com `!important` para sobrescrever conflitos
- Suporte para modo escuro e claro

#### 2. Classes CSS Obrigatórias para Usar

**Títulos e Subtítulos:**
```tsx
<h1 className="page-title">Título Principal</h1>
<h2 className="section-title">Título da Seção</h2>
<p className="page-subtitle">Subtítulo ou descrição</p>
```

**Labels e Descrições:**
```tsx
<label className="form-label">Nome do Campo</label>
<p className="form-description">Descrição do campo ou instrução</p>
```

**Textos de Configuração:**
```tsx
<div className="contaazul-config">
  <p>Configure os parâmetros para testar a busca em 2 etapas</p>
</div>
```

**Textos de Status:**
```tsx
<span className="success-text">Sucesso</span>
<span className="error-text">Erro</span>
<span className="warning-text">Aviso</span>
<span className="info-text">Informação</span>
```

#### 3. Estrutura Padrão para Páginas

**Template Base:**
```tsx
export default function MinhaPage() {
  return (
    <StandardPageLayout title="Título da Página">
      <div className="space-y-6">
        
        {/* Seção de Configuração */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="section-title mb-4">⚙️ Configuração do Teste</h2>
          <p className="form-description mb-4">
            Configure os parâmetros necessários para executar o teste
          </p>
          
          {/* Formulário */}
          <div className="space-y-4">
            <div>
              <label className="form-label">Token de Acesso</label>
              <input 
                type="text" 
                className="mt-1 block w-full rounded-md border-gray-300"
                placeholder="Insira seu token"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Data Início</label>
                <input type="date" className="mt-1 block w-full rounded-md border-gray-300" />
              </div>
              <div>
                <label className="form-label">Data Fim</label>
                <input type="date" className="mt-1 block w-full rounded-md border-gray-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Estratégia */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="section-title mb-4">📋 Estratégia de Execução</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
              <div>
                <h3 className="font-medium text-gray-900">Primeira Etapa</h3>
                <p className="text-gray-600">Descrição da primeira etapa</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
              <div>
                <h3 className="font-medium text-gray-900">Segunda Etapa</h3>
                <p className="text-gray-600">Descrição da segunda etapa</p>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Resultados */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="section-title mb-4">📊 Resultado do Teste</h2>
          <div id="resultado-container" className="space-y-4">
            <p className="form-description">
              Os resultados aparecerão aqui após a execução do teste
            </p>
          </div>
        </div>
        
      </div>
    </StandardPageLayout>
  )
}
```

### 4. Checklist para Criação de Páginas

Antes de criar qualquer página, verificar:

✅ **Todos os textos têm classes CSS definidas?**
✅ **Labels usam `form-label`?**
✅ **Descrições usam `form-description`?**
✅ **Títulos usam `page-title` ou `section-title`?**
✅ **Textos de status usam classes específicas?**
✅ **Placeholders são informativos?**
✅ **Nenhum texto fica "em branco" visualmente?**

### 5. Elementos Específicos por Seção

**Configuração de Testes:**
- Sempre usar `contaazul-config` ou `test-config`
- Labels claros e descritivos
- Placeholders informativos

**Estratégias de API:**
- Enumerar etapas com números visuais
- Usar `info-text` para detalhes técnicos
- Endpoints sempre em código: `GET /api/endpoint`

**Resultados:**
- Container com ID para JavaScript
- Estados de loading, sucesso e erro
- Formatação clara dos dados

### 6. Cores Padrão Definidas

- **Texto Principal**: `#1f2937` (cinza escuro)
- **Texto Secundário**: `#6b7280` (cinza médio) 
- **Labels**: `#374151` (cinza)
- **Links**: `#2563eb` (azul)
- **Sucesso**: `#16a34a` (verde)
- **Erro**: `#dc2626` (vermelho)
- **Aviso**: `#d97706` (laranja)
- **Info**: `#2563eb` (azul)

### 7. Exemplo de Página Problemática (EVITAR)

```tsx
// ❌ ERRADO - Textos podem ficar em branco
<div>
  <h2>Teste</h2>
  <p>........................</p>
  <label>Token</label>
  <input placeholder="......" />
</div>
```

### 8. Exemplo de Página Correta (SEGUIR)

```tsx
// ✅ CORRETO - Textos sempre visíveis
<div className="bg-white rounded-lg shadow p-6">
  <h2 className="section-title">⚙️ Configuração do Teste</h2>
  <p className="form-description">
    Configure os parâmetros para testar a busca em 2 etapas
  </p>
  <label className="form-label">Token de Acesso</label>
  <input 
    className="mt-1 block w-full rounded-md border-gray-300"
    placeholder="Insira seu token de acesso da API"
  />
</div>
```

---

## REGRA PARA ADICIONAR AO WORKSPACE

Adicione esta regra ao seu arquivo de regras do workspace:

```
### REGRA OBRIGATÓRIA: TEXTOS SEMPRE VISÍVEIS

Ao criar qualquer página no sistema, SEMPRE:

1. **Usar classes CSS apropriadas**:
   - Títulos: `page-title`, `section-title`
   - Labels: `form-label` 
   - Descrições: `form-description`
   - Status: `success-text`, `error-text`, `warning-text`, `info-text`

2. **Seguir estrutura padrão**:
   ```tsx
   <div className="bg-white rounded-lg shadow p-6">
     <h2 className="section-title mb-4">⚙️ Título da Seção</h2>
     <p className="form-description mb-4">Descrição clara</p>
     <label className="form-label">Nome do Campo</label>
     <input placeholder="Placeholder informativo" />
   </div>
   ```

3. **NUNCA usar**:
   - Textos sem classes CSS
   - Placeholders vagos como "......"
   - Descrições em branco
   - Labels sem contexto

4. **Sempre verificar**:
   - Todos os textos têm cor visível
   - Labels são claros e descritivos
   - Placeholders são informativos
   - Nenhum elemento fica "em branco"
```

**IMPORTANTE**: Estas regras devem ser aplicadas SEMPRE que criar qualquer página no sistema, garantindo que nunca haverá textos invisíveis ou "em branco" visualmente. 