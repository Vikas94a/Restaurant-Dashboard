import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Share2, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Recommendation } from '@/types/ai/aiInsights';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onStatusChange?: (id: string, status: 'implemented' | 'dismissed') => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'menu':
      return '🍽️';
    case 'inventory':
      return '📦';
    case 'staffing':
      return '👥';
    case 'promotion':
      return '📢';
    case 'pricing':
      return '💰';
    case 'social_media':
      return '📱';
    default:
      return '💡';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'implemented':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'dismissed':
      return <XCircle className="w-4 h-4 text-red-600" />;
    default:
      return <Clock className="w-4 h-4 text-gray-600" />;
  }
};

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'facebook':
      return '📘';
    case 'instagram':
      return '📷';
    case 'twitter':
      return '🐦';
    default:
      return '📱';
  }
};

const getPlatformColor = (platform: string) => {
  switch (platform) {
    case 'facebook':
      return 'bg-blue-50 border-blue-200 text-blue-800';
    case 'instagram':
      return 'bg-pink-50 border-pink-200 text-pink-800';
    case 'twitter':
      return 'bg-sky-50 border-sky-200 text-sky-800';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800';
  }
};

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onStatusChange
}) => {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const copySocialMediaContent = () => {
    if (recommendation.socialMediaContent) {
      const content = `${recommendation.socialMediaContent.content}\n\n${recommendation.socialMediaContent.hashtags.join(' ')}`;
      copyToClipboard(content);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getCategoryIcon(recommendation.category)}</span>
            <div>
              <CardTitle className="text-lg font-semibold">{recommendation.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getPriorityColor(recommendation.priority)}>
                  {recommendation.priority} priority
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  {getStatusIcon(recommendation.status)}
                  {recommendation.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <p className="text-gray-700 mb-2">{recommendation.description}</p>
          <p className="text-sm text-gray-600 italic">&ldquo;{recommendation.reasoning}&rdquo;</p>
        </div>

        {/* Expected Impact */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Expected Impact</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {recommendation.expectedImpact.revenue && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span>Revenue: +{recommendation.expectedImpact.revenue}%</span>
              </div>
            )}
            {recommendation.expectedImpact.orders && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Orders: +{recommendation.expectedImpact.orders}%</span>
              </div>
            )}
            {recommendation.expectedImpact.efficiency && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span>Efficiency: +{recommendation.expectedImpact.efficiency}%</span>
              </div>
            )}
            {recommendation.expectedImpact.social_engagement && (
              <div className="flex items-center gap-1">
                <Share2 className="w-4 h-4 text-pink-600" />
                <span>Social: +{recommendation.expectedImpact.social_engagement}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Implementation Steps */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Implementation Steps</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            {recommendation.implementation.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>

        {/* Social Media Content */}
        {recommendation.socialMediaContent && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getPlatformIcon(recommendation.socialMediaContent.platform)}</span>
                <h4 className="font-medium text-gray-900">Social Media Content</h4>
                <Badge className={getPlatformColor(recommendation.socialMediaContent.platform)}>
                  {recommendation.socialMediaContent.platform}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copySocialMediaContent}
                className="flex items-center gap-1"
              >
                <Copy className="w-4 h-4" />
                Copy
              </Button>
            </div>
            
            <div className="bg-white p-3 rounded border mb-3">
              <p className="text-sm whitespace-pre-line">{recommendation.socialMediaContent.content}</p>
            </div>
            
            <div className="flex flex-wrap gap-1 mb-2">
              {recommendation.socialMediaContent.hashtags.map((hashtag, index) => (
                <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {hashtag}
                </span>
              ))}
            </div>
            
            {recommendation.socialMediaContent.imageSuggestion && (
              <p className="text-xs text-gray-600">
                <strong>Image suggestion:</strong> {recommendation.socialMediaContent.imageSuggestion}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {onStatusChange && recommendation.status === 'pending' && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(recommendation.id, 'implemented')}
              className="flex items-center gap-1 text-green-700 border-green-200 hover:bg-green-50"
            >
              <CheckCircle className="w-4 h-4" />
              Mark Implemented
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(recommendation.id, 'dismissed')}
              className="flex items-center gap-1 text-red-700 border-red-200 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4" />
              Dismiss
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 