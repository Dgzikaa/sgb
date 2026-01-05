import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { parseNubankCSV, parseBradescoCSV, parseItauCSV, parseBBCSV, parseCaixaCSV, parseGenericCSV } from '@/lib/parsers/csv-parser'
import { parseOFX } from '@/lib/parsers/ofx-parser'
import { categorizarTransacao } from '@/lib/fp/categorizacao'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar CPF do usuário
    const { data: userData } = await supabase
      .from('usuarios')
      .select('cpf')
      .eq('id', session.user.id)
      .single()

    if (!userData?.cpf) {
      return NextResponse.json({ error: 'CPF não encontrado' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const contaId = formData.get('conta_id') as string
    const banco = formData.get('banco') as string // 'nubank', 'bradesco', 'itau', 'bb', 'caixa', 'generic'
    
    if (!file || !contaId || !banco) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Verificar se a conta existe e pertence ao usuário
    const { data: conta } = await supabase
      .from('fp_contas')
      .select('*')
      .eq('id', contaId)
      .eq('usuario_cpf', userData.cpf)
      .single()

    if (!conta) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })
    }

    // Ler conteúdo do arquivo
    const buffer = await file.arrayBuffer()
    const content = Buffer.from(buffer).toString('utf-8')

    let transacoes: any[] = []
    const fileName = file.name.toLowerCase()

    // Detectar formato e parsear
    if (fileName.endsWith('.ofx')) {
      transacoes = parseOFX(content)
    } else if (fileName.endsWith('.csv')) {
      // Parsear conforme o banco
      switch (banco) {
        case 'nubank':
          transacoes = parseNubankCSV(content)
          break
        case 'bradesco':
          transacoes = parseBradescoCSV(content)
          break
        case 'itau':
          transacoes = parseItauCSV(content)
          break
        case 'bb':
          transacoes = parseBBCSV(content)
          break
        case 'caixa':
          transacoes = parseCaixaCSV(content)
          break
        default:
          transacoes = parseGenericCSV(content)
      }
    } else {
      return NextResponse.json({ error: 'Formato de arquivo não suportado' }, { status: 400 })
    }

    if (!transacoes || transacoes.length === 0) {
      return NextResponse.json({ error: 'Nenhuma transação encontrada no arquivo' }, { status: 400 })
    }

    // Buscar categorias do usuário para categorização automática
    const { data: categorias } = await supabase
      .from('fp_categorias')
      .select('*')
      .eq('usuario_cpf', userData.cpf)
      .eq('ativa', true)

    // Buscar regras de categorização
    const { data: regras } = await supabase
      .from('fp_regras_categoria')
      .select('*, categoria:fp_categorias(*)')
      .eq('usuario_cpf', userData.cpf)
      .eq('ativa', true)
      .order('prioridade', { ascending: false })

    // Processar transações
    const transacoesParaInserir = []
    const transacoesDuplicadas = []
    const transacoesCategorizadas = []

    for (const t of transacoes) {
      // Gerar hash único para detectar duplicatas
      const hash = `${t.data}_${t.valor}_${t.descricao}`.replace(/\s/g, '').toLowerCase()

      // Verificar se já existe
      const { data: existente } = await supabase
        .from('fp_transacoes')
        .select('id')
        .eq('usuario_cpf', userData.cpf)
        .eq('conta_id', contaId)
        .eq('hash_original', hash)
        .single()

      if (existente) {
        transacoesDuplicadas.push(t)
        continue
      }

      // Categorizar automaticamente
      const categoriaId = categorizarTransacao(t.descricao, t.tipo, regras || [], categorias || [])
      
      if (categoriaId) {
        transacoesCategorizadas.push(t)
      }

      transacoesParaInserir.push({
        usuario_cpf: userData.cpf,
        conta_id: contaId,
        categoria_id: categoriaId,
        tipo: t.tipo,
        descricao: t.descricao,
        valor: parseFloat(t.valor),
        data: t.data,
        status: 'confirmada',
        origem_importacao: banco,
        hash_original: hash
      })
    }

    // Inserir transações
    let transacoesInseridas = []
    if (transacoesParaInserir.length > 0) {
      const { data: inseridas, error } = await supabase
        .from('fp_transacoes')
        .insert(transacoesParaInserir)
        .select()

      if (error) throw error
      transacoesInseridas = inseridas || []

      // Recalcular saldo da conta
      const totalReceitas = transacoesParaInserir
        .filter(t => t.tipo === 'receita')
        .reduce((acc, t) => acc + t.valor, 0)
      
      const totalDespesas = transacoesParaInserir
        .filter(t => t.tipo === 'despesa')
        .reduce((acc, t) => acc + t.valor, 0)

      const novoSaldo = parseFloat(conta.saldo_atual) + totalReceitas - totalDespesas

      await supabase
        .from('fp_contas')
        .update({ saldo_atual: novoSaldo })
        .eq('id', contaId)
    }

    return NextResponse.json({
      success: true,
      message: 'Importação concluída',
      data: {
        total: transacoes.length,
        inseridas: transacoesInseridas.length,
        duplicadas: transacoesDuplicadas.length,
        categorizadasAuto: transacoesCategorizadas.length,
        semCategoria: transacoesInseridas.length - transacoesCategorizadas.length,
        transacoes: transacoesInseridas
      }
    })
  } catch (error: any) {
    console.error('Erro ao importar transações:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
