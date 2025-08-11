'use client';

import { motion } from 'framer-motion';
import { Crown, Sparkles, ArrowRight } from 'lucide-react';
import CodigoConviteValidator from '@/components/forms/CodigoConviteValidator';

export default function ConvitePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-amber-900 to-black">
      {/* Background Premium */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.1),transparent_50%)]"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge VIP Exclusivo */}
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur-xl border border-amber-400/30 rounded-full px-8 py-4 mb-8 shadow-2xl">
            <Crown className="w-6 h-6 text-amber-300 animate-pulse" />
            <span className="text-amber-100 font-bold text-lg">ACESSO VIP EXCLUSIVO</span>
            <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
          </div>

          {/* Título Principal */}
          <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black text-white mb-6 leading-none">
            Você foi
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 bg-clip-text text-transparent animate-pulse">
              CONVIDADO
            </span>
          </h1>
          
          {/* Subtítulo */}
          <p className="text-lg sm:text-xl lg:text-2xl text-amber-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Para fazer parte do círculo exclusivo de apenas 
            <span className="font-black text-amber-300 text-2xl lg:text-3xl"> 100 PESSOAS </span>
            <br className="hidden sm:block" />
            no programa VIP do Ordinário Bar e Música
          </p>

          {/* Explicação do Fluxo */}
          <div className="bg-amber-500/10 backdrop-blur-md border border-amber-400/20 rounded-2xl p-6 mb-8 max-w-2xl mx-auto">
            <h3 className="text-amber-200 text-lg font-bold mb-3 text-center">Como funciona:</h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-amber-100">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-black rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">1</span>
                <span>Validar código</span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 transform rotate-90 sm:rotate-0" />
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-black rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">2</span>
                <span>Completar dados</span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 transform rotate-90 sm:rotate-0" />
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-black rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">3</span>
                <span>Pagar R$ 100</span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 transform rotate-90 sm:rotate-0" />
              <div className="flex items-center gap-2">
                <span className="bg-green-500 text-black rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">✓</span>
                <span className="font-bold text-amber-300">R$ 150 de crédito!</span>
              </div>
            </div>
          </div>

          {/* Card Central - Oferta */}
          <div className="relative max-w-2xl mx-auto mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-yellow-500/30 rounded-3xl blur-2xl"></div>
            <div className="relative bg-black/40 backdrop-blur-xl border border-amber-400/30 rounded-3xl p-8 lg:p-12 shadow-2xl">
              
              {/* Preço Especial */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-white">Investimento</div>
                  <div className="text-4xl lg:text-6xl font-black text-red-400">R$ 100</div>
                  <div className="text-sm text-red-300 opacity-80">uma única vez</div>
                </div>
                <ArrowRight className="w-8 h-8 text-amber-400" />
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-white">Créditos</div>
                  <div className="text-4xl lg:text-6xl font-black bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent">R$ 150</div>
                  <div className="text-sm text-amber-300 opacity-80">todo mês</div>
                </div>
              </div>
              
              {/* Alerta importante */}
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4 mb-6">
                <p className="text-blue-100 text-sm text-center">
                  💡 <strong>Importante:</strong> Seus créditos são ativados automaticamente após a confirmação do pagamento
                </p>
              </div>
              
              {/* Benefícios Rápidos */}
              <div className="grid grid-cols-3 gap-4 lg:gap-8 mb-8">
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-green-400">50%</div>
                  <div className="text-amber-200/80 text-sm lg:text-base">Retorno garantido</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-amber-300">VIP</div>
                  <div className="text-amber-200/80 text-sm lg:text-base">Acesso exclusivo</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-blue-400">100</div>
                  <div className="text-amber-200/80 text-sm lg:text-base">Vagas limitadas</div>
                </div>
              </div>

              {/* Validador de Código de Convite */}
              <CodigoConviteValidator 
                onValidacaoSucesso={(dados) => {
                  // Redirecionar para completar cadastro com dados validados
                  const params = new URLSearchParams({
                    codigo: dados.codigo,
                    cpf: dados.cpf,
                    validation_token: dados.validation_token
                  });
                  window.location.href = `/fidelidade/completar-cadastro?${params.toString()}`;
                }}
                className="mb-6"
              />
            </div>
          </div>

          {/* Urgência e Trust Signals */}
          <div className="space-y-4">
            <p className="text-amber-200 text-lg font-semibold">
              ⚡ Apenas para convidados especiais • Cadastro liberado com código válido
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-amber-300/80">
              <span>🔒 Pagamento 100% seguro</span>
              <span>📱 Créditos ativados após pagamento</span>
              <span>💳 Cartão digital imediato</span>
            </div>
            
            {/* Informação adicional sobre o fluxo */}
            <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-400/20">
              <p className="text-amber-200 text-xs text-center">
                O código de convite é usado apenas para validar seu acesso ao cadastro.<br/>
                Os R$ 150 em créditos são liberados automaticamente após a confirmação do seu pagamento.
              </p>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
