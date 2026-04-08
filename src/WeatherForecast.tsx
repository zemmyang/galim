import { fetchWeatherApi } from 'openmeteo';
import { useState, useEffect } from 'react';
import type { WeatherProps } from './utils';
import { getWeatherDescription, getCardinalDirection, useTheme } from './utils';
import { useHourlyWeather } from './WeatherHooks';
import type { CurrentWeatherData } from './WeatherHooks';
import Plot from 'react-plotly.js';

const url = "https://api.open-meteo.com/v1/forecast";

interface DailyForecastData {
  time: Date[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  wind_speed_10m_max: number[];
  uv_index_max: number[];
  sunrise: Date[];
  sunset: Date[];
}

async function getDailyForecast(latitude: number, longitude: number): Promise<DailyForecastData | null> {
  const params = {
    "latitude": latitude,
    "longitude": longitude,
    "daily": [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "wind_speed_10m_max",
      "uv_index_max",
      "sunrise",
      "sunset",
    ],
    "timezone": "auto",
    "forecast_days": 7,
  };
  const responses = await fetchWeatherApi(url, params);
  const response = responses[0];
  const utcOffsetSeconds = response.utcOffsetSeconds();
  const daily = response.daily()!;

  const sunrise = daily.variables(6)!;
  const sunset = daily.variables(7)!;

  return {
    time: [...Array((Number(daily.timeEnd()) - Number(daily.time())) / daily.interval())].map(
      (_, i) => new Date((Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) * 1000)
    ),
    weather_code: Array.from(daily.variables(0)!.valuesArray() || []),
    temperature_2m_max: Array.from(daily.variables(1)!.valuesArray() || []),
    temperature_2m_min: Array.from(daily.variables(2)!.valuesArray() || []),
    precipitation_sum: Array.from(daily.variables(3)!.valuesArray() || []),
    wind_speed_10m_max: Array.from(daily.variables(4)!.valuesArray() || []),
    uv_index_max: Array.from(daily.variables(5)!.valuesArray() || []),
    sunrise: [...Array(sunrise.valuesInt64Length())].map(
      (_, i) => new Date((Number(sunrise.valuesInt64(i)) + utcOffsetSeconds) * 1000)
    ),
    sunset: [...Array(sunset.valuesInt64Length())].map(
      (_, i) => new Date((Number(sunset.valuesInt64(i)) + utcOffsetSeconds) * 1000)
    ),
  };
}

function getWeatherEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code === 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌦️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '🌨️';
  if (code <= 82) return '🌧️';
  if (code <= 86) return '🌨️';
  if (code <= 99) return '⛈️';
  return '❓';
}

function useDailyForecast(latitude: number, longitude: number) {
  const [dailyData, setDailyData] = useState<DailyForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getDailyForecast(latitude, longitude)
      .then(data => {
        if (isMounted) { setDailyData(data); setLoading(false); }
      })
      .catch(err => {
        if (isMounted) { setError(err); setLoading(false); }
      });

    return () => { isMounted = false; };
  }, [latitude, longitude]);

  return { dailyData, loading, error };
}

