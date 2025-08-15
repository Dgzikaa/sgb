'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export function useRechartsTheme() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return {
    grid: isDark ? '#374151' : '#e5e7eb',
    text: isDark ? '#e5e7eb' : '#111827',
    axis: isDark ? '#9ca3af' : '#6b7280',
    tooltipBg: isDark ? '#111827' : '#ffffff',
    tooltipBorder: isDark ? '#374151' : '#e5e7eb',
  };
}

export function RechartsLine({ data, xKey, yKey, color = '#4A90E2', height = 260 }: any) {
  const th = useRechartsTheme();
  return (
    <div className="card-dark p-4">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={th.grid} strokeDasharray="3 3" />
          <XAxis dataKey={xKey} stroke={th.axis} />
          <YAxis stroke={th.axis} />
          <Tooltip contentStyle={{ background: th.tooltipBg, borderColor: th.tooltipBorder }} />
          <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RechartsBar({ data, xKey, yKey, color = '#8B5FBF', height = 260 }: any) {
  const th = useRechartsTheme();
  return (
    <div className="card-dark p-4">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={th.grid} strokeDasharray="3 3" />
          <XAxis dataKey={xKey} stroke={th.axis} />
          <YAxis stroke={th.axis} />
          <Tooltip contentStyle={{ background: th.tooltipBg, borderColor: th.tooltipBorder }} />
          <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const chartComponents = { RechartsLine, RechartsBar };

export default chartComponents;


