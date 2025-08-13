'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Crown, 
  CreditCard, 
  Lock, 
  CheckCircle, 
  ArrowLeft,
  Gift,
  Star,
  Shield
} from 'lucide-react';
import { AlertDialogCustom } from '@/components/ui/alert-dialog-custom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface FormData {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  dataNascimento: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  aceitaTermos: boolean;
  aceitaLgpd: boolean;
  aceitaMarketing: boolean;
}

export default function CadastroFidelidadePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    action?: { label: string; onClick: () => void };
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    dataNascimento: '',
    endereco: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: ''
    },
    aceitaTermos: false,
    aceitaLgpd: false,
    aceitaMarketing: false
  });

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('endereco.')) {
      const enderecoField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          [enderecoField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleCheckboxChange = (field: keyof FormData, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const buscarCep = async (cep: string) => {
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco: {
              ...prev.endereco,
              logradouro: data.logradouro || '',
              bairro: data.bairro || '',
              cidade: data.localidade || '',
              estado: data.uf || ''
            }
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const validateStep1 = () => {
    return formData.nome && formData.email && formData.telefone && formData.cpf && formData.dataNascimento;
  };

  const validateStep2 = () => {
    const { endereco } = formData;
    return endereco.cep && endereco.logradouro && endereco.numero && endereco.bairro && endereco.cidade && endereco.estado;
  };

  const validateStep3 = () => {
    return formData.aceitaTermos && formData.aceitaLgpd;
  };

  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, action?: { label: string; onClick: () => void }) => {
    setAlert({
      isOpen: true,
      type,
      title,
      message,
      action
    });
  };

  const closeAlert = () => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/fidelidade/cadastro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Salvar dados temporários para o pagamento
        localStorage.setItem('fidelidade_membro_temp', JSON.stringify(data.membro));
        
        showAlert(
          'success',
          'Cadastro realizado com sucesso! 🎉',
          'Seus dados foram salvos. Agora vamos para o pagamento da sua primeira mensalidade.',
          {
            label: 'Ir para Pagamento',
            onClick: () => {
              closeAlert();
              router.push('/fidelidade/pagamento');
            }
          }
        );
      } else {
        // Tratar diferentes tipos de erro
        if (data.type === 'email_exists') {
          showAlert(
            'warning',
            '📧 Email já cadastrado',
            data.message,
            {
              label: 'Fazer Login',
              onClick: () => {
                closeAlert();
                router.push('/fidelidade/login');
              }
            }
          );
        } else if (data.type === 'cpf_exists') {
          showAlert(
            'warning',
            '🆔 CPF já cadastrado',
            data.message,
            {
              label: 'Verificar Dados',
              onClick: () => {
                closeAlert();
                setStep(1); // Volta para dados pessoais
              }
            }
          );
        } else if (data.type === 'server_error') {
          showAlert(
            'error',
            '⚠️ Erro no servidor',
            data.message
          );
        } else {
          showAlert(
            'error',
            '❌ Erro ao cadastrar',
            data.message || 'Ocorreu um erro inesperado. Tente novamente.'
          );
        }
      }
    } catch (error) {
      console.error('Erro:', error);
      showAlert(
        'error',
        '🚫 Erro de conexão',
        'Não foi possível conectar com o servidor. Verifique sua internet e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const beneficiosResumo = [
    { icon: Gift, texto: "R$ 150 em créditos mensais" },
    { icon: Crown, texto: "Acesso VIP sem fila" },
    { icon: Star, texto: "Eventos exclusivos" },
    { icon: CreditCard, texto: "Cartão digital na wallet" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-amber-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/fidelidade">
            <Button variant="ghost" className="text-amber-600 dark:text-amber-400">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            Passo {step} de 3
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Sidebar com resumo */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  <div>
                    <CardTitle className="text-xl text-gray-900 dark:text-white">
                      Fidelidade VIP
                    </CardTitle>
                    <CardDescription className="text-amber-600 dark:text-amber-400">
                      Ordinário Bar
                    </CardDescription>
                  </div>
                </div>
                
                <div className="card-dark rounded-lg p-4 border-amber-200 dark:border-amber-700">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      R$ 100/mês
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receba R$ 150 em créditos
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {beneficiosResumo.map((beneficio, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <beneficio.icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {beneficio.texto}
                      </span>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Shield className="w-4 h-4" />
                  <span>Dados protegidos por SSL</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulário principal */}
          <div className="lg:col-span-2">
            <Card className="card-dark shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900 dark:text-white">
                  {step === 1 && "Dados Pessoais"}
                  {step === 2 && "Endereço"}
                  {step === 3 && "Termos e Finalização"}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {step === 1 && "Preencha seus dados básicos"}
                  {step === 2 && "Onde você mora?"}
                  {step === 3 && "Aceite os termos e finalize seu cadastro"}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Step 1: Dados Pessoais */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="nome" className="text-gray-700 dark:text-gray-300">Nome Completo</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => handleInputChange('nome', e.target.value)}
                        placeholder="Seu nome completo"
                        className="input-dark"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="seu@email.com"
                        className="input-dark"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="telefone" className="text-gray-700 dark:text-gray-300">Telefone</Label>
                        <Input
                          id="telefone"
                          value={formData.telefone}
                          onChange={(e) => handleInputChange('telefone', e.target.value)}
                          placeholder="(61) 99999-9999"
                          className="input-dark"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="cpf" className="text-gray-700 dark:text-gray-300">CPF</Label>
                        <Input
                          id="cpf"
                          value={formData.cpf}
                          onChange={(e) => handleInputChange('cpf', e.target.value)}
                          placeholder="000.000.000-00"
                          className="input-dark"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="dataNascimento" className="text-gray-700 dark:text-gray-300">Data de Nascimento</Label>
                      <Input
                        id="dataNascimento"
                        type="date"
                        value={formData.dataNascimento}
                        onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
                        className="input-dark"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Endereço */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="cep" className="text-gray-700 dark:text-gray-300">CEP</Label>
                      <Input
                        id="cep"
                        value={formData.endereco.cep}
                        onChange={(e) => {
                          const cep = e.target.value.replace(/\D/g, '');
                          handleInputChange('endereco.cep', cep);
                          if (cep.length === 8) {
                            buscarCep(cep);
                          }
                        }}
                        placeholder="00000-000"
                        maxLength={8}
                        className="input-dark"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="logradouro" className="text-gray-700 dark:text-gray-300">Logradouro</Label>
                        <Input
                          id="logradouro"
                          value={formData.endereco.logradouro}
                          onChange={(e) => handleInputChange('endereco.logradouro', e.target.value)}
                          placeholder="Rua, Avenida..."
                          className="input-dark"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="numero" className="text-gray-700 dark:text-gray-300">Número</Label>
                        <Input
                          id="numero"
                          value={formData.endereco.numero}
                          onChange={(e) => handleInputChange('endereco.numero', e.target.value)}
                          placeholder="123"
                          className="input-dark"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="complemento" className="text-gray-700 dark:text-gray-300">Complemento (opcional)</Label>
                      <Input
                        id="complemento"
                        value={formData.endereco.complemento}
                        onChange={(e) => handleInputChange('endereco.complemento', e.target.value)}
                        placeholder="Apto, Casa..."
                        className="input-dark"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="bairro" className="text-gray-700 dark:text-gray-300">Bairro</Label>
                        <Input
                          id="bairro"
                          value={formData.endereco.bairro}
                          onChange={(e) => handleInputChange('endereco.bairro', e.target.value)}
                          placeholder="Bairro"
                          className="input-dark"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="cidade" className="text-gray-700 dark:text-gray-300">Cidade</Label>
                        <Input
                          id="cidade"
                          value={formData.endereco.cidade}
                          onChange={(e) => handleInputChange('endereco.cidade', e.target.value)}
                          placeholder="Cidade"
                          className="input-dark"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="estado" className="text-gray-700 dark:text-gray-300">Estado</Label>
                        <Input
                          id="estado"
                          value={formData.endereco.estado}
                          onChange={(e) => handleInputChange('endereco.estado', e.target.value)}
                          placeholder="UF"
                          maxLength={2}
                          className="input-dark"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Termos */}
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg border border-amber-200 dark:border-amber-700">
                      <h3 className="font-semibold text-lg text-amber-800 dark:text-amber-300 mb-4">
                        Resumo da Assinatura
                      </h3>
                      <div className="space-y-2 text-sm text-amber-700 dark:text-amber-400">
                        <p>• Mensalidade: R$ 100,00</p>
                        <p>• Créditos mensais: R$ 150,00</p>
                        <p>• Benefícios VIP inclusos</p>
                        <p>• Cancelamento a qualquer momento</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={formData.aceitaTermos}
                          onCheckedChange={(checked) => handleCheckboxChange('aceitaTermos', checked as boolean)}
                        />
                        <Label htmlFor="termos" className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          Aceito os{' '}
                          <Link href="/fidelidade/termos" className="text-amber-600 dark:text-amber-400 hover:underline" target="_blank">
                            Termos de Uso
                          </Link>{' '}
                          e{' '}
                          <Link href="/fidelidade/privacidade" className="text-amber-600 dark:text-amber-400 hover:underline" target="_blank">
                            Política de Privacidade
                          </Link>
                        </Label>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={formData.aceitaLgpd}
                          onCheckedChange={(checked) => handleCheckboxChange('aceitaLgpd', checked as boolean)}
                        />
                        <Label htmlFor="lgpd" className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          Autorizo o tratamento dos meus dados pessoais conforme a LGPD
                        </Label>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={formData.aceitaMarketing}
                          onCheckedChange={(checked) => handleCheckboxChange('aceitaMarketing', checked as boolean)}
                        />
                        <Label htmlFor="marketing" className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          Desejo receber ofertas e comunicações por e-mail e WhatsApp (opcional)
                        </Label>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Navegação */}
                <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                  {step > 1 ? (
                    <Button
                      variant="outline"
                      onClick={() => setStep(step - 1)}
                      className="border-amber-600 text-amber-600 hover:bg-amber-50 dark:border-amber-400 dark:text-amber-400"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                  ) : (
                    <div />
                  )}
                  
                  {step < 3 ? (
                    <Button
                      onClick={() => setStep(step + 1)}
                      disabled={
                        (step === 1 && !validateStep1()) ||
                        (step === 2 && !validateStep2())
                      }
                      className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                    >
                      Próximo
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={!validateStep3() || loading}
                      className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8"
                    >
                      {loading ? 'Processando...' : 'Finalizar Cadastro'}
                      <Lock className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Alert Dialog */}
      <AlertDialogCustom
        isOpen={alert.isOpen}
        onClose={closeAlert}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        action={alert.action}
      />
    </div>
  );
}
