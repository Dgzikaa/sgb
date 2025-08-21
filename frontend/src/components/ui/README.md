# 🎨 Design System Zykor

Um sistema de design completo e moderno para aplicações React/Next.js, focado em acessibilidade, performance e experiência do usuário.

## ✨ Características

- 🎬 **Page Transitions** - Transições cinematográficas entre páginas
- 🚨 **Error Boundaries** - Sistema robusto de recuperação de erros
- 🎭 **Empty States** - Estados vazios contextuais com ilustrações
- 📜 **Scroll Animations** - Animações baseadas em scroll e parallax
- 📱 **Mobile Gestures** - Suporte completo a gestos touch
- 🔍 **Global Search** - Sistema de busca inteligente com categorização
- 🍞 **Smart Breadcrumbs** - Navegação contextual inteligente
- 📈 **Analytics UX** - Heatmaps e insights de comportamento
- ♿ **Accessibility WCAG AAA** - Conformidade total com padrões de acessibilidade
- 🌙 **Dark Mode** - Suporte nativo a temas claro/escuro
- 📱 **Responsive** - Design adaptativo para todos os dispositivos
- ⚡ **Performance** - Otimizado para velocidade e eficiência

## 🚀 Instalação

### Dependências

```bash
npm install framer-motion lucide-react @radix-ui/react-switch @radix-ui/react-slider
```

### Importação

```typescript
// Importar componentes específicos
import { PageTransition, ErrorBoundary, GlobalSearch } from '@/components/ui';

// Ou importar tudo
import * as DesignSystem from '@/components/ui';
```

## 🎯 Componentes Principais

### 🎬 Page Transitions

Sistema de transições entre páginas com animações suaves.

```tsx
import { PageTransition, PageTransitionWrapper } from '@/components/ui';

function MyPage() {
  return (
    <PageTransitionWrapper>
      <PageTransition variant="slide" duration={0.5}>
        <div className="page-content">
          <h1>Minha Página</h1>
          <p>Conteúdo da página com transições suaves</p>
        </div>
      </PageTransition>
    </PageTransitionWrapper>
  );
}
```

**Variantes disponíveis:**
- `slide` - Deslizamento horizontal/vertical
- `fade` - Fade in/out
- `scale` - Escala com fade
- `slide-up` - Deslizamento para cima
- `slide-down` - Deslizamento para baixo

### 🚨 Error Boundaries

Sistema robusto de captura e recuperação de erros.

```tsx
import { ErrorBoundary } from '@/components/ui';

function App() {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="error-container">
          <h2>Algo deu errado</h2>
          <p>{error.message}</p>
          <button onClick={resetError}>Tentar novamente</button>
        </div>
      )}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### 🎭 Empty States

Estados vazios contextuais com ilustrações e ações.

```tsx
import { EmptyState } from '@/components/ui';

function NoDataComponent() {
  return (
    <EmptyState
      title="Nenhum dado encontrado"
      description="Não há dados para exibir no momento. Tente criar um novo item."
      icon={<Database className="w-12 h-12" />}
      actions={[
        {
          label: 'Criar novo',
          onClick: () => createNew(),
          primary: true,
          icon: <Plus className="w-4 h-4" />
        },
        {
          label: 'Importar dados',
          onClick: () => importData(),
          icon: <Upload className="w-4 h-4" />
        }
      ]}
    />
  );
}
```

### 📜 Scroll Animations

Animações baseadas em scroll com Intersection Observer.

```tsx
import { ScrollTrigger, Parallax, StaggeredContainer } from '@/components/ui';

function AnimatedSection() {
  return (
    <div className="space-y-8">
      {/* Trigger de animação */}
      <ScrollTrigger animation="fadeIn" threshold={0.1}>
        <h2>Este título aparece ao fazer scroll</h2>
      </ScrollTrigger>

      {/* Efeito parallax */}
      <Parallax speed={0.5} direction="up">
        <div className="parallax-content">
          <p>Conteúdo com efeito parallax</p>
        </div>
      </Parallax>

      {/* Container com animações em sequência */}
      <StaggeredContainer animation="slideUp" staggerDelay={0.1}>
        {items.map((item, index) => (
          <div key={index} className="item">
            {item.content}
          </div>
        ))}
      </StaggeredContainer>
    </div>
  );
}
```

### 📱 Mobile Gestures

Suporte completo a gestos touch e mobile.

```tsx
import { GestureHandler, Swipeable, Pinchable } from '@/components/ui';

