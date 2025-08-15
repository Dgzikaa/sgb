'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Database, 
  Server, 
  Globe, 
  Clock,
  Cpu,
  MemoryStick,
  Wifi,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { motion } from 'framer-motion';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  lastCheck: string;
  details?: string;
  uptime?: number;
}

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<{ className?: string }>;
}

export default function HealthDashboard() {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Simular dados de health check (substituir por API real)
  useEffect(() => {
    const fetchHealthData = async () => {
      setIsLoading(true);
      
      try {
        // Simulação de health checks
        const mockHealthChecks: HealthCheck[] = [
          {
            service: 'Supabase Database',
            status: 'healthy',
            latency: 45,
            lastCheck: new Date().toISOString(),
            uptime: 99.9
          },
          {
            service: 'Vercel Frontend',
            status: 'healthy',
            latency: 120,
            lastCheck: new Date().toISOString(),
            uptime: 99.8
          },
          {
            service: 'ContaHub API',
            status: 'degraded',
            latency: 2400,
            lastCheck: new Date().toISOString(),
            details: 'Alta latência detectada',
            uptime: 98.5
          },
          {
            service: 'ContaAzul Integration',
            status: 'healthy',
            latency: 890,
            lastCheck: new Date().toISOString(),
            uptime: 99.2
          },
          {
            service: 'Edge Functions',
            status: 'healthy',
            latency: 67,
            lastCheck: new Date().toISOString(),
            uptime: 99.7
          },
          {
            service: 'CDN',
            status: 'healthy',
            latency: 23,
            lastCheck: new Date().toISOString(),
            uptime: 99.9
          }
        ];

        const mockSystemMetrics: SystemMetric[] = [
          {
            name: 'CPU Usage',
            value: 34,
            unit: '%',
            status: 'good',
            trend: 'stable',
            icon: Cpu
          },
          {
            name: 'Memory',
            value: 68,
            unit: '%',
            status: 'warning',
            trend: 'up',
            icon: MemoryStick
          },
          {
            name: 'Network',
            value: 12,
            unit: 'Mbps',
            status: 'good',
            trend: 'down',
            icon: Wifi
          },
          {
            name: 'Response Time',
            value: 240,
            unit: 'ms',
            status: 'good',
            trend: 'stable',
            icon: Clock
          }
        ];

        setHealthChecks(mockHealthChecks);
        setSystemMetrics(mockSystemMetrics);
        setLastUpdate(new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Erro ao buscar dados de health:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000); // Update a cada 30s

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'degraded':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'unhealthy':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'critical':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const overallStatus = healthChecks.every(hc => hc.status === 'healthy') 
    ? 'healthy' 
    : healthChecks.some(hc => hc.status === 'unhealthy') 
    ? 'unhealthy' 
    : 'degraded';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Health Dashboard</h1>
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-white/5 backdrop-blur-xl border-white/10 animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-white/10 rounded mb-2"></div>
                <div className="h-8 bg-white/10 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Health Dashboard</h1>
          {getStatusIcon(overallStatus)}
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/60">
            Última atualização: {lastUpdate}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Status Geral */}
      <Alert className={`border ${getStatusColor(overallStatus).split(' ')[2]} ${getStatusColor(overallStatus).split(' ')[0]}`}>
        <AlertDescription className="flex items-center gap-2">
          {getStatusIcon(overallStatus)}
          <span className="font-semibold">
            Sistema {overallStatus === 'healthy' ? 'Operacional' : 
                   overallStatus === 'degraded' ? 'Parcialmente Operacional' : 'Indisponível'}
          </span>
          {overallStatus !== 'healthy' && (
            <span className="text-sm opacity-80">
              - Alguns serviços podem estar com problemas
            </span>
          )}
        </AlertDescription>
      </Alert>

      {/* Métricas do Sistema */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemMetrics.map((metric, index) => (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <metric.icon className={`w-5 h-5 ${getMetricStatusColor(metric.status)}`} />
                  {getTrendIcon(metric.trend)}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-white/60">{metric.name}</p>
                  <p className={`text-2xl font-bold ${getMetricStatusColor(metric.status)}`}>
                    {metric.value}{metric.unit}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Health Checks */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Status dos Serviços</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {healthChecks.map((check, index) => (
            <motion.div
              key={check.service}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`bg-white/5 backdrop-blur-xl border transition-all duration-300 hover:-translate-y-1 ${
                check.status === 'healthy' ? 'border-green-500/30' :
                check.status === 'degraded' ? 'border-yellow-500/30' :
                'border-red-500/30'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white">{check.service}</CardTitle>
                    {getStatusIcon(check.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Latência</span>
                    <Badge className={`${getStatusColor(check.status)} text-xs`}>
                      {check.latency}ms
                    </Badge>
                  </div>
                  
                  {check.uptime && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/60">Uptime</span>
                      <span className="text-sm text-green-400 font-medium">
                        {check.uptime}%
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Última verificação</span>
                    <span className="text-sm text-white/80">
                      {new Date(check.lastCheck).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {check.details && (
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-sm text-yellow-400">{check.details}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
