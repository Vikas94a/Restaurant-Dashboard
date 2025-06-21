import { AIInsight, Recommendation, DemandPrediction } from '@/types/ai/aiInsights';
import { weatherService } from '@/services/weather/weatherService';
import { calendarService } from '@/services/calendar/calendarService';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';

const AI_API_KEY = process.env.AI_API_KEY;

interface OrderData {
  id: string;
  createdAt: string;
  status: string;
  items: Array<{
    itemName: string;
    categoryName: string;
    itemPrice: number;
    quantity: number;
  }>;
  total: number;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
  };
}

interface HistoricalAnalysis {
  totalOrders: number;
  averageOrderValue: number;
  peakHours: string[];
  popularItems: Array<{ name: string; orders: number; revenue: number }>;
  seasonalTrends: {
    winter: { orders: number; revenue: number };
    spring: { orders: number; revenue: number };
    summer: { orders: number; revenue: number };
    autumn: { orders: number; revenue: number };
  };
  dayOfWeekPattern: Record<string, number>;
  monthlyTrends: Record<string, { orders: number; revenue: number }>;
  categoryPerformance: Record<string, { orders: number; revenue: number }>;
}

interface AIAnalysisRequest {
  restaurantData: {
    name: string;
    location: string;
    type: string;
  };
  historicalData: HistoricalAnalysis;
  weatherData: {
    current: any;
    forecast: any[];
  };
  eventsData: any[];
  businessContext: {
    currentHour: number;
    currentDay: string;
    currentSeason: string;
  };
}

interface AIRecommendation {
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
  socialMediaContent?: {
    platform: 'facebook' | 'instagram' | 'twitter';
    content: string;
    hashtags: string[];
    imageSuggestion?: string;
  };
}

export class AIAnalysisService {
  private static instance: AIAnalysisService;
  private cache: Map<string, unknown> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  static getInstance(): AIAnalysisService {
    if (!AIAnalysisService.instance) {
      AIAnalysisService.instance = new AIAnalysisService();
    }
    return AIAnalysisService.instance;
  }

  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  private async getRestaurantLocation(restaurantId: string): Promise<{ streetName?: string; city?: string; zipCode?: string }> {
    try {
      const restaurantDoc = await getDoc(doc(db, "restaurants", restaurantId));
      if (restaurantDoc.exists()) {
        const data = restaurantDoc.data();
        return {
          streetName: data.streetName,
          city: data.city,
          zipCode: data.zipCode
        };
      }
      return {};
    } catch (error) {
      console.error('Error fetching restaurant location:', error);
      return {};
    }
  }

  private async getRestaurantDetails(restaurantId: string): Promise<{ name: string; type: string; location: string }> {
    try {
      const restaurantDoc = await getDoc(doc(db, "restaurants", restaurantId));
      if (restaurantDoc.exists()) {
        const data = restaurantDoc.data();
        return {
          name: data.name || data.restaurantType || 'Restaurant',
          type: data.restaurantType || 'Restaurant',
          location: `${data.streetName || ''}, ${data.city || ''}, ${data.zipCode || ''}`.trim()
        };
      }
      return { name: 'Restaurant', type: 'Restaurant', location: 'Unknown' };
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
      return { name: 'Restaurant', type: 'Restaurant', location: 'Unknown' };
    }
  }

