"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  Lightbulb,
  DollarSign,
  Users,
  ChevronUp,
  ChevronDown,
  ShoppingCart,
  Star
} from 'lucide-react';
import { Recommendation } from '@/types/ai/aiInsights';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onStatusUpdate: (id: string, status: 'implemented' | 'dismissed') => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ 
  recommendation, 
  onStatusUpdate 
}) => {
  const [expanded, setExpanded] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'menu': return <Target className="w-5 h-5" />;
      case 'inventory': return <ShoppingCart className="w-5 h-5" />;
      case 'staffing': return <Users className="w-5 h-5" />;
      case 'promotion': return <TrendingUp className="w-5 h-5" />;
      case 'pricing': return <DollarSign className="w-5 h-5" />;
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'menu': return 'bg-blue-100 text-blue-600';
      case 'inventory': return 'bg-green-100 text-green-600';
      case 'staffing': return 'bg-purple-100 text-purple-600';
      case 'promotion': return 'bg-orange-100 text-orange-600';
      case 'pricing': return 'bg-yellow-100 text-yellow-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented': return <CheckCircle className="w-4 h-4" />;
      case 'dismissed': return <XCircle className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  return (
    <Card className={`p-4 transition-all duration-200 ${expanded ? 'ring-2 ring-blue-200' : ''}`}>
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-lg ${getCategoryColor(recommendation.category)}`}>
          {getCategoryIcon(recommendation.category)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">{recommendation.title}</h3>
              <div className="flex items-center space-x-2 mb-2">
                <Badge className={getPriorityColor(recommendation.priority)}>
                  {recommendation.priority} priority
                </Badge>
                <Badge className={getStatusColor(recommendation.status)}>
                  <span className="flex items-center space-x-1">
                    {getStatusIcon(recommendation.status)}
                    <span>{recommendation.status}</span>
                  </span>
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {recommendation.category}
                </Badge>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="ml-2"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>

          {expanded && (
            <div className="space-y-4 pt-3 border-t border-gray-200">
              {/* Reasoning */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Reasoning</h4>
                <p className="text-sm text-gray-600">{recommendation.reasoning}</p>
              </div>

              {/* Expected Impact */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Expected Impact</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {recommendation.expectedImpact.revenue && (
                    <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-600">Revenue</p>
                        <p className="text-sm font-medium text-green-700">+{recommendation.expectedImpact.revenue}%</p>
                      </div>
                    </div>
                  )}
                  {recommendation.expectedImpact.orders && (
                    <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-600">Orders</p>
                        <p className="text-sm font-medium text-blue-700">+{recommendation.expectedImpact.orders}%</p>
                      </div>
                    </div>
                  )}
                  {recommendation.expectedImpact.efficiency && (
                    <div className="flex items-center space-x-2 p-2 bg-purple-50 rounded-lg">
                      <Star className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-xs text-gray-600">Efficiency</p>
                        <p className="text-sm font-medium text-purple-700">+{recommendation.expectedImpact.efficiency}%</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Implementation Steps */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Implementation Steps</h4>
                <ul className="space-y-1">
                  {recommendation.implementation.map((step, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              {recommendation.status === 'pending' && (
                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => onStatusUpdate(recommendation.id, 'implemented')}
                    className="flex items-center space-x-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Implement</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusUpdate(recommendation.id, 'dismissed')}
                    className="flex items-center space-x-1"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Dismiss</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default RecommendationCard; 