// ========================================
// 💾 API BACKUP MÉTRICAS SOCIAIS
// ========================================
// Sistema de backup automático e recovery das métricas
// Recursos: backup diário, export, restore, cleanup

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Configuração Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ========================================
// 🔒 AUTENTICAÇÃO E VALIDAÇÃO
// ========================================
async function validateAdminAccess(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return false
  }
  
  const token = authHeader.split(' ')[1]
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) return false
  
  // Verificar se é admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  return profile?.role === 'admin'
}

// ========================================
// 💾 BACKUP DAS MÉTRICAS
// ========================================
async function createBackup() {
  const backupData = {
    timestamp: new Date().toISOString(),
    tables: {} as Record<string, any[]>,
    metadata: {
      version: '1.0',
      bar_id: 3,
      backup_type: 'automatic',
      total_records: 0
    }
  }

  try {
    // Lista de tabelas para backup
    const tables = [
      'facebook_metrics',
      'instagram_metrics', 
      'facebook_posts',
      'instagram_posts',
      'social_metrics_consolidated',
      'meta_configuracoes',
      'meta_coletas_log'
    ]

    for (const tableName of tables) {
      console.log(`📦 Fazendo backup da tabela: ${tableName}`)
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('bar_id', 3)
        .order('created_at', { ascending: false })
        .limit(1000) // Limitar para evitar backups muito grandes

      if (error) {
        console.error(`❌ Erro no backup de ${tableName}:`, error)
        continue
      }

      backupData.tables[tableName] = data || []
      backupData.metadata.total_records += (data?.length || 0)
      
      console.log(`✅ ${tableName}: ${data?.length || 0} registros`)
    }

    // Salvar o backup
    const backupFileName = `meta_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`
    
    const { error: uploadError } = await supabase.storage
      .from('backups')
      .upload(`metricas-sociais/${backupFileName}`, 
        JSON.stringify(backupData, null, 2), {
          contentType: 'application/json'
        })

    if (uploadError) {
      console.error('❌ Erro ao salvar backup:', uploadError)
      throw uploadError
    }

    // Log do backup
    await supabase
      .from('backup_logs')
      .insert({
        backup_type: 'metricas_sociais',
        filename: backupFileName,
        total_records: backupData.metadata.total_records,
        status: 'sucesso',
        criado_em: new Date().toISOString()
      })

    console.log(`✅ Backup criado: ${backupFileName}`)
    return { success: true, filename: backupFileName, records: backupData.metadata.total_records }

  } catch (error: any) {
    console.error('💥 Erro crítico no backup:', error)
    
    // Log do erro
    await supabase
      .from('backup_logs')
      .insert({
        backup_type: 'metricas_sociais',
        filename: 'erro',
        total_records: 0,
        status: 'erro',
        erro_detalhes: error?.message || 'Erro desconhecido',
        criado_em: new Date().toISOString()
      })

    throw error
  }
}

// ========================================
// 🔄 RESTORE DE BACKUP
// ========================================
async function restoreBackup(filename: string) {
  try {
    console.log(`🔄 Iniciando restore do backup: ${filename}`)

    // Baixar o arquivo de backup
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('backups')
      .download(`metricas-sociais/${filename}`)

    if (downloadError) {
      throw new Error(`Erro ao baixar backup: ${downloadError.message}`)
    }

    // Ler o conteúdo do backup
    const backupContent = await fileData.text()
    const backupData = JSON.parse(backupContent)

    let restoredRecords = 0

    // Restore por tabela
    for (const [tableName, records] of Object.entries(backupData.tables)) {
      if (!Array.isArray(records) || records.length === 0) continue

      console.log(`🔄 Restaurando ${tableName}: ${records.length} registros`)

      // Limpar dados existentes da data do backup (opcional)
      const backupDate = new Date(backupData.timestamp).toISOString().split('T')[0]
      
      await supabase
        .from(tableName)
        .delete()
        .eq('bar_id', 3)
        .gte('created_at', backupDate)

      // Inserir dados do backup em lotes
      const batchSize = 100
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize)
        
        const { error: insertError } = await supabase
          .from(tableName)
          .insert(batch)

        if (insertError) {
          console.error(`❌ Erro ao restaurar lote de ${tableName}:`, insertError)
          continue
        }

        restoredRecords += batch.length
      }
    }

    // Log do restore
    await supabase
      .from('backup_logs')
      .insert({
        backup_type: 'restore_metricas_sociais',
        filename: filename,
        total_records: restoredRecords,
        status: 'sucesso',
        criado_em: new Date().toISOString()
      })

    console.log(`✅ Restore concluído: ${restoredRecords} registros`)
    return { success: true, restored_records: restoredRecords }

  } catch (error: any) {
    console.error('💥 Erro no restore:', error)
    
    await supabase
      .from('backup_logs')
      .insert({
        backup_type: 'restore_metricas_sociais',
        filename: filename,
        total_records: 0,
        status: 'erro',
        erro_detalhes: error?.message || 'Erro desconhecido',
        criado_em: new Date().toISOString()
      })

    throw error
  }
}

