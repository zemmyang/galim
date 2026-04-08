
import { useEffect, useState } from 'react';

import { Row, Col } from 'react-bootstrap'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faStar as faStarSolid, faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';

import locationsCSV from './locations.csv?raw';
import headerImage from '../assets/header.jpg';

import { useWeatherForLocations } from './WeatherHooks';
import { loadPreferences, toggleFavoriteInPreferences, saveTheme } from './Storage';

import type { WeatherProps } from './utils';
import { getWeatherDescription } from './utils';

export function Header() {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const prefs = loadPreferences();
        return prefs.theme;
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        saveTheme(newTheme);
    };

return (
  <header style={{ 
    margin: 0, 
    padding: 0, 
    width: '100%', 
    height: '400px',
    backgroundColor: 'var(--color-bg)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `url(${headerImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      opacity: 0.3,
      zIndex: 0
    }}></div>
    
    <button
      onClick={toggleTheme}
      style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        background: 'none',
        border: 'none',
        color: 'var(--color-accent)',
        fontSize: '1.5rem',
        cursor: 'pointer',
        padding: '0.5rem',
        zIndex: 1,
      }}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} />
    </button>

    <h1 style={{
      color: 'var(--color-text-primary)',
      fontSize: '3rem',
      fontWeight: 'bold',
      textAlign: 'center',
      margin: 0,
      zIndex: 1,
    }}>GALIM: App for Locating Israeli Meteorology</h1>

    <h3 className="mt-4" style={{ color: 'var(--color-text-secondary)', zIndex: 1 }}>
    Updated every 15 minutes. Data from <a href="https://open-meteo.com/" style={{ color: 'var(--color-accent)' }}>Open-Meteo</a>.
    </h3>

  </header>
)
}

export function Footer() {
    return (
        <footer style={{ 
            textAlign: 'center', 
            padding: '1rem', 
            backgroundColor: 'var(--color-divider)', 
            marginTop: 'auto',
            flexShrink: 0
        }}>
    
            2026.
            <br />
            Purely client-side. No servers, no tracking, no ads.
            <br />
            An experiment by <a href="https://zemmyang.com" style={{ color: 'var(--color-accent)' }}>Zemmy Ang</a>.

            <br />
            <a href="https://github.com/zemmyang/galim" style={{ color: 'var(--color-accent)' }}>Github page.</a>.
            
        </footer>
    )
}

export function Main() {
    const [locations, setLocations] = useState<WeatherProps[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<string[]>(() => loadPreferences().favorites);

    useEffect(() => {

        const loadLocations = () => {
            try {
                const lines = locationsCSV.trim().split('\n').slice(1);
                const locationData = lines.filter(line => line.trim()).map(line => {
                    const [name, slug, latitude, longitude] = line.split(',').map(item => item.trim());
                    return {
                        name: name,
                        slug: slug,
                        latitude: parseFloat(latitude),
                        longitude: parseFloat(longitude)
                    };
                });
                
                setLocations(locationData);
                setError(null);
            } catch (error) {
                console.error('Error parsing locations CSV:', error);
                setError(`Failed to load locations: ${error instanceof Error ? error.message : 'Unknown error'}`);
                setLocations([]);
            }
        };

        loadLocations();
    }, []);

    // Fetch weather data for all locations
    const { weatherData, loading: weatherLoading } = useWeatherForLocations(locations);

    const handleToggleFavorite = (slug: string) => {
        const newState = toggleFavoriteInPreferences(slug);
        setFavorites(prev => newState ? [...prev, slug] : prev.filter(s => s !== slug));
        return newState;
    };

    // Sort locations so favorites float to the top
    const sortedLocations = [...locations].map((location, index) => ({ location, index }));
    sortedLocations.sort((a, b) => {
        const aFav = favorites.includes(a.location.slug) ? 0 : 1;
        const bFav = favorites.includes(b.location.slug) ? 0 : 1;
        return aFav - bFav;
    });

    return (
        <main>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {error ? (
                    <Row>
                        <Col>
                            <div className="error-message">
                                {error}
                            </div>
                        </Col>
                    </Row>
                ) : weatherLoading ? (
                    <Row>
                        <Col>
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                Loading weather data...
                            </div>
                        </Col>
                    </Row>
                ) : (
                    <Row>
                        {sortedLocations.map(({ location, index }) => (
                            <Col xs={12} md={4} key={location.slug}>
                                <WeatherCard 
                                    latitude={location.latitude} 
                                    longitude={location.longitude} 
                                    name={location.name} 
                                    slug={location.slug}
                                    weatherData={weatherData[index]}
                                    onToggleFavorite={handleToggleFavorite}
                                />
                            </Col>
                        ))}
                    </Row>
                )}
            </div>
        </main>
    )
}

interface WeatherCardProps extends WeatherProps {
    weatherData?: {
        temperature_2m: number;
        wind_speed_10m: number;
        wind_direction_10m: number;
        weather_code: number;
    } | null;
    onToggleFavorite?: (slug: string) => boolean;
}

export function WeatherCard ({ name, slug, weatherData, onToggleFavorite }: WeatherCardProps) {
    const [isFavorite, setIsFavorite] = useState(() => {
        const preferences = loadPreferences();
        return preferences.favorites.includes(slug);
    });

    const toggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        if (onToggleFavorite) {
            const newState = onToggleFavorite(slug);
            setIsFavorite(newState);
        } else {
            const newState = toggleFavoriteInPreferences(slug);
            setIsFavorite(newState);
        }
    };

    return (
        <div className="card" style={{ position: 'relative' }}>
            <button 
                onClick={toggleFavorite}
                className="card-favorite-icon"
                style={{ color: isFavorite ? '#FFD700' : '#ccc' }}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
                <FontAwesomeIcon icon={isFavorite ? faStarSolid : faStarRegular} />
            </button>
            <a href={`/${slug}`}><h2 className="card-title">{ name }</h2></a>
            {weatherData ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="card-description" style={{ flex: 1 }}>
                        <p style={{ margin: '0.25rem 0' }}>{getWeatherDescription(weatherData.weather_code)}</p>
                        <p style={{ margin: '0.25rem 0' }}>Wind: {Math.round(weatherData.wind_speed_10m)} km/h<WindDirectionArrow direction={weatherData.wind_direction_10m} /></p> 
                        
                    </div>
                    <div className="card-temperature">
                        {Math.round(weatherData.temperature_2m)}°C
                    </div>
                </div>
            ) : (
                <p className="card-description">Loading weather...</p>
            )}
        </div>
    )
}

function WindDirectionArrow({ direction }: { direction: number }) {
    return (
        <span style={{ 
            display: 'inline-block',
            transform: `rotate(${direction}deg)`, 
            fontSize: '1rem',
            color: 'var(--color-accent)',
            marginLeft: '0.5rem'
            }}><FontAwesomeIcon icon={faArrowDown} /></span>
    )
}