"use client";

import { useState, useEffect } from "react";

export interface WeatherDay {
    day: string;
    date: string;
    maxTemp: number;
    minTemp: number;
    condition: string;
    weatherCategory: string;
}

export interface WeatherDataProps {
    location: string;
    onWeatherDataReady?: (weatherData: WeatherDay[]) => void;
}

export const WeatherData: React.FC<WeatherDataProps> = ({ location, onWeatherDataReady }) => {
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
            
            const weatherUrl = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}&days=7&aqi=no&alerts=no`;
            const weatherRes = await fetch(weatherUrl);
            
            if (!weatherRes.ok) {
                throw new Error(`Weather API error: ${weatherRes.status}`);
            }
            
            const rawWeatherData = await weatherRes.json();
            const processedData = processWeatherData(rawWeatherData);
            
            setWeatherData(processedData);
            
            // Call the callback if provided
            if (onWeatherDataReady) {
                onWeatherDataReady(processedData);
            }
            
        } catch (err) {
            console.error("Failed to fetch weather data", err);
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

    // Expose fetch function for manual refresh
    useEffect(() => {
        // Add fetchWeatherData to window for debugging (remove in production)
        if (typeof window !== 'undefined') {
            (window as any).refreshWeather = fetchWeatherData;
        }
    }, []);

    if (loading) {
        return (
            <div className="p-4 bg-white rounded-lg shadow">
                <div className="text-center text-gray-600">Loading weather data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-white rounded-lg shadow">
                <div className="text-center text-red-600">Error: {error}</div>
            </div>
        );
    }

    if (weatherData.length === 0) {
        return (
            <div className="p-4 bg-white rounded-lg shadow">
                <div className="text-center text-gray-600">No weather data available</div>
            </div>
        );
    }

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Weather Forecast for {location}</h3>
                <button 
                    onClick={fetchWeatherData}
                    className="text-sm text-blue-600 hover:text-blue-800"
                >
                    Refresh
                </button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
                {weatherData.map((day, index) => (
                    <div key={index} className="text-center p-3 border rounded-lg bg-gray-50">
                        <div className="font-medium text-gray-800">{day.day}</div>
                        <div className="text-xs text-gray-500 mb-1">{day.date}</div>
                        <div className="text-xl font-bold text-gray-900">{day.maxTemp}°</div>
                        <div className="text-sm text-gray-600 mb-1">{day.minTemp}°</div>
                        <div className="text-xs capitalize text-gray-700 mb-1">{day.condition}</div>
                        <div className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full inline-block">
                            {day.weatherCategory}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeatherData; 