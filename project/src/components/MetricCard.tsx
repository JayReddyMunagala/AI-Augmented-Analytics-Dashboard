import React from 'react';
import { MetricCard as MetricCardType } from '../types/dashboard';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface Props {
  metric: MetricCardType;
}

const iconMap = {
  DollarSign,
  Users,
  TrendingUp,
  ShoppingCart,
};

export const MetricCard: React.FC<Props> = ({ metric }) => {
  const IconComponent = iconMap[metric.icon as keyof typeof iconMap] || TrendingUp;
  
  const getChangeIcon = () => {
    if (metric.changeType === 'positive') return ArrowUp;
    if (metric.changeType === 'negative') return ArrowDown;
    return Minus;
  };
  
  const getChangeColor = () => {
    if (metric.changeType === 'positive') return 'text-green-600 bg-green-50';
    if (metric.changeType === 'negative') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };
  
  const ChangeIcon = getChangeIcon();
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <IconComponent className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{metric.title}</p>
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
          </div>
        </div>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getChangeColor()}`}>
          <ChangeIcon className="h-3 w-3" />
          <span>{Math.abs(metric.change)}%</span>
        </div>
      </div>
    </div>
  );
};