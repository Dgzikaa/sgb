import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao conectar com banco' 
      }, { status: 500 })
    }

    console.log('🔍 Verificando estrutura das tabelas...')

    // Verificar estrutura da tabela produtos
    let produtosInfo = 'Erro ao verificar'
    try {
      // Primeiro tenta buscar dados existentes
      const { data: produtosSample, error: produtosSampleError } = await supabase
        .from('produtos')
        .select('*')
        .limit(1)

      if (!produtosSampleError) {
        if (produtosSample && produtosSample.length > 0) {
          produtosInfo = Object.keys(produtosSample[0]).join(', ')
        } else {
          // Se vazia, tenta inserir um produto teste para ver a estrutura
          const { data: testData, error: testError } = await supabase
            .from('produtos')
            .insert([{ 
              bar_id: 3, 
              codigo: 'TESTE_ESTRUTURA', 
              nome: 'Produto Teste Estrutura' 
            }])
            .select()
            
          if (!testError && testData && testData.length > 0) {
            produtosInfo = Object.keys(testData[0]).join(', ')
            // Remove o produto teste
            await supabase.from('produtos').delete().eq('codigo', 'TESTE_ESTRUTURA')
          } else {
            produtosInfo = 'Tabela vazia - estrutura não detectada'
          }
        }
      } else {
        produtosInfo = produtosSampleError.message
      }
    } catch (error) {
      produtosInfo = (error as Error).message
    }

    // Verificar estrutura da tabela insumos
    let insumosInfo = 'Erro ao verificar'
    try {
      const { data: insumosSample, error: insumosSampleError } = await supabase
        .from('insumos')
        .select('*')
        .limit(1)

      if (!insumosSampleError) {
        if (insumosSample && insumosSample.length > 0) {
          insumosInfo = Object.keys(insumosSample[0]).join(', ')
        } else {
          insumosInfo = 'Tabela vazia, mas existe'
        }
      } else {
        insumosInfo = insumosSampleError.message
      }
    } catch (error) {
      insumosInfo = (error as Error).message
    }

    // Verificar estrutura da tabela receitas
    let receitasInfo = 'Erro ao verificar'
    try {
      const { data: receitasSample, error: receitasSampleError } = await supabase
        .from('receitas')
        .select('*')
        .limit(1)

      if (!receitasSampleError) {
        if (receitasSample && receitasSample.length > 0) {
          receitasInfo = Object.keys(receitasSample[0]).join(', ')
        } else {
          receitasInfo = 'Tabela vazia, mas existe'
        }
      } else {
        receitasInfo = receitasSampleError.message
      }
    } catch (error) {
      receitasInfo = (error as Error).message
    }

    return NextResponse.json({
      success: true,
      estrutura: {
        produtos: {
          colunas: produtosInfo
        },
        insumos: {
          colunas: insumosInfo
        },
        receitas: {
          colunas: receitasInfo
        }
      },
      script_correcao: `-- Script para corrigir/recriar as tabelas com estrutura completa
DROP TABLE IF EXISTS receitas CASCADE;
DROP TABLE IF EXISTS produtos CASCADE;
DROP TABLE IF EXISTS insumos CASCADE;

-- Tabela de produtos com estrutura completa
CREATE TABLE produtos (
  id BIGSERIAL PRIMARY KEY,
  bar_id INTEGER NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  grupo VARCHAR(100),
  tipo VARCHAR(50) CHECK (tipo IN ('comida', 'bebida', 'indefinido')) DEFAULT 'comida',
  preco_venda DECIMAL(10,2),
  custo_producao DECIMAL(10,2),
  margem_lucro DECIMAL(5,2),
  tempo_preparo_segundos INTEGER DEFAULT 300,
  quantidade_base DECIMAL(10,3) DEFAULT 1,
  unidade_final VARCHAR(20) DEFAULT 'porções',
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(bar_id, codigo)
);

-- Tabela de insumos com estrutura completa
CREATE TABLE insumos (
  id BIGSERIAL PRIMARY KEY,
  bar_id INTEGER NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  categoria VARCHAR(100),
  unidade_medida VARCHAR(20) DEFAULT 'kg',
  custo_por_unidade DECIMAL(10,4),
  fornecedor VARCHAR(255),
  estoque_minimo DECIMAL(10,3) DEFAULT 0,
  estoque_atual DECIMAL(10,3) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(bar_id, codigo)
);

-- Tabela de receitas com estrutura completa
CREATE TABLE receitas (
  id BIGSERIAL PRIMARY KEY,
  bar_id INTEGER NOT NULL,
  produto_id BIGINT REFERENCES produtos(id) ON DELETE CASCADE,
  insumo_id BIGINT REFERENCES insumos(id) ON DELETE CASCADE,
  quantidade_necessaria DECIMAL(10,4) NOT NULL,
  custo_unitario DECIMAL(10,4),
  rendimento_percentual DECIMAL(5,2) DEFAULT 100,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(produto_id, insumo_id)
);

-- Índices para performance
CREATE INDEX idx_produtos_bar_codigo ON produtos(bar_id, codigo);
CREATE INDEX idx_insumos_bar_codigo ON insumos(bar_id, codigo);
CREATE INDEX idx_receitas_produto ON receitas(produto_id);
CREATE INDEX idx_receitas_insumo ON receitas(insumo_id);

-- Inserir dados de exemplo para teste
INSERT INTO produtos (bar_id, codigo, nome, grupo, preco_venda, custo_producao) VALUES 
(3, 'pc0001', 'Molho de pimenta tradicional', 'MOLHOS', 8.50, 3.20),
(3, 'pc0005', 'Frango a Passarinho preparo', 'COMIDAS', 28.90, 12.50);

INSERT INTO insumos (bar_id, codigo, nome, categoria, unidade_medida, custo_por_unidade) VALUES 
(3, 'in001', 'Pimenta dedo de moça', 'VEGETAIS', 'kg', 15.80),
(3, 'in002', 'Frango inteiro', 'CARNES', 'kg', 8.90);`,
      recomendacao: `PASSOS PARA CORREÇÃO:
1. Acesse seu dashboard do Supabase em https://supabase.com/dashboard
2. Selecione seu projeto: uqtgsvujwcbymjmvkjhy
3. Vá em "SQL Editor" no menu lateral
4. Cole o script de correção e execute
5. Volte aqui e teste novamente a importação`
    })

  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno no servidor: ' + (error as Error).message
    }, { status: 500 })
  }
} 