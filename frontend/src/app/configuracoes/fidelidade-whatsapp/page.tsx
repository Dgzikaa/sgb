'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  MessageCircle, 
  Send, 
  User, 
  Phone, 
  ExternalLink,
  Clipboard,
  Search,
  QrCode
} from 'lucide-react'

interface Membro {
  id: string
  nome: string
  email: string
  telefone: string
  status: string
  plano: string
  qr_code_token: string
  bar: {
    nome: string
  }
}

export default function FidelidadeWhatsAppPage() {
  const [membros, setMembros] = useState<Membro[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMembro, setSelectedMembro] = useState<Membro | null>(null)
  const [telefoneCustom, setTelefoneCustom] = useState('')
  const [envioUrl, setEnvioUrl] = useState('')
  const [showEnvioResult, setShowEnvioResult] = useState(false)

  // Buscar membros ativos
  const buscarMembros = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/fidelidade/membros-ativos')
      if (response.ok) {
        const data = await response.json()
        setMembros(data.membros || [])
      }
    } catch (error) {
      console.error('Erro ao buscar membros:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    buscarMembros()
  }, [])

  // Filtrar membros pela busca
  const membrosFiltrados = membros.filter(membro =>
    membro.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    membro.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    membro.telefone.includes(searchTerm)
  )

  // Enviar QR Code via WhatsApp
  const enviarWhatsApp = async (membro: Membro, telefone?: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/fidelidade/enviar-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membro_id: membro.id,
          telefone: telefone || membro.telefone,
          tipo: 'cartao'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setEnvioUrl(data.whatsapp.url)
        setShowEnvioResult(true)
        
        // Abrir WhatsApp automaticamente
        window.open(data.whatsapp.url, '_blank')
      } else {
        alert('Erro ao gerar link do WhatsApp')
      }
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error)
      alert('Erro ao enviar WhatsApp')
    } finally {
      setLoading(false)
    }
  }

  // Copiar link para área de transferência
  const copiarLink = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Link copiado para área de transferência!')
    } catch (error) {
      console.error('Erro ao copiar:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Cabeçalho Moderno */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Envio de QR Code via WhatsApp
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Envie o cartão digital de fidelidade para membros ativos de forma rápida e personalizada
          </p>
        </div>

        {/* Layout Principal */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Lista de Membros - Mais espaçosa */}
          <div className="xl:col-span-2">
            <Card className="card-dark border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-3">
                    <User className="w-6 h-6" />
                    Membros Ativos ({membrosFiltrados.length})
                  </CardTitle>
                  <Badge className="bg-white/20 text-white border-white/30">
                    Total: {membros.length}
                  </Badge>
                </div>
                
                {/* Busca Melhorada */}
                <div className="relative mt-4">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" />
                  <Input
                    placeholder="Buscar por nome, email ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 bg-white/10 border-white/20 text-white placeholder-white/70 focus:bg-white/20 focus:border-white/40"
                  />
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">Carregando membros...</p>
                    </div>
                  ) : membrosFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <User className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-lg text-gray-600 dark:text-gray-400">Nenhum membro encontrado</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">Tente ajustar os filtros de busca</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {membrosFiltrados.map((membro) => (
                        <div
                          key={membro.id}
                          className={`p-6 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                            selectedMembro?.id === membro.id
                              ? 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500'
                              : ''
                          }`}
                          onClick={() => setSelectedMembro(membro)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {/* Avatar */}
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {membro.nome.charAt(0).toUpperCase()}
                              </div>
                              
                              {/* Info do Membro */}
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                                  {membro.nome}
                                </h4>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                  {membro.email}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {membro.telefone || 'Sem telefone'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Badges */}
                            <div className="flex flex-col items-end gap-2">
                              <Badge className={`${
                                membro.plano === 'premium' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                                membro.plano === 'vip' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                                'bg-gradient-to-r from-blue-500 to-cyan-500'
                              } text-white border-0 font-medium`}>
                                {membro.plano.toUpperCase()}
                              </Badge>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {membro.bar.nome}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Painel de Envio - Redesenhado */}
          <div className="xl:col-span-1">
            <Card className="card-dark border-0 shadow-xl rounded-2xl overflow-hidden sticky top-8">
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <Send className="w-6 h-6" />
                  Enviar QR Code
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6">
                {selectedMembro ? (
                  <div className="space-y-6">
                    {/* Preview do Membro */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {selectedMembro.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {selectedMembro.nome}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedMembro.email}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Telefone:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedMembro.telefone || 'Não informado'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Plano:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedMembro.plano}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Telefone Customizado */}
                    <div>
                      <Label htmlFor="telefone-custom" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Telefone para envio (opcional)
                      </Label>
                      <Input
                        id="telefone-custom"
                        placeholder="Ex: 11999999999"
                        value={telefoneCustom}
                        onChange={(e) => setTelefoneCustom(e.target.value)}
                        className="mt-2 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Deixe vazio para usar o telefone cadastrado
                      </p>
                    </div>

                    {/* Botões de Ação */}
                    <div className="space-y-3">
                      <Button
                        onClick={() => enviarWhatsApp(selectedMembro, telefoneCustom || undefined)}
                        disabled={loading || (!selectedMembro.telefone && !telefoneCustom)}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 rounded-xl shadow-lg"
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        {loading ? 'Gerando link...' : 'Enviar via WhatsApp'}
                      </Button>

                      <Button
                        onClick={() => copiarLink(`${process.env.NEXT_PUBLIC_APP_URL || 'https://sgbv2.vercel.app'}/cartao/${selectedMembro.qr_code_token}`)}
                        variant="outline"
                        className="w-full border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 py-3 rounded-xl"
                      >
                        <QrCode className="w-5 h-5 mr-2" />
                        Copiar Link do Cartão
                      </Button>
                    </div>

                    {/* Resultado do Envio */}
                    {showEnvioResult && envioUrl && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800 p-4 rounded-xl">
                        <h4 className="font-bold text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
                          ✅ Link gerado com sucesso!
                        </h4>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => window.open(envioUrl, '_blank')}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Abrir WhatsApp
                          </Button>
                          <Button
                            onClick={() => copiarLink(envioUrl)}
                            size="sm"
                            variant="outline"
                            className="rounded-lg"
                          >
                            <Clipboard className="w-4 h-4 mr-1" />
                            Copiar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Selecione um membro
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Escolha um membro da lista para enviar o QR Code via WhatsApp
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instruções Melhoradas */}
        <Card className="card-dark border-0 shadow-xl rounded-2xl mt-8 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
            <CardTitle className="text-xl font-bold">Como funciona o envio?</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">1. Selecione o Membro</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Escolha o membro ativo na lista que receberá o cartão digital de fidelidade
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">2. Gere o Link</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Clique para criar automaticamente o link do WhatsApp com mensagem personalizada
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Send className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">3. Envie</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  O WhatsApp abrirá automaticamente com a mensagem pronta para envio instantâneo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