function GestureComponent() {
  return (
    <GestureHandler
      onSwipe={(direction, distance) => {
        console.log(`Swiped ${direction} with distance ${distance}`);
      }}
      onPinch={(scale) => {
        console.log(`Pinched to scale ${scale}`);
      }}
      onLongPress={() => {
        console.log('Long pressed!');
      }}
    >
      <div className="gesture-area">
        <p>Área com suporte a gestos</p>
      </div>
    </GestureHandler>
  );
}

// Componente swipeable
function SwipeableCard() {
  return (
    <Swipeable
      onSwipeLeft={() => deleteItem()}
      onSwipeRight={() => favoriteItem()}
      threshold={50}
    >
      <Card className="swipeable-card">
        <CardContent>
          <p>Deslize para ações</p>
        </CardContent>
      </Card>
    </Swipeable>
  );
}
```

### 🔍 Global Search

Sistema de busca global com categorização e sugestões.

```tsx
import { GlobalSearch } from '@/components/ui';

function SearchComponent() {
  return (
    <GlobalSearch
      placeholder="Buscar no sistema..."
      maxResults={10}
      onResultSelect={(result) => {
        console.log('Selected:', result);
        router.push(result.url);
      }}
    />
  );
}
```

**Atalhos de teclado:**
- `⌘ + K` - Abrir busca
- `↑/↓` - Navegar resultados
- `Enter` - Selecionar resultado
- `Escape` - Fechar busca

### 🍞 Smart Breadcrumbs

Navegação contextual inteligente com sugestões.

```tsx
import { SmartBreadcrumbs } from '@/components/ui';

function NavigationComponent() {
  return (
    <SmartBreadcrumbs
      enableSmartSuggestions={true}
      enableContextualActions={true}
      showQuickActions={true}
      variant="smart"
    />
  );
}
```

### 📈 Analytics UX

Sistema de analytics com heatmaps e insights.

```tsx
import { AnalyticsUX, UserEventTracker } from '@/components/ui';

function AnalyticsComponent() {
  return (
    <UserEventTracker>
      <AnalyticsUX
        enableTracking={true}
        enableHeatmaps={true}
        enablePerformance={true}
        enableUserInsights={true}
      />
    </UserEventTracker>
  );
}
```

### ♿ Accessibility WCAG AAA

Sistema completo de acessibilidade.

```tsx
import { AccessibilityProvider } from '@/components/ui';

function App() {
  return (
    <AccessibilityProvider
      enableVoiceControl={true}
      enableEyeTracking={false}
      enableSwitchControl={true}
    >
      <div className="app">
        {/* Seu conteúdo aqui */}
      </div>
    </AccessibilityProvider>
  );
}
```

**Atalhos de acessibilidade:**
- `Ctrl + Alt + A` - Abrir painel de acessibilidade
- `Ctrl + Alt + C` - Alternar alto contraste
- `Ctrl + Alt + T` - Alternar texto grande
- `Ctrl + Alt + M` - Alternar movimento reduzido

## 🎨 Hooks Personalizados

### useScrollAnimation

```tsx
import { useScrollAnimation } from '@/components/ui';

function AnimatedComponent() {
  const { ref, isInView, scrollVariants } = useScrollAnimation();

  return (
    <motion.div
      ref={ref}
      variants={scrollVariants}
      animate={isInView ? 'visible' : 'hidden'}
    >
      <h2>Conteúdo animado</h2>
    </motion.div>
  );
}
```

### useSwipeGesture

```tsx
import { useSwipeGesture } from '@/components/ui';

function SwipeComponent() {
  const { swipeDirection, swipeDistance, handleSwipe } = useSwipeGesture(
    (direction, distance) => {
      console.log(`Swiped ${direction} with distance ${distance}`);
    }
  );

  return (
    <div className="swipe-area">
      <p>Último swipe: {swipeDirection}</p>
      <p>Distância: {swipeDistance}</p>
    </div>
  );
}
```

### useGlobalSearch

```tsx
import { useGlobalSearch } from '@/components/ui';

