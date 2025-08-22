'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity,
  ZoomIn,
  ZoomOut,
  Download,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 🎯 TYPES
interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

interface ModernChartProps {
  data: ChartDataPoint[] | ChartSeries[];
  type: 'line' | 'bar' | 'pie' | 'area' | 'doughnut' | 'radar';
  title?: string;
  subtitle?: string;
  height?: number;
  width?: number;
  animated?: boolean;
  interactive?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  showAxis?: boolean;
  variant?: 'default' | 'minimal' | 'glass' | 'premium';
  className?: string;
  onDataPointClick?: (point: ChartDataPoint, index: number) => void;
  onSeriesClick?: (series: ChartSeries, index: number) => void;
}

// 🎨 COMPONENTE PRINCIPAL
export const ModernChart = React.forwardRef<HTMLDivElement, ModernChartProps>(
  ({
    data,
    type,
    title,
    subtitle,
    height = 300,
    width,
    animated = true,
    interactive = true,
    showTooltip = true,
    showLegend = true,
    showGrid = true,
    showAxis = true,
    variant = 'default',
    className,
    onDataPointClick,
    onSeriesClick,
    ...props
  }, ref) => {
    // 🎭 STATES
    const [hoveredPoint, setHoveredPoint] = React.useState<ChartDataPoint | null>(null);
    const [hoveredSeries, setHoveredSeries] = React.useState<ChartSeries | null>(null);
    const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });
    const [zoomLevel, setZoomLevel] = React.useState(1);
    const [panOffset, setPanOffset] = React.useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = React.useState(false);

    // 🔍 REFS
    const containerRef = React.useRef<HTMLDivElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const tooltipRef = React.useRef<HTMLDivElement>(null);

    // 🎯 HELPER FUNCTIONS
    const isMultiSeries = (data: ChartDataPoint[] | ChartSeries[]): data is ChartSeries[] => {
      return data.length > 0 && 'data' in data[0];
    };

    const getFlattenedData = (): ChartDataPoint[] => {
      if (isMultiSeries(data)) {
        return data.flatMap(series => series.data);
      }
      return data;
    };

    const getMaxValue = (): number => {
      const allData = getFlattenedData();
      return Math.max(...allData.map(point => point.value));
    };

    const getMinValue = (): number => {
      const allData = getFlattenedData();
      return Math.min(...allData.map(point => point.value));
    };

    const getValueRange = (): number => {
      return getMaxValue() - getMinValue();
    };

    const getColor = (point: ChartDataPoint, index: number, seriesIndex?: number): string => {
      if (point.color) return point.color;
      
      const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
        '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
      ];
      
      if (isMultiSeries(data) && seriesIndex !== undefined) {
        return colors[seriesIndex % colors.length];
      }
      
      return colors[index % colors.length];
    };

    // 🎮 EVENT HANDLERS
    const handleMouseMove = (e: React.MouseEvent) => {
      if (!interactive || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Find closest data point
      const closestPoint = findClosestPoint(x, y);
      if (closestPoint) {
        setHoveredPoint(closestPoint.point);
        setHoveredSeries(closestPoint.series);
        setTooltipPosition({ x: e.clientX, y: e.clientY });
      } else {
        setHoveredPoint(null);
        setHoveredSeries(null);
      }
    };

    const handleMouseLeave = () => {
      setHoveredPoint(null);
      setHoveredSeries(null);
    };

    const handleDataPointClick = (point: ChartDataPoint, index: number, seriesIndex?: number) => {
      if (onDataPointClick) {
        onDataPointClick(point, index);
      }
      if (onSeriesClick && isMultiSeries(data) && seriesIndex !== undefined) {
        onSeriesClick(data[seriesIndex], seriesIndex);
      }
    };

    const handleZoomIn = () => {
      setZoomLevel(prev => Math.min(prev * 1.2, 3));
    };

    const handleZoomOut = () => {
      setZoomLevel(prev => Math.max(prev / 1.2, 0.5));
    };

    const handleReset = () => {
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
    };

    const handleDownload = () => {
      if (!canvasRef.current) return;
      
      const link = document.createElement('a');
      link.download = `${title || 'chart'}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    };

    // 🔍 POINT DETECTION
    const findClosestPoint = (mouseX: number, mouseY: number) => {
      const allData = getFlattenedData();
      let closestPoint: ChartDataPoint | null = null;
      let closestDistance = Infinity;
      let closestIndex = -1;
      let closestSeriesIndex = -1;

      if (isMultiSeries(data)) {
        data.forEach((series, seriesIndex) => {
          series.data.forEach((point, pointIndex) => {
            const distance = calculateDistance(mouseX, mouseY, point, pointIndex, seriesIndex);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestPoint = point;
              closestIndex = pointIndex;
              closestSeriesIndex = seriesIndex;
            }
          });
        });
      } else {
        allData.forEach((point, index) => {
          const distance = calculateDistance(mouseX, mouseY, point, index);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestPoint = point;
            closestIndex = index;
          }
        });
      }

      if (closestDistance < 30) { // Threshold for hover detection
        return {
          point: closestPoint!,
          index: closestIndex,
          series: isMultiSeries(data) ? data[closestSeriesIndex] : null
        };
      }

      return null;
    };

    const calculateDistance = (mouseX: number, mouseY: number, point: ChartDataPoint, pointIndex: number, seriesIndex?: number): number => {
      // Simplified distance calculation - in a real implementation, you'd map data coordinates to screen coordinates
      const chartWidth = width || (containerRef.current?.clientWidth || 400);
      const chartHeight = height;
      
      const pointX = (pointIndex / (getFlattenedData().length - 1)) * chartWidth;
      const pointY = chartHeight - ((point.value - getMinValue()) / getValueRange()) * chartHeight;
      
      return Math.sqrt(Math.pow(mouseX - pointX, 2) + Math.pow(mouseY - pointY, 2));
    };

    // 🎨 STYLES
    const getVariantStyles = () => {
      switch (variant) {
        case 'minimal':
          return 'bg-transparent border-0';
        case 'glass':
          return 'bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm border border-white/20 dark:border-gray-700/50';
        case 'premium':
          return 'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700';
        default:
          return 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700';
      }
    };

    // 🎭 ANIMATIONS
    const chartVariants = {
      hidden: { opacity: 0, scale: 0.9 },
      visible: { 
        opacity: 1, 
        scale: 1,
        transition: { 
          duration: 0.5,
          ease: [0.4, 0, 0.2, 1]
        }
      }
    };

    const dataPointVariants = {
      hidden: { opacity: 0, scale: 0 },
      visible: (i: number) => ({
        opacity: 1,
        scale: 1,
        transition: {
          delay: i * 0.05,
          duration: 0.3,
          ease: "easeOut"
        }
      })
    };

    // 🎨 RENDER CHART
    const renderChart = () => {
      switch (type) {
        case 'line':
          return renderLineChart();
        case 'bar':
          return renderBarChart();
        case 'pie':
          return renderPieChart();
        case 'area':
          return renderAreaChart();
        case 'doughnut':
          return renderDoughnutChart();
        case 'radar':
          return renderRadarChart();
        default:
          return renderLineChart();
      }
    };

    const renderLineChart = () => {
      const allData = getFlattenedData();
      const maxValue = getMaxValue();
      const minValue = getMinValue();
      const valueRange = getValueRange();

      return (
        <div className="relative w-full h-full">
          {/* Grid lines */}
          {showGrid && (
            <div className="absolute inset-0">
              {Array.from({ length: 5 }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 0.1, scaleY: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="absolute w-full border-t border-gray-200 dark:border-gray-700"
                  style={{ top: `${(i / 4) * 100}%` }}
                />
              ))}
            </div>
          )}

          {/* Data line */}
          <svg className="w-full h-full absolute inset-0">
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              d={generateLinePath(allData, maxValue, minValue, valueRange)}
              fill="none"
              stroke={getColor(allData[0], 0)}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Data points */}
          {allData.map((point, index) => (
            <motion.div
              key={index}
              custom={index}
              variants={dataPointVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.2 }}
              className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-pointer"
              style={{
                left: `${(index / (allData.length - 1)) * 100}%`,
                top: `${100 - ((point.value - minValue) / valueRange) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => handleDataPointClick(point, index)}
            />
          ))}
        </div>
      );
    };

    const renderBarChart = () => {
      const allData = getFlattenedData();
      const maxValue = getMaxValue();
      const barWidth = 100 / allData.length;

      return (
        <div className="relative w-full h-full flex items-end justify-between px-4">
          {allData.map((point, index) => (
            <motion.div
              key={index}
              custom={index}
              variants={dataPointVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.05 }}
              className="relative flex-1 mx-1"
              style={{ maxWidth: `${barWidth}%` }}
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(point.value / maxValue) * 100}%` }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="w-full bg-gradient-to-t from-blue-500 to-blue-600 rounded-t-lg cursor-pointer"
                onClick={() => handleDataPointClick(point, index)}
              />
              <div className="text-xs text-gray-600 dark:text-gray-400 text-center mt-2 truncate">
                {point.label}
              </div>
            </motion.div>
          ))}
        </div>
      );
    };

    const renderPieChart = () => {
      const allData = getFlattenedData();
      const total = allData.reduce((sum, point) => sum + point.value, 0);
      let currentAngle = 0;

      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <svg className="w-48 h-48">
            {allData.map((point, index) => {
              const percentage = point.value / total;
              const angle = percentage * 360;
              const startAngle = currentAngle;
              currentAngle += angle;

              const x1 = 96 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
              const y1 = 96 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
              const x2 = 96 + 80 * Math.cos((currentAngle - 90) * Math.PI / 180);
              const y2 = 96 + 80 * Math.sin((currentAngle - 90) * Math.PI / 180);

              const largeArcFlag = angle > 180 ? 1 : 0;

              const pathData = [
                `M 96 96`,
                `L ${x1} ${y1}`,
                `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');

              return (
                <motion.path
                  key={index}
                  custom={index}
                  variants={dataPointVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ scale: 1.05 }}
                  d={pathData}
                  fill={getColor(point, index)}
                  className="cursor-pointer"
                  onClick={() => handleDataPointClick(point, index)}
                />
              );
            })}
          </svg>
        </div>
      );
    };

    const renderAreaChart = () => {
      // Similar to line chart but with filled area
      return renderLineChart();
    };

    const renderDoughnutChart = () => {
      // Similar to pie chart but with center hole
      return renderPieChart();
    };

    const renderRadarChart = () => {
      // Radar chart implementation
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">
            Radar Chart - Em desenvolvimento
          </div>
        </div>
      );
    };

    // 🛠️ HELPER FUNCTIONS
    const generateLinePath = (data: ChartDataPoint[], maxValue: number, minValue: number, valueRange: number): string => {
      if (data.length < 2) return '';

      const points = data.map((point, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((point.value - minValue) / valueRange) * 100;
        return `${x}% ${y}%`;
      });

      return `M ${points.join(' L ')}`;
    };

    // 🚀 RENDER PRINCIPAL
    return (
      <motion.div
        ref={containerRef}
        className={cn(
          'relative rounded-xl shadow-sm overflow-hidden',
          getVariantStyles(),
          className
        )}
        style={{ height, width }}
        variants={chartVariants}
        initial="hidden"
        animate="visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Chart container */}
        <div className="relative flex-1 p-4">
          {renderChart()}
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-4">
              {getFlattenedData().map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-2"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getColor(point, index) }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {point.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Toolbar */}
        {interactive && (
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleZoomIn}
              className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleZoomOut}
              className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleReset}
              className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDownload}
              className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <Download className="w-4 h-4" />
            </motion.button>
          </div>
        )}

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && hoveredPoint && (
            <motion.div
              ref={tooltipRef}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute z-50 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-xl pointer-events-none"
              style={{
                left: tooltipPosition.x + 10,
                top: tooltipPosition.y - 10,
                transform: 'translateY(-100%)'
              }}
            >
              <div className="font-medium">{hoveredPoint.label}</div>
              <div className="text-gray-300">
                {hoveredPoint.value.toLocaleString()}
              </div>
              {hoveredSeries && (
                <div className="text-xs text-gray-400 mt-1">
                  {hoveredSeries.name}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas for export */}
        <canvas
          ref={canvasRef}
          className="hidden"
          width={width || 800}
          height={height || 600}
        />
      </motion.div>
    );
  }
);

ModernChart.displayName = 'ModernChart';

// 🚀 EXPORT
// export { ModernChart }; // Já exportado acima
