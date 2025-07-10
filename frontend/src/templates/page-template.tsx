/**
 * ⚠️ TEMPLATE OBRIGATÓRIO PARA PÁGINAS DO SISTEMA SGB_V2
 * 
 * REGRAS OBRIGATÓRIAS:
 * 1. Sempre criar layout.tsx na pasta da página
 * 2. Layout deve usar DarkSidebarLayout
 * 3. Página deve usar Card components
 * 4. Seguir estrutura de pastas definida
 * 
 * EXEMPLO DE USO:
 * 
 * 1. CRIAR: frontend/src/app/minha-secao/layout.tsx
 * 2. CRIAR: frontend/src/app/minha-secao/page.tsx
 * 
 * ⚠️ NUNCA CRIAR PÁGINAS SEM LAYOUT.TSX!
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { usePermissions } from '@/hooks/usePermissions'
import { 
  Settings, 
  User, 
  Shield, 
  AlertCircle, 
  CheckCircle 
} from 'lucide-react'

// ========================================
// TEMPLATE DE LAYOUT.TSX (OBRIGATÓRIO)
// ========================================
/*
import { DarkSidebarLayout } from '@/components/layouts'

export default function MinhaSecaoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DarkSidebarLayout>
      {children}
    </DarkSidebarLayout>
  )
}
*/

// ========================================
// TEMPLATE DE PAGE.TSX
// ========================================

interface DadosExemplo {
  id: number
  nome: string
  email: string
  ativo: boolean
  criado_em: string
}

export default function ExemploPageTemplate() {
  const { user } = usePermissions()
  
  const [dados, setDados] = useState<DadosExemplo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setCarregando(true)
      // Sua lógica de carregamento aqui
      // const response = await fetch('/api/seus-dados')
      // const data = await response.json()
      setDados([]) // Placeholder
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setMensagem({ tipo: 'error', texto: 'Erro ao carregar dados' })
    } finally {
      setCarregando(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ✅ Header da página - SEMPRE INCLUIR */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Título da Página</h1>
          <Badge variant="default">Status</Badge>
        </div>
        <p className="text-gray-600">
          Descrição do que a página faz
        </p>
      </div>

      {/* ✅ Mensagem de feedback - SEMPRE INCLUIR */}
      {mensagem && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          mensagem.tipo === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {mensagem.tipo === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{mensagem.texto}</span>
        </div>
      )}

      {/* ✅ Conteúdo principal - SEMPRE USAR TABS SE NECESSÁRIO */}
      <Tabs defaultValue="principal" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="principal">Principal</TabsTrigger>
          <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
        </TabsList>

        {/* ✅ Tab Principal */}
        <TabsContent value="principal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Seção Principal</span>
              </CardTitle>
              <CardDescription>
                Descrição da seção principal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ✅ Conteúdo do card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="exemplo">Campo de exemplo</Label>
                  <Input
                    id="exemplo"
                    placeholder="Placeholder"
                  />
                </div>
                {/* Adicione mais campos conforme necessário */}
              </div>

              <Separator />

              {/* ✅ Botões de ação */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline">
                  Cancelar
                </Button>
                <Button>
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ✅ Tab Configurações */}
        <TabsContent value="configuracoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Configurações</span>
              </CardTitle>
              <CardDescription>
                Configurações da página
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Conteúdo das configurações */}
              <p className="text-sm text-gray-600">
                Conteúdo das configurações aqui
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ========================================
// CHECKLIST OBRIGATÓRIO
// ========================================
/*
✅ ANTES DE CRIAR QUALQUER PÁGINA:

1. [ ] Criei o layout.tsx na pasta da página?
2. [ ] O layout usa DarkSidebarLayout?
3. [ ] A página usa Card components?
4. [ ] Inclui header com título e descrição?
5. [ ] Inclui sistema de mensagens de feedback?
6. [ ] Usa loading states?
7. [ ] Segue estrutura de pastas correta?
8. [ ] Testei se sidebar/header/footer aparecem?

❌ SE ALGUM ITEM NÃO ESTIVER MARCADO, NÃO CRIAR A PÁGINA!
*/ 