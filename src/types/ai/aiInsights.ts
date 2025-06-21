export interface WeatherData {
  date: string;
  temperature: number;
  conditions: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
}

export interface CalendarEvent {
  id: string;
  date: string;
  eventName: string;
  eventType: 'holiday' | 'local_event' | 'sports' | 'cultural' | 'other';
  expectedImpact: 'high' | 'medium' | 'low';
  location: string;
  description?: string;
}

export interface AIInsight {
  id: string;
  type: 'weather' | 'event' | 'demand' | 'inventory' | 'promotion';
  title: string;
  description: string;
  confidence: number; // 0-100
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  createdAt: string;
  data: {
    weatherData?: WeatherData;
    events?: CalendarEvent[];
    historicalData?: any;
    predictions?: any;
  };
}

export interface Recommendation {
  id: string;
  category: 'menu' | 'inventory' | 'staffing' | 'promotion' | 'pricing' | 'social_media';
  title: string;
  description: string;
  reasoning: string;
  expectedImpact: {
    revenue?: number;
    orders?: number;
    efficiency?: number;
    social_engagement?: number;
  };
  implementation: string[];
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  status: 'pending' | 'implemented' | 'dismissed';
  socialMediaContent?: {
    platform: 'facebook' | 'instagram' | 'twitter';
    content: string;
    hashtags: string[];
    imageSuggestion?: string;
  };
}

export interface DemandPrediction {
  date: string;
  predictedOrders: number;
  predictedRevenue: number;
  confidence: number;
  factors: {
    weather: number;
    events: number;
    historical: number;
    seasonal: number;
  };
}

export interface AIAnalyticsData {
  insights: AIInsight[];
  recommendations: Recommendation[];
  predictions: DemandPrediction[];
  weatherData: WeatherData[];
  events: CalendarEvent[];
  lastUpdated: string;
} 