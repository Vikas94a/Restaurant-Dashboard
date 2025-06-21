"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, BarChart3, Calendar } from 'lucide-react';
import { DemandPrediction as DemandPredictionType } from '@/types/ai/aiInsights';

interface DemandPredictionProps {
  prediction: DemandPredictionType;
}

const DemandPrediction: React.FC<DemandPredictionProps> = ({ prediction }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getFactorColor = (factor: number) => {
    if (factor >= 1.2) return 'text-green-600';
    if (factor >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFactorIcon = (factor: number) => {
    if (factor >= 1.2) return '↗️';
    if (factor >= 0.8) return '→';
    return '↘️';
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <TrendingUp className="w-5 h-5 text-purple-600" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <h3 className="font-medium text-gray-900">{formatDate(prediction.date)}</h3>
            </div>
            <Badge className={getConfidenceColor(prediction.confidence)}>
              {prediction.confidence}% confidence
            </Badge>
          </div>

          {/* Main Predictions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Predicted Orders</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{prediction.predictedOrders}</p>
              <p className="text-xs text-gray-600">orders expected</p>
            </div>

            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-900">Predicted Revenue</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{prediction.predictedRevenue.toFixed(0)} kr</p>
              <p className="text-xs text-gray-600">revenue expected</p>
            </div>
          </div>

          {/* Contributing Factors */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Contributing Factors</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-xs text-gray-600">Weather</span>
                <div className="flex items-center space-x-1">
                  <span className="text-xs">{getFactorIcon(prediction.factors.weather)}</span>
                  <span className={`text-xs font-medium ${getFactorColor(prediction.factors.weather)}`}>
                    {(prediction.factors.weather * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-xs text-gray-600">Events</span>
                <div className="flex items-center space-x-1">
                  <span className="text-xs">{getFactorIcon(prediction.factors.events)}</span>
                  <span className={`text-xs font-medium ${getFactorColor(prediction.factors.events)}`}>
                    {(prediction.factors.events * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-xs text-gray-600">Historical</span>
                <div className="flex items-center space-x-1">
                  <span className="text-xs">{getFactorIcon(prediction.factors.historical)}</span>
                  <span className={`text-xs font-medium ${getFactorColor(prediction.factors.historical)}`}>
                    {(prediction.factors.historical * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-xs text-gray-600">Seasonal</span>
                <div className="flex items-center space-x-1">
                  <span className="text-xs">{getFactorIcon(prediction.factors.seasonal)}</span>
                  <span className={`text-xs font-medium ${getFactorColor(prediction.factors.seasonal)}`}>
                    {(prediction.factors.seasonal * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations based on prediction */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendations</h4>
            <ul className="space-y-1">
              {prediction.predictedOrders > 50 && (
                <li className="flex items-start space-x-2 text-sm text-gray-600">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></span>
                  <span>High demand expected - increase staff scheduling</span>
                </li>
              )}
              {prediction.predictedOrders < 20 && (
                <li className="flex items-start space-x-2 text-sm text-gray-600">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2"></span>
                  <span>Low demand expected - consider promotional offers</span>
                </li>
              )}
              {prediction.factors.weather < 0.7 && (
                <li className="flex items-start space-x-2 text-sm text-gray-600">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                  <span>Weather may impact business - focus on delivery options</span>
                </li>
              )}
              {prediction.factors.events > 1.2 && (
                <li className="flex items-start space-x-2 text-sm text-gray-600">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></span>
                  <span>Events may boost demand - prepare additional inventory</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DemandPrediction; 