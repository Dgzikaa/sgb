'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermosPage() {
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

        <Card className="max-w-4xl mx-auto card-dark">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white text-center">
              Termos de Uso - Fidelidade VIP
            </CardTitle>
            <p className="text-center text-gray-600 dark:text-gray-400">
              Ordinário Bar - Programa de Fidelidade
            </p>
          </CardHeader>
          
          <CardContent className="prose dark:prose-invert max-w-none">
            <div className="space-y-6 text-gray-700 dark:text-gray-300">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  1. Sobre o Programa
                </h2>
                <p>
                  O Programa de Fidelidade VIP do Ordinário Bar oferece benefícios exclusivos 
                  aos membros mediante pagamento de mensalidade de R$ 100,00.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  2. Benefícios Inclusos
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>R$ 150,00 em créditos mensais para consumo</li>
                  <li>Acesso VIP sem fila</li>
                  <li>Drink especial do mês</li>
                  <li>Convites para eventos exclusivos</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  3. Pagamento e Renovação
                </h2>
                <p>
                  A mensalidade é cobrada no dia do cadastro e renovada mensalmente. 
                  O cancelamento pode ser feito a qualquer momento.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  4. Uso dos Créditos
                </h2>
                <p>
                  Os créditos são válidos por 30 dias e não são cumulativos. 
                  Podem ser utilizados para qualquer item do cardápio.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  5. Cancelamento
                </h2>
                <p>
                  O membro pode cancelar sua assinatura a qualquer momento. 
                  Não há multa por cancelamento.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  6. Contato
                </h2>
                <p>
                  Para dúvidas: contato@ordinariobar.com.br
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
