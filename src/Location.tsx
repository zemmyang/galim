// page for each location in the csv
import { useState } from 'react';

import './App.css'
import { Header, Footer } from './UserInterface'
import type { WeatherProps } from './utils'
import { CurrentWeather, HourlyWeatherForecast, WeeklyForecast } from './WeatherForecast'
import { useWeatherForLocations } from './WeatherHooks'
import { SwimmerMarineForecast, SurferMarineForecast } from './MarineForecast'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import ToggleButton from 'react-bootstrap/ToggleButton';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import { loadPreferences, saveUserTypes } from './Storage';

function FilterControls({ userTypes, onChange }: { userTypes: number[], onChange: (v: number[]) => void }) {
    const handleUserTypeChange = (value: number[]) => {
        onChange(value);
        saveUserTypes(value);
    };

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            gap: '1rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--color-card-bg)',
            borderBottom: '1px solid var(--color-divider)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
            <span style={{ 
                color: 'var(--color-text-secondary)', 
                fontSize: '0.9rem',
                fontWeight: 500,
                letterSpacing: '0.02em',
            }}>I am a:</span>
            <ToggleButtonGroup 
                type="checkbox" 
                value={userTypes}
                onChange={handleUserTypeChange}
                id="tbg-user-type"
                style={{ gap: '0.5rem' }}
            >
                <ToggleButton 
                    id="tbg-swimmer" 
                    value={1}
                    variant={userTypes.includes(1) ? 'primary' : 'outline-secondary'}
                    style={{
                        borderRadius: '20px',
                        padding: '0.35rem 1.25rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        border: userTypes.includes(1) ? 'none' : '1px solid var(--color-divider)',
                    }}
                >
                    🏊 Swimmer
                </ToggleButton>
                <ToggleButton 
                    id="tbg-surfer" 
                    value={2}
                    variant={userTypes.includes(2) ? 'primary' : 'outline-secondary'}
                    style={{
                        borderRadius: '20px',
                        padding: '0.35rem 1.25rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        border: userTypes.includes(2) ? 'none' : '1px solid var(--color-divider)',
                    }}
                >
                    🏄 Surfer
                </ToggleButton>
            </ToggleButtonGroup>
        </div>
    )
}

export function Location({ name, slug, latitude, longitude }: WeatherProps) {
  const location = useMemo(() => [{ name, slug, latitude, longitude }], [name, slug, latitude, longitude]);
  const { weatherData, loading, error } = useWeatherForLocations(location);
  const [userTypes, setUserTypes] = useState<number[]>(() => loadPreferences().userTypes);

  const isSwimmer = userTypes.includes(1);
  const isSurfer = userTypes.includes(2);

  return (
    <>
    <Header />

    <FilterControls userTypes={userTypes} onChange={setUserTypes} />
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden',
      margin: 0,
      padding: 0
    }}>
      <div style={{ padding: '0 15px', flex: 1 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem 0' }}>
          <Link to="/" style={{
            color: 'var(--color-accent)',
            textDecoration: 'none',
            fontSize: '0.95rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}>← Back to all locations</Link>
        </div>
        <div style={{ maxWidth: '900px', margin: '2rem auto', textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 700, 
            color: 'var(--color-text-primary)',
            marginBottom: '0.25rem'
          }}>{name}</h1>
          <p style={{ 
            color: 'var(--color-text-secondary)', 
            fontSize: '0.95rem',
            margin: 0 
          }}>{latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E</p>
        
          {error && <div style={{ color: 'var(--color-warning)', marginTop: '1rem' }}>Error loading weather: {error.message}</div>}
        
          <CurrentWeather 
            name={name}
            slug={slug}
            latitude={latitude}
            longitude={longitude}
            data={weatherData[0] || null}
            loading={loading}
          />
        </div>

        <WeeklyForecast
          name={name}
          slug={slug}
          latitude={latitude}
          longitude={longitude}
        />

        <HourlyWeatherForecast
          name={name}
          slug={slug}
          latitude={latitude}
          longitude={longitude}
        />

        {isSwimmer && (
          <SwimmerMarineForecast
            name={name}
            slug={slug}
            latitude={latitude}
            longitude={longitude}
          />
        )}

        {isSurfer && (
          <SurferMarineForecast
            name={name}
            slug={slug}
            latitude={latitude}
            longitude={longitude}
          />
        )}
      </div>
      <Footer />
    </div>
    </>
  )
}
