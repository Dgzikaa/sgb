import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Interfaces TypeScript
interface BackupResultado {
  tabela: string;
  registros: number;
  arquivo: string | null;
  sucesso: boolean;
  erro?: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const tabelas = [
  'nibo_agendamentos',
  'nibo_categorias', 
  'nibo_usuarios',
  'nibo_contas_bancarias',
  'nibo_logs_sincronizacao',
  'nibo_stakeholders',
  'nibo_centros_custo'
]

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando backup das tabelas NIBO...')
    
    const resultados: BackupResultado[] = []
    
    for (const tabela of tabelas) {
      try {
        console.log(`📊 Exportando tabela: ${tabela}`)
        
        // Consultar dados da tabela
        const { data, error } = await supabase
          .from(tabela)
          .select('*')
        
        if (error) {
          console.error(`❌ Erro ao consultar ${tabela}:`, error)
          resultados.push({
            tabela,
            registros: 0,
            arquivo: null,
            sucesso: false,
            erro: error.message
          })
          continue
        }
        
        console.log(`✅ ${tabela}: ${data.length} registros encontrados`)
        
        // Criar arquivo JSON com os dados
        const backupData = {
          tabela: tabela,
          data_exportacao: new Date().toISOString(),
          total_registros: data.length,
          dados: data
        }
        
        const filename = `${tabela}_backup_${new Date().toISOString().split('T')[0]}.json`
        
        // Fazer upload para o bucket
        const { error: uploadError } = await supabase.storage
          .from('nibo')
          .upload(filename, JSON.stringify(backupData, null, 2), {
            contentType: 'application/json',
            upsert: true
          })
        
        if (uploadError) {
          console.error(`❌ Erro no upload de ${filename}:`, uploadError)
          resultados.push({
            tabela,
            registros: data.length,
            arquivo: filename,
            sucesso: false,
            erro: uploadError.message
          })
        } else {
          console.log(`✅ Backup salvo: ${filename}`)
          resultados.push({
            tabela,
            registros: data.length,
            arquivo: filename,
            sucesso: true
          })
        }
        
      } catch (error) {
        console.error(`❌ Erro ao processar ${tabela}:`, error)
        resultados.push({
          tabela,
          registros: 0,
          arquivo: null,
          sucesso: false,
          erro: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }
    
    const sucessos = resultados.filter(r => r.sucesso).length
    const total = resultados.length
    
    console.log(`🎉 Backup concluído: ${sucessos}/${total} tabelas processadas com sucesso!`)
    
    return NextResponse.json({
      success: true,
      message: `Backup concluído: ${sucessos}/${total} tabelas processadas`,
      data: {
        total_tabelas: total,
        sucessos: sucessos,
        falhas: total - sucessos,
        resultados: resultados
      }
    })
    
  } catch (error) {
    console.error('❌ Erro geral no backup:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Verificar status do bucket
    const { data: files, error } = await supabase.storage
      .from('nibo')
      .list()
    
    if (error) {
      console.error('❌ Erro ao listar arquivos:', error)
      return NextResponse.json({
        success: false,
        error: 'Erro ao verificar backups'
      }, { status: 500 })
    }
    
    const backups = files?.map(file => ({
      nome: file.name,
      tamanho: file.metadata?.size || 0,
      criado_em: file.created_at,
      atualizado_em: file.updated_at
    })) || []
    
    return NextResponse.json({
      success: true,
      data: {
        total_backups: backups.length,
        backups: backups
      }
    })
    
  } catch (error) {
    console.error('❌ Erro ao verificar backups:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
} 