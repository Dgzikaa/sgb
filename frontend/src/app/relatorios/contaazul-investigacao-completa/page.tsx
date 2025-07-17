'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, XCircle, Search, Target, BarChart3, Building2 } from 'lucide-react';
import ContaAzulOAuth from '@/components/configuracoes/ContaAzulOAuth';

export default function ContaAzulInvestigacaoCompleta() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const executarInvestigacao = async () => {
    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const response = await fetch('/api/contaazul/investigar-tudo-possivel');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro na investigaá§á£o');
      }

      setResultado(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const executarInvestigacaoEspecifica = async () => {
    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const response = await fetch('/api/contaazul/investigar-categorias-especificas');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro na investigaá§á£o de categorias');
      }

      setResultado(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = ({ sucesso }: { sucesso: boolean }) => {
    return sucesso ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const DescobertaIcon = ({ descoberta }: { descoberta: string }) => {
    if (descoberta.includes('RATEIO')) return <Target className="w-4 h-4 text-blue-500" />;
    if (descoberta.includes('CATEGORIAS')) return <BarChart3 className="w-4 h-4 text-purple-500" />;
    if (descoberta.includes('CENTROS DE CUSTO')) return <Building2 className="w-4 h-4 text-orange-500" />;
    return <AlertCircle className="w-4 h-4 text-yellow-500" />;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">ðŸ” Investigaá§á£o Completa ContaAzul</h1>
          <p className="text-gray-600">
            Testando TODOS os endpoints possá­veis para encontrar dados de categorizaá§á£o
          </p>
        </div>

        <div className="mb-6">
          <ContaAzulOAuth />
        </div>

        <div className="mb-6 space-y-4">
          <Button 
            onClick={executarInvestigacao}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Search className="w-4 h-4 mr-2 animate-spin" />
                Investigando... (pode demorar atá© 30 segundos)
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                ðŸš€ Iniciar Investigaá§á£o Completa
              </>
            )}
          </Button>
          
          <Button 
            onClick={() => executarInvestigacaoEspecifica()}
            disabled={loading}
            className="w-full"
            size="lg"
            variant="outline"
          >
            {loading ? (
              <>
                <BarChart3 className="w-4 h-4 mr-2 animate-spin" />
                Investigando Categorias...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4 mr-2" />
                ðŸŽ¯ Investigar Categorias Especá­ficas
              </>
            )}
          </Button>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Erro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {resultado && (
          <div className="space-y-6">
            {/* Resumo da Aná¡lise */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  ðŸ“Š Resumo da Aná¡lise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Eventos testados</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {resultado.analise.total_eventos_testados}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Descobertas importantes</p>
                    <p className="text-2xl font-bold text-green-600">
                      {resultado.analise.descobertas.length}
                    </p>
                  </div>
                </div>

                {/* Endpoints com Sucesso */}
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">ðŸŽ¯ Endpoints com Sucesso</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(resultado.analise.endpoints_com_sucesso).map(([endpoint, sucessos]) => {
                      const numSucessos = Number(sucessos);
                      return (
                        <Badge key={endpoint} variant={numSucessos > 0 ? "default" : "secondary"}>
                          {endpoint}: {numSucessos}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Descobertas */}
            {resultado.analise.descobertas.length > 0 && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    ðŸŽ‰ Descobertas Importantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {resultado.analise.descobertas.map((descoberta: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <DescobertaIcon descoberta={descoberta} />
                        <span className="text-green-700">{descoberta}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recomendaá§áµes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  ðŸ’¡ Recomendaá§áµes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {resultado.recomendacoes.map((recomendacao: string, index: number) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-blue-500">€¢</span>
                      <span>{recomendacao}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resultados Detalhados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  ðŸ” Resultados Detalhados
                </CardTitle>
                <CardDescription>
                  Aná¡lise completa de cada evento testado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resultado.resultados_detalhados.map((evento: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="mb-3">
                        <h4 className="font-semibold">
                          ðŸ“‹ Evento: {evento.evento_id}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {evento.tipo} - {evento.descricao}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(evento.testes).map(([endpoint, teste]) => {
                          const t = teste as any;
                          return (
                            <div key={endpoint} className="border rounded p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{endpoint}</span>
                                <div className="flex items-center space-x-2">
                                  <StatusIcon sucesso={t.sucesso} />
                                  <Badge variant={t.sucesso ? "default" : "secondary"}>
                                    {t.status}
                                  </Badge>
                                </div>
                              </div>
                              
                              {t.sucesso && (
                                <div className="space-y-1 text-sm">
                                  {t.tem_rateio && (
                                    <Badge variant="outline" className="text-blue-600">
                                      ðŸŽ¯ Rateio
                                    </Badge>
                                  )}
                                  {t.tem_categorias && (
                                    <Badge variant="outline" className="text-purple-600">
                                      ðŸ“Š Categorias
                                    </Badge>
                                  )}
                                  {t.tem_centros_custo && (
                                    <Badge variant="outline" className="text-orange-600">
                                      ðŸ¢ Centros de Custo
                                    </Badge>
                                  )}
                                  {t.campos_primeiro_nivel && (
                                    <div className="mt-2">
                                      <p className="text-xs text-gray-500">Campos encontrados:</p>
                                      <p className="text-xs">{t.campos_primeiro_nivel.join(', ')}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {!t.sucesso && (
                                <p className="text-xs text-red-600 mt-2">
                                  {t.erro}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* JSON Completo */}
            <Card>
              <CardHeader>
                <CardTitle>ðŸ“ JSON Completo</CardTitle>
                <CardDescription>
                  Dados completos da investigaá§á£o para aná¡lise tá©cnica
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={JSON.stringify(resultado, null, 2)}
                  readOnly
                  rows={20}
                  className="font-mono text-xs"
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 
