'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  User, 
  Bell, 
  CreditCard,
  Shield,
  ArrowLeft,
  Save,
  Trash2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Membro {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  status: string;
  data_adesao: string;
  proxima_cobranca: string;
}

export default function ConfiguracoesFidelidadePage() {
  const router = useRouter();
  const [membro, setMembro] = useState<Membro | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    notificacoes_email: true,
    notificacoes_whatsapp: false,
    marketing: true
  });

  useEffect(() => {
    const membroData = localStorage.getItem('fidelidade_membro');
    
    if (!membroData) {
      router.push('/fidelidade/login');
      return;
    }

    try {
      const parsedMembro = JSON.parse(membroData);
      setMembro(parsedMembro);
      setFormData({
        nome: parsedMembro.nome || '',
        telefone: parsedMembro.telefone || '',
        notificacoes_email: true,
        notificacoes_whatsapp: false,
        marketing: true
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      router.push('/fidelidade/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleSave = async () => {
    if (!membro) return;
    
    setSaving(true);
    try {
      // Em produção, aqui faria a chamada para a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualizar dados locais
      const updatedMembro = {
        ...membro,
        nome: formData.nome,
        telefone: formData.telefone
      };
      
      localStorage.setItem('fidelidade_membro', JSON.stringify(updatedMembro));
      setMembro(updatedMembro);
      
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!membro) return;
    
    const confirmCancel = confirm(
      'Tem certeza que deseja cancelar sua assinatura VIP?\n\n' +
      'Você perderá todos os benefícios e créditos restantes.\n' +
      'Esta ação não pode ser desfeita.'
    );
    
    if (!confirmCancel) return;

    try {
      // Em produção, aqui faria a chamada para a API de cancelamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Assinatura cancelada com sucesso. Você receberá um e-mail de confirmação.');
      router.push('/fidelidade');
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      alert('Erro ao cancelar assinatura. Entre em contato com o suporte.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Settings className="w-16 h-16 text-amber-600 dark:text-amber-400 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  if (!membro) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/fidelidade/dashboard">
              <Button variant="ghost" className="text-amber-600 dark:text-amber-400">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Configurações
              </h1>
              <p className="text-amber-600 dark:text-amber-400">
                Gerencie sua conta VIP
              </p>
            </div>
          </div>
          
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            {membro.status.toUpperCase()}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Informações da Conta */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados Pessoais */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900 dark:text-white flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Dados Pessoais
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Atualize suas informações pessoais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="nome" className="text-gray-700 dark:text-gray-300">Nome Completo</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      className="bg-white dark:bg-gray-700"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">E-mail</Label>
                    <Input
                      id="email"
                      value={membro.email}
                      disabled
                      className="bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      O e-mail não pode ser alterado
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="telefone" className="text-gray-700 dark:text-gray-300">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                      placeholder="(61) 99999-9999"
                      className="bg-white dark:bg-gray-700"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notificações */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notificações
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Configure como deseja receber notificações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Notificações por E-mail</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Receba atualizações sobre sua conta e benefícios
                      </p>
                    </div>
                    <Switch
                      checked={formData.notificacoes_email}
                      onCheckedChange={(checked) => setFormData({...formData, notificacoes_email: checked})}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Notificações por WhatsApp</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Receba lembretes e ofertas especiais
                      </p>
                    </div>
                    <Switch
                      checked={formData.notificacoes_whatsapp}
                      onCheckedChange={(checked) => setFormData({...formData, notificacoes_whatsapp: checked})}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Marketing e Promoções</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Receba ofertas exclusivas e novidades
                      </p>
                    </div>
                    <Switch
                      checked={formData.marketing}
                      onCheckedChange={(checked) => setFormData({...formData, marketing: checked})}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Zona de Perigo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="bg-white dark:bg-gray-800 border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="text-xl text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Zona de Perigo
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Ações irreversíveis da sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 mb-4">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <AlertDescription className="text-red-700 dark:text-red-300">
                      <p className="font-semibold mb-1">Cancelar Assinatura</p>
                      <p className="text-sm">
                        Ao cancelar, você perderá todos os benefícios VIP e créditos restantes. 
                        Esta ação não pode ser desfeita.
                      </p>
                    </AlertDescription>
                  </Alert>
                  
                  <Button
                    onClick={handleCancelSubscription}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Cancelar Assinatura VIP
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status da Conta */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    Status da Conta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {membro.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Membro desde</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(membro.data_adesao).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Próxima cobrança</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(membro.proxima_cobranca).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Valor da Mensalidade
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      R$ 100,00
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Botão Salvar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3"
              >
                {saving ? (
                  'Salvando...'
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </motion.div>

            {/* Links Úteis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    Links Úteis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/fidelidade/beneficios">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      Ver Benefícios
                    </Button>
                  </Link>
                  
                  <Link href="/fidelidade/historico">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      Histórico de Transações
                    </Button>
                  </Link>
                  
                  <Link href="/fidelidade/suporte">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      Suporte
                    </Button>
                  </Link>
                  
                  <Link href="/fidelidade/termos">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      Termos de Uso
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
