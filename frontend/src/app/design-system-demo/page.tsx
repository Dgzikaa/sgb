'use client';

import React, { useState } from 'react';
import { 
  Button, 
  Input, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Badge,
  Switch,
  Slider
} from '@/components/ui';
import { ThemeSwitcher } from '@/components/ui/theme-switcher-modern';

export default function DesignSystemDemo() {
  const [inputValue, setInputValue] = useState('');
  const [switchValue, setSwitchValue] = useState(false);
  const [sliderValue, setSliderValue] = useState([50]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="card-dark p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="card-title-dark">🎨 Design System Demo</h1>
              <p className="card-description-dark">
                Demonstração dos componentes e melhorias do design system Zykor
              </p>
            </div>
            <ThemeSwitcher />
          </div>
        </div>

        {/* Grid de Componentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {/* Botões */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="text-gray-900 dark:text-white">Botões</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Diferentes variantes e estados
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">
                  Primary Button
                </Button>
                <Button 
                  variant="secondary" 
                  className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
                >
                  Secondary Button
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Outline Button
                </Button>
                <Button 
                  variant="destructive"
                  className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
                >
                  Destructive Button
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Inputs */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="text-gray-900 dark:text-white">Inputs</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Campos de entrada e formulários
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <Input
                  placeholder="Input padrão"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <Input
                  placeholder="Input com erro"
                  className="bg-white dark:bg-gray-700 border-red-300 dark:border-red-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-red-500 dark:focus:border-red-400"
                />
                <Input
                  placeholder="Input desabilitado"
                  disabled
                  className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-500 placeholder-gray-400 dark:placeholder-gray-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="text-gray-900 dark:text-white">Badges</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Indicadores de status e categorias
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Primary
                </Badge>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Success
                </Badge>
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Warning
                </Badge>
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  Error
                </Badge>
                <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  Neutral
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Controles */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="text-gray-900 dark:text-white">Controles</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Switches, sliders e outros controles
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Dark Mode
                </span>
                <Switch
                  checked={switchValue}
                  onCheckedChange={setSwitchValue}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Volume: {sliderValue[0]}%
                </label>
                <Slider
                  value={sliderValue}
                  onValueChange={setSliderValue}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Estados de Loading */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="text-gray-900 dark:text-white">Estados</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Loading, empty states e feedbacks
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
              <div className="text-center py-4">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Carregando...</p>
              </div>
            </CardContent>
          </Card>

          {/* Tipografia */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="text-gray-900 dark:text-white">Tipografia</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Hierarquia de textos e estilos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Heading 1
              </h1>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Heading 2
              </h2>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                Heading 3
              </h3>
              <p className="text-base text-gray-700 dark:text-gray-300">
                Texto parágrafo normal com boa legibilidade.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Texto secundário menor.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Texto auxiliar muito pequeno.
              </p>
            </CardContent>
          </Card>

        </div>

        {/* Seção de Cores */}
        <div className="mt-8">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="text-gray-900 dark:text-white">🎨 Paleta de Cores</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Sistema de cores com suporte completo ao dark mode
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {/* Cores Primárias */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Primary</h4>
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-blue-500 rounded"></div>
                    <div className="w-full h-8 bg-blue-600 rounded"></div>
                    <div className="w-full h-8 bg-blue-700 rounded"></div>
                  </div>
                </div>

                {/* Cores de Sucesso */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Success</h4>
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-green-500 rounded"></div>
                    <div className="w-full h-8 bg-green-600 rounded"></div>
                    <div className="w-full h-8 bg-green-700 rounded"></div>
                  </div>
                </div>

                {/* Cores de Warning */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Warning</h4>
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-yellow-500 rounded"></div>
                    <div className="w-full h-8 bg-yellow-600 rounded"></div>
                    <div className="w-full h-8 bg-yellow-700 rounded"></div>
                  </div>
                </div>

                {/* Cores de Erro */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Error</h4>
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-red-500 rounded"></div>
                    <div className="w-full h-8 bg-red-600 rounded"></div>
                    <div className="w-full h-8 bg-red-700 rounded"></div>
                  </div>
                </div>

                {/* Cores Neutras */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Neutral</h4>
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="w-full h-8 bg-gray-400 dark:bg-gray-700 rounded"></div>
                    <div className="w-full h-8 bg-gray-500 dark:bg-gray-800 rounded"></div>
                  </div>
                </div>

                {/* Backgrounds */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Background</h4>
                  <div className="space-y-1">
                    <div className="w-full h-8 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded"></div>
                    <div className="w-full h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded"></div>
                    <div className="w-full h-8 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            🚀 Design System Zykor - Versão 2.0 com Dark Mode
          </p>
        </div>
      </div>
    </div>
  );
}
