import { useState, useEffect } from "react";
import type { WeatherDay } from "./WeatherData";

export const useWeatherData = (location: string) => {
    const [weatherData, setWeatherData] = useState<WeatherDay[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Helper function to categorize weather conditions
    const categorizeWeather = (condition: string): string => {
        const conditionLower = condition.toLowerCase();
        
        if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
            return 'sunny';
        } else if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) {
            return 'cloudy';
        } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
            return 'rainy';
        } else if (conditionLower.includes('snow') || conditionLower.includes('sleet')) {
            return 'snowy';
        } else if (conditionLower.includes('storm') || conditionLower.includes('thunder')) {
            return 'stormy';
        } else if (conditionLower.includes('fog') || conditionLower.includes('mist')) {
            return 'foggy';
        } else {
            return 'mixed';
        }
    };

    // Helper function to get day name from date
    const getDayName = (dateString: string): string => {
        const date = new Date(dateString);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
    };

    // Helper function to format date
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    };

    // Process raw weather data into refined format
    const processWeatherData = (rawData: any): WeatherDay[] => {
        if (!rawData.forecast?.forecastday) {
            return [];
        }

        return rawData.forecast.forecastday.map((day: any) => ({
            day: getDayName(day.date),
            date: formatDate(day.date),
            maxTemp: Math.round(day.day.maxtemp_c),
            minTemp: Math.round(day.day.mintemp_c),
            condition: day.day.condition.text,
            weatherCategory: categorizeWeather(day.day.condition.text)
        }));
    };

    // Fetch weather data
    const fetchWeatherData = async () => {
        if (!location) {
            setError("Location is required");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const WEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHER_API || "YOUR_WEATHER_API_KEY";
            
            // Request 3 days for free tier compatibility
            const weatherUrl = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}&days=3&aqi=no&alerts=no`;
            const weatherRes = await fetch(weatherUrl);
            
            if (!weatherRes.ok) {
                throw new Error(`Weather API error: ${weatherRes.status}`);
            }
            
            const rawWeatherData = await weatherRes.json();
            const processedData = processWeatherData(rawWeatherData);
            
            setWeatherData(processedData);
            
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch weather data");
        } finally {
            setLoading(false);
        }
    };

    // Fetch weather data when location changes
    useEffect(() => {
        if (location) {
            fetchWeatherData();
        }
    }, [location]);

    return {
        weatherData,
        loading,
        error,
        fetchWeatherData
    };
}; 