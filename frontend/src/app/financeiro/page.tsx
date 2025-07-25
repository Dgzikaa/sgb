'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Calendar,
  CreditCard,
  TrendingUp,
  FileText,
  Calculator,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function FinanceiroPage() {
  const router = useRouter();

  return (
    <ProtectedRoute requiredModule="financeiro">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Gestão Financeira
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Gerencie pagamentos, receitas e controle financeiro
                </p>
              </div>
            </div>
          </div>

          {/* Métricas Rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Pagamentos
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      12
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Pendentes
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      3
                    </p>
                  </div>
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      R$ 45K
                    </p>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Próximo
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      15/12
                    </p>
                  </div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Módulos Financeiros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Agendamento de Pagamentos */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900 dark:text-white">
                        Agendamento
                      </CardTitle>
                      <CardDescription>Agendar pagamentos</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                  >
                    Ativo
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Agende e gerencie pagamentos recorrentes
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500 dark:text-gray-500">
                    Pagamentos agendados 12
                  </span>
                  <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: '80%' }}
                    ></div>
                  </div>
                </div>
                <Link href="/financeiro/agendamento">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
                    Agendar Pagamentos
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Em Desenvolvimento */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg opacity-60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-500 dark:text-gray-400">
                        Receitas
                      </CardTitle>
                      <CardDescription>Em desenvolvimento</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  >
                    Em breve
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                  Módulo em desenvolvimento
                </p>
                <Button className="w-full" disabled>
                  Em Desenvolvimento
                </Button>
              </CardContent>
            </Card>

            {/* Em Desenvolvimento */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg opacity-60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <FileText className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-500 dark:text-gray-400">
                        Relatórios
                      </CardTitle>
                      <CardDescription>Em desenvolvimento</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  >
                    Em breve
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                  Módulo em desenvolvimento
                </p>
                <Button className="w-full" disabled>
                  Em Desenvolvimento
                </Button>
              </CardContent>
            </Card>

            {/* Em Desenvolvimento */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg opacity-60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <CreditCard className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-500 dark:text-gray-400">
                        Gastos
                      </CardTitle>
                      <CardDescription>Em desenvolvimento</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  >
                    Em breve
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                  Módulo em desenvolvimento
                </p>
                <Button className="w-full" disabled>
                  Em Desenvolvimento
                </Button>
              </CardContent>
            </Card>

            {/* Em Desenvolvimento */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg opacity-60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <DollarSign className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-500 dark:text-gray-400">
                        Fluxo de Caixa
                      </CardTitle>
                      <CardDescription>Em desenvolvimento</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  >
                    Em breve
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                  Módulo em desenvolvimento
                </p>
                <Button className="w-full" disabled>
                  Em Desenvolvimento
                </Button>
              </CardContent>
            </Card>

            {/* Em Desenvolvimento */}
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg opacity-60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <Calculator className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-500 dark:text-gray-400">
                        Calculadora
                      </CardTitle>
                      <CardDescription>Em desenvolvimento</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  >
                    Em breve
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                  Módulo em desenvolvimento
                </p>
                <Button className="w-full" disabled>
                  Em Desenvolvimento
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
