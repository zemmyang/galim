import { useState, useEffect } from 'react';

export interface WeatherProps {
    latitude: number;
    longitude: number;
    name: string;
    slug: string;
}

export function useTheme() {
    const [theme, setTheme] = useState<'light' | 'dark'>(
        () => (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'dark'
    );

    useEffect(() => {
        const observer = new MutationObserver(() => {
            const t = document.documentElement.getAttribute('data-theme') as 'light' | 'dark';
            setTheme(t || 'dark');
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    return theme;
}


// convert Open-Meteo weather codes to a human-readable description
export function getWeatherDescription(code: number): string {
    const weatherCodes: { [key: number]: string } = {
        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Fog", 48: "Depositing rime fog", 51: "Drizzle: Light", 53: "Drizzle: Moderate",
        55: "Drizzle: Dense", 56: "Freezing Drizzle: Light", 57: "Freezing Drizzle: Dense",
        61: "Rain: Slight", 63: "Rain: Moderate", 65: "Rain: Heavy", 66: "Freezing Rain: Light",
        67: "Freezing Rain: Heavy", 71: "Snow fall: Slight", 73: "Snow fall: Moderate",
        75: "Snow fall: Heavy", 77: "Snow grains", 80: "Rain showers: Slight",
        81: "Rain showers: Moderate", 82: "Rain showers: Violent", 85: "Snow showers: Slight",
        86: "Snow showers: Heavy", 95: "Thunderstorm: Slight or moderate",
        96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail"
    };
    return weatherCodes[code] || "Unknown weather condition";
}

export function getCardinalDirection(degrees: number): string {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const i = Math.round(((degrees % 360) + 360) % 360 / 22.5) % 16;
    return dirs[i];
}
