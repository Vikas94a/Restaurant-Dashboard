"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Cloud, Thermometer, Droplets, Wind } from 'lucide-react';
import { AIInsight } from '@/types/ai/aiInsights';

interface WeatherInsightProps {
  insight: AIInsight;
}

const WeatherInsight: React.FC<WeatherInsightProps> = ({ insight }) => {
  const weatherData = insight.data.weatherData;
  
  if (!weatherData) {
    return null;
  }

  const getWeatherIcon = (conditions: string) => {
    const condition = conditions.toLowerCase();
    if (condition.includes('sunny')) return '☀️';
    if (condition.includes('cloudy')) return '☁️';
    if (condition.includes('rainy')) return '🌧️';
    if (condition.includes('snowy')) return '❄️';
    return '🌤️';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWeatherAdvice = (conditions: string, temperature: number) => {
    const condition = conditions.toLowerCase();
    const advice = [];

    if (condition.includes('rainy') || condition.includes('snowy')) {
      advice.push('Consider delivery promotions');
      advice.push('Highlight comfort food items');
      advice.push('Increase delivery staff if needed');
    }

    if (temperature < 10) {
      advice.push('Promote hot beverages and warm meals');
      advice.push('Consider indoor dining specials');
    }

    if (temperature > 25) {
      advice.push('Promote cold beverages and light meals');
      advice.push('Consider outdoor seating promotions');
    }

    return advice;
  };

  const advice = getWeatherAdvice(weatherData.conditions, weatherData.temperature);

  return (
    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Cloud className="w-5 h-5 text-blue-600" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-medium text-gray-900">{insight.title}</h3>
            <Badge className={getImpactColor(insight.impact)}>
              {insight.impact} impact
            </Badge>
            <Badge variant="outline">{insight.confidence}% confidence</Badge>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">{insight.description}</p>

          {/* Weather Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="flex items-center space-x-2 p-2 bg-white rounded-lg">
              <span className="text-lg">{getWeatherIcon(weatherData.conditions)}</span>
              <div>
                <p className="text-xs text-gray-600">Conditions</p>
                <p className="text-sm font-medium">{weatherData.conditions}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-2 bg-white rounded-lg">
              <Thermometer className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-xs text-gray-600">Temperature</p>
                <p className="text-sm font-medium">{weatherData.temperature}°C</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-2 bg-white rounded-lg">
              <Droplets className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs text-gray-600">Humidity</p>
                <p className="text-sm font-medium">{weatherData.humidity}%</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 p-2 bg-white rounded-lg">
              <Wind className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-600">Wind</p>
                <p className="text-sm font-medium">{weatherData.windSpeed} km/h</p>
              </div>
            </div>
          </div>

          {/* Weather Advice */}
          {advice.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Suggested Actions</h4>
              <ul className="space-y-1">
                {advice.map((item, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                    <span className="flex-shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherInsight; 