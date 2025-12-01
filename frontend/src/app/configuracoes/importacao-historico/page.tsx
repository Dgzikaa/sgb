'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Database, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ImportacaoHistoricoPage() {
  const [importando, setImportando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [stats, setStats] = useState<any>(null);

  const importarHistorico = async () => {
    setImportando(true);
    setProgresso(0);
    
    try {
      toast.loading('Iniciando importação retroativa...', { id: 'import' });
      
      const response = await fetch('/api/ferramentas/contagem-estoque/sync-retroativo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cronSecret: 'admin_trigger',
          data_inicio: '2025-02-01',
          data_fim: '2025-11-30'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Importação concluída!', { 
          id: 'import',
          description: `${result.result?.data?.total_insumos_importados || 0} insumos importados`
        });
        setStats(result.result?.data);
        setProgresso(100);
      } else {
        toast.error('Erro na importação', { id: 'import', description: result.error });
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao importar histórico', { id: 'import' });
    } finally {
      setImportando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="card-title-dark flex items-center gap-2">
              <Database className="h-6 w-6" />
              Importação de Histórico de Contagens
            </CardTitle>
            <CardDescription className="card-description-dark">
              Importar todo o histórico de contagens de Fevereiro a Novembro de 2025
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                ℹ️ Sobre a Importação
              </h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>• Período: <strong>01/02/2025 a 30/11/2025</strong></li>
                <li>• Total aproximado: <strong>~300 dias</strong></li>
                <li>• Tempo estimado: <strong>30-40 minutos</strong></li>
                <li>• Dados importados do Google Sheets automaticamente</li>
              </ul>
            </div>

            {importando && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Importando...</span>
                  <span className="font-medium text-gray-900 dark:text-white">{progresso}%</span>
                </div>
                <Progress value={progresso} className="h-2" />
              </div>
            )}

            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.total_insumos_importados || 0}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Insumos</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.datas_processadas || 0}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Dias</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.datas_sem_dados || 0}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Sem Dados</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {stats.erros || 0}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Erros</div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={importarHistorico}
                disabled={importando}
                className="btn-primary-dark flex-1"
              >
                {importando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Iniciar Importação
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              ⚠️ Esta operação pode demorar. Não feche a página durante a importação.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

