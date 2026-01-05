'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ImportarExtrato Page() {
  const [contas, setContas] = useState<any[]>([])
  const [contaSelecionada, setContaSelecionada] = useState('')
  const [banco, setBanco] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [resultado, setResultado] = useState<any>(null)

  useEffect(() => {
    fetchContas()
  }, [])

  const fetchContas = async () => {
    try {
      const response = await fetch('/api/fp/contas')
      const result = await response.json()
      
      if (result.success) {
        setContas(result.data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar contas:', error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setArquivo(file)
      setResultado(null)
    }
  }

  const handleImport = async () => {
    if (!arquivo || !contaSelecionada || !banco) {
      toast.error('Preencha todos os campos')
      return
    }

    try {
      setImporting(true)
      setResultado(null)

      const formData = new FormData()
      formData.append('file', arquivo)
      formData.append('conta_id', contaSelecionada)
      formData.append('banco', banco)

      const response = await fetch('/api/fp/importar', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setResultado(result.data)
        toast.success(result.message)
        setArquivo(null)
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        toast.error(result.error || 'Erro ao importar extrato')
      }
    } catch (error) {
      console.error('Erro ao importar:', error)
      toast.error('Erro ao importar extrato')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="card-dark p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/fp/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Importar Extrato Bancário
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Importe seus extratos em CSV ou OFX
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário de Importação */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                Dados da Importação
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Selecione a conta e o banco do extrato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selecionar Conta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Conta Destino *
                </label>
                {contas.length === 0 ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                    <p className="text-yellow-800 dark:text-yellow-300 mb-2">
                      Você precisa cadastrar uma conta primeiro
                    </p>
                    <Link href="/fp/contas">
                      <Button size="sm">
                        Cadastrar Conta
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Select value={contaSelecionada} onValueChange={setContaSelecionada}>
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {contas.map((conta) => (
                        <SelectItem key={conta.id} value={conta.id}>
                          {conta.nome} - {conta.banco}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Selecionar Banco */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Banco do Extrato *
                </label>
                <Select value={banco} onValueChange={setBanco}>
                  <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nubank">Nubank</SelectItem>
                    <SelectItem value="bradesco">Bradesco</SelectItem>
                    <SelectItem value="itau">Itaú</SelectItem>
                    <SelectItem value="bb">Banco do Brasil</SelectItem>
                    <SelectItem value="caixa">Caixa Econômica</SelectItem>
                    <SelectItem value="generic">Genérico (Auto-detectar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Upload de Arquivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Arquivo do Extrato *
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                  <input
                    id="file-input"
                    type="file"
                    accept=".csv,.ofx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="file-input" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    {arquivo ? (
                      <div>
                        <p className="text-green-600 dark:text-green-400 font-medium">
                          {arquivo.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          Clique para trocar o arquivo
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">
                          Clique para selecionar
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          CSV ou OFX (máx. 10MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Botão Importar */}
              <Button
                onClick={handleImport}
                disabled={!arquivo || !contaSelecionada || !banco || importing || contas.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar Extrato
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Resultado da Importação */}
          <div className="space-y-4">
            {resultado && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Importação Concluída
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Resumo do processamento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-gray-700 dark:text-gray-300">
                        Total de transações
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {resultado.total}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="text-green-700 dark:text-green-300 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Importadas com sucesso
                      </span>
                      <span className="font-semibold text-green-700 dark:text-green-300">
                        {resultado.inseridas}
                      </span>
                    </div>

                    {resultado.duplicadas > 0 && (
                      <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <span className="text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Duplicadas (ignoradas)
                        </span>
                        <span className="font-semibold text-yellow-700 dark:text-yellow-300">
                          {resultado.duplicadas}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Categorizadas automaticamente
                      </span>
                      <span className="font-semibold text-blue-700 dark:text-blue-300">
                        {resultado.categorizadasAuto}
                      </span>
                    </div>

                    {resultado.semCategoria > 0 && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-gray-700 dark:text-gray-300">
                          Sem categoria
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {resultado.semCategoria}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link href="/fp/transacoes">
                      <Button className="w-full">
                        Ver Transações Importadas
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instruções */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Como Baixar seu Extrato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-1">
                      Nubank
                    </p>
                    <p>
                      App → Extrato → Ícone de compartilhar → Exportar como CSV
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-1">
                      Bradesco
                    </p>
                    <p>
                      Internet Banking → Extrato → Exportar → CSV
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-1">
                      Itaú
                    </p>
                    <p>
                      App → Extrato → Exportar → OFX ou CSV
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-1">
                      Banco do Brasil
                    </p>
                    <p>
                      Internet Banking → Extrato → Salvar como → Excel/CSV
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-1">
                      Caixa
                    </p>
                    <p>
                      Internet Banking → Extrato → Exportar → CSV
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
