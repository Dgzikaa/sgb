import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🏗️ CRIANDO ESTRUTURA LIMPA para ContaAzul...');
    
    const { bar_id } = await request.json();
    
    if (!bar_id) {
      return NextResponse.json(
        { success: false, message: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🎯 Estrutura anterior removida - criando tabelas organizadas...');
    
    // MIGRATION: Criar estrutura completa do ContaAzul
    const createStructureQuery = `
      -- 1. TABELA PRINCIPAL - Visão de Competência (baseada na planilha modelo)
      CREATE TABLE contaazul_visao_competencia (
        id SERIAL PRIMARY KEY,
        bar_id INTEGER NOT NULL,
        
        -- Dados básicos da parcela
        parcela_id VARCHAR(255) NOT NULL,
        evento_id VARCHAR(255),
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('RECEITA', 'DESPESA')),
        descricao TEXT,
        valor DECIMAL(15,2) NOT NULL,
        
        -- Datas importantes
        data_vencimento DATE,
        data_competencia DATE NOT NULL, -- PRINCIPAL para visão de competência
        data_pagamento DATE,
        
        -- Categoria e Centro de Custo (dados do rateio)
        categoria_id VARCHAR(255),
        categoria_nome VARCHAR(255),
        categoria_valor DECIMAL(15,2),
        centro_custo_id VARCHAR(255),
        centro_custo_nome VARCHAR(255),
        centro_custo_valor DECIMAL(15,2),
        
        -- Cliente/Fornecedor
        cliente_fornecedor_id VARCHAR(255),
        cliente_fornecedor_nome VARCHAR(255),
        
        -- Status e controle
        status VARCHAR(50),
        conta_financeira_id VARCHAR(255),
        conta_financeira_nome VARCHAR(255),
        
        -- Metadados
        coletado_em TIMESTAMP DEFAULT NOW(),
        atualizado_em TIMESTAMP DEFAULT NOW(),
        
        -- Constraints
        UNIQUE(bar_id, parcela_id)
      );

      -- 2. TABELAS AUXILIARES para caching
      CREATE TABLE contaazul_categorias (
        id VARCHAR(255) PRIMARY KEY,
        bar_id INTEGER NOT NULL,
        nome VARCHAR(255) NOT NULL,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('RECEITA', 'DESPESA')),
        codigo VARCHAR(100),
        permite_filhos BOOLEAN DEFAULT false,
        categoria_pai_id VARCHAR(255),
        entrada_dre VARCHAR(100),
        ativo BOOLEAN DEFAULT true,
        atualizado_em TIMESTAMP DEFAULT NOW(),
        
        UNIQUE(bar_id, id)
      );
      
      CREATE TABLE contaazul_centros_custo (
        id VARCHAR(255) PRIMARY KEY,
        bar_id INTEGER NOT NULL,
        nome VARCHAR(255) NOT NULL,
        codigo VARCHAR(100),
        ativo BOOLEAN DEFAULT true,
        atualizado_em TIMESTAMP DEFAULT NOW(),
        
        UNIQUE(bar_id, id)
      );
      
      CREATE TABLE contaazul_contas_financeiras (
        id VARCHAR(255) PRIMARY KEY,
        bar_id INTEGER NOT NULL,
        nome VARCHAR(255) NOT NULL,
        tipo VARCHAR(50),
        banco_numero VARCHAR(10),
        agencia VARCHAR(20),
        conta VARCHAR(30),
        saldo_inicial DECIMAL(15,2) DEFAULT 0,
        ativo BOOLEAN DEFAULT true,
        atualizado_em TIMESTAMP DEFAULT NOW(),
        
        UNIQUE(bar_id, id)
      );

      -- 3. CONFIGURAÇÃO E LOGS
      CREATE TABLE contaazul_config (
        bar_id INTEGER PRIMARY KEY,
        ultima_sincronizacao TIMESTAMP,
        periodo_competencia_inicio DATE,
        periodo_competencia_fim DATE,
        sincronizacao_ativa BOOLEAN DEFAULT true,
        configurado_em TIMESTAMP DEFAULT NOW(),
        atualizado_em TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE contaazul_sync_log (
        id SERIAL PRIMARY KEY,
        bar_id INTEGER NOT NULL,
        tipo_operacao VARCHAR(50) NOT NULL, -- 'COLETA_PARCELAS', 'COLETA_DETALHES', 'PROCESSAMENTO'
        periodo_inicio DATE,
        periodo_fim DATE,
        total_processado INTEGER DEFAULT 0,
        total_sucesso INTEGER DEFAULT 0,
        total_erro INTEGER DEFAULT 0,
        detalhes_erro TEXT,
        tempo_execucao_ms INTEGER,
        iniciado_em TIMESTAMP DEFAULT NOW(),
        finalizado_em TIMESTAMP
      );

      -- 4. ÍNDICES PARA PERFORMANCE
      CREATE INDEX idx_visao_bar_competencia ON contaazul_visao_competencia (bar_id, data_competencia);
      CREATE INDEX idx_visao_categoria ON contaazul_visao_competencia (bar_id, categoria_id);
      CREATE INDEX idx_visao_centro_custo ON contaazul_visao_competencia (bar_id, centro_custo_id);
      CREATE INDEX idx_visao_tipo_competencia ON contaazul_visao_competencia (bar_id, tipo, data_competencia);
      CREATE INDEX idx_visao_status ON contaazul_visao_competencia (bar_id, status);
      
      CREATE INDEX idx_categorias_bar ON contaazul_categorias (bar_id, tipo);
      CREATE INDEX idx_centros_custo_bar ON contaazul_centros_custo (bar_id, ativo);
      CREATE INDEX idx_contas_financeiras_bar ON contaazul_contas_financeiras (bar_id, ativo);
      
      CREATE INDEX idx_sync_log_bar_operacao ON contaazul_sync_log (bar_id, tipo_operacao, iniciado_em);

      -- 5. INSERIR CONFIGURAÇÃO INICIAL
      INSERT INTO contaazul_config (bar_id, sincronizacao_ativa) 
      VALUES (${bar_id}, true)
      ON CONFLICT (bar_id) DO UPDATE SET 
        sincronizacao_ativa = true,
        atualizado_em = NOW();
    `;

    console.log('📊 Executando migration...');
    
    const { error } = await supabase.rpc('exec_sql', { 
      sql_query: createStructureQuery 
    });

    if (error) {
      throw new Error(`Erro na migration: ${error.message}`);
    }

    console.log('🎯 Estrutura ContaAzul criada com sucesso!');

    return NextResponse.json({
      success: true,
      message: '✅ Estrutura ContaAzul criada com sucesso!',
      tabelas_criadas: [
        'contaazul_visao_competencia (PRINCIPAL)',
        'contaazul_categorias (cache)',
        'contaazul_centros_custo (cache)', 
        'contaazul_contas_financeiras (cache)',
        'contaazul_config (configuração)',
        'contaazul_sync_log (logs)'
      ],
      indices_criados: [
        'Performance para data_competencia',
        'Performance para categoria',
        'Performance para centro_custo',
        'Performance para tipo + competencia'
      ],
      proximos_passos: [
        '1. 📥 Coletar dados auxiliares (categorias, centros custo)',
        '2. 🔄 Implementar coleta com detalhes das parcelas',
        '3. ⏰ Configurar automação (4 em 4 horas)',
        '4. 📊 Criar dashboard baseado na planilha modelo'
      ],
      estrutura_final: {
        objetivo: 'Reproduzir planilha visao_competencia via API',
        campos_principais: [
          'data_competencia (filtro)',
          'categoria_id + categoria_nome',
          'centro_custo_id + centro_custo_nome', 
          'tipo (RECEITA/DESPESA)',
          'valor, descricao, cliente_fornecedor_nome'
        ],
        fluxo_coleta: [
          '1. Buscar parcelas por competência',
          '2. Para cada parcela, buscar evento completo',
          '3. Extrair categoria + centro custo do rateio',
          '4. Inserir na visão de competência'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Erro ao criar estrutura:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao criar estrutura ContaAzul',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 