export function WeeklyForecast({ latitude, longitude }: WeatherProps) {
  const { dailyData, loading, error } = useDailyForecast(latitude, longitude);

  if (loading) return <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading weekly forecast...</p>;
  if (error) return <p style={{ color: 'var(--color-warning)', textAlign: 'center' }}>Error loading forecast: {error.message}</p>;
  if (!dailyData) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto' }}>
      <h2 style={{
        fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)',
        textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', marginBottom: '1rem'
      }}>7-Day Forecast</h2>
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        overflowX: 'auto',
        padding: '0.5rem 0',
      }}>
        {dailyData.time.map((day, i) => {
          const dayDate = new Date(day);
          dayDate.setHours(0, 0, 0, 0);
          const isToday = dayDate.getTime() === today.getTime();
          const dayName = isToday ? 'Today' : day.toLocaleDateString('en-US', { weekday: 'short' });
          const dateStr = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          return (
            <div key={i} style={{
              flex: '1 0 0',
              minWidth: '110px',
              backgroundColor: isToday ? 'var(--color-accent)' : 'var(--color-card-bg)',
              borderRadius: '12px',
              padding: '1rem 0.75rem',
              textAlign: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
            }}>
              <div style={{
                fontWeight: 700,
                fontSize: '0.9rem',
                color: isToday ? '#fff' : 'var(--color-text-primary)',
              }}>{dayName}</div>
              <div style={{
                fontSize: '0.75rem',
                color: isToday ? 'rgba(255,255,255,0.8)' : 'var(--color-text-secondary)',
                marginBottom: '0.5rem',
              }}>{dateStr}</div>
              <div style={{ fontSize: '2rem', lineHeight: 2, margin: '0.25rem 0' }}>
                {getWeatherEmoji(dailyData.weather_code[i])}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: isToday ? 'rgba(255,255,255,0.85)' : 'var(--color-text-secondary)',
                margin: '0.25rem 0 0.5rem',
                minHeight: '3em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>{getWeatherDescription(dailyData.weather_code[i])}</div>
              <div style={{
                fontWeight: 700,
                fontSize: '1.1rem',
                color: isToday ? '#fff' : 'var(--color-text-primary)',
              }}>
                {Math.round(dailyData.temperature_2m_max[i])}°
                <span style={{
                  fontWeight: 400,
                  fontSize: '0.9rem',
                  color: isToday ? 'rgba(255,255,255,0.7)' : 'var(--color-text-secondary)',
                  marginLeft: '0.25rem',
                }}>{Math.round(dailyData.temperature_2m_min[i])}°</span>
              </div>
              {dailyData.uv_index_max && (
                <div style={{
                  fontSize: '0.7rem',
                  color: isToday ? 'rgba(255,255,255,0.7)' : dailyData.uv_index_max[i] >= 8 ? 'var(--color-warning)' : 'var(--color-text-secondary)',
                  marginTop: '0.35rem',
                }}>☀️ UV {dailyData.uv_index_max[i].toFixed(1)}</div>
              )}
              <div style={{
                fontSize: '0.7rem',
                color: isToday ? 'rgba(255,255,255,0.7)' : 'var(--color-text-secondary)',
                marginTop: '0.35rem',
              }}>💨 {Math.round(dailyData.wind_speed_10m_max[i])} km/h</div>
              {dailyData.precipitation_sum[i] > 0 && (
                <div style={{
                  fontSize: '0.75rem',
                  color: isToday ? 'rgba(255,255,255,0.8)' : 'var(--color-accent)',
                  marginTop: '0.35rem',
                }}>💧 {dailyData.precipitation_sum[i].toFixed(1)} mm</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


export function HourlyWeatherForecast ({ latitude, longitude }: WeatherProps) {
  const { hourlyData, loading, error } = useHourlyWeather(latitude, longitude);
  const theme = useTheme();

  const plotColors = theme === 'light'
    ? { plotBg: '#f9f9f9', gridColor: '#e0e0e0', fontColor: '#57606f' }
    : { plotBg: '#1e2530', gridColor: '#2f3640', fontColor: '#b2bec3' };

  if (loading) {
    return (
      <div>
        <h2>Hourly Weather Forecast</h2>
        <p>Loading hourly forecast...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2>Hourly Weather Forecast</h2>
        <p>Error loading forecast: {error.message}</p>
      </div>
    );
  }

  if (!hourlyData) {
    return (
      <div>
        <h2>Hourly Weather Forecast</h2>
        <p>No forecast data available</p>
      </div>
    );
  }

  const hoursToShow = hourlyData.time.length;
  
  // Prepare time strings for x-axis
  const timeStrings = hourlyData.time.slice(0, hoursToShow);
  const xRange = [timeStrings[0], timeStrings[timeStrings.length - 1]];
  
  return (
    <div>
      <h2 style={{ 
        fontSize: '1.25rem', 
        fontWeight: 600, 
        color: 'var(--color-text-secondary)', 
        textTransform: 'uppercase', 
        letterSpacing: '0.05em',
        textAlign: 'center',
        marginBottom: '0.25rem' 
      }}>Hourly Weather Forecast</h2>
      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
        Showing {hoursToShow} hours of forecast data from {timeStrings[0].toLocaleString()} to {timeStrings[timeStrings.length - 1].toLocaleString()}
      </p>
      
      {/* Temperature Plot */}
      <div style={{ marginTop: '2rem' }}>
        <Plot
          data={[
            {
              x: timeStrings,
              y: hourlyData.temperature_2m.slice(0, hoursToShow),
              type: 'scatter',
              mode: 'lines+markers',
              name: 'Temperature',
              line: { color: '#ff6b6b', width: 2 },
              marker: { size: 4 },
              hovertemplate: '<b>%{x}</b><br>Temperature: %{y:.1f}°C<extra></extra>',
            }
          ]}
          layout={{
            title: { text: 'Temperature (°C)', font: { color: plotColors.fontColor } },
            xaxis: { 
              title: { text: 'Time', font: { color: plotColors.fontColor } },
              tickangle: -45,
              tickfont: { color: plotColors.fontColor },
              gridcolor: plotColors.gridColor,
              fixedrange: true,
              range: xRange,
            },
            yaxis: { 
              title: { text: 'Temperature (°C)', font: { color: plotColors.fontColor } },
              tickfont: { color: plotColors.fontColor },
              gridcolor: plotColors.gridColor,
              fixedrange: true,
            },
            autosize: true,
            margin: { l: 60, r: 40, t: 60, b: 100 },
            hovermode: 'closest',
            plot_bgcolor: plotColors.plotBg,
            paper_bgcolor: 'transparent',
          }}
          config={{
            responsive: true,
            displayModeBar: false,
            scrollZoom: false,
          }}
          style={{ width: '100%', height: '400px' }}
          useResizeHandler={true}
        />
      </div>

      {/* UV Index Plot */}
      <div style={{ marginTop: '2rem' }}>
        <Plot
          data={[
            {
              x: timeStrings,
              y: hourlyData.uv_index.slice(0, hoursToShow),
              type: 'scatter',
              mode: 'lines',
              name: 'UV Index',
              fill: 'tozeroy',
              line: { color: '#f39c12', width: 2 },
              fillcolor: 'rgba(243, 156, 18, 0.15)',
              hovertemplate: '<b>%{x}</b><br>UV Index: %{y:.1f}<extra></extra>',
            }
          ]}
          layout={{
            title: { text: 'UV Index', font: { color: plotColors.fontColor } },
            xaxis: { 
              title: { text: 'Time', font: { color: plotColors.fontColor } },
              tickangle: -45,
              tickfont: { color: plotColors.fontColor },
              gridcolor: plotColors.gridColor,
              fixedrange: true,
              range: xRange,
            },
            yaxis: { 
              title: { text: 'UV Index', font: { color: plotColors.fontColor } },
              tickfont: { color: plotColors.fontColor },
              gridcolor: plotColors.gridColor,
              fixedrange: true,
              rangemode: 'tozero',
            },
            autosize: true,
            margin: { l: 60, r: 40, t: 60, b: 100 },
            hovermode: 'closest',
            plot_bgcolor: plotColors.plotBg,
            paper_bgcolor: 'transparent',
            shapes: [
              { type: 'line', x0: timeStrings[0], x1: timeStrings[timeStrings.length - 1], y0: 3, y1: 3, line: { color: '#2ecc71', width: 1, dash: 'dot' } },
              { type: 'line', x0: timeStrings[0], x1: timeStrings[timeStrings.length - 1], y0: 6, y1: 6, line: { color: '#f39c12', width: 1, dash: 'dot' } },
              { type: 'line', x0: timeStrings[0], x1: timeStrings[timeStrings.length - 1], y0: 8, y1: 8, line: { color: '#e74c3c', width: 1, dash: 'dot' } },
            ],
          }}
          config={{
            responsive: true,
            displayModeBar: false,
            scrollZoom: false,
          }}
          style={{ width: '100%', height: '400px' }}
          useResizeHandler={true}
        />
      </div>

      {/* Precipitation and Humidity Plot */}
      <div style={{ marginTop: '2rem' }}>
        <Plot
          data={[
            {
              x: timeStrings,
              y: hourlyData.precipitation.slice(0, hoursToShow),
              type: 'bar',
              name: 'Precipitation',
              marker: { color: '#4ecdc4' },
              yaxis: 'y',
              hovertemplate: '<b>%{x}</b><br>Precipitation: %{y:.1f} mm<extra></extra>',
            },
            {
              x: timeStrings,
              y: hourlyData.humidity_2m.slice(0, hoursToShow),
              type: 'scatter',
              mode: 'lines',
              name: 'Humidity',
              line: { color: '#95a5a6', width: 2, dash: 'dash' },
              yaxis: 'y2',
              hovertemplate: '<b>%{x}</b><br>Humidity: %{y:.0f}%<extra></extra>',
            }
          ]}
          layout={{
            title: { text: 'Precipitation & Humidity', font: { color: plotColors.fontColor } },
            xaxis: { 
              title: { text: 'Time', font: { color: plotColors.fontColor } },
              tickangle: -45,
              tickfont: { color: plotColors.fontColor },
              gridcolor: plotColors.gridColor,
              fixedrange: true,
              range: xRange,
            },
            yaxis: { 
              title: { text: 'Precipitation (mm)', font: { color: plotColors.fontColor } },
              side: 'left',
              tickfont: { color: plotColors.fontColor },
              gridcolor: plotColors.gridColor,
              fixedrange: true,
            },
            yaxis2: {
              title: { text: 'Humidity (%)', font: { color: plotColors.fontColor } },
              overlaying: 'y',
              side: 'right',
              tickfont: { color: plotColors.fontColor },
              gridcolor: plotColors.gridColor,
              fixedrange: true,
            },
            autosize: true,
            margin: { l: 60, r: 60, t: 60, b: 100 },
            hovermode: 'closest',
            plot_bgcolor: plotColors.plotBg,
            paper_bgcolor: 'transparent',
            showlegend: true,
            legend: { x: 0, y: 1.1, orientation: 'h', font: { color: plotColors.fontColor } }
          }}
          config={{
            responsive: true,
            displayModeBar: false,
            scrollZoom: false,
          }}
          style={{ width: '100%', height: '400px' }}
          useResizeHandler={true}
        />
      </div>

      {/* Wind Speed Plot */}
      <div style={{ marginTop: '2rem' }}>
        <Plot
          data={[
            {
              x: timeStrings,
              y: hourlyData.wind_speed_10m.slice(0, hoursToShow),
              type: 'scatter',
              mode: 'lines',
              name: 'Wind Speed',
              fill: 'tozeroy',
              line: { color: '#3498db', width: 2 },
              hovertemplate: '<b>%{x}</b><br>Wind Speed: %{y:.1f} km/h<extra></extra>',
            }
          ]}
          layout={{
            title: { text: 'Wind Speed (km/h)', font: { color: plotColors.fontColor } },
            xaxis: { 
              title: { text: 'Time', font: { color: plotColors.fontColor } },
              tickangle: -45,
              tickfont: { color: plotColors.fontColor },
              gridcolor: plotColors.gridColor,
              fixedrange: true,
              range: xRange,
            },
            yaxis: { 
              title: { text: 'Wind Speed (km/h)', font: { color: plotColors.fontColor } },
              tickfont: { color: plotColors.fontColor },
              gridcolor: plotColors.gridColor,
              fixedrange: true,
            },
            autosize: true,
            margin: { l: 60, r: 40, t: 60, b: 100 },
            hovermode: 'closest',
            plot_bgcolor: plotColors.plotBg,
            paper_bgcolor: 'transparent',
          }}
          config={{
            responsive: true,
            displayModeBar: false,
            scrollZoom: false,
          }}
          style={{ width: '100%', height: '400px' }}
          useResizeHandler={true}
        />
      </div>
    </div>
  );
};interface CurrentWeatherProps extends WeatherProps {
  data?: CurrentWeatherData | null;
  loading?: boolean;
}

export function CurrentWeather ({ data, loading }: CurrentWeatherProps) {
  if (loading) {
    return (
      <div>
        <h2>Current Weather</h2>
        <p>Loading weather data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <h2>Current Weather</h2>
        <p>No weather data available</p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--color-card-bg)',
      borderRadius: '12px',
      padding: '1.5rem 2rem',
      marginTop: '1.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    }}>
      <h2 style={{ 
        fontSize: '1.25rem', 
        fontWeight: 600, 
        color: 'var(--color-text-secondary)', 
        textTransform: 'uppercase', 
        letterSpacing: '0.05em',
        marginBottom: '1rem' 
      }}>Current Weather</h2>
      <div style={{ 
        fontSize: '3.5rem', 
        fontWeight: 700, 
        color: 'var(--color-text-primary)', 
        lineHeight: 1 
      }}>
        {Math.round(data.temperature_2m)}°C
      </div>
      <p style={{ 
        fontSize: '1.1rem', 
        color: 'var(--color-text-secondary)', 
        margin: '0.5rem 0 1rem' 
      }}>
        {getWeatherDescription(data.weather_code)}
      </p>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '2rem',
        color: 'var(--color-text-secondary)',
        fontSize: '0.95rem'
      }}>
        <span>Wind: {Math.round(data.wind_speed_10m)} km/h</span>
        <span>Direction: {Math.round(data.wind_direction_10m)}° {getCardinalDirection(data.wind_direction_10m)}</span>
      </div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '2rem',
        color: 'var(--color-text-secondary)',
        fontSize: '0.95rem',
        marginTop: '0.75rem'
      }}>
        <span>☀️ Sunrise: {data.sunrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <span>🌅 Sunset: {data.sunset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
};
