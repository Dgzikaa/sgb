'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useBar } from '@/contexts/BarContext'
import { 
  Users, 
  Shield, 
  Target, 
  Plus, 
  Edit2, 
  Trash2, 
  Save,
  X,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Download,
  Upload,
  RefreshCw,
  Database,
  Edit,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  modulos_permitidos: string[];
}

export default function ConfiguracaoPage() {
  const { selectedBar } = useBar()
  const [activeTab, setActiveTab] = useState('usuarios')
  
  // Estados para usuá¡rios
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [editandoUsuario, setEditandoUsuario] = useState<any>(null)
  const [novoUsuario, setNovoUsuario] = useState<any>({})
  const [modalEditarUsuario, setModalEditarUsuario] = useState(false)
  const [usuarioPermissoes, setUsuarioPermissoes] = useState<any>(null)
  const [modalPermissoesUsuario, setModalPermissoesUsuario] = useState(false)
  
  // Estados para metas
  const [metas, setMetas] = useState<any[]>([])
  const [editandoMeta, setEditandoMeta] = useState<any>(null)
  const [novaMeta, setNovaMeta] = useState<any>({})
  
  // Estados para importaá§á£o
  const [urlGoogleSheets, setUrlGoogleSheets] = useState('')
  const [importandoDados, setImportandoDados] = useState(false)
  const [resultadoImportacao, setResultadoImportacao] = useState<any>(null)
  const [statsImportacao, setStatsImportacao] = useState<any>(null)
  
  // Estados para funá§áµes/roles
  const [funcoes, setFuncoes] = useState<any[]>([])
  
  // Estados para má³dulos
  const [modulosDisponiveis, setModulosDisponiveis] = useState<any[]>([])

  if (!selectedBar?.id) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-600 font-medium">š ï¸ Selecione um bar primeiro</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-black mb-2">
          Configuraá§áµes do Sistema
        </h1>
        <p className="text-gray-700 font-medium">
          Gerencie usuá¡rios, permissáµes, metas e importaá§áµes de dados - {selectedBar.nome}
        </p>
      </div>

      {/* Tabs de Configuraá§á£o */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuá¡rios & Permissáµes
          </TabsTrigger>
          <TabsTrigger value="metas" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Metas
          </TabsTrigger>
          <TabsTrigger value="importacao" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Importaá§á£o de Dados
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* Tab de Usuá¡rios */}
        <TabsContent value="usuarios">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Gestá£o de Usuá¡rios e Permissáµes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Metas */}
        <TabsContent value="metas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Metas e Objetivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Importaá§á£o */}
        <TabsContent value="importacao">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Importaá§á£o de Dados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Sistema */}
        <TabsContent value="sistema">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Configuraá§áµes do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 
