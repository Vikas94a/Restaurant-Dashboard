"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw,
  Lightbulb,
  Target,
  Clock
} from 'lucide-react';
import { useAIInsights } from '@/hooks/ai/useAIInsights';
import RecommendationCard from './RecommendationCard';
import WeatherInsight from './WeatherInsight';
import EventInsight from './EventInsight';
import DemandPrediction from './DemandPrediction';

interface AIInsightsPanelProps {
  restaurantId: string;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ restaurantId }) => {
  const { 
    data, 
    loading, 
    error, 
    refreshData, 
    updateRecommendationStatus,
    getHighPriorityRecommendations,
    getWeatherInsights,
    getEventInsights,
    getDemandInsights
  } = useAIInsights(restaurantId);

  const [activeTab, setActiveTab] = useState<'insights' | 'recommendations' | 'predictions'>('insights');

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading AI insights...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          <span>Error: {error}</span>
        </div>
        <Button onClick={refreshData} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          No AI insights available
        </div>
      </Card>
    );
  }

  const highPriorityRecommendations = getHighPriorityRecommendations();
  const weatherInsights = getWeatherInsights();
  const eventInsights = getEventInsights();
  const demandInsights = getDemandInsights();

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Brain className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI-Powered Insights</h2>
            <p className="text-sm text-gray-600">
              Last updated: {new Date(data.lastUpdated).toLocaleString()}
            </p>
          </div>
        </div>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Lightbulb className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Insights</p>
              <p className="text-xl font-semibold">{data.insights.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Recommendations</p>
              <p className="text-xl font-semibold">{data.recommendations.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-xl font-semibold">{highPriorityRecommendations.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Predictions</p>
              <p className="text-xl font-semibold">{data.predictions.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeTab === 'insights' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('insights')}
          className="flex-1"
        >
          <Lightbulb className="w-4 h-4 mr-2" />
          Insights
        </Button>
        <Button
          variant={activeTab === 'recommendations' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('recommendations')}
          className="flex-1"
        >
          <Target className="w-4 h-4 mr-2" />
          Recommendations
        </Button>
        <Button
          variant={activeTab === 'predictions' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('predictions')}
          className="flex-1"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Predictions
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          {weatherInsights.map((insight) => (
            <WeatherInsight key={insight.id} insight={insight} />
          ))}
          
          {eventInsights.map((insight) => (
            <EventInsight key={insight.id} insight={insight} />
          ))}
          
          {demandInsights.map((insight) => (
            <div key={insight.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-medium text-gray-900">{insight.title}</h3>
                    <Badge className={getImpactColor(insight.impact)}>
                      {insight.impact} impact
                    </Badge>
                    <Badge variant="outline">{insight.confidence}% confidence</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}

          {data.insights.length === 0 && (
            <Card className="p-6 text-center text-gray-500">
              No insights available at the moment
            </Card>
          )}
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          {data.recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onStatusUpdate={updateRecommendationStatus}
            />
          ))}

          {data.recommendations.length === 0 && (
            <Card className="p-6 text-center text-gray-500">
              No recommendations available at the moment
            </Card>
          )}
        </div>
      )}

      {activeTab === 'predictions' && (
        <div className="space-y-4">
          {data.predictions.map((prediction) => (
            <DemandPrediction key={prediction.date} prediction={prediction} />
          ))}

          {data.predictions.length === 0 && (
            <Card className="p-6 text-center text-gray-500">
              No predictions available at the moment
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default AIInsightsPanel; 