import { CalendarEvent } from '@/types/ai/aiInsights';

export class CalendarService {
  private static instance: CalendarService;
  private cache: Map<string, CalendarEvent[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  static getInstance(): CalendarService {
    if (!CalendarService.instance) {
      CalendarService.instance = new CalendarService();
    }
    return CalendarService.instance;
  }

  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private setCache(key: string, data: CalendarEvent[]): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  async getUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
    try {
      // Mock calendar events - in production, this would fetch from a real calendar API
      const mockEvents: CalendarEvent[] = [
        {
          id: '1',
          eventName: 'Local Food Festival',
          eventType: 'local_event',
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
          location: 'City Center',
          expectedImpact: 'high',
          description: 'Annual food festival attracting thousands of visitors'
        },
        {
          id: '2',
          eventName: 'Business Conference',
          eventType: 'other',
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
          location: 'Convention Center',
          expectedImpact: 'medium',
          description: 'Major business conference with lunch catering needs'
        },
        {
          id: '3',
          eventName: 'Sports Tournament',
          eventType: 'sports',
          date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
          location: 'Sports Complex',
          expectedImpact: 'high',
          description: 'Weekend sports tournament with food vendor opportunities'
        }
      ];

      // Filter events within the specified days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + days);

      return mockEvents.filter(event => new Date(event.date) <= cutoffDate);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }

  async getEventsByDate(date: string): Promise<CalendarEvent[]> {
    const cacheKey = `events_date_${date}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const allEvents = await this.getUpcomingEvents(30);
      const targetDate = new Date(date);
      const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const eventsOnDate = allEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= dayStart && eventDate < dayEnd;
      });

      this.setCache(cacheKey, eventsOnDate);
      return eventsOnDate;
    } catch (error) {
      console.error('Error fetching events by date:', error);
      throw new Error('Failed to fetch events by date');
    }
  }

  getEventImpact(event: CalendarEvent): number {
    // Calculate event impact on restaurant business (0-100)
    let impact = 30; // Base impact

    switch (event.eventType) {
      case 'holiday':
        impact += 40; // High impact for holidays
        break;
      case 'local_event':
        impact += 35; // High impact for local events
        break;
      case 'sports':
        impact += 35; // High impact for sports events
        break;
      case 'cultural':
        impact += 25; // Medium-high impact for cultural events
        break;
      case 'other':
        impact += 20; // Medium impact for other events
        break;
      default:
        impact += 15; // Low-medium impact for other events
    }

    // Adjust based on expected impact
    if (event.expectedImpact === 'high') {
      impact += 20;
    } else if (event.expectedImpact === 'medium') {
      impact += 10;
    }

    return Math.min(100, impact);
  }

  getEventRecommendations(event: CalendarEvent): string[] {
    const recommendations: string[] = [];

    switch (event.eventType) {
      case 'holiday':
        recommendations.push(
          'Increase inventory for popular items',
          'Prepare holiday-themed menu items',
          'Consider special holiday promotions',
          'Hire additional staff for the holiday period'
        );
        break;
      case 'local_event':
        recommendations.push(
          'Increase inventory for popular items',
          'Prepare for high-volume orders',
          'Consider food truck or catering options',
          'Hire additional staff for the event period'
        );
        break;
      case 'sports':
        recommendations.push(
          'Stock up on quick-service items',
          'Prepare for post-game rush',
          'Consider mobile ordering options',
          'Increase beverage inventory'
        );
        break;
      case 'cultural':
        recommendations.push(
          'Add culturally themed menu items',
          'Consider special pricing for event attendees',
          'Prepare for increased demand'
        );
        break;
      case 'other':
        recommendations.push(
          'Monitor event details for specific opportunities',
          'Prepare for potential increased demand',
          'Consider promotional offers'
        );
        break;
      default:
        recommendations.push(
          'Monitor event details for specific opportunities',
          'Prepare for potential increased demand',
          'Consider promotional offers'
        );
    }

    return recommendations;
  }
}

export const calendarService = CalendarService.getInstance(); 