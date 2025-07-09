import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🏗️ Criando estrutura de banco para Visão de Competência...');
    
    // SQL para criar todas as tabelas necessárias
    const createTablesSQL = `
      -- 1. Tabela principal de dados financeiros
      CREATE TABLE IF NOT EXISTS contaazul_financeiro (
        id BIGSERIAL PRIMARY KEY,
        
        -- Identificadores
        bar_id INTEGER NOT NULL,
        conta_id VARCHAR(50) NOT NULL, -- ID único do ContaAzul
        
        -- Dados da transação
        tipo VARCHAR(20) NOT NULL, -- 'RECEITA' ou 'DESPESA'  
        status VARCHAR(20) NOT NULL, -- 'EM_ABERTO', 'RECEBIDO', 'ATRASADO', etc
        descricao TEXT,
        valor DECIMAL(15,2) NOT NULL,
        
        -- Datas importantes
        data_vencimento DATE NOT NULL,
        data_competencia DATE,
        data_pagamento DATE,
        
        -- Categorização
        categoria_id VARCHAR(50),
        categoria_nome VARCHAR(255),
        conta_financeira_id VARCHAR(50),
        conta_financeira_nome VARCHAR(255),
        centro_custo_id VARCHAR(50),
        
        -- Dados brutos e metadados
        dados_originais JSONB, -- Dados completos da API
        
        -- Controle
        ultima_sincronizacao TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        -- Constraints
        UNIQUE(bar_id, conta_id) -- Evita duplicatas
      );

      -- 2. Tabela de controle de sincronização
      CREATE TABLE IF NOT EXISTS contaazul_sincronizacao (
        id BIGSERIAL PRIMARY KEY,
        bar_id INTEGER NOT NULL,
        
        -- Controle de sincronização
        ultima_execucao TIMESTAMP NOT NULL,
        periodo_inicio DATE NOT NULL,
        periodo_fim DATE NOT NULL,
        
        -- Resultados
        total_receitas_processadas INTEGER DEFAULT 0,
        total_despesas_processadas INTEGER DEFAULT 0,
        total_erros INTEGER DEFAULT 0,
        
        -- Status
        status VARCHAR(20) DEFAULT 'EXECUTANDO', -- 'SUCESSO', 'ERRO', 'EXECUTANDO'
        detalhes_execucao JSONB,
        
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- 3. Tabela de categorias (cache local)
      CREATE TABLE IF NOT EXISTS contaazul_categorias (
        id BIGSERIAL PRIMARY KEY,
        bar_id INTEGER NOT NULL,
        categoria_id VARCHAR(50) NOT NULL,
        nome VARCHAR(255) NOT NULL,
        tipo VARCHAR(20), -- 'RECEITA' ou 'DESPESA'
        ativa BOOLEAN DEFAULT true,
        ultima_atualizacao TIMESTAMP DEFAULT NOW(),
        
        UNIQUE(bar_id, categoria_id)
      );

      -- 4. Tabela de contas financeiras (cache local) 
      CREATE TABLE IF NOT EXISTS contaazul_contas_financeiras (
        id BIGSERIAL PRIMARY KEY,
        bar_id INTEGER NOT NULL,
        conta_id VARCHAR(50) NOT NULL,
        nome VARCHAR(255) NOT NULL,
        tipo VARCHAR(50),
        ativa BOOLEAN DEFAULT true,
        ultima_atualizacao TIMESTAMP DEFAULT NOW(),
        
        UNIQUE(bar_id, conta_id)
      );
    `;

    // SQL para criar índices de performance
    const createIndexesSQL = `
      -- Índices para performance na tabela principal
      CREATE INDEX IF NOT EXISTS idx_contaazul_financeiro_bar_id ON contaazul_financeiro(bar_id);
      CREATE INDEX IF NOT EXISTS idx_contaazul_financeiro_tipo ON contaazul_financeiro(tipo);
      CREATE INDEX IF NOT EXISTS idx_contaazul_financeiro_data_competencia ON contaazul_financeiro(data_competencia);
      CREATE INDEX IF NOT EXISTS idx_contaazul_financeiro_data_vencimento ON contaazul_financeiro(data_vencimento);
      CREATE INDEX IF NOT EXISTS idx_contaazul_financeiro_status ON contaazul_financeiro(status);
      CREATE INDEX IF NOT EXISTS idx_contaazul_financeiro_categoria ON contaazul_financeiro(categoria_id);
      
      -- Índices para sincronização
      CREATE INDEX IF NOT EXISTS idx_contaazul_sincronizacao_bar_id ON contaazul_sincronizacao(bar_id);
      CREATE INDEX IF NOT EXISTS idx_contaazul_sincronizacao_status ON contaazul_sincronizacao(status);
      CREATE INDEX IF NOT EXISTS idx_contaazul_sincronizacao_execucao ON contaazul_sincronizacao(ultima_execucao);
      
      -- Índices para categorias
      CREATE INDEX IF NOT EXISTS idx_contaazul_categorias_bar_id ON contaazul_categorias(bar_id);
      CREATE INDEX IF NOT EXISTS idx_contaazul_categorias_tipo ON contaazul_categorias(tipo);
      
      -- Índices para contas financeiras
      CREATE INDEX IF NOT EXISTS idx_contaazul_contas_bar_id ON contaazul_contas_financeiras(bar_id);
    `;

    // SQL para triggers de updated_at
    const createTriggersSQL = `
      -- Função para atualizar updated_at
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Trigger para contaazul_financeiro
      DROP TRIGGER IF EXISTS update_contaazul_financeiro_updated_at ON contaazul_financeiro;
      CREATE TRIGGER update_contaazul_financeiro_updated_at
        BEFORE UPDATE ON contaazul_financeiro
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;

    // Executar criação das tabelas
    console.log('📋 Criando tabelas...');
    const { error: tablesError } = await supabase.rpc('exec_sql', {
      sql: createTablesSQL
    });

    if (tablesError) {
      console.error('❌ Erro ao criar tabelas:', tablesError);
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar tabelas',
        details: tablesError.message
      }, { status: 500 });
    }

    // Executar criação dos índices
    console.log('🔍 Criando índices...');
    const { error: indexesError } = await supabase.rpc('exec_sql', {
      sql: createIndexesSQL
    });

    if (indexesError) {
      console.error('⚠️ Aviso ao criar índices:', indexesError);
      // Não falha se índices já existem
    }

    // Executar criação dos triggers
    console.log('⚡ Criando triggers...');
    const { error: triggersError } = await supabase.rpc('exec_sql', {
      sql: createTriggersSQL
    });

    if (triggersError) {
      console.error('⚠️ Aviso ao criar triggers:', triggersError);
      // Não falha se triggers já existem
    }

    // Verificar se as tabelas foram criadas
    const { data: tables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'contaazul_financeiro', 
        'contaazul_sincronizacao', 
        'contaazul_categorias',
        'contaazul_contas_financeiras'
      ]);

    if (checkError) {
      console.error('❌ Erro ao verificar tabelas:', checkError);
      return NextResponse.json({
        success: false,
        error: 'Erro ao verificar tabelas criadas',
        details: checkError.message
      }, { status: 500 });
    }

    const tabelasCriadas = tables?.map(t => t.table_name) || [];
    
    console.log('✅ Setup de banco concluído!');
    console.log('📋 Tabelas criadas:', tabelasCriadas);

    return NextResponse.json({
      success: true,
      message: 'Estrutura de banco para Visão de Competência criada com sucesso!',
      tabelas_criadas: tabelasCriadas,
      estrutura: {
        contaazul_financeiro: 'Dados financeiros normalizados (receitas e despesas)',
        contaazul_sincronizacao: 'Controle e histórico de sincronizações',
        contaazul_categorias: 'Cache local das categorias do ContaAzul',
        contaazul_contas_financeiras: 'Cache local das contas financeiras'
      },
      proximos_passos: [
        '1. Testar endpoints oficiais para verificar estrutura de dados',
        '2. Implementar API de sincronização',
        '3. Criar interface da Visão de Competência',
        '4. Configurar sincronização automática/agendada'
      ]
    });

  } catch (error: any) {
    console.error('❌ Erro no setup do banco:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno no setup do banco',
      details: error.message
    }, { status: 500 });
  }
} 