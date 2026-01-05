import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Papa from 'papaparse'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const contaId = formData.get('conta_id') as string
    const banco = formData.get('banco') as string
    const usuarioCpf = formData.get('usuario_cpf') as string

    if (!file || !contaId || !banco) {
      return NextResponse.json(
        { error: 'Arquivo, conta e banco são obrigatórios' },
        { status: 400 }
      )
    }

    // Ler arquivo CSV
    const text = await file.text()

    return new Promise((resolve) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: any) => {
          try {
            // Mapear dados baseado no banco
            let transacoes = results.data.map((row: any) => 
              mapearTransacao(row, banco, contaId, usuarioCpf)
            ).filter((t: any) => t !== null)

            // Verificar duplicatas
            const hashes = transacoes.map((t: any) => t.hash_original)
            const { data: existentes } = await supabase
              .from('fp_transacoes')
              .select('hash_original')
              .in('hash_original', hashes)

            const hashesExistentes = new Set(existentes?.map((e: any) => e.hash_original) || [])
            
            const transacoesNovas = transacoes.filter(
              (t: any) => !hashesExistentes.has(t.hash_original)
            )

            if (transacoesNovas.length === 0) {
              resolve(NextResponse.json({
                success: true,
                message: 'Nenhuma transação nova encontrada',
                importadas: 0,
                duplicadas: transacoes.length
              }))
              return
            }

            // Inserir transações
            const { data, error } = await supabase
              .from('fp_transacoes')
              .insert(transacoesNovas)
              .select()

            if (error) {
              console.error('Erro ao inserir transações:', error)
              resolve(NextResponse.json(
                { error: 'Erro ao inserir transações: ' + error.message },
                { status: 500 }
              ))
              return
            }

            resolve(NextResponse.json({
              success: true,
              message: `${transacoesNovas.length} transações importadas com sucesso`,
              importadas: transacoesNovas.length,
              duplicadas: transacoes.length - transacoesNovas.length,
              data
            }))

          } catch (error: any) {
            console.error('Erro no processamento:', error)
            resolve(NextResponse.json(
              { error: 'Erro ao processar arquivo: ' + error.message },
              { status: 500 }
            ))
          }
        },
        error: (error: any) => {
          resolve(NextResponse.json(
            { error: 'Erro ao ler arquivo CSV: ' + error.message },
            { status: 400 }
          ))
        }
      })
    })

  } catch (error: any) {
    console.error('Erro na importação:', error)
    return NextResponse.json(
      { error: 'Erro na importação: ' + error.message },
      { status: 500 }
    )
  }
}

function mapearTransacao(row: any, banco: string, contaId: string, usuarioCpf: string): any {
  try {
    let data, descricao, valor, tipo

    switch (banco.toLowerCase()) {
      case 'nubank':
        data = row['date'] || row['Data']
        descricao = row['description'] || row['title'] || row['Descrição']
        valor = parseFloat((row['amount'] || row['Valor'] || '0').toString().replace(',', '.'))
        tipo = valor < 0 ? 'saida' : 'entrada'
        break

      case 'inter':
        data = row['Data']
        descricao = row['Descrição'] || row['Histórico']
        valor = parseFloat((row['Valor'] || '0').toString().replace(',', '.'))
        tipo = row['Tipo']?.toLowerCase() === 'débito' ? 'saida' : 'entrada'
        break

      case 'itau':
        data = row['data'] || row['Data']
        descricao = row['descricao'] || row['histórico'] || row['Descrição']
        valor = parseFloat((row['valor'] || '0').toString().replace(',', '.'))
        tipo = valor < 0 ? 'saida' : 'entrada'
        break

      case 'bradesco':
        data = row['Data']
        descricao = row['Histórico'] || row['Descrição']
        valor = parseFloat((row['Valor'] || '0').toString().replace(',', '.'))
        tipo = row['Tipo'] === 'D' || valor < 0 ? 'saida' : 'entrada'
        break

      case 'caixa':
        data = row['Data']
        descricao = row['Descrição'] || row['Histórico']
        valor = parseFloat((row['Valor'] || '0').toString().replace(',', '.'))
        tipo = valor < 0 ? 'saida' : 'entrada'
        break

      default:
        // Formato genérico
        data = row['data'] || row['Data'] || row['date']
        descricao = row['descricao'] || row['Descrição'] || row['description'] || row['Histórico']
        valor = parseFloat((row['valor'] || row['Valor'] || row['amount'] || '0').toString().replace(',', '.'))
        tipo = valor < 0 ? 'saida' : 'entrada'
    }

    if (!data || !descricao || isNaN(valor)) {
      return null
    }

    // Normalizar data para YYYY-MM-DD
    const dataFormatada = normalizarData(data)
    
    // Gerar hash único
    const hash = gerarHash(dataFormatada, descricao, valor, contaId)

    return {
      usuario_cpf: usuarioCpf,
      conta_id: contaId,
      categoria_id: null,
      tipo: tipo,
      descricao: descricao.trim(),
      valor: Math.abs(valor),
      data: dataFormatada,
      status: 'pendente',
      origem_importacao: banco,
      hash_original: hash
    }

  } catch (error) {
    console.error('Erro ao mapear transação:', error, row)
    return null
  }
}

function normalizarData(data: string): string {
  try {
    // Tentar diversos formatos
    const formatos = [
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    ]

    for (const formato of formatos) {
      const match = data.match(formato)
      if (match) {
        if (formato === formatos[0]) {
          return data // Já está no formato correto
        } else {
          // DD/MM/YYYY ou DD-MM-YYYY para YYYY-MM-DD
          return `${match[3]}-${match[2]}-${match[1]}`
        }
      }
    }

    // Se não bateu com nenhum formato, tentar parse direto
    const d = new Date(data)
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0]
    }

    throw new Error('Formato de data inválido')
  } catch (error) {
    console.error('Erro ao normalizar data:', data, error)
    return new Date().toISOString().split('T')[0]
  }
}

function gerarHash(data: string, descricao: string, valor: number, contaId: string): string {
  const str = `${data}-${descricao}-${valor}-${contaId}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}
