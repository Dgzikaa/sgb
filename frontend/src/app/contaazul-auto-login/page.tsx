'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Copy, CheckCircle, ExternalLink, Zap, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { safeNavigator } from '@/lib/client-utils';

export default function ContaAzulAutoLogin() {
  const [autoLoginData, setAutoLoginData] = useState<any>(null);
  const [phase, setPhase] = useState<'waiting' | 'ready' | 'expired'>('waiting');
  const [scriptCopied, setScriptCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar dados de auto login
    const checkData = () => {
      const dataStr = sessionStorage.getItem('contaazul_auto_login');
      if (dataStr) {
        const data = JSON.parse(dataStr);
        
        // Verificar se ainda é válido (5 min)
        if (Date.now() - data.timestamp > 300000) {
          setPhase('expired');
          sessionStorage.removeItem('contaazul_auto_login');
        } else {
          setAutoLoginData(data);
          setPhase('ready');
        }
      }
    };

    checkData();
    const interval = setInterval(checkData, 1000);

    return () => clearInterval(interval);
  }, []);

  const copyAutoFillScript = async () => {
    const script = `// 🤖 Script Automático ContaAzul - Cole e pressione Enter
// Email: ${autoLoginData?.email}
// Senha: ${autoLoginData?.password}
// Código 2FA: ${autoLoginData?.totpCode}

(function() {
  console.log('🚀 Iniciando preenchimento automático...');
  
  // Preencher email
  const emailFields = document.querySelectorAll('input[type="email"], input[name="username"], input[name="email"], input[placeholder*="mail" i]');
  emailFields.forEach(field => {
    field.value = '${autoLoginData?.email}';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  });
  
  // Preencher senha
  const passwordFields = document.querySelectorAll('input[type="password"]');
  passwordFields.forEach(field => {
    field.value = '${autoLoginData?.password}';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  });
  
  console.log('✅ Campos preenchidos! Clicando em login...');
  
  // Clicar no botão de login após 500ms
  setTimeout(() => {
    const submitButtons = document.querySelectorAll('button[type="submit"], button.btn-primary, input[type="submit"]');
    if (submitButtons.length > 0) {
      submitButtons[0].click();
      console.log('✅ Botão de login clicado!');
    }
  }, 500);
  
  // Monitorar campo 2FA
  console.log('👀 Aguardando campo 2FA...');
  const checkFor2FA = setInterval(() => {
    const totpFields = document.querySelectorAll('input[name="totp"], input[name="code"], input[placeholder*="código" i], input[placeholder*="2fa" i], input[type="text"][maxlength="6"]');
    
    if (totpFields.length > 0) {
      totpFields.forEach(field => {
        if (!field.value || field.value.length < 6) {
          field.value = '${autoLoginData?.totpCode}';
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('✅ Código 2FA preenchido!');
          
          // Submeter após preencher 2FA
          setTimeout(() => {
            const submit2FA = document.querySelectorAll('button[type="submit"], button.btn-primary');
            if (submit2FA.length > 0) {
              submit2FA[0].click();
              console.log('✅ Código 2FA enviado!');
            }
          }, 500);
        }
      });
      clearInterval(checkFor2FA);
    }
  }, 1000);
  
  // Parar de verificar após 30 segundos
  setTimeout(() => clearInterval(checkFor2FA), 30000);
})();`;

    try {
      const copied = await safeNavigator.clipboard.writeText(script);
      if (copied) {
        setScriptCopied(true);
        toast({
          title: "Script Copiado! 📋",
          description: "Agora abra o ContaAzul, pressione F12, cole no Console e pressione Enter",
        });
      } else {
        throw new Error('Falha ao copiar para clipboard');
      }
      
      // Abrir ContaAzul na mesma aba após pequeno delay
      setTimeout(() => {
        window.location.href = 'https://sgb-v2.vercel.app/api/contaazul/auth';
      }, 1000);
      
      // Mostrar instruções avançadas
      toast({
        title: "ContaAzul Aberto",
        description: "Use o código 2FA mostrado abaixo quando solicitado",
      });
      
      setTimeout(() => setScriptCopied(false), 5000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
  };

  const copyField = async (text: string, fieldName: string) => {
    try {
      const copied = await safeNavigator.clipboard.writeText(text);
      if (copied) {
          toast({
            title: `${fieldName} copiado!`,
          description: "Cole no campo correspondente",
        });
      } else {
        throw new Error('Falha ao copiar para clipboard');
      }
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
  };

  if (phase === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Aguardando dados de autenticação...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (phase === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              Dados expirados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              Os dados de autenticação expiraram. Por favor, tente novamente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">
            🤖 Login Automático ContaAzul
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Botão Principal */}
          <Button
            onClick={copyAutoFillScript}
            size="lg"
            className="w-full h-16 text-lg"
            variant={scriptCopied ? "default" : "default"}
          >
            {scriptCopied ? (
              <>
                <CheckCircle className="w-6 h-6 mr-2" />
                Script Copiado! Abrindo ContaAzul...
              </>
            ) : (
              <>
                <Zap className="w-6 h-6 mr-2" />
                Copiar Script Automático e Abrir ContaAzul
              </>
            )}
          </Button>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-blue-800">
              <strong>Como usar:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Clique no botão acima para copiar o script</li>
                <li>Na página do ContaAzul, pressione <kbd>F12</kbd></li>
                <li>Clique na aba <strong>Console</strong></li>
                <li>Cole o script (<kbd>Ctrl+V</kbd>) e pressione <kbd>Enter</kbd></li>
                <li>O login será feito automaticamente!</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Dados para cópia manual */}
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-3">📋 Copiar Manualmente:</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-mono text-sm">{autoLoginData?.email}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyField(autoLoginData?.email, 'Email')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Senha</p>
                  <p className="font-mono text-sm">{'•'.repeat(8)}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyField(autoLoginData?.password, 'Senha')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Código 2FA</p>
                  <p className="font-mono text-2xl font-bold text-blue-600">{autoLoginData?.totpCode}</p>
                  <p className="text-xs text-gray-500 mt-1">Válido por 30 segundos</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyField(autoLoginData?.totpCode, 'Código 2FA')}
                  className="border-blue-300"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <Button
            onClick={() => window.location.href = 'https://sgb-v2.vercel.app/api/contaazul/auth'}
            variant="outline"
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir ContaAzul Manualmente
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 