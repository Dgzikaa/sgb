'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-amber-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/fidelidade">
            <Button variant="ghost" className="text-amber-600 dark:text-amber-400">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>

        <Card className="max-w-4xl mx-auto bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white text-center">
              Política de Privacidade
            </CardTitle>
            <p className="text-center text-gray-600 dark:text-gray-400">
              Ordinário Bar - Programa de Fidelidade
            </p>
          </CardHeader>
          
          <CardContent className="prose dark:prose-invert max-w-none">
            <div className="space-y-6 text-gray-700 dark:text-gray-300">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  1. Coleta de Dados
                </h2>
                <p>
                  Coletamos apenas os dados necessários para o funcionamento do programa:
                  nome, email, CPF, telefone e data de nascimento.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  2. Uso dos Dados
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Identificação do membro</li>
                  <li>Processamento de pagamentos</li>
                  <li>Comunicação sobre benefícios</li>
                  <li>Convites para eventos exclusivos</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  3. Proteção de Dados
                </h2>
                <p>
                  Seus dados são protegidos com criptografia SSL e armazenados em 
                  servidores seguros. Não compartilhamos informações com terceiros.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  4. Direitos do Titular
                </h2>
                <p>
                  Conforme a LGPD, você pode solicitar acesso, correção ou exclusão 
                  dos seus dados a qualquer momento.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  5. Cookies
                </h2>
                <p>
                  Utilizamos cookies apenas para melhorar sua experiência de navegação 
                  e funcionamento do sistema.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  6. Contato para Dados
                </h2>
                <p>
                  Para exercer seus direitos sobre dados pessoais: 
                  privacidade@ordinariobar.com.br
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
