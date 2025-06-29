import React from 'react';
import { AIInsight } from '../types/dashboard';
import { Brain, TrendingUp, AlertTriangle, Target, Clock } from 'lucide-react';

interface Props {
  insights: AIInsight[];
}

const getInsightIcon = (type: AIInsight['type']) => {
  switch (type) {
    case 'trend': return TrendingUp;
    case 'warning': return AlertTriangle;
    case 'opportunity': return Target;
    case 'anomaly': return Brain;
    default: return Brain;
  }
};

const getInsightColor = (type: AIInsight['type']) => {
  switch (type) {
    case 'trend': return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'warning': return 'bg-red-50 text-red-600 border-red-200';
    case 'opportunity': return 'bg-green-50 text-green-600 border-green-200';
    case 'anomaly': return 'bg-purple-50 text-purple-600 border-purple-200';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

export const AIInsights: React.FC<Props> = ({ insights }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Brain className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI-Generated Insights</h3>
      </div>
      
      <div className="space-y-4">
        {insights.map((insight) => {
          const IconComponent = getInsightIcon(insight.type);
          const colorClasses = getInsightColor(insight.type);
          
          return (
            <div key={insight.id} className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg border ${colorClasses}`}>
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {insight.title}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded-full">
                        {insight.confidence}% confidence
                      </span>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{insight.timestamp}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {insight.summary}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};