  private async fetchOrdersFromLast3Months(restaurantId: string): Promise<OrderData[]> {
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const ordersRef = collection(db, 'restaurants', restaurantId, 'orders');
      const q = query(
        ordersRef,
        where('createdAt', '>=', threeMonthsAgo.toISOString()),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const orders: OrderData[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          createdAt: data.createdAt,
          status: data.status,
          items: data.items || [],
          total: data.total || 0,
          customerDetails: data.customerDetails || {}
        });
      });
      
      return orders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  private analyzeOrdersData(orders: OrderData[]): HistoricalAnalysis {
    if (orders.length === 0) {
      // Return default analysis if no orders
      return {
        totalOrders: 0,
        averageOrderValue: 0,
        peakHours: [],
        popularItems: [],
        seasonalTrends: {
          winter: { orders: 0, revenue: 0 },
          spring: { orders: 0, revenue: 0 },
          summer: { orders: 0, revenue: 0 },
          autumn: { orders: 0, revenue: 0 }
        },
        dayOfWeekPattern: {
          monday: 0, tuesday: 0, wednesday: 0, thursday: 0, 
          friday: 0, saturday: 0, sunday: 0
        },
        monthlyTrends: {},
        categoryPerformance: {}
      };
    }

    // Calculate basic metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalRevenue / totalOrders;

    // Analyze peak hours
    const hourCounts: Record<number, number> = {};
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const hour = orderDate.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00-${parseInt(hour) + 1}:00`);

    // Analyze popular items
    const itemCounts: Record<string, { orders: number; revenue: number }> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const key = item.itemName;
        if (!itemCounts[key]) {
          itemCounts[key] = { orders: 0, revenue: 0 };
        }
        itemCounts[key].orders += item.quantity;
        itemCounts[key].revenue += item.itemPrice * item.quantity;
      });
    });

    const popularItems = Object.entries(itemCounts)
      .sort(([,a], [,b]) => b.orders - a.orders)
      .slice(0, 5)
      .map(([name, data]) => ({ name, orders: data.orders, revenue: data.revenue }));

    // Analyze seasonal trends
    const seasonalData = {
      winter: { orders: 0, revenue: 0 },
      spring: { orders: 0, revenue: 0 },
      summer: { orders: 0, revenue: 0 },
      autumn: { orders: 0, revenue: 0 }
    };

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const month = orderDate.getMonth();
      const season = month >= 2 && month <= 4 ? 'spring' :
                    month >= 5 && month <= 7 ? 'summer' :
                    month >= 8 && month <= 10 ? 'autumn' : 'winter';
      
      seasonalData[season].orders += 1;
      seasonalData[season].revenue += order.total;
    });

    // Analyze day of week patterns
    const dayOfWeekPattern: Record<string, number> = {
      monday: 0, tuesday: 0, wednesday: 0, thursday: 0, 
      friday: 0, saturday: 0, sunday: 0
    };

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const dayName = orderDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      dayOfWeekPattern[dayName] = (dayOfWeekPattern[dayName] || 0) + 1;
    });

    // Analyze monthly trends
    const monthlyTrends: Record<string, { orders: number; revenue: number }> = {};
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const monthKey = orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      if (!monthlyTrends[monthKey]) {
        monthlyTrends[monthKey] = { orders: 0, revenue: 0 };
      }
      monthlyTrends[monthKey].orders += 1;
      monthlyTrends[monthKey].revenue += order.total;
    });

    // Analyze category performance
    const categoryPerformance: Record<string, { orders: number; revenue: number }> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const category = item.categoryName;
        if (!categoryPerformance[category]) {
          categoryPerformance[category] = { orders: 0, revenue: 0 };
        }
        categoryPerformance[category].orders += item.quantity;
        categoryPerformance[category].revenue += item.itemPrice * item.quantity;
      });
    });

    return {
      totalOrders,
      averageOrderValue,
      peakHours,
      popularItems,
      seasonalTrends: seasonalData,
      dayOfWeekPattern,
      monthlyTrends,
      categoryPerformance
    };
  }

  private async getAIRecommendations(analysisData: AIAnalysisRequest): Promise<AIRecommendation[]> {
    if (!AI_API_KEY) {
      console.warn('No AI API key provided, using fallback recommendations');
      return this.getFallbackRecommendations(analysisData);
    }

    try {
      const prompt = this.buildAIPrompt(analysisData);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert restaurant business consultant and social media strategist. Analyze the provided data and give actionable recommendations including social media content suggestions.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('No response from AI API');
      }

      return this.parseAIResponse(aiResponse, analysisData);
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      return this.getFallbackRecommendations(analysisData);
    }
  }

  private buildAIPrompt(analysisData: AIAnalysisRequest): string {
    const { restaurantData, historicalData, weatherData, eventsData, businessContext } = analysisData;
    
    return `
Analyze this restaurant data and provide 5-7 actionable recommendations including social media content suggestions.

RESTAURANT INFO:
- Name: ${restaurantData.name}
- Type: ${restaurantData.type}
- Location: ${restaurantData.location}

BUSINESS PERFORMANCE (Last 3 months):
- Total Orders: ${historicalData.totalOrders}
- Average Order Value: ${historicalData.averageOrderValue.toFixed(2)} kr
- Peak Hours: ${historicalData.peakHours.join(', ')}
- Top Selling Items: ${historicalData.popularItems.map(item => `${item.name} (${item.orders} orders)`).join(', ')}
- Best Performing Category: ${Object.entries(historicalData.categoryPerformance).sort(([,a], [,b]) => b.revenue - a.revenue)[0]?.[0] || 'N/A'}

CURRENT CONTEXT:
- Current Hour: ${businessContext.currentHour}:00
- Current Day: ${businessContext.currentDay}
- Current Season: ${businessContext.currentSeason}
- Weather: ${weatherData.current.conditions}, ${weatherData.current.temperature}°C
- Upcoming Events: ${eventsData.length} events in next 7 days

Provide recommendations in this JSON format:
[
  {
    "category": "menu|inventory|staffing|promotion|pricing|social_media",
    "title": "Recommendation title",
    "description": "Detailed description",
    "reasoning": "Why this recommendation",
    "expectedImpact": {
      "revenue": 15,
      "orders": 20,
      "efficiency": 10,
      "social_engagement": 25
    },
    "implementation": ["Step 1", "Step 2", "Step 3"],
    "priority": "high|medium|low",
    "socialMediaContent": {
      "platform": "facebook|instagram|twitter",
      "content": "Post content with emojis",
      "hashtags": ["#hashtag1", "#hashtag2"],
      "imageSuggestion": "Type of image to use"
    }
  }
]

Focus on actionable, specific recommendations that combine business insights with social media marketing opportunities. Include at least 2 social media recommendations.
`;
  }

  private parseAIResponse(aiResponse: string, analysisData: AIAnalysisRequest): AIRecommendation[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0]);
        return recommendations.map((rec: any) => ({
          category: rec.category || 'promotion',
          title: rec.title || 'AI Recommendation',
          description: rec.description || '',
          reasoning: rec.reasoning || '',
          expectedImpact: rec.expectedImpact || { revenue: 10, orders: 10 },
          implementation: rec.implementation || [],
          priority: rec.priority || 'medium',
          socialMediaContent: rec.socialMediaContent
        }));
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
    }

    // Fallback if parsing fails
    return this.getFallbackRecommendations(analysisData);
  }

  private getFallbackRecommendations(analysisData: AIAnalysisRequest): AIRecommendation[] {
    const { historicalData, weatherData, eventsData } = analysisData;
    const recommendations: AIRecommendation[] = [];

    // Weather-based recommendation
    if (weatherData.current.conditions.toLowerCase() === 'rainy' || weatherData.current.conditions.toLowerCase() === 'snowy') {
      recommendations.push({
        category: 'promotion',
        title: 'Weather-Appropriate Promotions',
        description: 'Offer delivery discounts or comfort food promotions to attract customers during bad weather.',
        reasoning: `Current weather (${weatherData.current.conditions}) typically reduces walk-in customers but increases delivery demand.`,
        expectedImpact: { revenue: 15, orders: 20 },
        implementation: [
          'Create delivery discount promotion',
          'Highlight comfort food items',
          'Increase delivery staff if needed'
        ],
        priority: 'high',
        socialMediaContent: {
          platform: 'facebook',
          content: `🌧️ Rainy day? Stay cozy with our comfort food! 🍕☕\n\nFree delivery on orders over 150 kr today only!\n\nPerfect for: ${historicalData.popularItems[0]?.name || 'our delicious menu'} 😋`,
          hashtags: ['#RainyDayFood', '#ComfortFood', '#FreeDelivery', '#StayCozy'],
          imageSuggestion: 'Cozy food photo with rain in background'
        }
      });
    }

    // Popular items recommendation
    if (historicalData.popularItems.length > 0) {
      const topItem = historicalData.popularItems[0];
      recommendations.push({
        category: 'inventory',
        title: 'Stock Up on Popular Items',
        description: `Ensure adequate inventory for "${topItem.name}" which is your best-seller.`,
        reasoning: `${topItem.name} has been ordered ${topItem.orders} times in the last 3 months, generating ${topItem.revenue.toFixed(2)} kr in revenue.`,
        expectedImpact: { revenue: 10, orders: 15 },
        implementation: [
          'Increase stock levels for this item',
          'Consider bulk purchasing for better margins',
          'Promote this item on your menu'
        ],
        priority: 'medium',
        socialMediaContent: {
          platform: 'instagram',
          content: `🔥 Our #1 Best Seller! 🔥\n\n${topItem.name} - ${topItem.orders} happy customers can't be wrong! 😍\n\nWhat makes it special? Tell us in the comments! 👇`,
          hashtags: ['#BestSeller', '#CustomerFavorite', '#MustTry', '#Foodie'],
          imageSuggestion: 'Professional photo of the popular item'
        }
      });
    }

    // Event-based recommendation
    if (eventsData.length > 0) {
      const event = eventsData[0];
      recommendations.push({
        category: 'promotion',
        title: `Prepare for ${event.eventName}`,
        description: `Increase inventory and staffing for the upcoming ${event.eventType} event.`,
        reasoning: `${event.eventName} is expected to have ${event.expectedImpact} impact on business.`,
        expectedImpact: { revenue: 30, orders: 40, efficiency: 15 },
        implementation: [
          'Increase inventory for popular items',
          'Prepare for high-volume orders',
          'Consider food truck or catering options',
          'Hire additional staff for the event period'
        ],
        priority: 'high',
        socialMediaContent: {
          platform: 'facebook',
          content: `🎉 ${event.eventName} is coming! 🎉\n\nWe're ready to serve you delicious food during this amazing event! 📍\n\nPre-order available - beat the crowds! 🚀`,
          hashtags: ['#EventReady', '#LocalEvent', '#FoodService', '#PreOrder'],
          imageSuggestion: 'Event preparation or menu showcase'
        }
      });
    }

    return recommendations;
  }

  async analyzeHistoricalOrders(restaurantId: string, days: number = 30): Promise<HistoricalAnalysis> {
    const cacheKey = `orders_analysis_${restaurantId}_${days}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey) as HistoricalAnalysis;
    }

    try {
      const orders = await this.fetchOrdersFromLast3Months(restaurantId);
      const analysis = this.analyzeOrdersData(orders);

      this.setCache(cacheKey, analysis);
      return analysis;
    } catch (error) {
      console.error('Error analyzing historical orders:', error);
      throw new Error('Failed to analyze historical orders');
    }
  }

  async generateInsights(restaurantId: string): Promise<AIInsight[]> {
    try {
      const restaurantLocation = await this.getRestaurantLocation(restaurantId);
      const [currentWeather, upcomingEvents, historicalData] = await Promise.all([
        weatherService.getCurrentWeather(restaurantLocation.streetName, restaurantLocation.city, restaurantLocation.zipCode),
        calendarService.getUpcomingEvents(7),
        this.analyzeHistoricalOrders(restaurantId)
      ]);

      const insights: AIInsight[] = [];

      // Weather-based insights
      const weatherImpact = weatherService.getWeatherImpact(currentWeather);
      if (weatherImpact < 40) {
        insights.push({
          id: `weather_${Date.now()}`,
          type: 'weather',
          title: 'Weather Impact on Business',
          description: `Current weather conditions (${currentWeather.conditions}, ${currentWeather.temperature}°C) may reduce customer traffic. Consider indoor promotions or delivery specials.`,
          confidence: 85,
          impact: weatherImpact < 30 ? 'high' : 'medium',
          actionable: true,
          createdAt: new Date().toISOString(),
          data: { weatherData: currentWeather }
        });
      }

      // Event-based insights
      if (upcomingEvents.length > 0) {
        const highImpactEvents = upcomingEvents.filter(event => 
          calendarService.getEventImpact(event) > 60
        );

        if (highImpactEvents.length > 0) {
          insights.push({
            id: `event_${Date.now()}`,
            type: 'event',
            title: 'High-Impact Events Detected',
            description: `${highImpactEvents.length} upcoming events may significantly increase demand. Prepare for increased orders and consider special promotions.`,
            confidence: 90,
            impact: 'high',
            actionable: true,
            createdAt: new Date().toISOString(),
            data: { events: highImpactEvents }
          });
        }
      }

      // Historical data-based insights
      if (historicalData.totalOrders > 0) {
        // Peak hours insight
        if (historicalData.peakHours.length > 0) {
          const currentHour = new Date().getHours();
          const isPeakHour = historicalData.peakHours.some(hourRange => {
            const [startHour] = hourRange.split('-')[0].split(':');
            const [endHour] = hourRange.split('-')[1].split(':');
            return currentHour >= parseInt(startHour) && currentHour < parseInt(endHour);
          });

          if (isPeakHour) {
            insights.push({
              id: `demand_${Date.now()}`,
              type: 'demand',
              title: 'Peak Hours Active',
              description: `You are currently in peak ordering hours (${historicalData.peakHours.join(', ')}). Ensure adequate staffing and inventory for optimal service.`,
              confidence: 95,
              impact: 'medium',
              actionable: true,
              createdAt: new Date().toISOString(),
              data: { historicalData }
            });
          }
        }

        // Popular items insight
        if (historicalData.popularItems.length > 0) {
          const topItem = historicalData.popularItems[0];
          insights.push({
            id: `popular_items_${Date.now()}`,
            type: 'inventory',
            title: 'Popular Item Performance',
            description: `"${topItem.name}" is your best-selling item with ${topItem.orders} orders. Consider promoting it or ensuring adequate stock.`,
            confidence: 90,
            impact: 'medium',
            actionable: true,
            createdAt: new Date().toISOString(),
            data: { historicalData }
          });
        }

        // Average order value insight
        if (historicalData.averageOrderValue < 25) {
          insights.push({
            id: `avg_order_${Date.now()}`,
            type: 'promotion',
            title: 'Low Average Order Value',
            description: `Your average order value is ${historicalData.averageOrderValue.toFixed(2)} kr. Consider upselling strategies and combo deals to increase revenue.`,
            confidence: 85,
            impact: 'medium',
            actionable: true,
            createdAt: new Date().toISOString(),
            data: { historicalData }
          });
        }
      }

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      throw new Error('Failed to generate insights');
    }
  }

  async generateRecommendations(restaurantId: string): Promise<Recommendation[]> {
    try {
      const [restaurantDetails, restaurantLocation] = await Promise.all([
        this.getRestaurantDetails(restaurantId),
        this.getRestaurantLocation(restaurantId)
      ]);

      const [currentWeather, weatherForecast, upcomingEvents, historicalData] = await Promise.all([
        weatherService.getCurrentWeather(restaurantLocation.streetName, restaurantLocation.city, restaurantLocation.zipCode),
        weatherService.getWeatherForecast(restaurantLocation.streetName, restaurantLocation.city, restaurantLocation.zipCode, 7),
        calendarService.getUpcomingEvents(7),
        this.analyzeHistoricalOrders(restaurantId)
      ]);

      const currentDate = new Date();
      const currentHour = currentDate.getHours();
      const currentDay = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const currentSeason = currentDate.getMonth() >= 2 && currentDate.getMonth() <= 4 ? 'spring' :
                           currentDate.getMonth() >= 5 && currentDate.getMonth() <= 7 ? 'summer' :
                           currentDate.getMonth() >= 8 && currentDate.getMonth() <= 10 ? 'autumn' : 'winter';

      const analysisData: AIAnalysisRequest = {
        restaurantData: restaurantDetails,
        historicalData,
        weatherData: {
          current: currentWeather,
          forecast: weatherForecast
        },
        eventsData: upcomingEvents,
        businessContext: {
          currentHour,
          currentDay,
          currentSeason
        }
      };

      const aiRecommendations = await this.getAIRecommendations(analysisData);

      // Convert AI recommendations to the expected format
      return aiRecommendations.map(rec => ({
        id: `${rec.category}_${Date.now()}_${Math.random()}`,
        category: rec.category as any,
        title: rec.title,
        description: rec.description,
        reasoning: rec.reasoning,
        expectedImpact: rec.expectedImpact,
        implementation: rec.implementation,
        priority: rec.priority,
        createdAt: new Date().toISOString(),
        status: 'pending' as const,
        socialMediaContent: rec.socialMediaContent
      }));

    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  async predictDemand(restaurantId: string, days: number = 7): Promise<DemandPrediction[]> {
    try {
      const restaurantLocation = await this.getRestaurantLocation(restaurantId);
      const [weatherForecast, upcomingEvents, historicalData] = await Promise.all([
        weatherService.getWeatherForecast(restaurantLocation.streetName, restaurantLocation.city, restaurantLocation.zipCode, days),
        calendarService.getUpcomingEvents(days),
        this.analyzeHistoricalOrders(restaurantId)
      ]);

      const predictions: DemandPrediction[] = [];

      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        const weather = weatherForecast[i];
        const eventsOnDate = upcomingEvents.filter(event => 
          new Date(event.date).toDateString() === date.toDateString()
        );

        const weatherFactor = weatherService.getWeatherImpact(weather) / 100;
        const eventFactor = eventsOnDate.length > 0 ? 
          Math.min(1.5, 1 + (eventsOnDate.length * 0.2)) : 1;
        
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
        const historicalFactor = historicalData.dayOfWeekPattern[dayName] || 1;
        const normalizedHistoricalFactor = historicalFactor / Math.max(...Object.values(historicalData.dayOfWeekPattern));

        const baseOrders = historicalData.totalOrders > 0 ? 
          historicalData.totalOrders / 90 : 10; // Daily average from 3 months
        const predictedOrders = Math.round(baseOrders * weatherFactor * eventFactor * normalizedHistoricalFactor);
        const predictedRevenue = predictedOrders * historicalData.averageOrderValue;

        const confidence = Math.min(95, 70 + (weatherFactor * 10) + (eventFactor * 5));

        predictions.push({
          date: dateStr,
          predictedOrders,
          predictedRevenue,
          confidence,
          factors: {
            weather: weatherFactor,
            events: eventFactor,
            historical: normalizedHistoricalFactor,
            seasonal: 1 // Placeholder for seasonal factor
          }
        });
      }

      return predictions;
    } catch (error) {
      console.error('Error predicting demand:', error);
      throw new Error('Failed to predict demand');
    }
  }
}

export const aiAnalysisService = AIAnalysisService.getInstance(); 