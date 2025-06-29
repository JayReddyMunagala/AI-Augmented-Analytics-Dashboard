import React, { useState, useMemo } from 'react';
import { subDays } from 'date-fns';
import { MetricCard } from './components/MetricCard';
import { SalesChart } from './components/SalesChart';
import { RegionalChart } from './components/RegionalChart';
import { AIInsights } from './components/AIInsights';
import { FilterPanel } from './components/FilterPanel';
import { ExportPanel } from './components/ExportPanel';
import { CSVUploader } from './components/CSVUploader';
import { AdvancedCharts } from './components/AdvancedCharts';
import { AIInsightsGenerator } from './components/AIInsightsGenerator';
import { mockSalesData, metricCards } from './data/mockData';
import { FilterState, SalesData, DatasetInfo, AIInsight } from './types/dashboard';
import { Brain, Database, BarChart3, FileText, Settings, Upload } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'data' | 'charts' | 'insights' | 'export'>('data');
  const [currentData, setCurrentData] = useState<SalesData[]>(mockSalesData);
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      start: subDays(new Date(), 30),
      end: new Date(),
    },
    regions: [],
    products: [],
    categories: [],
  });

  // Get unique values for filter options from current data
  const availableRegions = useMemo(() => 
    Array.from(new Set(currentData.map(item => item.region))), [currentData]);
  const availableProducts = useMemo(() => 
    Array.from(new Set(currentData.map(item => item.product))), [currentData]);
  const availableCategories = useMemo(() => 
    Array.from(new Set(currentData.map(item => item.category))), [currentData]);
  const availableColumns = useMemo(() => 
    currentData.length > 0 ? Object.keys(currentData[0]) : [], [currentData]);

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    return currentData.filter(item => {
      const itemDate = new Date(item.date);
      const dateInRange = itemDate >= filters.dateRange.start && itemDate <= filters.dateRange.end;
      const regionMatch = filters.regions.length === 0 || filters.regions.includes(item.region);
      const productMatch = filters.products.length === 0 || filters.products.includes(item.product);
      const categoryMatch = filters.categories.length === 0 || filters.categories.includes(item.category);
      
      return dateInRange && regionMatch && productMatch && categoryMatch;
    });
  }, [currentData, filters]);

  // Calculate dynamic metrics from current data
  const dynamicMetrics = useMemo(() => {
    const totalSales = filteredData.reduce((sum, item) => sum + item.sales, 0);
    const avgDailySales = totalSales / (filteredData.length || 1);
    const uniqueCustomers = new Set(filteredData.map(item => item.product)).size * 10; // Approximation
    
    // Calculate growth (compare first half vs second half)
    const sortedData = filteredData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const midpoint = Math.floor(sortedData.length / 2);
    const firstHalf = sortedData.slice(0, midpoint);
    const secondHalf = sortedData.slice(midpoint);
    
    const firstHalfSales = firstHalf.reduce((sum, item) => sum + item.sales, 0);
    const secondHalfSales = secondHalf.reduce((sum, item) => sum + item.sales, 0);
    const growthRate = firstHalfSales > 0 ? ((secondHalfSales - firstHalfSales) / firstHalfSales * 100) : 0;
    
    return [
      {
        title: 'Total Revenue',
        value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(totalSales),
        change: growthRate,
        changeType: growthRate > 0 ? 'positive' as const : growthRate < 0 ? 'negative' as const : 'neutral' as const,
        icon: 'DollarSign',
      },
      {
        title: 'Data Points',
        value: filteredData.length.toLocaleString(),
        change: ((filteredData.length / currentData.length) * 100) - 100,
        changeType: 'neutral' as const,
        icon: 'Users',
      },
      {
        title: 'Avg Daily Sales',
        value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(avgDailySales),
        change: 5.7,
        changeType: 'positive' as const,
        icon: 'TrendingUp',
      },
      {
        title: 'Unique Products',
        value: new Set(filteredData.map(item => item.product)).size.toString(),
        change: 2.1,
        changeType: 'positive' as const,
        icon: 'ShoppingCart',
      },
    ];
  }, [filteredData, currentData]);

  const handleDataUpload = (data: SalesData[], info: DatasetInfo) => {
    setCurrentData(data);
    setDatasetInfo(info);
    setUploadError(null);
    setAiInsights([]); // Clear old insights
    
    // Update date range to match uploaded data if dates are available
    if (data.length > 0) {
      const dates = data.map(item => new Date(item.date)).sort((a, b) => a.getTime() - b.getTime());
      const start = dates[0];
      const end = dates[dates.length - 1];
      
      setFilters(prev => ({
        ...prev,
        dateRange: { start, end },
        regions: [],
        products: [],
        categories: []
      }));
    }
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
  };

  const handleInsightsGenerated = (insights: AIInsight[]) => {
    setAiInsights(insights);
    setActiveTab('insights'); // Switch to insights tab to show results
  };

  const tabs = [
    { id: 'data' as const, label: 'Data & Upload', icon: Database },
    { id: 'charts' as const, label: 'Interactive Charts', icon: BarChart3 },
    { id: 'insights' as const, label: 'AI Insights', icon: Brain },
    { id: 'export' as const, label: 'Export & Share', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Analytics Dashboard</h1>
                <p className="text-sm text-gray-500">
                  Upload CSV data • Generate AI insights • Export reports
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {datasetInfo && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-green-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>{datasetInfo.fileName} ({datasetInfo.rowCount.toLocaleString()} rows)</span>
                </div>
              )}
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <IconComponent className="h-5 w-5" />
                  <span>{tab.label}</span>
                  {tab.id === 'insights' && aiInsights.length > 0 && (
                    <span className="ml-1 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                      {aiInsights.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {uploadError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
            <div className="text-red-600">⚠️</div>
            <div>
              <p className="text-red-800 font-medium">Upload Error</p>
              <p className="text-red-700 text-sm">{uploadError}</p>
            </div>
            <button 
              onClick={() => setUploadError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'data' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* CSV Uploader */}
              <CSVUploader 
                onDataUpload={handleDataUpload}
                onError={handleUploadError}
              />

              {/* Data Preview */}
              {currentData.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Preview</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          {availableColumns.slice(0, 6).map(col => (
                            <th key={col} className="text-left py-2 px-3 font-medium text-gray-700">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.slice(0, 10).map((row, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            {availableColumns.slice(0, 6).map(col => (
                              <td key={col} className="py-2 px-3 text-gray-600">
                                {typeof row[col] === 'number' && col.toLowerCase().includes('sales') ? 
                                  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(row[col]) :
                                  String(row[col])
                                }
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Showing 10 of {filteredData.length.toLocaleString()} filtered records
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <FilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                availableRegions={availableRegions}
                availableProducts={availableProducts}
                availableCategories={availableCategories}
              />
            </div>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-8">
              {/* Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {dynamicMetrics.map((metric, index) => (
                  <MetricCard key={index} metric={metric} />
                ))}
              </div>

              {/* Advanced Charts */}
              <AdvancedCharts 
                data={filteredData}
                availableColumns={availableColumns}
              />

              {/* Classic Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <SalesChart 
                  data={filteredData} 
                  type="line" 
                  title="Sales Trend Over Time" 
                />
                <RegionalChart data={filteredData} />
              </div>
            </div>

            <div className="space-y-6">
              <FilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                availableRegions={availableRegions}
                availableProducts={availableProducts}
                availableCategories={availableCategories}
              />
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* AI Insights Generator */}
              <AIInsightsGenerator
                data={filteredData}
                filters={filters}
                onInsightsGenerated={handleInsightsGenerated}
                existingInsights={aiInsights}
              />

              {/* AI Insights Display */}
              {aiInsights.length > 0 && (
                <AIInsights insights={aiInsights} />
              )}
            </div>

            <div className="space-y-6">
              <FilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                availableRegions={availableRegions}
                availableProducts={availableProducts}
                availableCategories={availableCategories}
              />
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {dynamicMetrics.map((metric, index) => (
                  <MetricCard key={index} metric={metric} />
                ))}
              </div>

              {/* Charts Preview for Export */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <SalesChart 
                  data={filteredData} 
                  type="line" 
                  title="Sales Trend (Export Preview)" 
                />
                <RegionalChart data={filteredData} />
              </div>

              {/* AI Insights for Export */}
              {aiInsights.length > 0 && (
                <AIInsights insights={aiInsights} />
              )}
            </div>

            <div className="space-y-6">
              <ExportPanel 
                filteredData={filteredData}
                metrics={dynamicMetrics}
                insights={aiInsights}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;