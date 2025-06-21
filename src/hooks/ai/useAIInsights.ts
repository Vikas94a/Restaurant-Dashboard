"use client";

import { useState, useEffect, useCallback } from 'react';
import { AIInsight, Recommendation, AIAnalyticsData } from '@/types/ai/aiInsights';
import { aiAnalysisService } from '@/services/ai/aiAnalysisService';
import { weatherService } from '@/services/weather/weatherService';
import { calendarService } from '@/services/calendar/calendarService';

export const useAIInsights = (restaurantId: string) => {
  const [data, setData] = useState<AIAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [insights, recommendations, predictions, weatherData, events] = await Promise.all([
        aiAnalysisService.generateInsights(restaurantId),
        aiAnalysisService.generateRecommendations(restaurantId),
        aiAnalysisService.predictDemand(restaurantId, 7),
        weatherService.getWeatherForecast(undefined, undefined, undefined, 7), // Will get location from restaurant details
        calendarService.getUpcomingEvents(7)
      ]);

      const analyticsData: AIAnalyticsData = {
        insights,
        recommendations,
        predictions,
        weatherData,
        events,
        lastUpdated: new Date().toISOString()
      };

      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch AI insights');
      console.error('Error fetching AI insights:', err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  const refreshData = () => {
    fetchAllData();
  };

  const updateRecommendationStatus = (recommendationId: string, status: 'implemented' | 'dismissed') => {
    if (data) {
      setData({
        ...data,
        recommendations: data.recommendations.map(rec =>
          rec.id === recommendationId ? { ...rec, status } : rec
        )
      });
    }
  };

  const getInsightsByType = (type: AIInsight['type']) => {
    return data?.insights.filter(insight => insight.type === type) || [];
  };

  const getRecommendationsByCategory = (category: Recommendation['category']) => {
    return data?.recommendations.filter(rec => rec.category === category) || [];
  };

  const getHighPriorityRecommendations = () => {
    return data?.recommendations.filter(rec => rec.priority === 'high') || [];
  };

  const getWeatherInsights = () => {
    return getInsightsByType('weather');
  };

  const getEventInsights = () => {
    return getInsightsByType('event');
  };

  const getDemandInsights = () => {
    return getInsightsByType('demand');
  };

  useEffect(() => {
    if (restaurantId) {
      fetchAllData();
    }
  }, [restaurantId, fetchAllData]);

  return {
    data,
    loading,
    error,
    refreshData,
    updateRecommendationStatus,
    getInsightsByType,
    getRecommendationsByCategory,
    getHighPriorityRecommendations,
    getWeatherInsights,
    getEventInsights,
    getDemandInsights
  };
}; 