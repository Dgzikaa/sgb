'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  ArrowRight,
  Star
} from 'lucide-react';
import Link from 'next/link';

export default function TestLandingPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* Hero Section Simplificado */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            {/* Logo Simplificado */}
            <div className="flex items-center justify-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <span className="text-4xl text-white font-black">Z</span>
              </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-white via-amber-200 to-orange-300 bg-clip-text text-transparent mb-4">
              ZYKOR
            </h1>
            
            <p className="text-xl md:text-2xl font-light text-amber-200 mb-3">
              Sistema de Gestão para Bares e Restaurantes
            </p>
            
            <p className="text-lg md:text-xl text-white/80 mb-8 leading-relaxed max-w-4xl mx-auto">
              A plataforma completa que revoluciona a gestão do seu estabelecimento
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/login">
                <Button size="lg" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-12 py-6 text-xl font-bold shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-2xl">
                  Acessar Sistema
                  <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades Simples */}
      <section className="py-12 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Funcionalidades
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Tudo que você precisa para transformar seu bar em um negócio de sucesso
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6 text-center">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Gestão Inteligente</h3>
              <p className="text-white/70 text-lg">Dashboard completo com métricas em tempo real</p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6 text-center">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Gestão de Equipe</h3>
              <p className="text-white/70 text-lg">Controle de funcionários e processos</p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6 text-center">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center mb-4">
                <Star className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Programa VIP</h3>
              <p className="text-white/70 text-lg">Sistema de fidelidade digital</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Simples */}
      <footer className="py-8 bg-black/60 backdrop-blur-sm border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/60 mb-3">
            © 2024 ZYKOR - Sistema de Gestão para Bares e Restaurantes
          </p>
        </div>
      </footer>
    </div>
  );
}
