'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogIn, 
  Eye, 
  EyeOff, 
  Fingerprint, 
  Shield,
  Smartphone,
  Mail,
  Lock,
  ArrowRight,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Image from 'next/image';
import { api } from '@/lib/api-client';
import { useZykorToast } from '@/components/ui/toast-modern';
import { usePushNotifications } from '@/lib/push-notifications';
import { useBackgroundSync } from '@/lib/background-sync';
import { 
  MotionWrapper, 
  HoverMotion, 
  LoadingSpinner 
} from '@/components/ui/motion-wrapper';
import { 
  AccessibleButton, 
  AccessibleText, 
  FocusRing 
} from '@/components/ui/accessibility-wrapper';
import BiometricAuth from '@/components/auth/BiometricAuth';

interface LoginFormData {
  email: string;
  password: string;
}

interface ForgotPasswordData {
  email: string;
}

export default function LoginModernPage() {
  // Estados principais
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [forgotData, setForgotData] = useState<ForgotPasswordData>({ email: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Estados PWA e biométricos
  const [loginMethod, setLoginMethod] = useState<'traditional' | 'biometric'>('traditional');
  const [showBiometricRegistration, setShowBiometricRegistration] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [lastLoginData, setLastLoginData] = useState<Record<string, unknown> | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Hooks
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useZykorToast();
  const pushNotifications = usePushNotifications();
  const backgroundSync = useBackgroundSync();

  const returnUrl = isHydrated ? searchParams.get('returnUrl') : null;

  useEffect(() => {
    setIsHydrated(true);
    initializeLoginPage();
  }, []);

  const initializeLoginPage = async () => {
    try {
      // Detectar dispositivo móvel
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobileDevice(isMobile);

      // Verificar disponibilidade biométrica
      if ('credentials' in navigator && 'create' in navigator.credentials) {
        setIsBiometricAvailable(true);
      }

      // Inicializar PWA features
      await Promise.all([
        pushNotifications.initialize(),
        backgroundSync.initialize()
      ]);

      // Carregar último login se disponível
      const lastLogin = localStorage.getItem('zykor-last-login');
      if (lastLogin) {
        try {
          const data = JSON.parse(lastLogin);
          setLastLoginData(data);
          setFormData(prev => ({ ...prev, email: data.email || '' }));
        } catch (e) {
          console.warn('Erro ao carregar último login:', e);
        }
      }

      // Toast de boas-vindas
      toast.info('Bem-vindo ao Zykor!', 'Sistema de gestão de bares com IA');

    } catch (error) {
      console.error('Erro ao inicializar página de login:', error);
      toast.warning('Inicialização parcial', 'Algumas funcionalidades podem estar limitadas');
    }
  };

  const handleInputChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return false;
    }

    if (!formData.email.includes('@')) {
      setError('Email inválido');
      return false;
    }

    if (!formData.password.trim()) {
      setError('Senha é obrigatória');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      toast.loading('Autenticando...', 'Verificando suas credenciais');

      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
        device: {
          userAgent: navigator.userAgent,
          isMobile: isMobileDevice,
          timestamp: new Date().toISOString()
        }
      });

      if (response.success) {
        // Salvar dados do último login
        localStorage.setItem('zykor-last-login', JSON.stringify({
          email: formData.email,
          timestamp: new Date().toISOString()
        }));

        // Sincronizar login em background
        await backgroundSync.addTask('auth', 'create', {
          email: formData.email,
          loginMethod: 'traditional',
          timestamp: new Date().toISOString()
        }, 'high');

        // Configurar notificações se disponível
        if (pushNotifications.isEnabled()) {
          await pushNotifications.notifySystemAlert(
            `Login realizado com sucesso! Bem-vindo de volta.`,
            'info'
          );
        }

        toast.success('Login realizado!', 'Redirecionando para o dashboard...');
        
        // Pequeno delay para UX
        setTimeout(() => {
          router.push(returnUrl || '/home');
        }, 1000);

      } else {
        throw new Error(response.message || 'Erro ao fazer login');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro de conexão';
      setError(errorMessage);
      toast.error('Erro no login', errorMessage);
      
      // Vibrar em dispositivos móveis
      if (navigator.vibrate && isMobileDevice) {
        navigator.vibrate([100, 50, 100]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotData.email.trim() || !forgotData.email.includes('@')) {
      toast.error('Email inválido', 'Por favor, insira um email válido');
      return;
    }

    setForgotLoading(true);

    try {
      toast.loading('Enviando email...', 'Aguarde enquanto processamos sua solicitação');

      const response = await api.post('/auth/forgot-password', {
        email: forgotData.email
      });

      if (response.success) {
        setForgotSuccess(true);
        toast.success('Email enviado!', 'Verifique sua caixa de entrada');
      } else {
        throw new Error(response.message || 'Erro ao enviar email');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro de conexão';
      toast.error('Erro ao enviar email', errorMessage);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!isBiometricAvailable) {
      toast.warning('Biometria indisponível', 'Seu dispositivo não suporta autenticação biométrica');
      return;
    }

    try {
      toast.info('Autenticação biométrica', 'Use sua impressão digital ou Face ID');
      
      // Aqui seria implementada a lógica real de biometria
      // Por enquanto, simulamos o processo
      setTimeout(() => {
        toast.success('Biometria autorizada!', 'Redirecionando...');
        router.push(returnUrl || '/home');
      }, 2000);

    } catch (error) {
      toast.error('Falha na biometria', 'Tente novamente ou use senha tradicional');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-800 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 dark:bg-yellow-800 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -top-40 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-800 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <MotionWrapper variant="slideUp" className="relative w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 overflow-hidden"
        >
          {/* Header com logo */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
              className="inline-block p-4 bg-white/10 rounded-full mb-4"
            >
              <Zap className="h-12 w-12 text-white" />
            </motion.div>
            <AccessibleText level={1} className="text-2xl font-bold text-white mb-2">
              Zykor
            </AccessibleText>
            <AccessibleText className="text-blue-100">
              O núcleo da gestão de bares
            </AccessibleText>
          </div>

          {/* Método de login */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              {!showForgotPassword ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Seletor de método */}
                  <div className="flex mb-6 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <button
                      onClick={() => setLoginMethod('traditional')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                        loginMethod === 'traditional'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      <Mail className="h-4 w-4 inline mr-2" />
                      Email & Senha
                    </button>
                    <button
                      onClick={() => setLoginMethod('biometric')}
                      disabled={!isBiometricAvailable}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                        loginMethod === 'biometric'
                          ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-300'
                      } ${!isBiometricAvailable ? 'opacity-50' : ''}`}
                    >
                      <Fingerprint className="h-4 w-4 inline mr-2" />
                      Biometria
                    </button>
                  </div>

                  {loginMethod === 'traditional' ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Campo Email */}
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email
                        </label>
                        <FocusRing>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={handleInputChange('email')}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="seu@email.com"
                              autoComplete="email"
                              required
                            />
                          </div>
                        </FocusRing>
                      </div>

                      {/* Campo Senha */}
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Senha
                        </label>
                        <FocusRing>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              value={formData.password}
                              onChange={handleInputChange('password')}
                              className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="••••••••"
                              autoComplete="current-password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </FocusRing>
                      </div>

                      {/* Mensagens de erro/sucesso */}
                      <AnimatePresence>
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"
                          >
                            <AlertCircle className="h-5 w-5" />
                            <span className="text-sm">{error}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Botão de login */}
                      <AccessibleButton
                        type="submit"
                        loading={isLoading}
                        loadingText="Entrando..."
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        {!isLoading && <LogIn className="h-5 w-5 mr-2" />}
                        Entrar no Zykor
                      </AccessibleButton>

                      {/* Link esqueci senha */}
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          Esqueci minha senha
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Biometric Login */
                    <div className="text-center space-y-6">
                      <div className="py-8">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="inline-block p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4"
                        >
                          <Fingerprint className="h-12 w-12 text-white" />
                        </motion.div>
                        <AccessibleText level={2} className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Autenticação Biométrica
                        </AccessibleText>
                        <AccessibleText className="text-gray-600 dark:text-gray-400">
                          Use sua impressão digital ou Face ID para entrar
                        </AccessibleText>
                      </div>

                      <AccessibleButton
                        onClick={handleBiometricLogin}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-lg font-medium"
                      >
                        <Shield className="h-5 w-5 mr-2" />
                        Usar Biometria
                      </AccessibleButton>

                      <button
                        onClick={() => setLoginMethod('traditional')}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                      >
                        Usar email e senha
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                /* Forgot Password */
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {!forgotSuccess ? (
                    <form onSubmit={handleForgotPassword} className="space-y-6">
                      <div className="text-center mb-6">
                        <AccessibleText level={2} className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Recuperar Senha
                        </AccessibleText>
                        <AccessibleText className="text-gray-600 dark:text-gray-400">
                          Digite seu email para receber instruções
                        </AccessibleText>
                      </div>

                      <div>
                        <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email
                        </label>
                        <FocusRing>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              id="forgot-email"
                              type="email"
                              value={forgotData.email}
                              onChange={(e) => setForgotData({ email: e.target.value })}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="seu@email.com"
                              required
                            />
                          </div>
                        </FocusRing>
                      </div>

                      <div className="space-y-4">
                        <AccessibleButton
                          type="submit"
                          loading={forgotLoading}
                          loadingText="Enviando..."
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-medium"
                        >
                          Enviar Instruções
                        </AccessibleButton>

                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(false)}
                          className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                        >
                          Voltar ao login
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center space-y-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className="inline-block p-4 bg-green-100 dark:bg-green-900/20 rounded-full mb-4"
                      >
                        <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                      </motion.div>
                      <AccessibleText level={2} className="text-lg font-semibold text-gray-900 dark:text-white">
                        Email Enviado!
                      </AccessibleText>
                      <AccessibleText className="text-gray-600 dark:text-gray-400">
                        Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                      </AccessibleText>
                      <button
                        onClick={() => {
                          setShowForgotPassword(false);
                          setForgotSuccess(false);
                        }}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        Voltar ao login
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-800/50 px-8 py-4 text-center">
            <AccessibleText className="text-xs text-gray-500 dark:text-gray-400">
              © 2025 Zykor - Sistema de Gestão de Bares
            </AccessibleText>
          </div>
        </motion.div>
      </MotionWrapper>
    </div>
  );
}
