'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { 
  Phone, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  UserPlus, 
  Edit, 
  TestTube,
  Search,
  Download,
  Settings
} from 'lucide-react'
import UsuarioCelularForm from '@/components/forms/UsuarioCelularForm'

interface Usuario {
  id: number
  nome: string
  email: string
  celular: string | null
  whatsapp_valido?: boolean
  numero_formatado?: string | null
  cargo?: string
  departamento?: string
  ativo: boolean
}

export default function WhatsAppFuncionariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [usuariosSemWhatsApp, setUsuariosSemWhatsApp] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(false)
  const [editandoUsuario, setEditandoUsuario] = useState<number | null>(null)
  const [filtro, setFiltro] = useState('')
  const [testingUser, setTestingUser] = useState<number | null>(null)

  useEffect(() => {
    loadUsuarios()
  }, [])

  const loadUsuarios = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/usuarios/with-whatsapp?include_without=true')
      const data = await response.json()

      if (data.success) {
        setUsuarios(data.com_whatsapp || [])
        setUsuariosSemWhatsApp(data.sem_whatsapp || [])
      }
    } catch (error) {
      console.error('Erro ao carregar usuÃ¡rios:', error)
    } finally {
      setLoading(false)
    }
  }

  const testWhatsApp = async (usuario: Usuario) => {
    if (!usuario.celular) return
    
    setTestingUser(usuario.id)
    
    try {
      const response = await fetch('/api/whatsapp/test-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: usuario.celular,
          mensagem: `ðŸ“± Teste WhatsApp - SGB\n\nOlÃ¡ ${usuario.nome}!\n\nEste Ã© um teste do sistema de notificaÃ§Ãµes.\n\nâœ… Seu WhatsApp estÃ¡ funcionando perfeitamente!\n\n_Sistema SGB - ${new Date().toLocaleString('pt-BR')}_`
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(`âœ… Teste enviado com sucesso para ${usuario.nome}!`)
      } else {
        alert(`âŒ Erro ao enviar teste: ${result.error}`)
      }
      
    } catch (error) {
      console.error('Erro ao testar:', error)
      alert('âŒ Erro ao enviar teste')
    } finally {
      setTestingUser(null)
    }
  }

  const exportarRelatorio = () => {
    const todosUsuarios = [...usuarios, ...usuariosSemWhatsApp]
    const csv = [
      'Nome,Email,Celular,WhatsApp VÃ¡lido,Cargo,Departamento,Status',
      ...todosUsuarios.map((u: any) => 
        `"${u.nome}","${u.email}","${u.numero_formatado || u.celular || 'Sem celular'}","${u.whatsapp_valido ? 'Sim' : 'NÃ£o'}","${u.cargo || ''}","${u.departamento || ''}","${u.ativo ? 'Ativo' : 'Inativo'}"`
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `whatsapp-funcionarios-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const usuariosFiltrados = usuarios.filter((u: any) =>
    u.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    u.email.toLowerCase().includes(filtro.toLowerCase())
  )

  const usuariosSemWhatsAppFiltrados = usuariosSemWhatsApp.filter((u: any) =>
    u.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    u.email.toLowerCase().includes(filtro.toLowerCase())
  )

  const usuariosValidos = usuarios.filter((u: any) => u.whatsapp_valido)
  const usuariosInvalidos = usuarios.filter((u: any) => !u.whatsapp_valido)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Gerenciar WhatsApp dos FuncionÃ¡rios
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Configure e valide os nÃºmeros de WhatsApp para notificaÃ§Ãµes automÃ¡ticas
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={exportarRelatorio}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <Button 
                onClick={loadUsuarios}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </div>

          {/* EstatÃ­sticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {usuariosValidos.length}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      WhatsApp OK
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  <div>
                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                      {usuariosInvalidos.length}
                    </div>
                    <div className="text-sm text-yellow-600 dark:text-yellow-400">
                      NÃºmero InvÃ¡lido
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <UserPlus className="h-8 w-8 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                      {usuariosSemWhatsApp.length}
                    </div>
                    <div className="text-sm text-red-600 dark:text-red-400">
                      Sem WhatsApp
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {usuarios.length + usuariosSemWhatsApp.length}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      Total FuncionÃ¡rios
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtro */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar funcionÃ¡rio por nome ou email..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Modal de EdiÃ§Ã£o */}
          {editandoUsuario && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <UsuarioCelularForm
                    usuarioId={editandoUsuario}
                    onSave={() => {
                      setEditandoUsuario(null)
                      loadUsuarios()
                    }}
                    showValidation={true}
                  />
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      onClick={() => setEditandoUsuario(null)}
                      className="w-full"
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Abas */}
          <Tabs defaultValue="com-whatsapp" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700">
              <TabsTrigger value="com-whatsapp" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600">
                WhatsApp Configurado ({usuarios.length})
              </TabsTrigger>
              <TabsTrigger value="sem-whatsapp" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600">
                Sem WhatsApp ({usuariosSemWhatsApp.length})
              </TabsTrigger>
              <TabsTrigger value="alertas" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600">
                Alertas e Avisos
              </TabsTrigger>
            </TabsList>

            {/* FuncionÃ¡rios com WhatsApp */}
            <TabsContent value="com-whatsapp" className="space-y-4">
              {usuariosFiltrados.length === 0 ? (
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="p-8 text-center">
                    <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {filtro ? 'Nenhum funcionÃ¡rio encontrado com o filtro aplicado' : 'Nenhum funcionÃ¡rio com WhatsApp configurado'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {usuariosFiltrados.map((usuario) => (
                    <Card key={usuario.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {usuario.nome}
                              </div>
                              {usuario.whatsapp_valido ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  âœ… VÃ¡lido
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                  âš ï¸ InvÃ¡lido
                                </Badge>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              ðŸ“§ {usuario.email}
                            </div>
                            
                            <div className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                              ðŸ“± {usuario.numero_formatado}
                            </div>
                            
                            {(usuario.cargo || usuario.departamento) && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {[usuario.cargo, usuario.departamento].filter(Boolean).join(' â€¢ ')}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {usuario.whatsapp_valido && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => testWhatsApp(usuario)}
                                disabled={testingUser === usuario.id}
                                className="flex items-center gap-2"
                              >
                                <TestTube className="h-4 w-4" />
                                {testingUser === usuario.id ? 'Testando...' : 'Testar'}
                              </Button>
                            )}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditandoUsuario(usuario.id)}
                              className="flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* FuncionÃ¡rios sem WhatsApp */}
            <TabsContent value="sem-whatsapp" className="space-y-4">
              {usuariosSemWhatsAppFiltrados.length === 0 ? (
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {filtro ? 'Nenhum funcionÃ¡rio encontrado com o filtro aplicado' : 'Todos os funcionÃ¡rios tÃªm WhatsApp configurado!'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <UserPlus className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700 dark:text-red-300">
                      <strong>AtenÃ§Ã£o:</strong> Estes funcionÃ¡rios nÃ£o podem receber notificaÃ§Ãµes de checklist via WhatsApp. 
                      Configure os nÃºmeros antes de atribuÃ­-los como responsÃ¡veis.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid gap-4">
                    {usuariosSemWhatsAppFiltrados.map((usuario) => (
                      <Card key={usuario.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {usuario.nome}
                                </div>
                                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  âŒ Sem WhatsApp
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                ðŸ“§ {usuario.email}
                              </div>
                              
                              {(usuario.cargo || usuario.departamento) && (
                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  {[usuario.cargo, usuario.departamento].filter(Boolean).join(' â€¢ ')}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => setEditandoUsuario(usuario.id)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Phone className="h-4 w-4" />
                                Configurar WhatsApp
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Alertas e Avisos */}
            <TabsContent value="alertas" className="space-y-4">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">
                    ðŸ›¡ï¸ ConfiguraÃ§Ãµes de SeguranÃ§a
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Limites e proteÃ§Ãµes para evitar ban do WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                        ðŸ“Š Limites DiÃ¡rios
                      </h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <li>â€¢ MÃ¡ximo 50 mensagens por dia por nÃºmero</li>
                        <li>â€¢ Intervalo mÃ­nimo de 30 segundos entre mensagens</li>
                        <li>â€¢ Funcionamento apenas em horÃ¡rio comercial (8h Ã s 18h)</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-medium text-green-900 dark:text-green-200 mb-2">
                        âœ… ProteÃ§Ãµes Ativas
                      </h4>
                      <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                        <li>â€¢ Mensagens personalizadas (anti-spam)</li>
                        <li>â€¢ CÃ³digos Ãºnicos para identificaÃ§Ã£o</li>
                        <li>â€¢ ValidaÃ§Ã£o de nÃºmeros antes do envio</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* RecomendaÃ§Ãµes */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">
                    ðŸ’¡ RecomendaÃ§Ãµes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                      <strong>Campo ObrigatÃ³rio:</strong> Recomendamos tornar o celular obrigatÃ³rio no cadastro de novos funcionÃ¡rios 
                      para evitar problemas na atribuiÃ§Ã£o de checklists.
                    </AlertDescription>
                  </Alert>
                  
                  <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                    <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                      <strong>Backup:</strong> Mantenha sempre um responsÃ¡vel adicional nos checklists crÃ­ticos 
                      caso um nÃºmero fique indisponÃ­vel.
                    </AlertDescription>
                  </Alert>
                  
                  <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      <strong>Teste Regular:</strong> Teste os nÃºmeros periodicamente para garantir que estÃ£o funcionando.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 
