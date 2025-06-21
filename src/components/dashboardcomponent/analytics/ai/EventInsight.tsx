"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, TrendingUp } from 'lucide-react';
import { AIInsight } from '@/types/ai/aiInsights';

interface EventInsightProps {
  insight: AIInsight;
}

const EventInsight: React.FC<EventInsightProps> = ({ insight }) => {
  const events = insight.data.events;
  
  if (!events || events.length === 0) {
    return null;
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'holiday': return '🎉';
      case 'local_event': return '🎪';
      case 'sports': return '⚽';
      case 'cultural': return '🎭';
      default: return '📅';
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'holiday': return 'bg-red-100 text-red-800';
      case 'local_event': return 'bg-blue-100 text-blue-800';
      case 'sports': return 'bg-green-100 text-green-800';
      case 'cultural': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getEventAdvice = (eventType: string, expectedImpact: string) => {
    const advice = [];

    switch (eventType) {
      case 'holiday':
        advice.push('Increase staff scheduling');
        advice.push('Prepare holiday-themed menu items');
        advice.push('Consider special holiday promotions');
        break;
      case 'local_event':
        advice.push('Stock up on popular items');
        advice.push('Consider event-specific menu items');
        advice.push('Increase delivery capacity');
        break;
      case 'sports':
        advice.push('Prepare game-day specials');
        advice.push('Increase beverage inventory');
        advice.push('Consider late-night delivery options');
        break;
      case 'cultural':
        advice.push('Add culturally themed menu items');
        advice.push('Consider special pricing for event attendees');
        break;
    }

    if (expectedImpact === 'high') {
      advice.push('Increase overall inventory by 30%');
      advice.push('Extend operating hours if possible');
    }

    return advice;
  };

  return (
    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Calendar className="w-5 h-5 text-purple-600" />
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

          {/* Events List */}
          <div className="space-y-3 mb-3">
            {events.map((event) => {
              const advice = getEventAdvice(event.eventType, event.expectedImpact);
              
              return (
                <div key={event.id} className="p-3 bg-white rounded-lg border border-purple-100">
                  <div className="flex items-start space-x-3">
                    <span className="text-xl">{getEventIcon(event.eventType)}</span>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{event.eventName}</h4>
                        <Badge className={getEventTypeColor(event.eventType)}>
                          {event.eventType.replace('_', ' ')}
                        </Badge>
                        <Badge className={getImpactColor(event.expectedImpact)}>
                          {event.expectedImpact} impact
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                      
                      {event.description && (
                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                      )}

                      {/* Event-specific advice */}
                      {advice.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-gray-900 mb-1">Suggested Actions</h5>
                          <ul className="space-y-1">
                            {advice.slice(0, 3).map((item, index) => (
                              <li key={index} className="flex items-start space-x-2 text-xs text-gray-600">
                                <span className="flex-shrink-0 w-1 h-1 bg-purple-500 rounded-full mt-1.5"></span>
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
            })}
          </div>

          {/* General Event Advice */}
          <div className="bg-white p-3 rounded-lg border border-purple-100">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <h4 className="text-sm font-medium text-gray-900">Business Impact</h4>
            </div>
            <ul className="space-y-1">
              <li className="flex items-start space-x-2 text-sm text-gray-600">
                <span className="flex-shrink-0 w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></span>
                <span>Expect increased customer traffic during event times</span>
              </li>
              <li className="flex items-start space-x-2 text-sm text-gray-600">
                <span className="flex-shrink-0 w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></span>
                <span>Consider event-specific promotions and menu items</span>
              </li>
              <li className="flex items-start space-x-2 text-sm text-gray-600">
                <span className="flex-shrink-0 w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></span>
                <span>Prepare for potential delivery surge during events</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventInsight; 