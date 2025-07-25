'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users,
  Phone,
  AlertTriangle,
  CheckCircle,
  UserPlus,
} from 'lucide-react';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  celular: string | null;
  whatsapp_valido: boolean;
  numero_formatado: string | null;
  cargo?: string;
  departamento?: string;
}

interface ResponsavelWhatsAppSelectorProps {
  responsaveisSelecionados: string[];
  onResponsaveisChange: (responsaveis: string[]) => void;
  barId?: number;
  showWarnings?: boolean;
}

export default function ResponsavelWhatsAppSelector({
  responsaveisSelecionados,
  onResponsaveisChange,
  barId,
  showWarnings = true,
}: ResponsavelWhatsAppSelectorProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuariosSemWhatsApp, setUsuariosSemWhatsApp] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSemWhatsApp, setShowSemWhatsApp] = useState(false);

  const loadUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        include_without: 'true',
      });

      if (barId) {
        params.append('bar_id', barId.toString());
      }

      const response = await fetch(`/api/usuarios/with-whatsapp?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsuarios(data.com_whatsapp || []);
        setUsuariosSemWhatsApp(data.sem_whatsapp || []);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  }, [barId]);

  useEffect(() => {
    loadUsuarios();
  }, [loadUsuarios]);

  const handleUsuarioChange = (usuario: Usuario, checked: boolean) => {
    const numeroLimpo = usuario.celular?.replace(/\D/g, '') || '';

    if (checked) {
      if (!responsaveisSelecionados.includes(numeroLimpo)) {
        onResponsaveisChange([...responsaveisSelecionados, numeroLimpo]);
      }
    } else {
      onResponsaveisChange(
        responsaveisSelecionados.filter(n => n !== numeroLimpo)
      );
    }
  };

  const usuariosValidos = usuarios.filter(u => u.whatsapp_valido);
  const usuariosInvalidos = usuarios.filter(u => !u.whatsapp_valido);

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Selecionar Responsáveis (WhatsApp)
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Escolha os funcionários que receberão notificações do checklist via
            WhatsApp
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-4 text-gray-600 dark:text-gray-400">
              Carregando funcionários...
            </div>
          ) : (
            <>
              {/* Estatísticas */}
              <div className="flex flex-wrap gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {usuariosValidos.length} com WhatsApp válido
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {usuariosInvalidos.length} com WhatsApp inválido
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {usuariosSemWhatsApp.length} sem WhatsApp
                  </span>
                </div>
              </div>

              {/* Funcionários com WhatsApp Válido */}
              {usuariosValidos.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Funcionários Disponíveis ({usuariosValidos.length})
                  </h4>

                  <div className="grid gap-3">
                    {usuariosValidos.map(usuario => {
                      const numeroLimpo =
                        usuario.celular?.replace(/\D/g, '') || '';
                      const isSelected =
                        responsaveisSelecionados.includes(numeroLimpo);

                      return (
                        <div
                          key={usuario.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                          onClick={() =>
                            handleUsuarioChange(usuario, !isSelected)
                          }
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              className="pointer-events-none"
                            />

                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {usuario.nome}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {usuario.email}
                              </div>
                              {(usuario.cargo || usuario.departamento) && (
                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                  {[usuario.cargo, usuario.departamento]
                                    .filter(Boolean)
                                    .join(' • ')}
                                </div>
                              )}
                            </div>

                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-700 dark:text-green-300 font-mono">
                                  {usuario.numero_formatado}
                                </span>
                              </div>
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                                WhatsApp OK
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Funcionários com WhatsApp Inválido */}
              {usuariosInvalidos.length > 0 && showWarnings && (
                <div className="space-y-3">
                  <h4 className="font-medium text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    WhatsApp Inválido ({usuariosInvalidos.length})
                  </h4>

                  <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                      Estes funcionários não podem receber notificações pois têm
                      números inválidos. Configure o WhatsApp na página de
                      usuários.
                    </AlertDescription>
                  </Alert>

                  <div className="grid gap-2">
                    {usuariosInvalidos.map(usuario => (
                      <div
                        key={usuario.id}
                        className="p-3 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 opacity-60"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {usuario.nome}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {usuario.email}
                            </div>
                          </div>

                          <div className="text-right">
                            {usuario.celular ? (
                              <div className="text-sm text-yellow-700 dark:text-yellow-300 font-mono">
                                {usuario.numero_formatado || usuario.celular}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 dark:text-gray-500">
                                Sem celular
                              </div>
                            )}
                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">
                              Número Inválido
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Funcionários sem WhatsApp */}
              {usuariosSemWhatsApp.length > 0 && showWarnings && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Sem WhatsApp ({usuariosSemWhatsApp.length})
                    </h4>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSemWhatsApp(!showSemWhatsApp)}
                      className="text-xs"
                    >
                      {showSemWhatsApp ? 'Ocultar' : 'Mostrar'}
                    </Button>
                  </div>

                  {showSemWhatsApp && (
                    <>
                      <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                        <UserPlus className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700 dark:text-red-300">
                          Estes funcionários precisam cadastrar o WhatsApp para
                          receber notificações.
                        </AlertDescription>
                      </Alert>

                      <div className="grid gap-2">
                        {usuariosSemWhatsApp.map(usuario => (
                          <div
                            key={usuario.id}
                            className="p-3 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/10 opacity-60"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {usuario.nome}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {usuario.email}
                                </div>
                              </div>

                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">
                                Sem WhatsApp
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Nenhum funcionário disponível */}
              {usuariosValidos.length === 0 && !loading && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 dark:text-red-300">
                    <strong>
                      Nenhum funcionário com WhatsApp válido encontrado!
                    </strong>
                    <br />
                    Configure os números de WhatsApp dos funcionários antes de
                    criar checklists automatizados.
                  </AlertDescription>
                </Alert>
              )}

              {/* Resumo da Seleção */}
              {responsaveisSelecionados.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-green-900 dark:text-green-200 mb-2">
                    ✅ {responsaveisSelecionados.length} responsável(eis)
                    selecionado(s)
                  </h4>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Estes funcionários receberão notificações via WhatsApp
                    quando o checklist for agendado.
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
