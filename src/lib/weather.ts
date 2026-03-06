// =============================================================================
// Weather — Geocoding + Forecast for Le Baromètre
//
// Uses Google Geocoding API (address → coords) and Open-Meteo (free forecast).
// Server-side only.
// =============================================================================

const GEOCODE_BASE = 'https://maps.googleapis.com/maps/api/geocode/json';
const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GeoCoords = { lat: number; lng: number };

export type DailyForecast = {
  date: string;                 // YYYY-MM-DD
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;     // mm
  precipitationProbability: number; // %
  windSpeedMax: number;         // km/h
  sunrise: string;
  sunset: string;
};

export type CurrentWeather = {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  isDay: boolean;
};

export type WeatherData = {
  current: CurrentWeather;
  daily: DailyForecast[];
  coords: GeoCoords;
};

// ---------------------------------------------------------------------------
// WMO Weather Codes → labels & icons
// ---------------------------------------------------------------------------

export const WEATHER_LABELS: Record<number, { label: string; icon: string }> = {
  0:  { label: 'Ciel dégagé', icon: '☀️' },
  1:  { label: 'Principalement dégagé', icon: '🌤️' },
  2:  { label: 'Partiellement nuageux', icon: '⛅' },
  3:  { label: 'Couvert', icon: '☁️' },
  45: { label: 'Brouillard', icon: '🌫️' },
  48: { label: 'Brouillard givrant', icon: '🌫️' },
  51: { label: 'Bruine légère', icon: '🌦️' },
  53: { label: 'Bruine modérée', icon: '🌦️' },
  55: { label: 'Bruine forte', icon: '🌧️' },
  61: { label: 'Pluie légère', icon: '🌧️' },
  63: { label: 'Pluie modérée', icon: '🌧️' },
  65: { label: 'Pluie forte', icon: '🌧️' },
  66: { label: 'Pluie verglaçante légère', icon: '🌨️' },
  67: { label: 'Pluie verglaçante forte', icon: '🌨️' },
  71: { label: 'Neige légère', icon: '🌨️' },
  73: { label: 'Neige modérée', icon: '🌨️' },
  75: { label: 'Neige forte', icon: '❄️' },
  77: { label: 'Grains de neige', icon: '❄️' },
  80: { label: 'Averses légères', icon: '🌦️' },
  81: { label: 'Averses modérées', icon: '🌧️' },
  82: { label: 'Averses violentes', icon: '🌧️' },
  85: { label: 'Averses de neige légères', icon: '🌨️' },
  86: { label: 'Averses de neige fortes', icon: '❄️' },
  95: { label: 'Orage', icon: '⛈️' },
  96: { label: 'Orage avec grêle légère', icon: '⛈️' },
  99: { label: 'Orage avec grêle forte', icon: '⛈️' },
};

export function getWeatherLabel(code: number): { label: string; icon: string } {
  return WEATHER_LABELS[code] ?? { label: 'Inconnu', icon: '❓' };
}

// ---------------------------------------------------------------------------
// Geocode address → coords (Google Geocoding API)
// ---------------------------------------------------------------------------

export async function geocodeAddress(address: string): Promise<GeoCoords | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    console.error('[Weather] Missing GOOGLE_PLACES_API_KEY');
    return null;
  }

  const url = `${GEOCODE_BASE}?address=${encodeURIComponent(address)}&key=${key}`;
  const res = await fetch(url, { next: { revalidate: 86400 } }); // cache 24h

  if (!res.ok) {
    console.error('[Weather] Geocoding failed:', res.status);
    return null;
  }

  const json = await res.json();
  const location = json.results?.[0]?.geometry?.location;
  if (!location) return null;

  return { lat: location.lat, lng: location.lng };
}

// ---------------------------------------------------------------------------
// Fetch weather forecast (Open-Meteo — free, no key needed)
// ---------------------------------------------------------------------------

