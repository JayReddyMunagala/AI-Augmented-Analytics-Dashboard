import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts';
import { SalesData, ChartConfig } from '../types/dashboard';
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, ScatterChart as Scatter3D, Settings } from 'lucide-react';

interface Props {
  data: SalesData[];
  availableColumns: string[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

export const AdvancedCharts: React.FC<Props> = ({ data, availableColumns }) => {
  const [chartConfigs, setChartConfigs] = useState<ChartConfig[]>([
    {
      type: 'line',
      xAxis: 'date',
      yAxis: 'sales',
      title: 'Sales Trend Over Time'
    },
    {
      type: 'bar',
      xAxis: 'product',
      yAxis: 'sales',
      title: 'Sales by Product'
    },
    {
      type: 'pie',
      xAxis: 'region',
      yAxis: 'sales',
      title: 'Sales Distribution by Region'
    }
  ]);

  const [activeChart, setActiveChart] = useState(0);
  const [showConfig, setShowConfig] = useState(false);

  const numericColumns = availableColumns.filter(col => 
    data.length > 0 && typeof data[0][col] === 'number'
  );

  const stringColumns = availableColumns.filter(col => 
    data.length > 0 && typeof data[0][col] === 'string'
  );

  const processDataForChart = (config: ChartConfig) => {
    if (config.type === 'pie') {
      // Aggregate data for pie chart
      const aggregated = data.reduce((acc, item) => {
        const key = String(item[config.xAxis]);
        const value = Number(item[config.yAxis]) || 0;
        
        if (acc[key]) {
          acc[key] += value;
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(aggregated).map(([name, value]) => ({
        name,
        value,
        percentage: ((value / Object.values(aggregated).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
      }));
    }

    if (config.type === 'bar' && stringColumns.includes(config.xAxis)) {
      // Aggregate data for bar chart with string x-axis
      const aggregated = data.reduce((acc, item) => {
        const key = String(item[config.xAxis]);
        const value = Number(item[config.yAxis]) || 0;
        
        if (acc[key]) {
          acc[key] += value;
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(aggregated)
        .map(([name, value]) => ({ [config.xAxis]: name, [config.yAxis]: value }))
        .sort((a, b) => Number(b[config.yAxis]) - Number(a[config.yAxis]))
        .slice(0, 10); // Show top 10
    }

    // For line charts and scatter plots, return data as-is (but limit for performance)
    return data.slice(0, 1000).map(item => ({
      ...item,
      [config.xAxis]: config.xAxis === 'date' ? 
        new Date(item[config.xAxis]).toLocaleDateString() : 
        item[config.xAxis],
      [config.yAxis]: Number(item[config.yAxis]) || 0
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const updateChartConfig = (index: number, updates: Partial<ChartConfig>) => {
    const newConfigs = [...chartConfigs];
    newConfigs[index] = { ...newConfigs[index], ...updates };
    setChartConfigs(newConfigs);
  };

  const addNewChart = () => {
    const newChart: ChartConfig = {
      type: 'line',
      xAxis: availableColumns[0] || 'date',
      yAxis: numericColumns[0] || 'sales',
      title: `Chart ${chartConfigs.length + 1}`
    };
    setChartConfigs([...chartConfigs, newChart]);
    setActiveChart(chartConfigs.length);
  };

  const removeChart = (index: number) => {
    if (chartConfigs.length > 1) {
      const newConfigs = chartConfigs.filter((_, i) => i !== index);
      setChartConfigs(newConfigs);
      if (activeChart >= newConfigs.length) {
        setActiveChart(newConfigs.length - 1);
      }
    }
  };

  const renderChart = (config: ChartConfig, chartData: any[]) => {
    const commonProps = {
      width: '100%',
      height: '100%'
    };

    switch (config.type) {
      case 'line':
        return (
          <LineChart data={chartData} {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey={config.xAxis}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => numericColumns.includes(config.yAxis) ? `$${(value / 1000).toFixed(0)}k` : value}
              stroke="#6b7280"
            />
            <Tooltip 
              formatter={(value: number) => [
                numericColumns.includes(config.yAxis) ? formatCurrency(value) : value, 
                config.yAxis
              ]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Line 
              type="monotone" 
              dataKey={config.yAxis}
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={chartData} {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey={config.xAxis}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => numericColumns.includes(config.yAxis) ? `$${(value / 1000).toFixed(0)}k` : value}
              stroke="#6b7280"
            />
            <Tooltip 
              formatter={(value: number) => [
                numericColumns.includes(config.yAxis) ? formatCurrency(value) : value, 
                config.yAxis
              ]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Bar dataKey={config.yAxis} fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name} (${percentage}%)`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart data={chartData} {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey={config.xAxis}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => numericColumns.includes(config.yAxis) ? `$${(value / 1000).toFixed(0)}k` : value}
              stroke="#6b7280"
            />
            <Tooltip 
              formatter={(value: number) => [
                numericColumns.includes(config.yAxis) ? formatCurrency(value) : value, 
                config.yAxis
              ]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Scatter dataKey={config.yAxis} fill="#3b82f6" />
          </ScatterChart>
        );

      default:
        return <div>Chart type not supported</div>;
    }
  };

  const activeConfig = chartConfigs[activeChart];
  const chartData = activeConfig ? processDataForChart(activeConfig) : [];

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'line': return LineChartIcon;
      case 'bar': return BarChart3;
      case 'pie': return PieChartIcon;
      case 'scatter': return Scatter3D;
      default: return BarChart3;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Interactive Charts</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            onClick={addNewChart}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Chart
          </button>
        </div>
      </div>

      {/* Chart Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {chartConfigs.map((config, index) => {
          const IconComponent = getChartIcon(config.type);
          return (
            <button
              key={index}
              onClick={() => setActiveChart(index)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeChart === index
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <IconComponent className="h-4 w-4" />
              <span>{config.title}</span>
              {chartConfigs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeChart(index);
                  }}
                  className="ml-1 text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              )}
            </button>
          );
        })}
      </div>

      {/* Chart Configuration */}
      {showConfig && activeConfig && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Chart Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Chart Type</label>
              <select
                value={activeConfig.type}
                onChange={(e) => updateChartConfig(activeChart, { type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="scatter">Scatter Plot</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">X-Axis</label>
              <select
                value={activeConfig.xAxis}
                onChange={(e) => updateChartConfig(activeChart, { xAxis: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {availableColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Y-Axis</label>
              <select
                value={activeConfig.yAxis}
                onChange={(e) => updateChartConfig(activeChart, { yAxis: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {numericColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
              <input
                type="text"
                value={activeConfig.title}
                onChange={(e) => updateChartConfig(activeChart, { title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Chart Display */}
      {activeConfig && chartData.length > 0 ? (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart(activeConfig, chartData)}
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-96 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No data available for the selected configuration</p>
            <p className="text-sm">Try adjusting your filters or chart settings</p>
          </div>
        </div>
      )}

      {/* Chart Stats */}
      {activeConfig && chartData.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-gray-900">{chartData.length}</p>
            <p className="text-xs text-gray-500">Data Points</p>
          </div>
          {numericColumns.includes(activeConfig.yAxis) && (
            <>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(chartData.reduce((sum, item) => sum + (Number(item[activeConfig.yAxis]) || 0), 0))}
                </p>
                <p className="text-xs text-gray-500">Total {activeConfig.yAxis}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(chartData.reduce((sum, item) => sum + (Number(item[activeConfig.yAxis]) || 0), 0) / chartData.length)}
                </p>
                <p className="text-xs text-gray-500">Average {activeConfig.yAxis}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(Math.max(...chartData.map(item => Number(item[activeConfig.yAxis]) || 0)))}
                </p>
                <p className="text-xs text-gray-500">Max {activeConfig.yAxis}</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};