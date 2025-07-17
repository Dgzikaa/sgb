import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse, permissionErrorResponse } from '@/middleware/auth'

// =====================================================
// CONFIGURAÃ¡â€¡Ã¡â€¢ES DE UPLOAD
// =====================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/svg+xml'
]

const FOLDERS = {
  checklist_photos: 'checklists/photos',
  signatures: 'checklists/signatures',
  profile_photos: 'usuarios/profiles'
}

// =====================================================
// FUNÃ¡â€¡Ã¡Æ’O DE COMPRESSÃ¡Æ’O DE IMAGEM
// =====================================================

async function compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    
    img.onload = () => {
      // Calcular dimensÃ¡Âµes mantendo aspect ratio
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      canvas.width = width
      canvas.height = height
      
      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height)
      
      // Converter para blob comprimido
      canvas.toBlob(resolve as BlobCallback, 'image/jpeg', quality)
    }
    
    img.src = URL.createObjectURL(file)
  })
}

// =====================================================
// VALIDAÃ¡â€¡Ã¡â€¢ES
// =====================================================

function validateFile(file: File): { valid: boolean; error?: string } {
  // Verificar tipo de arquivo
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo nÃ¡Â£o permitido. Aceitos: ${ALLOWED_TYPES.join(', ')}`
    }
  }
  
  // Verificar tamanho
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Arquivo muito grande. MÃ¡Â¡ximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }
  }
  
  return { valid: true }
}

// =====================================================
// POST - UPLOAD DE ARQUIVO
// =====================================================
export async function POST(request: NextRequest) {
  try {
    // Ã°Å¸â€Â AUTENTICAÃ¡â€¡Ã¡Æ’O
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('UsuÃ¡Â¡rio nÃ¡Â£o autenticado')
    }

    // Verificar se tem permissÃ¡Â£o para uploads
    if (!user.ativo) {
      return permissionErrorResponse('UsuÃ¡Â¡rio inativo')
    }

    // Parsear FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string
    const compress = formData.get('compress') === 'true'
    const maxWidth = parseInt(formData.get('maxWidth') as string) || 1920
    const quality = parseFloat(formData.get('quality') as string) || 0.8

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nenhum arquivo fornecido' 
      }, { status: 400 })
    }

    // Validar arquivo
    const validation = validateFile(file)
    if (!validation.valid) {
      return NextResponse.json({ 
        success: false, 
        error: validation.error 
      }, { status: 400 })
    }

    // Validar pasta
    if (!folder || !FOLDERS[folder as keyof typeof FOLDERS]) {
      return NextResponse.json({ 
        success: false, 
        error: 'Pasta de destino invÃ¡Â¡lida' 
      }, { status: 400 })
    }

    const supabase = await getAdminClient()

    // Preparar arquivo para upload
    const fileToUpload: File | Blob = file
    let finalFileName = file.name
    
    // Comprimir se solicitado e for imagem
    if (compress && file.type.startsWith('image/')) {
      try {
        // Nota: compressÃ¡Â£o seria feita no frontend, aqui sÃ¡Â³ validamos
        console.log('Ã°Å¸â€œÂ¸ CompressÃ¡Â£o serÃ¡Â¡ aplicada no frontend')
      } catch (error) {
        console.warn('Å¡Â Ã¯Â¸Â Erro na compressÃ¡Â£o, usando arquivo original:', error)
      }
    }

    // Gerar nome Ã¡Âºnico para o arquivo
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    finalFileName = `${timestamp}_${randomId}_${safeName}`

    // Caminho completo no storage
    const folderPath = FOLDERS[folder as keyof typeof FOLDERS]
    const fullPath = `${folderPath}/${user.bar_id}/${finalFileName}`

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads') // bucket name
      .upload(fullPath, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      console.error('ÂÅ’ Erro no upload:', uploadError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao fazer upload do arquivo' 
      }, { status: 500 })
    }

    // Obter URL pÃ¡Âºblica
    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(fullPath)

    // Salvar metadados no banco
    const { data: anexo, error: dbError } = await supabase
      .from('checklist_anexos')
      .insert({
        nome_arquivo: finalFileName,
        nome_original: file.name,
        tipo_arquivo: file.type,
        tamanho_bytes: file.size,
        caminho_storage: fullPath,
        url_publica: urlData.publicUrl,
        pasta: folder,
        uploadado_por: user.user_id,
        bar_id: user.bar_id,
        metadados: {
          compressed: compress,
          maxWidth: compress ? maxWidth : null,
          quality: compress ? quality : null,
          originalSize: file.size
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('ÂÅ’ Erro ao salvar metadados:', dbError)
      
      // Tentar limpar arquivo do storage se o DB falhou
      await supabase.storage
        .from('uploads')
        .remove([fullPath])
        .catch(console.error)
      
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao salvar informaÃ¡Â§Ã¡Âµes do arquivo' 
      }, { status: 500 })
    }

    console.log('Å“â€¦ Upload realizado com sucesso:', finalFileName)

    return NextResponse.json({
      success: true,
      message: 'Upload realizado com sucesso',
      data: {
        id: anexo.id,
        filename: finalFileName,
        originalName: file.name,
        url: urlData.publicUrl,
        type: file.type,
        size: file.size,
        folder: folder,
        compressed: compress
      }
    })

  } catch (error: unknown) {
    console.error('ÂÅ’ Erro na API de upload:', error);
    const errMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: errMsg
    }, { status: 500 });
  }
}

// =====================================================
// GET - LISTAR UPLOADS DO USUÃ¡ÂRIO
// =====================================================
export async function GET(request: NextRequest) {
  try {
    // Ã°Å¸â€Â AUTENTICAÃ¡â€¡Ã¡Æ’O
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('UsuÃ¡Â¡rio nÃ¡Â£o autenticado')
    }

    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await getAdminClient()

    // Construir query
    let query = supabase
      .from('checklist_anexos')
      .select('*')
      .eq('bar_id', user.bar_id)
      .order('criado_em', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filtrar por pasta se especificada
    if (folder) {
      query = query.eq('pasta', folder)
    }

    const { data: anexos, error, count } = await query

    if (error) {
      console.error('ÂÅ’ Erro ao buscar uploads:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao buscar arquivos' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: anexos || [],
      pagination: {
        offset,
        limit,
        total: count
      }
    })

  } catch (error: unknown) {
    console.error('ÂÅ’ Erro na API de listagem:', error);
    const errMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: errMsg
    }, { status: 500 });
  }
}

// =====================================================
// DELETE - REMOVER ARQUIVO
// =====================================================
export async function DELETE(request: NextRequest) {
  try {
    // Ã°Å¸â€Â AUTENTICAÃ¡â€¡Ã¡Æ’O
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('UsuÃ¡Â¡rio nÃ¡Â£o autenticado')
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('id')

    if (!fileId) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID do arquivo Ã¡Â© obrigatÃ¡Â³rio' 
      }, { status: 400 })
    }

    const supabase = await getAdminClient()

    // Buscar arquivo (verificar se pertence ao bar do usuÃ¡Â¡rio)
    const { data: anexo, error: fetchError } = await supabase
      .from('checklist_anexos')
      .select('*')
      .eq('id', fileId)
      .eq('bar_id', user.bar_id)
      .single()

    if (fetchError || !anexo) {
      return NextResponse.json({ 
        success: false, 
        error: 'Arquivo nÃ¡Â£o encontrado ou sem permissÃ¡Â£o' 
      }, { status: 404 })
    }

    // Verificar se pode deletar (sÃ¡Â³ quem fez upload ou admin)
    if (anexo.uploadado_por !== user.user_id && user.role !== 'admin') {
      return permissionErrorResponse('Sem permissÃ¡Â£o para deletar este arquivo')
    }

    // Remover do storage
    const { error: storageError } = await supabase.storage
      .from('uploads')
      .remove([anexo.caminho_storage])

    if (storageError) {
      console.warn('Å¡Â Ã¯Â¸Â Erro ao remover do storage:', storageError)
      // Continuar mesmo com erro no storage
    }

    // Remover do banco
    const { error: dbError } = await supabase
      .from('checklist_anexos')
      .delete()
      .eq('id', fileId)

    if (dbError) {
      console.error('ÂÅ’ Erro ao remover do banco:', dbError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao remover arquivo' 
      }, { status: 500 })
    }

    console.log('Å“â€¦ Arquivo removido:', anexo.nome_arquivo)

    return NextResponse.json({
      success: true,
      message: 'Arquivo removido com sucesso'
    })

  } catch (error: unknown) {
    console.error('ÂÅ’ Erro na remoÃ¡Â§Ã¡Â£o de arquivo:', error);
    const errMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: errMsg
    }, { status: 500 });
  }
} 

