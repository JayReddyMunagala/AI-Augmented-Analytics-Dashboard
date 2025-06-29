import React from 'react';
import { FilterState } from '../types/dashboard';
import { Calendar, MapPin, Package, Tag, X } from 'lucide-react';

interface Props {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableRegions: string[];
  availableProducts: string[];
  availableCategories: string[];
}

export const FilterPanel: React.FC<Props> = ({ 
  filters, 
  onFiltersChange, 
  availableRegions, 
  availableProducts, 
  availableCategories 
}) => {
  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleArrayFilter = (array: string[], value: string) => {
    return array.includes(value) 
      ? array.filter(item => item !== value)
      : [...array, value];
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
        <span>Filters</span>
      </h3>
      
      <div className="space-y-6">
        {/* Date Range */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
            <Calendar className="h-4 w-4" />
            <span>Date Range</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={filters.dateRange.start.toISOString().split('T')[0]}
              onChange={(e) => updateFilters({
                dateRange: { ...filters.dateRange, start: new Date(e.target.value) }
              })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="date"
              value={filters.dateRange.end.toISOString().split('T')[0]}
              onChange={(e) => updateFilters({
                dateRange: { ...filters.dateRange, end: new Date(e.target.value) }
              })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Regions */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
            <MapPin className="h-4 w-4" />
            <span>Regions</span>
          </label>
          <div className="space-y-2">
            {availableRegions.map(region => (
              <label key={region} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.regions.includes(region)}
                  onChange={() => updateFilters({
                    regions: toggleArrayFilter(filters.regions, region)
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{region}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Products */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
            <Package className="h-4 w-4" />
            <span>Products</span>
          </label>
          <div className="space-y-2">
            {availableProducts.map(product => (
              <label key={product} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.products.includes(product)}
                  onChange={() => updateFilters({
                    products: toggleArrayFilter(filters.products, product)
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{product}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
            <Tag className="h-4 w-4" />
            <span>Categories</span>
          </label>
          <div className="space-y-2">
            {availableCategories.map(category => (
              <label key={category} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category)}
                  onChange={() => updateFilters({
                    categories: toggleArrayFilter(filters.categories, category)
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        <button
          onClick={() => updateFilters({
            regions: [],
            products: [],
            categories: []
          })}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
          <span>Clear Filters</span>
        </button>
      </div>
    </div>
  );
};