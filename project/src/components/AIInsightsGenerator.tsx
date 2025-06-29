import React, { useState } from 'react';
import { Brain, Sparkles, Loader2, TrendingUp, AlertTriangle, Target, Eye, RefreshCw } from 'lucide-react';
import { SalesData, AIInsight } from '../types/dashboard';
import { useOpenAI } from '../hooks/useOpenAI';

interface Props {
  data: SalesData[];
  filters: any;
  onInsightsGenerated: (insights: AIInsight[]) => void;
  existingInsights: AIInsight[];
}

export const AIInsightsGenerator: React.FC<Props> = ({ 
  data, 
  filters, 
  onInsightsGenerated, 
  existingInsights 
}) => {
  const { generateInsights, isGenerating, error } = useOpenAI();
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const handleGenerateInsights = async () => {
    if (data.length === 0) {
      alert('No data available. Please upload a CSV file first.');
      return;
    }

    try {
      const response = await generateInsights(data, filters);
      
      if (response) {
        // Create AI insights from the OpenAI response
        const newInsights: AIInsight[] = [
          {
            id: `ai-${Date.now()}-1`,
            title: 'Executive Summary',
            summary: response.summary,
            confidence: 95,
            type: 'trend',
            timestamp: 'Just now'
          },
          {
            id: `ai-${Date.now()}-2`,
            title: 'Detailed Analysis',
            summary: response.insights,
            confidence: 92,
            type: 'opportunity',
            timestamp: 'Just now'
          }
        ];

        // Add recommendations as separate insights
        response.recommendations.forEach((rec, index) => {
          newInsights.push({
            id: `ai-${Date.now()}-${index + 3}`,
            title: `Recommendation ${index + 1}`,
            summary: rec,
            confidence: 88,
            type: index % 2 === 0 ? 'opportunity' : 'warning',
            timestamp: 'Just now'
          });
        });

        onInsightsGenerated(newInsights);
        setLastGenerated(new Date());
      }
    } catch (err) {
      console.error('Failed to generate insights:', err);
    }
  };

  const formatDataStats = () => {
    const totalSales = data.reduce((sum, item) => sum + item.sales, 0);
    const uniqueRegions = new Set(data.map(item => item.region)).size;
    const uniqueProducts = new Set(data.map(item => item.product)).size;
    
    return {
      totalSales: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(totalSales),
      records: data.length.toLocaleString(),
      regions: uniqueRegions,
      products: uniqueProducts
    };
  };

  const stats = formatDataStats();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI-Powered Insights</h3>
        </div>
        {lastGenerated && (
          <span className="text-xs text-gray-500">
            Last updated: {lastGenerated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Data Overview */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
        <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center space-x-2">
          <Eye className="h-4 w-4" />
          <span>Current Dataset Overview</span>
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-blue-900">{stats.totalSales}</p>
            <p className="text-xs text-blue-600">Total Sales</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-900">{stats.records}</p>
            <p className="text-xs text-blue-600">Records</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-900">{stats.regions}</p>
            <p className="text-xs text-blue-600">Regions</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-900">{stats.products}</p>
            <p className="text-xs text-blue-600">Products</p>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="text-center mb-6">
        <button
          onClick={handleGenerateInsights}
          disabled={isGenerating || data.length === 0}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
        >
          {isGenerating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
          <span className="text-lg">
            {isGenerating ? 'Generating Insights...' : 'Generate AI Summary'}
          </span>
        </button>
        
        {existingInsights.length > 0 && !isGenerating && (
          <button
            onClick={handleGenerateInsights}
            className="ml-3 inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        )}
        
        <p className="text-sm text-gray-500 mt-2">
          Powered by OpenAI GPT-4 • Analyzes {stats.records} data points
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
          {error.includes('API key') && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Setup Required:</strong> To enable AI insights, you need to:
              </p>
              <ol className="list-decimal list-inside text-sm text-yellow-700 mt-1 space-y-1">
                <li>Get an OpenAI API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com</a></li>
                <li>Add it to your environment variables as <code className="bg-yellow-100 px-1 rounded">VITE_OPENAI_API_KEY</code></li>
                <li>Restart your development server</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div>
              <p className="text-blue-800 font-medium">Analyzing your data with AI...</p>
              <p className="text-blue-600 text-sm">This may take 10-30 seconds</p>
            </div>
          </div>
          <div className="mt-4 bg-blue-100 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              🤖 AI is examining {stats.records} records across {stats.regions} regions and {stats.products} products
            </p>
          </div>
        </div>
      )}

      {/* Existing Insights Preview */}
      {existingInsights.length > 0 && !isGenerating && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Latest AI Insights ({existingInsights.length})</span>
          </h4>
          {existingInsights.slice(0, 3).map((insight) => (
            <div key={insight.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-sm font-medium text-gray-900">{insight.title}</h5>
                <span className="text-xs text-gray-500">{insight.confidence}% confidence</span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">
                {insight.summary.length > 150 ? 
                  `${insight.summary.substring(0, 150)}...` : 
                  insight.summary
                }
              </p>
            </div>
          ))}
          {existingInsights.length > 3 && (
            <p className="text-xs text-gray-500 text-center">
              And {existingInsights.length - 3} more insights...
            </p>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">💡 AI Analysis Tips</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Apply filters to focus AI analysis on specific segments</li>
          <li>• Larger datasets (1000+ records) provide more accurate insights</li>
          <li>• Include time-series data for trend analysis</li>
          <li>• Ensure your CSV has clear column names (sales, revenue, date, etc.)</li>
        </ul>
      </div>
    </div>
  );
};