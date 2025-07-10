import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🏗️ EXPANDINDO TABELA usuarios_bar para incluir campos de perfil...')

    // SQL para adicionar os novos campos à tabela usuarios_bar
    const migrationSQL = `
      -- Adicionar novos campos para perfil do usuário
      DO $$ 
      BEGIN
        -- Campo para foto de perfil (URL ou base64)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'usuarios_bar' AND column_name = 'foto_perfil') THEN
          ALTER TABLE usuarios_bar ADD COLUMN foto_perfil TEXT;
        END IF;

        -- Campo para celular
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'usuarios_bar' AND column_name = 'celular') THEN
          ALTER TABLE usuarios_bar ADD COLUMN celular VARCHAR(20);
        END IF;

        -- Campo para telefone fixo
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'usuarios_bar' AND column_name = 'telefone') THEN
          ALTER TABLE usuarios_bar ADD COLUMN telefone VARCHAR(20);
        END IF;

        -- Campo para CPF
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'usuarios_bar' AND column_name = 'cpf') THEN
          ALTER TABLE usuarios_bar ADD COLUMN cpf VARCHAR(14);
        END IF;

        -- Campo para data de nascimento
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'usuarios_bar' AND column_name = 'data_nascimento') THEN
          ALTER TABLE usuarios_bar ADD COLUMN data_nascimento DATE;
        END IF;

        -- Campo para endereço completo
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'usuarios_bar' AND column_name = 'endereco') THEN
          ALTER TABLE usuarios_bar ADD COLUMN endereco TEXT;
        END IF;

        -- Campo para CEP
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'usuarios_bar' AND column_name = 'cep') THEN
          ALTER TABLE usuarios_bar ADD COLUMN cep VARCHAR(10);
        END IF;

        -- Campo para cidade
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'usuarios_bar' AND column_name = 'cidade') THEN
          ALTER TABLE usuarios_bar ADD COLUMN cidade VARCHAR(100);
        END IF;

        -- Campo para estado
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'usuarios_bar' AND column_name = 'estado') THEN
          ALTER TABLE usuarios_bar ADD COLUMN estado VARCHAR(2);
        END IF;

        -- Campo para biografia/descrição
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'usuarios_bar' AND column_name = 'bio') THEN
          ALTER TABLE usuarios_bar ADD COLUMN bio TEXT;
        END IF;

        -- Campo para cargo/função específica
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'usuarios_bar' AND column_name = 'cargo') THEN
          ALTER TABLE usuarios_bar ADD COLUMN cargo VARCHAR(100);
        END IF;

        -- Campo para departamento
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'usuarios_bar' AND column_name = 'departamento') THEN
          ALTER TABLE usuarios_bar ADD COLUMN departamento VARCHAR(100);
        END IF;

        -- Campo para data de contratação
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'usuarios_bar' AND column_name = 'data_contratacao') THEN
          ALTER TABLE usuarios_bar ADD COLUMN data_contratacao DATE;
        END IF;

        -- Campo para configurações de preferências (JSON)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'usuarios_bar' AND column_name = 'preferencias') THEN
          ALTER TABLE usuarios_bar ADD COLUMN preferencias JSONB DEFAULT '{}';
        END IF;

        -- Campo para última atividade
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'usuarios_bar' AND column_name = 'ultima_atividade') THEN
          ALTER TABLE usuarios_bar ADD COLUMN ultima_atividade TIMESTAMP;
        END IF;

        -- Campo para status de verificação de conta
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'usuarios_bar' AND column_name = 'conta_verificada') THEN
          ALTER TABLE usuarios_bar ADD COLUMN conta_verificada BOOLEAN DEFAULT false;
        END IF;

      END $$;

      -- Criar índices para performance
      CREATE INDEX IF NOT EXISTS idx_usuarios_bar_celular ON usuarios_bar(celular);
      CREATE INDEX IF NOT EXISTS idx_usuarios_bar_cpf ON usuarios_bar(cpf);
      CREATE INDEX IF NOT EXISTS idx_usuarios_bar_cidade ON usuarios_bar(cidade);
      CREATE INDEX IF NOT EXISTS idx_usuarios_bar_ultima_atividade ON usuarios_bar(ultima_atividade);

      -- Comentários para documentação
      COMMENT ON COLUMN usuarios_bar.foto_perfil IS 'URL ou dados base64 da foto de perfil do usuário';
      COMMENT ON COLUMN usuarios_bar.celular IS 'Número de celular com DDD (ex: (11) 99999-9999)';
      COMMENT ON COLUMN usuarios_bar.endereco IS 'Endereço completo (rua, número, complemento)';
      COMMENT ON COLUMN usuarios_bar.preferencias IS 'Configurações e preferências do usuário em formato JSON';
      COMMENT ON COLUMN usuarios_bar.bio IS 'Biografia ou descrição do usuário';
      COMMENT ON COLUMN usuarios_bar.cargo IS 'Cargo ou função específica do usuário na empresa';
    `

    console.log('📊 Executando migration para expandir usuarios_bar...')

    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })

    if (error) {
      console.error('❌ Erro na migration:', error)
      return NextResponse.json({
        success: false,
        message: 'Erro ao expandir tabela usuarios_bar',
        error: error.message
      }, { status: 500 })
    }

    console.log('✅ Migration concluída com sucesso!')

    // Verificar se os campos foram criados
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'usuarios_bar')
      .order('ordinal_position')

    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError)
    }

    const novosCampos = [
      'foto_perfil', 'celular', 'telefone', 'cpf', 'data_nascimento',
      'endereco', 'cep', 'cidade', 'estado', 'bio', 'cargo', 
      'departamento', 'data_contratacao', 'preferencias', 
      'ultima_atividade', 'conta_verificada'
    ]

    const camposCriados = columns?.filter(col => 
      novosCampos.includes(col.column_name)
    ) || []

    return NextResponse.json({
      success: true,
      message: 'Tabela usuarios_bar expandida com sucesso!',
      detalhes: {
        campos_adicionados: camposCriados.length,
        campos_criados: camposCriados.map(col => ({
          nome: col.column_name,
          tipo: col.data_type,
          nulo: col.is_nullable
        })),
        total_colunas: columns?.length || 0
      }
    })

  } catch (error) {
    console.error('❌ Erro geral na migration:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro interno na migration',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Verificar estrutura atual da tabela usuarios_bar
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'usuarios_bar')
      .order('ordinal_position')

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao consultar estrutura da tabela'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Estrutura atual da tabela usuarios_bar',
      colunas: columns || []
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
} 