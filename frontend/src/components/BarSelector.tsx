'use client';

import { useBar } from '@/contexts/BarContext';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPinIcon, CheckCircle2Icon } from 'lucide-react';

export default function BarSelector() {
  const { selectedBar, setSelectedBar, bars, loading } = useBar();

  // Loading state
  if (loading) {
    return (
      <div className="p-3 border-t border-slate-700/50">
        <div className="bg-slate-700/50 rounded-xl p-3 animate-pulse">
          <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-slate-600 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Collapsed state
  // TODO: implementar estado collapsed
  // if (isCollapsed) {
  //   return (
  //     <div className="flex items-center justify-center p-3 border-t border-slate-700/50">
  //       <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
  //         <MapPinIcon className="w-5 h-5 text-white" />
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="p-3">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Estabelecimento
            </span>
          </div>
          <Badge
            variant="outline"
            className="text-xs px-2 py-1 bg-slate-700/50 text-slate-300 border-slate-600"
          >
            {bars.length}
          </Badge>
        </div>

        {/* Selector */}
        <div className="relative">
          <Select
            value={selectedBar?.id?.toString() || ''}
            onValueChange={value => {
              const bar = bars.find(b => b.id.toString() === value);
              if (bar) setSelectedBar(bar);
            }}
          >
            <SelectTrigger className="w-full bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700/70 transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                  <span className="text-white text-sm font-bold">
                    {selectedBar?.nome?.charAt(0)?.toUpperCase() || 'B'}
                  </span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <SelectValue placeholder="Selecione um bar">
                    <div className="text-left">
                      <div className="font-medium text-white truncate">
                        {selectedBar?.nome || 'Selecione um bar'}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        ID: {selectedBar?.id || 'N/A'}
                      </div>
                    </div>
                  </SelectValue>
                </div>
              </div>
            </SelectTrigger>
            <SelectContent className="w-full bg-slate-800 border-slate-700 max-h-60 overflow-y-auto">
              {bars.map(bar => (
                <SelectItem
                  key={bar.id}
                  value={bar.id.toString()}
                  className="text-white hover:bg-slate-700 focus:bg-slate-700 cursor-pointer"
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                      <span className="text-white text-sm font-bold">
                        {bar.nome?.charAt(0)?.toUpperCase() || 'B'}
                      </span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-white truncate">
                          {bar.nome}
                        </div>
                        {selectedBar?.id === bar.id && (
                          <CheckCircle2Icon className="w-4 h-4 text-green-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        ID: {bar.id}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        {selectedBar && (
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-slate-400">
              Conectado • {selectedBar.nome}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
