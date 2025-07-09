'use client'

import { useState, useEffect } from 'react'
import { useBar } from '@/contexts/BarContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PageBase, PageHeader, PageContent, PageCard, PageGrid, PageText } from '@/components/ui/page-base'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

// Sempre usar essas interfaces para dados tipados
interface ExampleData {
  id: string
  nome: string
  valor: number
}

export default function ExamplePage() {
  const { selectedBar } = useBar()
  
  // Estados
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ExampleData[]>([])

  // Efeitos
  useEffect(() => {
    // Carregar dados iniciais
  }, [selectedBar?.id])

  return (
    <ProtectedRoute requiredModule="nome_do_modulo">
      <PageBase>
        <PageHeader 
          title="🎯 Título da Página"
          description="Descrição da funcionalidade"
          badge={`Bar: ${selectedBar?.nome}`}
        />

        <PageContent>
          <PageGrid columns="grid-cols-1 lg:grid-cols-2">
            
            {/* Card 1 */}
            <PageCard title="📊 Seção 1">
              <div className="space-y-4">
                <PageText variant="body">
                  Conteúdo sempre com texto preto automático
                </PageText>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <PageText variant="caption">Label:</PageText>
                    <PageText variant="subtitle">Valor</PageText>
                  </div>
                </div>
              </div>
            </PageCard>

            {/* Card 2 */}
            <PageCard title="⚙️ Ações">
              <div className="space-y-3">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                >
                  🚀 Ação Principal
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                >
                  📋 Ação Secundária
                </Button>
              </div>
            </PageCard>

          </PageGrid>

          {/* Seção completa */}
          <PageCard title="📋 Lista de Dados">
            {data.length === 0 ? (
              <div className="text-center py-8">
                <PageText variant="muted">
                  📝 Nenhum dado encontrado
                </PageText>
              </div>
            ) : (
              <div className="space-y-2">
                {data.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 border rounded">
                    <PageText variant="body">{item.nome}</PageText>
                    <Badge variant="secondary">{item.valor}</Badge>
                  </div>
                ))}
              </div>
            )}
          </PageCard>

        </PageContent>
      </PageBase>
    </ProtectedRoute>
  )
}

/*
📋 CHECKLIST PARA USAR ESTE TEMPLATE:

1. ✅ Copie este arquivo para sua nova página
2. ✅ Renomeie a função ExamplePage
3. ✅ Altere o requiredModule para o módulo correto
4. ✅ Personalize title, description e badge no PageHeader
5. ✅ Use PageText ao invés de <p>, <span>, etc.
6. ✅ Use PageCard ao invés de Card
7. ✅ Use PageGrid para layouts responsivos

RESULTADO: ✅ Texto sempre preto, sem problemas de CSS!
*/ 