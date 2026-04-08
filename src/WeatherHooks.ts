import { fetchWeatherApi } from 'openmeteo';
import { useState, useEffect } from 'react';
import type { WeatherProps } from './utils';

const url = "https://api.open-meteo.com/v1/forecast";

export interface CurrentWeatherData {
  temperature_2m: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  weather_code: number;
  sunrise: Date;
  sunset: Date;
}

export interface HourlyWeatherData {
  time: Date[];
  temperature_2m: number[];
  humidity_2m: number[];  // relative humidity
  weather_code: number[];
  precipitation: number[];
  wind_speed_10m: number[];
  wind_direction_10m: number[];
  uv_index: number[];
}

// make a request to OpenMeteo for a list of weather variables from a list of latitudes and longitudes
async function getCurrentWeatherList(locations: WeatherProps[]): Promise<(CurrentWeatherData | null)[]> {

  const latitudes = locations.map(loc => loc.latitude);
  const longitudes = locations.map(loc => loc.longitude);

  const params = {
    "latitude": latitudes,
    "longitude": longitudes,
    "daily": ["sunrise", "sunset"],
    "current": ["temperature_2m", "wind_speed_10m", "wind_direction_10m", "weather_code"],
  };
  const responses = await fetchWeatherApi(url, params);

  const results: (CurrentWeatherData | null)[] = [];

  // Process all locations
  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    const utcOffsetSeconds = response.utcOffsetSeconds();
    
    const current = response.current()!;
    const daily = response.daily()!;

    // Define Int64 variables so they can be processed accordingly
    const sunrise = daily.variables(0)!;
    const sunset = daily.variables(1)!;

    // Note: The order of weather variables in the URL query and the indices below need to match!
    const weatherData = {
      current: {
        time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
        temperature_2m: current.variables(0)!.value(),
        wind_speed_10m: current.variables(1)!.value(),
        wind_direction_10m: current.variables(2)!.value(),
        weather_code: current.variables(3)!.value(),
      },
      daily: {
        time: [...Array((Number(daily.timeEnd()) - Number(daily.time())) / daily.interval())].map(
          (_, i) => new Date((Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) * 1000)
        ),
        // Map Int64 values to according structure
        sunrise: [...Array(sunrise.valuesInt64Length())].map(
          (_, i) => new Date((Number(sunrise.valuesInt64(i)) + utcOffsetSeconds) * 1000)
        ),
        // Map Int64 values to according structure
        sunset: [...Array(sunset.valuesInt64Length())].map(
          (_, i) => new Date((Number(sunset.valuesInt64(i)) + utcOffsetSeconds) * 1000)
        ),
      },
    };
    
    results.push({
      sunrise: weatherData.daily.sunrise[0],
      sunset: weatherData.daily.sunset[0],
      temperature_2m: weatherData.current.temperature_2m,
      wind_speed_10m: weatherData.current.wind_speed_10m,
      wind_direction_10m: weatherData.current.wind_direction_10m,
      weather_code: weatherData.current.weather_code,
    });
  }
    
  return results;
}

async function getHourlyWeather(latitude: number, longitude: number): Promise<HourlyWeatherData | null> {

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 3);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 3);
  
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const params = {
    "latitude": latitude,
    "longitude": longitude,
  	"hourly": ["temperature_2m", "weather_code", "wind_speed_10m", "wind_direction_10m", "precipitation", "relative_humidity_2m", "uv_index"],
    "models": "best_match",
  	"timezone": "auto",
    "start_date": formatDate(today),
    "end_date": formatDate(endDate),
  };

  const responses = await fetchWeatherApi(url, params);

  // Process first location. Add a for-loop for multiple locations or weather models
  const response = responses[0];
  const utcOffsetSeconds = response.utcOffsetSeconds();
  
  const hourly = response.hourly()!;
  const times = [...Array((Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval())].map(
    (_, i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
  );

return {
  time: times,
  temperature_2m: Array.from(hourly.variables(0)!.valuesArray() || []),
  humidity_2m: Array.from(hourly.variables(5)!.valuesArray() || []),
  weather_code: Array.from(hourly.variables(1)!.valuesArray() || []),
  precipitation: Array.from(hourly.variables(4)!.valuesArray() || []),
  wind_speed_10m: Array.from(hourly.variables(2)!.valuesArray() || []),
  wind_direction_10m: Array.from(hourly.variables(3)!.valuesArray() || []),
  uv_index: Array.from(hourly.variables(6)!.valuesArray() || []),
};


}

// Hook to fetch weather data for multiple locations
export function useWeatherForLocations(locations: WeatherProps[]) {
  const [weatherData, setWeatherData] = useState<(CurrentWeatherData | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const locationsKey = locations.map(loc => `${loc.latitude},${loc.longitude}`).join('|');

  useEffect(() => {
    if (locations.length === 0) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    getCurrentWeatherList(locations)
      .then(data => {
        if (isMounted) {
          setWeatherData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [locationsKey]);

  return { weatherData, loading, error };
}

// Hook to fetch hourly weather data for a single location
export function useHourlyWeather(latitude: number, longitude: number) {
  const [hourlyData, setHourlyData] = useState<HourlyWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getHourlyWeather(latitude, longitude)
      .then(data => {
        if (isMounted) {
          setHourlyData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude]);

  return { hourlyData, loading, error };
}