export async function fetchForecast(coords: GeoCoords): Promise<WeatherData | null> {
  const params = new URLSearchParams({
    latitude: coords.lat.toString(),
    longitude: coords.lng.toString(),
    current: 'temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day',
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'sunrise',
      'sunset',
    ].join(','),
    timezone: 'auto',
    forecast_days: '7',
  });

  const res = await fetch(`${OPEN_METEO_BASE}?${params}`, {
    next: { revalidate: 1800 }, // cache 30 min
  });

  if (!res.ok) {
    console.error('[Weather] Open-Meteo failed:', res.status);
    return null;
  }

  const json = await res.json();

  const current: CurrentWeather = {
    temperature: json.current.temperature_2m,
    weatherCode: json.current.weather_code,
    windSpeed: json.current.wind_speed_10m,
    windDirection: json.current.wind_direction_10m,
    isDay: json.current.is_day === 1,
  };

  const daily: DailyForecast[] = json.daily.time.map((date: string, i: number) => ({
    date,
    weatherCode: json.daily.weather_code[i],
    tempMax: json.daily.temperature_2m_max[i],
    tempMin: json.daily.temperature_2m_min[i],
    precipitationSum: json.daily.precipitation_sum[i],
    precipitationProbability: json.daily.precipitation_probability_max[i],
    windSpeedMax: json.daily.wind_speed_10m_max[i],
    sunrise: json.daily.sunrise[i],
    sunset: json.daily.sunset[i],
  }));

  return { current, daily, coords };
}

// ---------------------------------------------------------------------------
// Service impact assessment — weather → restaurant ops
// ---------------------------------------------------------------------------

export type WeatherAlert = {
  type: 'rain' | 'storm' | 'cold' | 'heat' | 'snow' | 'wind';
  severity: 'advisory' | 'warning' | 'critical';
  day: string;
  message: string;
  recommendation: string;
};

export function analyzeServiceImpact(daily: DailyForecast[]): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  for (const day of daily) {
    const dayLabel = new Date(day.date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    // Heavy rain / storms
    if (day.weatherCode >= 95) {
      alerts.push({
        type: 'storm',
        severity: 'critical',
        day: day.date,
        message: `Orage prévu ${dayLabel}`,
        recommendation: 'Réduire les preps de 20-30%. Prévoir un afflux de livraisons. Vérifier la terrasse.',
      });
    } else if (day.precipitationSum > 15) {
      alerts.push({
        type: 'rain',
        severity: 'warning',
        day: day.date,
        message: `Fortes pluies ${dayLabel} (${day.precipitationSum.toFixed(0)} mm)`,
        recommendation: 'Anticiper 15-25% de couverts en moins. Renforcer les options livraison/emporter.',
      });
    } else if (day.precipitationProbability > 70 && day.precipitationSum > 5) {
      alerts.push({
        type: 'rain',
        severity: 'advisory',
        day: day.date,
        message: `Pluie probable ${dayLabel} (${day.precipitationProbability}%)`,
        recommendation: 'Préparer un plan terrasse de repli. Ajuster légèrement les quantités.',
      });
    }

    // Extreme cold
    if (day.tempMin < -5) {
      alerts.push({
        type: 'cold',
        severity: 'warning',
        day: day.date,
        message: `Grand froid ${dayLabel} (${day.tempMin.toFixed(0)}°C)`,
        recommendation: 'Préparer des plats réconfortants. Augmenter les soupes et boissons chaudes.',
      });
    }

    // Extreme heat
    if (day.tempMax > 35) {
      alerts.push({
        type: 'heat',
        severity: 'warning',
        day: day.date,
        message: `Canicule ${dayLabel} (${day.tempMax.toFixed(0)}°C)`,
        recommendation: 'Renforcer la chaîne du froid. Augmenter salades et desserts frais. Surveiller la DLC.',
      });
    }

    // Snow
    if ([71, 73, 75, 77, 85, 86].includes(day.weatherCode)) {
      alerts.push({
        type: 'snow',
        severity: 'warning',
        day: day.date,
        message: `Neige prévue ${dayLabel}`,
        recommendation: 'Réduire les preps de 25-40%. Risque de sous-effectif — confirmer les équipes.',
      });
    }

    // Strong wind
    if (day.windSpeedMax > 60) {
      alerts.push({
        type: 'wind',
        severity: 'warning',
        day: day.date,
        message: `Vents forts ${dayLabel} (${day.windSpeedMax.toFixed(0)} km/h)`,
        recommendation: 'Fermer la terrasse. Prévoir des baisses de fréquentation.',
      });
    }
  }

  return alerts;
}
