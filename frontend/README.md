# 🍺 SGB_V2 - Sistema de Gestão de Bares

Sistema moderno e completo para gestão de bares, restaurantes e estabelecimentos similares.

## 🚀 Tecnologias

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Form Validation**: Zod
- **State Management**: Zustand
- **Icons**: Lucide React

## 📋 Pré-requisitos

- Node.js 18.17.0 ou superior
- npm 9.0.0 ou superior

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd SGB_V2/frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

4. Execute o projeto:
```bash
npm run dev
```

## 📁 Estrutura do Projeto

```
src/
├── app/              # Páginas Next.js (App Router)
├── components/       # Componentes React reutilizáveis
├── contexts/         # Contextos React
├── hooks/           # Hooks customizados
├── lib/             # Bibliotecas e serviços
├── types/           # Tipos TypeScript globais
└── utils/           # Utilitários e helpers
```

## 🎯 Funcionalidades

- ✅ Gestão de usuários e permissões
- ✅ Checklists e tarefas
- ✅ Eventos e promoções
- ✅ Dashboard e relatórios
- ✅ Integração com ContaAzul
- ✅ Notificações em tempo real
- ✅ Sistema de cache inteligente
- ✅ Tratamento de erros robusto
- ✅ Interface responsiva
- ✅ Dark mode

## 📝 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run lint         # Verificar código
npm run lint:fix     # Corrigir automaticamente
npm run type-check   # Verificar tipos
npm run format       # Formatar código
npm run clean        # Limpar builds
```

## 🔧 Configurações

### ESLint
- Regras rigorosas de TypeScript
- Plugins de React e acessibilidade
- Integração com Prettier

### TypeScript
- Configuração strict
- Path mapping configurado
- Verificações rigorosas

### Prettier
- Formatação consistente
- Integração com ESLint

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### Outras Plataformas
O projeto é compatível com qualquer plataforma que suporte Next.js.

## 📊 Monitoramento

- Logs estruturados
- Tratamento de erros centralizado
- Métricas de performance
- Cache inteligente

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 🆘 Suporte

Para suporte, entre em contato com a equipe de desenvolvimento.

---

**Versão**: 2.0.0  
**Última atualização**: Dezembro 2024