import { fetchWeatherApi } from 'openmeteo';
import type { WeatherProps } from './utils';
import { useTheme, getCardinalDirection } from './utils';
import { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';


const url = "https://marine-api.open-meteo.com/v1/marine";


export interface HourlyMarineData {
    time: Date[];
    wave_height: number[];
    sea_surface_temperature: number[];
    wave_direction: number[];
    wave_period: number[];
    swell_wave_height: number[];
    swell_wave_direction: number[];
    swell_wave_period: number[];
    wind_wave_height: number[];
    wind_wave_direction: number[];
    wind_wave_period: number[];
}

export function useHourlyMarine(latitude: number, longitude: number) {
    const [marineData, setMarineData] = useState<HourlyMarineData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        const fetchData = async () => {
            const params = {
                "latitude": latitude,
                "longitude": longitude,
                "hourly": [
                    "wave_height",
                    "sea_surface_temperature",
                    "wave_direction",
                    "wave_period",
                    "swell_wave_height",
                    "swell_wave_direction",
                    "swell_wave_period",
                    "wind_wave_height",
                    "wind_wave_direction",
                    "wind_wave_period",
                ],
                "models": "best_match",
                "cell_selection": "sea",
                "timezone": "auto",
            };
            const responses = await fetchWeatherApi(url, params);
            const response = responses[0];
            const utcOffsetSeconds = response.utcOffsetSeconds();
            const hourly = response.hourly()!;

            const data: HourlyMarineData = {
                time: [...Array((Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval())].map(
                    (_, i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
                ),
                wave_height: Array.from(hourly.variables(0)!.valuesArray() || []),
                sea_surface_temperature: Array.from(hourly.variables(1)!.valuesArray() || []),
                wave_direction: Array.from(hourly.variables(2)!.valuesArray() || []),
                wave_period: Array.from(hourly.variables(3)!.valuesArray() || []),
                swell_wave_height: Array.from(hourly.variables(4)!.valuesArray() || []),
                swell_wave_direction: Array.from(hourly.variables(5)!.valuesArray() || []),
                swell_wave_period: Array.from(hourly.variables(6)!.valuesArray() || []),
                wind_wave_height: Array.from(hourly.variables(7)!.valuesArray() || []),
                wind_wave_direction: Array.from(hourly.variables(8)!.valuesArray() || []),
                wind_wave_period: Array.from(hourly.variables(9)!.valuesArray() || []),
            };

            if (isMounted) {
                setMarineData(data);
                setLoading(false);
            }
        };

        fetchData().catch(err => {
            if (isMounted) {
                setError(err);
                setLoading(false);
            }
        });

        return () => { isMounted = false; };
    }, [latitude, longitude]);

    return { marineData, loading, error };
}

// Swimmer-relevant: sea surface temperature
export function SwimmerMarineForecast({ latitude, longitude }: WeatherProps) {
    const { marineData, loading, error } = useHourlyMarine(latitude, longitude);
    const theme = useTheme();

    const plotColors = theme === 'light'
        ? { plotBg: '#f9f9f9', gridColor: '#e0e0e0', fontColor: '#57606f' }
        : { plotBg: '#1e2530', gridColor: '#2f3640', fontColor: '#b2bec3' };

    if (loading) return <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading marine data...</p>;
    if (error) return <p style={{ color: 'var(--color-warning)', textAlign: 'center' }}>Error loading marine data: {error.message}</p>;
    if (!marineData) return null;

    const xRange = [marineData.time[0], marineData.time[marineData.time.length - 1]];

    return (
        <div>
            <h2 style={{
                fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', marginBottom: '0.25rem'
            }}>Sea Conditions</h2>

            {/* Sea Surface Temperature */}
            <div style={{ marginTop: '2rem' }}>
                <Plot
                    data={[{
                        x: marineData.time,
                        y: marineData.sea_surface_temperature,
                        type: 'scatter', mode: 'lines+markers',
                        name: 'Sea Surface Temp',
                        line: { color: '#e17055', width: 2 },
                        marker: { size: 4 },
                        hovertemplate: '<b>%{x}</b><br>SST: %{y:.1f}°C<extra></extra>',
                    }]}
                    layout={{
                        title: { text: 'Sea Surface Temperature (°C)', font: { color: plotColors.fontColor } },
                        xaxis: { title: { text: 'Time', font: { color: plotColors.fontColor } }, tickangle: -45, tickfont: { color: plotColors.fontColor }, gridcolor: plotColors.gridColor, fixedrange: true, range: xRange },
                        yaxis: { title: { text: '°C', font: { color: plotColors.fontColor } }, tickfont: { color: plotColors.fontColor }, gridcolor: plotColors.gridColor, fixedrange: true },
                        autosize: true, margin: { l: 60, r: 40, t: 60, b: 100 },
                        hovermode: 'closest', plot_bgcolor: plotColors.plotBg, paper_bgcolor: 'transparent',
                    }}
                    config={{ responsive: true, displayModeBar: false, scrollZoom: false }}
                    style={{ width: '100%', height: '400px' }}
                    useResizeHandler={true}
                />
            </div>

            {/* Wave Height (general sea state) */}
            <div style={{ marginTop: '2rem' }}>
                <Plot
                    data={[{
                        x: marineData.time,
                        y: marineData.wave_height,
                        type: 'scatter', mode: 'lines',
                        name: 'Wave Height',
                        fill: 'tozeroy',
                        line: { color: '#0984e3', width: 2 },
                        hovertemplate: '<b>%{x}</b><br>Wave Height: %{y:.2f} m<extra></extra>',
                    }]}
                    layout={{
                        title: { text: 'Wave Height (m)', font: { color: plotColors.fontColor } },
                        xaxis: { title: { text: 'Time', font: { color: plotColors.fontColor } }, tickangle: -45, tickfont: { color: plotColors.fontColor }, gridcolor: plotColors.gridColor, fixedrange: true, range: xRange },
                        yaxis: { title: { text: 'Height (m)', font: { color: plotColors.fontColor } }, tickfont: { color: plotColors.fontColor }, gridcolor: plotColors.gridColor, fixedrange: true },
                        autosize: true, margin: { l: 60, r: 40, t: 60, b: 100 },
                        hovermode: 'closest', plot_bgcolor: plotColors.plotBg, paper_bgcolor: 'transparent',
                    }}
                    config={{ responsive: true, displayModeBar: false, scrollZoom: false }}
                    style={{ width: '100%', height: '400px' }}
                    useResizeHandler={true}
                />
            </div>
        </div>
    );
}

// Surfer-relevant: swell height, period, direction, wind waves
export function SurferMarineForecast({ latitude, longitude }: WeatherProps) {
    const { marineData, loading, error } = useHourlyMarine(latitude, longitude);
    const theme = useTheme();

    const plotColors = theme === 'light'
        ? { plotBg: '#f9f9f9', gridColor: '#e0e0e0', fontColor: '#57606f' }
        : { plotBg: '#1e2530', gridColor: '#2f3640', fontColor: '#b2bec3' };

    if (loading) return <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading marine data...</p>;
    if (error) return <p style={{ color: 'var(--color-warning)', textAlign: 'center' }}>Error loading marine data: {error.message}</p>;
    if (!marineData) return null;

    const xRange = [marineData.time[0], marineData.time[marineData.time.length - 1]];

    return (
        <div>
            <h2 style={{
                fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', marginBottom: '0.25rem'
            }}>Surf Conditions</h2>

            {/* Swell & Wind Wave Height */}
            <div style={{ marginTop: '2rem' }}>
                <Plot
                    data={[
                        {
                            x: marineData.time,
                            y: marineData.swell_wave_height,
                            type: 'scatter', mode: 'lines',
                            name: 'Swell Height',
                            line: { color: '#6c5ce7', width: 2 },
                            hovertemplate: '<b>%{x}</b><br>Swell: %{y:.2f} m<extra></extra>',
                        },
                        {
                            x: marineData.time,
                            y: marineData.wind_wave_height,
                            type: 'scatter', mode: 'lines',
                            name: 'Wind Wave Height',
                            line: { color: '#00cec9', width: 2, dash: 'dash' },
                            hovertemplate: '<b>%{x}</b><br>Wind Wave: %{y:.2f} m<extra></extra>',
                        },
                        {
                            x: marineData.time,
                            y: marineData.wave_height,
                            type: 'scatter', mode: 'lines',
                            name: 'Total Wave Height',
                            line: { color: '#0984e3', width: 2 },
                            fill: 'tozeroy',
                            fillcolor: 'rgba(9, 132, 227, 0.1)',
                            hovertemplate: '<b>%{x}</b><br>Total: %{y:.2f} m<extra></extra>',
                        },
                    ]}
                    layout={{
                        title: { text: 'Wave Heights (m)', font: { color: plotColors.fontColor } },
                        xaxis: { title: { text: 'Time', font: { color: plotColors.fontColor } }, tickangle: -45, tickfont: { color: plotColors.fontColor }, gridcolor: plotColors.gridColor, fixedrange: true, range: xRange },
                        yaxis: { title: { text: 'Height (m)', font: { color: plotColors.fontColor } }, tickfont: { color: plotColors.fontColor }, gridcolor: plotColors.gridColor, fixedrange: true },
                        autosize: true, margin: { l: 60, r: 40, t: 60, b: 100 },
                        hovermode: 'closest', plot_bgcolor: plotColors.plotBg, paper_bgcolor: 'transparent',
                        showlegend: true, legend: { x: 0, y: 1.1, orientation: 'h', font: { color: plotColors.fontColor } },
                    }}
                    config={{ responsive: true, displayModeBar: false, scrollZoom: false }}
                    style={{ width: '100%', height: '400px' }}
                    useResizeHandler={true}
                />
            </div>

            {/* Swell & Wave Period */}
            <div style={{ marginTop: '2rem' }}>
                <Plot
                    data={[
                        {
                            x: marineData.time,
                            y: marineData.swell_wave_period,
                            type: 'scatter', mode: 'lines',
                            name: 'Swell Period',
                            line: { color: '#6c5ce7', width: 2 },
                            hovertemplate: '<b>%{x}</b><br>Swell Period: %{y:.1f}s<extra></extra>',
                        },
                        {
                            x: marineData.time,
                            y: marineData.wave_period,
                            type: 'scatter', mode: 'lines',
                            name: 'Wave Period',
                            line: { color: '#0984e3', width: 2, dash: 'dash' },
                            hovertemplate: '<b>%{x}</b><br>Wave Period: %{y:.1f}s<extra></extra>',
                        },
                    ]}
                    layout={{
                        title: { text: 'Wave Period (seconds)', font: { color: plotColors.fontColor } },
                        xaxis: { title: { text: 'Time', font: { color: plotColors.fontColor } }, tickangle: -45, tickfont: { color: plotColors.fontColor }, gridcolor: plotColors.gridColor, fixedrange: true, range: xRange },
                        yaxis: { title: { text: 'Period (s)', font: { color: plotColors.fontColor } }, tickfont: { color: plotColors.fontColor }, gridcolor: plotColors.gridColor, fixedrange: true },
                        autosize: true, margin: { l: 60, r: 40, t: 60, b: 100 },
                        hovermode: 'closest', plot_bgcolor: plotColors.plotBg, paper_bgcolor: 'transparent',
                        showlegend: true, legend: { x: 0, y: 1.1, orientation: 'h', font: { color: plotColors.fontColor } },
                    }}
                    config={{ responsive: true, displayModeBar: false, scrollZoom: false }}
                    style={{ width: '100%', height: '400px' }}
                    useResizeHandler={true}
                />
            </div>

            {/* Swell Direction */}
            <div style={{ marginTop: '2rem' }}>
                <Plot
                    data={[
                        {
                            x: marineData.time,
                            y: marineData.swell_wave_direction,
                            type: 'scatter', mode: 'lines',
                            name: 'Swell Direction',
                            line: { color: '#6c5ce7', width: 2 },
                            text: marineData.swell_wave_direction.map(d => getCardinalDirection(d)),
                            hovertemplate: '<b>%{x}</b><br>Swell Dir: %{y:.0f}° %{text}<extra></extra>',
                        },
                        {
                            x: marineData.time,
                            y: marineData.wave_direction,
                            type: 'scatter', mode: 'lines',
                            name: 'Wave Direction',
                            line: { color: '#0984e3', width: 2, dash: 'dash' },
                            text: marineData.wave_direction.map(d => getCardinalDirection(d)),
                            hovertemplate: '<b>%{x}</b><br>Wave Dir: %{y:.0f}° %{text}<extra></extra>',
                        },
                    ]}
                    layout={{
                        title: { text: 'Wave & Swell Direction (°)', font: { color: plotColors.fontColor } },
                        xaxis: { title: { text: 'Time', font: { color: plotColors.fontColor } }, tickangle: -45, tickfont: { color: plotColors.fontColor }, gridcolor: plotColors.gridColor, fixedrange: true, range: xRange },
                        yaxis: { title: { text: 'Direction (°)', font: { color: plotColors.fontColor } }, tickfont: { color: plotColors.fontColor }, gridcolor: plotColors.gridColor, fixedrange: true, range: [0, 360], tickvals: [0, 45, 90, 135, 180, 225, 270, 315, 360], ticktext: ['N (0°)', 'NE (45°)', 'E (90°)', 'SE (135°)', 'S (180°)', 'SW (225°)', 'W (270°)', 'NW (315°)', 'N (360°)'] },
                        autosize: true, margin: { l: 60, r: 40, t: 60, b: 100 },
                        hovermode: 'closest', plot_bgcolor: plotColors.plotBg, paper_bgcolor: 'transparent',
                        showlegend: true, legend: { x: 0, y: 1.1, orientation: 'h', font: { color: plotColors.fontColor } },
                    }}
                    config={{ responsive: true, displayModeBar: false, scrollZoom: false }}
                    style={{ width: '100%', height: '400px' }}
                    useResizeHandler={true}
                />
            </div>
        </div>
    );
}