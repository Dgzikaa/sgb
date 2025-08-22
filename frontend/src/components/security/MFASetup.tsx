'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Smartphone, 
  Copy, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Eye,
  EyeOff,
  Timer,
  Key,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
// MFA disabled for frontend build
// import { useMFA, type MFASetup } from '@/lib/security/mfa';
import type { MFAConfig } from '@/lib/security/mfa';

// Simplified MFA types for frontend
type MFASetup = {
  secret: string;
  qrCode: string;
  qrCodeUrl: string;
  manualEntryKey: string;
  backupCodes: string[];
};

interface MFASetupProps {
  userId: string;
  userEmail: string;
  onComplete: (setup: MFASetup) => void;
  onCancel: () => void;
}

export default function MFASetupComponent({ userId, userEmail, onComplete, onCancel }: MFASetupProps) {
  const [step, setStep] = useState<'generate' | 'verify' | 'backup' | 'complete'>('generate');
  const [setup, setSetup] = useState<MFASetup | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(30);

  // MFA disabled for frontend - using mock functions
  const generateMFASetup = (userId: string, userEmail: string) => Promise.resolve({ 
    secret: 'MOCK_SECRET', 
    qrCode: 'data:image/png;base64,mock', 
    qrCodeUrl: 'data:image/png;base64,mock',
    manualEntryKey: 'MOCK_SECRET_KEY',
    backupCodes: ['MOCK001', 'MOCK002'] 
  });
  const verifyTOTPCode = async (code: string, secret: string) => Promise.resolve(false);
  const validateInputFormat = (code: string) => ({ isValid: code.length === 6, type: 'totp', formatted: code });
  const getTimeRemaining = () => 30;

  // Gerar configuração MFA no primeiro carregamento
  useEffect(() => {
    const initializeSetup = async () => {
      try {
        const mfaSetup = await generateMFASetup(userId, userEmail);
        setSetup(mfaSetup);
      } catch (error) {
        console.error('Erro ao gerar MFA setup:', error);
      }
    };

    initializeSetup();
  }, [userId, userEmail, generateMFASetup]);

  // Timer para código TOTP
  useEffect(() => {
    if (step === 'verify') {
      const timer = setInterval(() => {
        setTimeRemaining(getTimeRemaining());
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [step, getTimeRemaining]);

  // Copiar para clipboard
  const copyToClipboard = async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set([...prev, item]));
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(item);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  // Verificar código inserido
  const handleVerifyCode = async () => {
    if (!setup || !verificationCode.trim()) return;

    setIsVerifying(true);
    setVerificationError('');

    try {
      const validation = validateInputFormat(verificationCode);
      
      if (!validation.isValid || validation.type !== 'totp') {
        setVerificationError('Código deve ter 6 dígitos numéricos');
        return;
      }

            const isValid = await verifyTOTPCode(validation.formatted, setup.secret);

      if (isValid) {
        setStep('backup');
      } else {
        setVerificationError('Código inválido. Verifique o código no seu app e tente novamente.');
      }
    } catch (error) {
      setVerificationError('Erro na verificação. Tente novamente.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Finalizar configuração
  const handleComplete = () => {
    if (setup) {
      onComplete(setup);
    }
  };

  // Download dos códigos de backup
  const downloadBackupCodes = () => {
    if (!setup) return;

    const content = [
      'CÓDIGOS DE BACKUP - ZYKOR MFA',
      '=====================================',
      '',
      `Usuário: ${userEmail}`,
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
      '',
      'IMPORTANTE:',
      '- Guarde estes códigos em local seguro',
      '- Cada código pode ser usado apenas uma vez',
      '- Use apenas se não conseguir acessar seu app autenticador',
      '',
      'CÓDIGOS:',
      ...setup.backupCodes.map((code, index) => `${index + 1}. ${code}`),
      '',
      '====================================='
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zykor-backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!setup) {
    return (
      <Card className="max-w-md mx-auto bg-white/5 backdrop-blur-xl border-white/10">
        <CardContent className="p-6 text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white/70">Gerando configuração MFA...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Configurar Autenticação de Dois Fatores
        </h1>
        <p className="text-white/70">
          Adicione uma camada extra de segurança à sua conta
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center space-x-4">
        {['generate', 'verify', 'backup', 'complete'].map((stepName, index) => {
          const isActive = step === stepName;
          const isCompleted = ['generate', 'verify', 'backup', 'complete'].indexOf(step) > index;
          
          return (
            <div key={stepName} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                isCompleted ? 'bg-green-500 text-white' :
                isActive ? 'bg-blue-500 text-white' :
                'bg-white/10 text-white/50'
              }`}>
                {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
              </div>
              {index < 3 && (
                <div className={`w-8 h-0.5 mx-2 ${
                  isCompleted ? 'bg-green-500' : 'bg-white/10'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step: Generate QR Code */}
      {step === 'generate' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Configurar App Autenticador
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <AlertDescription className="text-blue-400">
                  <strong>Passo 1:</strong> Instale um app autenticador como Google Authenticator, 
                  Authy ou Microsoft Authenticator no seu celular.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-6">
                {/* QR Code */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Escaneie o QR Code
                  </h3>
                  <div className="bg-white p-4 rounded-xl inline-block">
                    <Image
                      src={setup.qrCodeUrl}
                      alt="QR Code MFA"
                      width={200}
                      height={200}
                    />
                  </div>
                </div>

                {/* Manual Entry */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Ou digite manualmente
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white/80">Serviço</Label>
                      <div className="mt-1 p-3 bg-white/5 rounded-lg">
                        <p className="text-white font-mono text-sm">Zykor - Gestão de Bares</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-white/80">Conta</Label>
                      <div className="mt-1 p-3 bg-white/5 rounded-lg">
                        <p className="text-white font-mono text-sm">{userEmail}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-white/80 flex items-center gap-2">
                        Chave Secreta
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSecret(!showSecret)}
                          className="h-6 w-6 p-0"
                        >
                          {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                      </Label>
                      <div className="mt-1 flex gap-2">
                        <div className="flex-1 p-3 bg-white/5 rounded-lg">
                          <p className="text-white font-mono text-sm">
                            {showSecret ? setup.manualEntryKey : '••••••••••••••••'}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(setup.secret, 'secret')}
                          className="bg-white/5 border-white/20"
                        >
                          {copiedItems.has('secret') ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="bg-white/5 border-white/20 text-white"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => setStep('verify')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  Próximo: Verificar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Step: Verify Code */}
      {step === 'verify' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Key className="w-5 h-5" />
                Verificar Configuração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-green-500/50 bg-green-500/10">
                <AlertDescription className="text-green-400">
                  <strong>Passo 2:</strong> Digite o código de 6 dígitos exibido 
                  no seu app autenticador para confirmar a configuração.
                </AlertDescription>
              </Alert>

              <div className="max-w-sm mx-auto space-y-4">
                <div>
                  <Label className="text-white/80">Código de Verificação</Label>
                  <div className="mt-2 relative">
                    <Input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setVerificationCode(value);
                        setVerificationError('');
                      }}
                      placeholder="000000"
                      className="text-center text-2xl font-mono bg-white/10 border-white/20 text-white placeholder-white/50 h-14"
                      maxLength={6}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <Timer className="w-4 h-4 text-white/60" />
                      <span className="text-sm text-white/60 font-mono">
                        {timeRemaining}s
                      </span>
                    </div>
                  </div>
                </div>

                {verificationError && (
                  <Alert className="border-red-500/50 bg-red-500/10">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription className="text-red-400">
                      {verificationError}
                    </AlertDescription>
                  </Alert>
                )}

                <p className="text-sm text-white/60 text-center">
                  O código muda a cada 30 segundos. Se não funcionar, 
                  aguarde o próximo código.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setStep('generate')}
                  className="bg-white/5 border-white/20 text-white"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleVerifyCode}
                  disabled={verificationCode.length !== 6 || isVerifying}
                  className="bg-gradient-to-r from-green-600 to-blue-600"
                >
                  {isVerifying ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Verificar Código
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Step: Backup Codes */}
      {step === 'backup' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Códigos de Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-amber-400">
                  <strong>Importante:</strong> Guarde estes códigos em local seguro. 
                  Cada código pode ser usado apenas uma vez para fazer login se você 
                  perder acesso ao seu app autenticador.
                </AlertDescription>
              </Alert>

              <div className="bg-black/20 p-6 rounded-xl">
                <div className="grid grid-cols-2 gap-3">
                  {setup.backupCodes.map((code, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between bg-white/5 p-3 rounded-lg"
                    >
                      <span className="text-white font-mono text-sm">
                        {index + 1}. {code}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(code, `backup-${index}`)}
                        className="h-6 w-6 p-0"
                      >
                        {copiedItems.has(`backup-${index}`) ? (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={downloadBackupCodes}
                  className="bg-white/5 border-white/20 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Códigos
                </Button>
                <Button
                  onClick={() => copyToClipboard(setup.backupCodes.join('\n'), 'all-backup')}
                  variant="outline"
                  className="bg-white/5 border-white/20 text-white"
                >
                  {copiedItems.has('all-backup') ? (
                    <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  Copiar Todos
                </Button>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setStep('verify')}
                  className="bg-white/5 border-white/20 text-white"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleComplete}
                  className="bg-gradient-to-r from-green-600 to-blue-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Concluir Configuração
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
