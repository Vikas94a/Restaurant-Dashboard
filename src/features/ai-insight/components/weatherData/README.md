# Weather Data Component

This component provides refined weather data for AI analysis in the restaurant dashboard.

## Features

- Fetches 3-day weather forecast from WeatherAPI.com (free tier)
- Processes raw weather data into structured format
- Categorizes weather conditions (sunny, cloudy, rainy, etc.)
- Provides loading and error states
- Reusable hook and component

## Data Structure

The weather data is structured as follows:

```typescript
interface WeatherDay {
  day: string; // Day name (e.g., "Monday")
  date: string; // Formatted date (e.g., "Dec 15")
  maxTemp: number; // Maximum temperature in Celsius
  minTemp: number; // Minimum temperature in Celsius
  condition: string; // Weather condition (e.g., "Partly cloudy")
  weatherCategory: string; // Categorized condition (sunny, cloudy, rainy, etc.)
}
```

## Usage

### Using the Hook

```typescript
import { useWeatherData } from "@/features/ai-insight/components/weatherData";

function MyComponent() {
  const { weatherData, loading, error, fetchWeatherData } =
    useWeatherData("New York");

  // weatherData will contain 3 days of processed weather information
  console.log(weatherData);
}
```

### Using the Component

```typescript
import { WeatherData } from '@/features/ai-insight/components/weatherData';

function MyComponent() {
    const handleWeatherReady = (weatherData) => {
        console.log('Weather data ready:', weatherData);
    };

    return (
        <WeatherData
            location="New York"
            onWeatherDataReady={handleWeatherReady}
        />
    );
}
```

## Weather Categories

The component automatically categorizes weather conditions:

- **sunny**: Clear, sunny conditions
- **cloudy**: Cloudy, overcast conditions
- **rainy**: Rain, drizzle conditions
- **snowy**: Snow, sleet conditions
- **stormy**: Storm, thunder conditions
- **foggy**: Fog, mist conditions
- **mixed**: Other conditions

## Environment Variables

Make sure to set your WeatherAPI key in your `.env` file:

```
NEXT_PUBLIC_WEATHER_API=your_weather_api_key_here
```

## Example Output

```json
[
  {
    "day": "Monday",
    "date": "Dec 15",
    "maxTemp": 22,
    "minTemp": 15,
    "condition": "Partly cloudy",
    "weatherCategory": "cloudy"
  },
  {
    "day": "Tuesday",
    "date": "Dec 16",
    "maxTemp": 25,
    "minTemp": 18,
    "condition": "Sunny",
    "weatherCategory": "sunny"
  },
  {
    "day": "Wednesday",
    "date": "Dec 17",
    "maxTemp": 20,
    "minTemp": 12,
    "condition": "Light rain",
    "weatherCategory": "rainy"
  }
]
```

This structured data is perfect for AI analysis to provide weather-based marketing insights for restaurants.
