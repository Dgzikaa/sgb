'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Upload,
  CheckCircle,
  AlertCircle,
  Download,
} from 'lucide-react';

export default function InterCertificadosPage() {
  const [uploading, setUploading] = useState(false);
  const [certStatus, setCertStatus] = useState<
    'checking' | 'found' | 'missing'
  >('checking');
  const { toast } = useToast();

  const checkCertificates = async () => {
    setCertStatus('checking');
    try {
      const response = await fetch('/api/inter-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bar_id: '1',
          chave_pix: 'test',
          webhook_url: 'https://test.com',
        }),
      });

      const data = await response.json();

      if (
        data.error &&
        data.error.includes('Certificados do Inter não configurados')
      ) {
        setCertStatus('missing');
      } else {
        setCertStatus('found');
      }
    } catch (error) {
      setCertStatus('missing');
    }
  };

  const uploadCertificate = async (file: File, type: 'cert' | 'key' | 'ca') => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const response = await fetch('/api/upload-certificado', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Sucesso!',
          description: `Certificado ${type} enviado com sucesso`,
        });
        checkCertificates();
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao enviar certificado',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro de conexão',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'cert' | 'key' | 'ca'
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadCertificate(file, type);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Certificados do Banco Inter
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Configure os certificados necessários para integração com o Banco
              Inter
            </p>
          </div>

          {/* Status dos Certificados */}
          <Card className="card-dark">
            <CardHeader>
              <CardTitle className="card-title-dark flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Status dos Certificados
              </CardTitle>
              <CardDescription className="card-description-dark">
                Verifique se os certificados estão configurados corretamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Button
                  onClick={checkCertificates}
                  disabled={certStatus === 'checking'}
                  className="btn-primary-dark"
                >
                  {certStatus === 'checking' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Verificar Certificados'
                  )}
                </Button>

                {certStatus === 'found' && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>Certificados encontrados</span>
                  </div>
                )}

                {certStatus === 'missing' && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>Certificados não encontrados</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upload de Certificados */}
          <Card className="card-dark">
            <CardHeader>
              <CardTitle className="card-title-dark flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload de Certificados
              </CardTitle>
              <CardDescription className="card-description-dark">
                Faça upload dos certificados fornecidos pelo Banco Inter
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Certificado do Cliente */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Certificado do Cliente (cert.crt)
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".crt,.pem"
                    onChange={e => handleFileChange(e, 'cert')}
                    className="hidden"
                    id="cert-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="cert-upload">
                    <Button
                      variant="outline"
                      className="btn-outline-dark cursor-pointer"
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Selecionar Arquivo
                    </Button>
                  </label>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Certificado público do cliente fornecido pelo Banco Inter
                </p>
              </div>

              {/* Chave Privada */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Chave Privada (key.key)
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".key,.pem"
                    onChange={e => handleFileChange(e, 'key')}
                    className="hidden"
                    id="key-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="key-upload">
                    <Button
                      variant="outline"
                      className="btn-outline-dark cursor-pointer"
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Selecionar Arquivo
                    </Button>
                  </label>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Chave privada do certificado (mantenha segura)
                </p>
              </div>

              {/* Certificado da CA */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Certificado da CA (ca.crt)
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".crt,.pem"
                    onChange={e => handleFileChange(e, 'ca')}
                    className="hidden"
                    id="ca-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="ca-upload">
                    <Button
                      variant="outline"
                      className="btn-outline-dark cursor-pointer"
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Selecionar Arquivo
                    </Button>
                  </label>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Certificado da autoridade certificadora do Banco Inter
                </p>
              </div>

              {uploading && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Enviando certificado...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instruções */}
          <Card className="card-dark">
            <CardHeader>
              <CardTitle className="card-title-dark">
                Como Obter os Certificados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <strong>1.</strong> Acesse o portal de desenvolvedores do
                  Banco Inter
                </p>
                <p>
                  <strong>2.</strong> Vá em "Certificados" ou "mTLS"
                </p>
                <p>
                  <strong>3.</strong> Gere ou baixe os certificados necessários
                </p>
                <p>
                  <strong>4.</strong> Faça upload dos arquivos acima
                </p>
                <p>
                  <strong>5.</strong> Os certificados serão salvos em{' '}
                  <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
                    frontend/pages/api/
                  </code>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