// ========================================
// 📊 GET - LISTAR BACKUPS
// ========================================
export async function GET(request: NextRequest) {
  try {
    // Validar acesso admin
    const isAdmin = await validateAdminAccess(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'list') {
      // 📋 Listar backups disponíveis
      const { data: files, error } = await supabase.storage
        .from('backups')
        .list('metricas-sociais', {
          limit: 50,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        console.error('Erro ao listar backups:', error)
        return NextResponse.json(
          { error: 'Erro ao listar backups' },
          { status: 500 }
        )
      }

      // Buscar logs dos backups
      const { data: logs } = await supabase
        .from('backup_logs')
        .select('*')
        .eq('backup_type', 'metricas_sociais')
        .order('criado_em', { ascending: false })
        .limit(20)

      return NextResponse.json({
        success: true,
        backups: files || [],
        logs: logs || [],
        total_backups: files?.length || 0,
        timestamp: new Date().toISOString()
      })

    } else if (action === 'download') {
      // 📥 Download de backup específico
      const filename = searchParams.get('filename')
      if (!filename) {
        return NextResponse.json(
          { error: 'Nome do arquivo é obrigatório' },
          { status: 400 }
        )
      }

      const { data: fileData, error } = await supabase.storage
        .from('backups')
        .download(`metricas-sociais/${filename}`)

      if (error) {
        return NextResponse.json(
          { error: 'Arquivo não encontrado' },
          { status: 404 }
        )
      }

      const headers = new Headers()
      headers.set('Content-Type', 'application/json')
      headers.set('Content-Disposition', `attachment; filename="${filename}"`)

      return new NextResponse(fileData, { headers })

    } else {
      // 📊 Status geral dos backups
      const { data: recentLogs } = await supabase
        .from('backup_logs')
        .select('*')
        .eq('backup_type', 'metricas_sociais')
        .order('criado_em', { ascending: false })
        .limit(5)

      const { data: files } = await supabase.storage
        .from('backups')
        .list('metricas-sociais')

      return NextResponse.json({
        success: true,
        status: {
          total_backups: files?.length || 0,
          last_backup: recentLogs?.[0]?.criado_em || null,
          recent_logs: recentLogs || []
        },
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Erro na API Backup GET:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// ========================================
// 💾 POST - CRIAR BACKUP
// ========================================
export async function POST(request: NextRequest) {
  try {
    // Validar acesso admin
    const isAdmin = await validateAdminAccess(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, filename } = body

    if (action === 'create') {
      // 💾 Criar novo backup
      const result = await createBackup()
      
      return NextResponse.json({
        success: true,
        message: 'Backup criado com sucesso',
        backup: result,
        timestamp: new Date().toISOString()
      })

    } else if (action === 'restore') {
      // 🔄 Restaurar backup
      if (!filename) {
        return NextResponse.json(
          { error: 'Nome do arquivo é obrigatório para restore' },
          { status: 400 }
        )
      }

      const result = await restoreBackup(filename)
      
      return NextResponse.json({
        success: true,
        message: 'Restore concluído com sucesso',
        restore: result,
        timestamp: new Date().toISOString()
      })

    } else {
      return NextResponse.json(
        { error: 'Ação não reconhecida' },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error('Erro na API Backup POST:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error?.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

// ========================================
// 🗑️ DELETE - LIMPAR BACKUPS ANTIGOS
// ========================================
export async function DELETE(request: NextRequest) {
  try {
    // Validar acesso admin
    const isAdmin = await validateAdminAccess(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    const cleanup = searchParams.get('cleanup') === 'true'

    if (filename) {
      // 🗑️ Deletar backup específico
      const { error } = await supabase.storage
        .from('backups')
        .remove([`metricas-sociais/${filename}`])

      if (error) {
        return NextResponse.json(
          { error: 'Erro ao deletar backup' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Backup deletado com sucesso',
        deleted_file: filename,
        timestamp: new Date().toISOString()
      })

    } else if (cleanup) {
      // 🧹 Limpeza automática (manter apenas últimos 30 dias)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: files } = await supabase.storage
        .from('backups')
        .list('metricas-sociais')

      let deletedCount = 0
      const filesToDelete = []

      for (const file of files || []) {
        const fileDate = new Date(file.created_at)
        if (fileDate < thirtyDaysAgo) {
          filesToDelete.push(`metricas-sociais/${file.name}`)
          deletedCount++
        }
      }

      if (filesToDelete.length > 0) {
        const { error } = await supabase.storage
          .from('backups')
          .remove(filesToDelete)

        if (error) {
          console.error('Erro na limpeza automática:', error)
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Limpeza automática concluída',
        deleted_count: deletedCount,
        cutoff_date: thirtyDaysAgo.toISOString(),
        timestamp: new Date().toISOString()
      })

    } else {
      return NextResponse.json(
        { error: 'Parâmetro filename ou cleanup é obrigatório' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Erro na API Backup DELETE:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// ========================================
// 📋 OPÇÕES DISPONÍVEIS
// ========================================
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

// ========================================
// 📝 DOCUMENTAÇÃO DA API
// ========================================
/*
BACKUP MÉTRICAS API ENDPOINTS:

GET /api/admin/backup-metricas
  ?action=list       - Listar todos os backups
  ?action=download&filename=X - Download de backup específico
  (default)          - Status geral dos backups

POST /api/admin/backup-metricas
  { "action": "create" }                    - Criar novo backup
  { "action": "restore", "filename": "X" }  - Restaurar backup

DELETE /api/admin/backup-metricas
  ?filename=X        - Deletar backup específico
  ?cleanup=true      - Limpeza automática (>30 dias)

Todas as requisições precisam de:
  Authorization: Bearer [JWT_TOKEN]
  User role: admin

Estrutura dos backups:
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "tables": {
    "facebook_metrics": [...],
    "instagram_metrics": [...],
    ...
  },
  "metadata": {
    "version": "1.0",
    "bar_id": 3,
    "backup_type": "automatic",
    "total_records": 1234
  }
}
*/ 