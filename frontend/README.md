# 🏪 SGB Frontend - Sistema de Gestão de Bares

Frontend do Sistema de Gestão de Bares (SGB) desenvolvido com Next.js, React e Tailwind CSS.

## 🚀 Tecnologias

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **Supabase** - Backend e autenticação

## 📦 Instalação

1. **Clone o repositório** (se ainda não fez):
```bash
git clone https://github.com/seu-usuario/sgb.git
cd sgb/frontend
```

2. **Instale as dependências**:
```bash
npm install
```

3. **Configure as variáveis de ambiente**:
```bash
cp env.example .env.local
```

Edite `.env.local` com suas credenciais do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica_aqui
```

4. **Execute o projeto**:
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`.

## 🎨 Design

O frontend foi desenvolvido com um tema específico para bares, utilizando:
- **Cores**: Tons de marrom, âmbar e dourado
- **Efeitos**: Glass morphism e gradientes
- **Layout**: Responsivo e moderno
- **UX**: Intuitivo e elegante

## 📁 Estrutura

```
frontend/
├── src/
│   ├── app/                 # App Router (Next.js 13+)
│   │   ├── dashboard/       # Dashboard principal
│   │   ├── globals.css      # Estilos globais
│   │   ├── layout.tsx       # Layout raiz
│   │   └── page.tsx         # Página de login
│   ├── components/          # Componentes reutilizáveis
│   ├── lib/                 # Utilitários e configurações
│   │   ├── supabase.ts      # Cliente Supabase
│   │   └── utils.ts         # Funções utilitárias
│   └── types/               # Definições de tipos
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

## 🔐 Autenticação

A autenticação é integrada com o Supabase, incluindo:
- **Login/Logout**
- **Gestão de sessões**
- **Proteção de rotas**

## 📊 Módulos Disponíveis

1. **Analítico** - Relatórios e análises
2. **Período** - Gestão temporal
3. **Pagamentos** - Controle financeiro
4. **Faturamento/Hora** - Análise temporal de vendas
5. **Tempo** - Produtividade
6. **Notas Fiscais** - Documentação fiscal

## 🛠️ Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Gera build de produção
- `npm run start` - Executa build de produção
- `npm run lint` - Executa linting

## 🔄 Integração com Backend

O frontend se conecta automaticamente com:
- **Supabase Database** - Para dados
- **Edge Functions** - Para operações complexas
- **Real-time** - Para atualizações em tempo real

## 📱 Responsividade

O sistema é totalmente responsivo, funcionando perfeitamente em:
- **Desktop** (1920px+)
- **Tablet** (768px+)
- **Mobile** (320px+)

## 🎯 Próximos Passos

1. Implementar páginas individuais dos módulos
2. Adicionar gráficos e relatórios
3. Implementar notificações em tempo real
4. Adicionar filtros avançados
5. Criar sistema de permissões por usuário

## 📞 Suporte

Para dúvidas ou suporte, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido para**: Bar Ordinário - Grupo Menos é Mais  
**Versão**: 1.0.0  
**Status**: Em desenvolvimento 