function SearchHook() {
  const { isSearchOpen, searchQuery, openSearch, closeSearch } = useGlobalSearch();

  return (
    <div>
      <button onClick={openSearch}>Abrir busca</button>
      {isSearchOpen && (
        <div className="search-modal">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Digite para buscar..."
          />
          <button onClick={closeSearch}>Fechar</button>
        </div>
      )}
    </div>
  );
}
```

## 🌙 Dark Mode

O Design System inclui suporte nativo a dark mode com classes CSS utilitárias.

```tsx
// Classes com dark mode automático
<div className="card-dark p-6">
  <h2 className="card-title-dark mb-4">Título</h2>
  <p className="card-description-dark">Descrição</p>
  <button className="btn-primary-dark">Ação</button>
</div>
```

**Classes disponíveis:**
- `card-dark` - Card com dark mode
- `card-title-dark` - Título com dark mode
- `card-description-dark` - Descrição com dark mode
- `btn-primary-dark` - Botão primário com dark mode
- `btn-secondary-dark` - Botão secundário com dark mode
- `input-dark` - Input com dark mode
- `textarea-dark` - Textarea com dark mode

## 📱 Responsividade

Todos os componentes são responsivos por padrão, com hooks para detectar o dispositivo.

```tsx
import { useResponsiveAnimation, ResponsiveWrapper } from '@/components/ui';

function ResponsiveComponent() {
  const { isMobile, isTablet, animationSettings } = useResponsiveAnimation();

  return (
    <ResponsiveWrapper
      mobileProps={{ className: 'p-4' }}
      tabletProps={{ className: 'p-6' }}
      desktopProps={{ className: 'p-8' }}
    >
      <div className="responsive-content">
        {isMobile && <p>Versão mobile</p>}
        {isTablet && <p>Versão tablet</p>}
        {!isMobile && !isTablet && <p>Versão desktop</p>}
      </div>
    </ResponsiveWrapper>
  );
}
```

## ⚡ Performance

O Design System é otimizado para performance com:

- **Lazy Loading** - Componentes carregados sob demanda
- **Memoização** - Hooks otimizados com useMemo e useCallback
- **Intersection Observer** - Animações eficientes baseadas em scroll
- **Debounce/Throttle** - Funções utilitárias para otimização
- **Tree Shaking** - Importações específicas para reduzir bundle size

## 🔧 Configuração

### Configuração Global

```typescript
import { DESIGN_SYSTEM_CONFIG } from '@/components/ui';

// Personalizar configurações padrão
const customConfig = {
  ...DESIGN_SYSTEM_CONFIG,
  defaultTransitionDuration: 0.5,
  defaultScrollThreshold: 0.05,
  defaultSwipeThreshold: 30,
};
```

### Configuração de Tema

```typescript
import { ThemeConfig } from '@/components/ui/types';

const theme: ThemeConfig = {
  colors: {
    primary: '#0066cc',
    secondary: '#6c757d',
    accent: '#ff6b35',
    // ... outras cores
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  // ... outras configurações
};
```

## 🧪 Testes

### Testando Componentes

```tsx
import { render, screen } from '@testing-library/react';
import { PageTransition } from '@/components/ui';

test('PageTransition renders correctly', () => {
  render(
    <PageTransition variant="fade">
      <div>Test content</div>
    </PageTransition>
  );

  expect(screen.getByText('Test content')).toBeInTheDocument();
});
```

### Testando Hooks

```tsx
import { renderHook } from '@testing-library/react';
import { useScrollAnimation } from '@/components/ui';

test('useScrollAnimation returns correct values', () => {
  const { result } = renderHook(() => useScrollAnimation());

  expect(result.current.ref).toBeDefined();
  expect(result.current.isInView).toBe(false);
  expect(result.current.scrollVariants).toBeDefined();
});
```

## 📚 Exemplos Completos

### Página com Todas as Funcionalidades

```tsx
import { EnhancedPage } from '@/components/ui';

function CompletePage() {
  return (
    <EnhancedPage
      enableAnimations={true}
      enableGestures={true}
      enableAccessibility={true}
      enableAnalytics={true}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Página Completa
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Cards com gestos */}
            <EnhancedCard enableSwipe={true} onSwipeLeft={() => console.log('Swiped left')}>
              <h3 className="text-lg font-semibold mb-2">Card Interativo</h3>
              <p>Deslize para ações</p>
            </EnhancedCard>
            
            {/* Cards com pinch */}
            <EnhancedCard enablePinch={true} onPinch={(scale) => console.log('Scale:', scale)}>
              <h3 className="text-lg font-semibold mb-2">Card com Pinch</h3>
              <p>Pinch para zoom</p>
            </EnhancedCard>
          </div>
        </div>
      </div>
    </EnhancedPage>
  );
}
```

### Dashboard com Analytics

```tsx
import { AnalyticsUX, UserEventTracker } from '@/components/ui';

