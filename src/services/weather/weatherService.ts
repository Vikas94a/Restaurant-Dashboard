import { WeatherData } from '@/types/ai/aiInsights';

const WEATHER_API_KEY = process.env.Weather_API;

interface WeatherAPIResponse {
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
  }>;
  wind: {
    speed: number;
  };
  rain?: {
    '1h'?: number;
    '3h'?: number;
  };
}

interface ForecastAPIResponse {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      humidity: number;
    };
    weather: Array<{
      main: string;
    }>;
    wind: {
      speed: number;
    };
    rain?: {
      '3h'?: number;
    };
  }>;
}

export class WeatherService {
  private static instance: WeatherService;
  private cache: Map<string, WeatherData> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private setCache(key: string, data: WeatherData): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  private async geocodeAddress(streetName: string, city: string, zipCode: string): Promise<{ lat: number; lon: number }> {
    try {
      const address = `${streetName}, ${city}, ${zipCode}`;
      const encodedAddress = encodeURIComponent(address);
      
      // Using OpenStreetMap Nominatim API for geocoding (free, no API key required)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        };
      }
      
      // Fallback to Stockholm coordinates if geocoding fails
      console.warn('Geocoding failed, using default coordinates');
      return { lat: 59.3293, lon: 18.0686 };
    } catch (error) {
      console.error('Error geocoding address:', error);
      // Fallback to Stockholm coordinates
      return { lat: 59.3293, lon: 18.0686 };
    }
  }

  async getCurrentWeather(streetName?: string, city?: string, zipCode?: string): Promise<WeatherData> {
    let lat = 59.3293;
    let lon = 18.0686;

    // If address is provided, geocode it to get coordinates
    if (streetName && city && zipCode) {
      const coords = await this.geocodeAddress(streetName, city, zipCode);
      lat = coords.lat;
      lon = coords.lon;
    }

    const cacheKey = `current_${lat}_${lon}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      if (WEATHER_API_KEY) {
        // Use real weather API (OpenWeatherMap)
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
        );
        
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`);
        }
        
        const weatherData = await response.json() as WeatherAPIResponse;
        
        const currentWeather: WeatherData = {
          date: new Date().toISOString(),
          temperature: Math.round(weatherData.main.temp),
          conditions: weatherData.weather[0].main,
          humidity: weatherData.main.humidity,
          windSpeed: Math.round(weatherData.wind.speed * 3.6), // Convert m/s to km/h
          precipitation: weatherData.rain ? weatherData.rain['1h'] || 0 : 0,
        };

        this.setCache(cacheKey, currentWeather);
        return currentWeather;
      } else {
        // Fallback to mock data if no API key
        console.warn('No weather API key provided, using mock data');
        const mockWeatherData: WeatherData = {
          date: new Date().toISOString(),
          temperature: Math.floor(Math.random() * 30) + 5, // 5-35°C
          conditions: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'][Math.floor(Math.random() * 4)],
          humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
          windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
          precipitation: Math.floor(Math.random() * 10), // 0-10 mm
        };

        this.setCache(cacheKey, mockWeatherData);
        return mockWeatherData;
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Return mock data as fallback
      const fallbackWeather: WeatherData = {
        date: new Date().toISOString(),
        temperature: 20,
        conditions: 'Cloudy',
        humidity: 60,
        windSpeed: 10,
        precipitation: 0,
      };
      return fallbackWeather;
    }
  }

  async getWeatherForecast(streetName?: string, city?: string, zipCode?: string, days: number = 7): Promise<WeatherData[]> {
    let lat = 59.3293;
    let lon = 18.0686;

    // If address is provided, geocode it to get coordinates
    if (streetName && city && zipCode) {
      const coords = await this.geocodeAddress(streetName, city, zipCode);
      lat = coords.lat;
      lon = coords.lon;
    }

    const cacheKey = `forecast_${lat}_${lon}_${days}`;
    
    if (this.isCacheValid(cacheKey)) {
      return Array.from(this.cache.values()).filter(data => 
        new Date(data.date) > new Date()
      ).slice(0, days);
    }

    try {
      if (WEATHER_API_KEY) {
        // Use real weather API for forecast
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
        );
        
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`);
        }
        
        const forecastData = await response.json() as ForecastAPIResponse;
        
        // Process forecast data to get daily forecasts
        const dailyForecasts = forecastData.list.filter((item, index) => index % 8 === 0).slice(0, days);
        
        const forecast: WeatherData[] = dailyForecasts.map((item) => ({
          date: new Date(item.dt * 1000).toISOString(),
          temperature: Math.round(item.main.temp),
          conditions: item.weather[0].main,
          humidity: item.main.humidity,
          windSpeed: Math.round(item.wind.speed * 3.6), // Convert m/s to km/h
          precipitation: item.rain ? item.rain['3h'] || 0 : 0,
        }));

        forecast.forEach(data => {
          const key = `forecast_${new Date(data.date).toISOString().split('T')[0]}`;
          this.setCache(key, data);
        });

        return forecast;
      } else {
        // Fallback to mock data if no API key
        console.warn('No weather API key provided, using mock forecast data');
        const forecast: WeatherData[] = [];
        for (let i = 1; i <= days; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          
          forecast.push({
            date: date.toISOString(),
            temperature: Math.floor(Math.random() * 30) + 5,
            conditions: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'][Math.floor(Math.random() * 4)],
            humidity: Math.floor(Math.random() * 40) + 40,
            windSpeed: Math.floor(Math.random() * 20) + 5,
            precipitation: Math.floor(Math.random() * 10),
          });
        }

        forecast.forEach(data => {
          const key = `forecast_${new Date(data.date).toISOString().split('T')[0]}`;
          this.setCache(key, data);
        });

        return forecast;
      }
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      // Return mock forecast as fallback
      const fallbackForecast: WeatherData[] = [];
      for (let i = 1; i <= days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        fallbackForecast.push({
          date: date.toISOString(),
          temperature: 20,
          conditions: 'Cloudy',
          humidity: 60,
          windSpeed: 10,
          precipitation: 0,
        });
      }
      return fallbackForecast;
    }
  }

  getWeatherImpact(weather: WeatherData): number {
    // Calculate weather impact on restaurant business (0-100)
    let impact = 50; // Base impact

    // Temperature impact
    if (weather.temperature < 10 || weather.temperature > 25) {
      impact -= 20; // Extreme temperatures reduce business
    } else if (weather.temperature >= 15 && weather.temperature <= 22) {
      impact += 15; // Comfortable temperatures increase business
    }

    // Conditions impact
    switch (weather.conditions.toLowerCase()) {
      case 'sunny':
        impact += 10;
        break;
      case 'cloudy':
        impact += 5;
        break;
      case 'rainy':
        impact -= 15;
        break;
      case 'snowy':
        impact -= 25;
        break;
    }

    // Precipitation impact
    if (weather.precipitation > 5) {
      impact -= 10;
    }

    return Math.max(0, Math.min(100, impact));
  }
}

export const weatherService = WeatherService.getInstance(); 