function DashboardPage() {
  return (
    <UserEventTracker>
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>Dashboard</h1>
          <GlobalSearch placeholder="Buscar no dashboard..." />
        </header>
        
        <main className="dashboard-content">
          <div className="metrics-grid">
            <MetricCard title="Usuários" value="1,234" />
            <MetricCard title="Vendas" value="R$ 45,678" />
            <MetricCard title="Conversões" value="12.5%" />
          </div>
          
          <div className="charts-section">
            <ChartComponent />
          </div>
        </main>
        
        {/* Analytics em background */}
        <AnalyticsUX
          enableTracking={true}
          enableHeatmaps={true}
          enablePerformance={true}
          enableUserInsights={true}
        />
      </div>
    </UserEventTracker>
  );
}
```

## 🚀 Deploy e Produção

### Build de Produção

```bash
# Build otimizado
npm run build

# Verificar bundle size
npm run analyze

# Deploy
npm run deploy
```

### Variáveis de Ambiente

```env
# Analytics
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id

# Performance
NEXT_PUBLIC_PERFORMANCE_MONITORING=true
NEXT_PUBLIC_ERROR_TRACKING=true

# Acessibilidade
NEXT_PUBLIC_ACCESSIBILITY_ENABLED=true
NEXT_PUBLIC_VOICE_CONTROL_ENABLED=false
```

## 🤝 Contribuição

### Estrutura do Projeto

```
src/components/ui/
├── index.ts              # Exportações principais
├── types.ts              # Tipos TypeScript
├── README.md             # Esta documentação
├── page-transitions.tsx  # Transições de página
├── error-boundary.tsx    # Error boundaries
├── empty-states.tsx      # Estados vazios
├── scroll-animations.tsx # Animações de scroll
├── mobile-gestures.tsx   # Gestos mobile
├── global-search.tsx     # Busca global
├── breadcrumbs.tsx       # Breadcrumbs
├── analytics-ux.tsx      # Analytics e UX
└── accessibility.tsx     # Acessibilidade
```

### Padrões de Código

- **TypeScript** - Tipagem completa para todos os componentes
- **ESLint** - Linting consistente
- **Prettier** - Formatação automática
- **Husky** - Hooks de git para qualidade
- **Testing Library** - Testes de componentes

### Checklist de Desenvolvimento

- [ ] Componente implementado com TypeScript
- [ ] Props documentadas e tipadas
- [ ] Dark mode implementado
- [ ] Responsividade testada
- [ ] Acessibilidade verificada (WCAG AAA)
- [ ] Testes unitários escritos
- [ ] Storybook stories criados
- [ ] Documentação atualizada

## 📄 Licença

MIT License - veja o arquivo [LICENSE](../../LICENSE) para detalhes.

## 🆘 Suporte

- **Documentação**: Este README
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discord**: [Comunidade Zykor](https://discord.gg/zykor)
- **Email**: suporte@zykor.com.br

## 🔮 Roadmap

### Próximas Versões

- [ ] **v2.1** - Componentes de formulário avançados
- [ ] **v2.2** - Sistema de notificações em tempo real
- [ ] **v2.3** - Editor visual de componentes
- [ ] **v2.4** - Sistema de temas customizáveis
- **v3.0** - Componentes 3D e WebGL

### Recursos Planejados

- [ ] **AI Components** - Componentes com IA integrada
- [ ] **Voice UI** - Interface por voz
- [ ] **AR/VR** - Suporte a realidade aumentada/virtual
- [ ] **Micro-interactions** - Micro-animações avançadas
- [ ] **Performance Insights** - Métricas de performance em tempo real

---

**Desenvolvido com ❤️ pela equipe Zykor**

*Para mais informações, visite [zykor.com.br](https://zykor.com.br)*
