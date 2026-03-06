"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { getWeatherLabel, type DailyForecast, type CurrentWeather, type WeatherAlert } from "@/lib/weather";
import { DynamicFoodCostAlerts } from "@/components/food-cost/DynamicFoodCostAlerts";
import {
  CloudRain,
  Thermometer,
  Wind,
  AlertTriangle,
  Loader2,
  MapPin,
  Snowflake,
  Sun,
  CloudLightning,
  ShieldAlert,
  Info,
} from "lucide-react";

// =============================================================================
// Le Baromètre — Predictive Alerts (La Traversée, Zone IV)
// =============================================================================

type WeatherResponse = {
  current: CurrentWeather;
  daily: DailyForecast[];
  alerts: WeatherAlert[];
  address: string;
};

const SEVERITY_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  critical: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    icon: "text-red-500",
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    icon: "text-amber-500",
  },
  advisory: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    icon: "text-blue-500",
  },
};

const ALERT_ICONS: Record<string, React.ElementType> = {
  rain: CloudRain,
  storm: CloudLightning,
  cold: Snowflake,
  heat: Sun,
  snow: Snowflake,
  wind: Wind,
};

export function Barometre() {
  const t = useTranslations("Barometre");
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWithTimeout("/api/weather", { timeoutMs: 15000 });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur météo");
        return;
      }
      const data = await res.json();
      setWeather(data);
    } catch (err) {
      console.error("[Barometre]", err);
      setError("Impossible de charger les données météo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Current Weather */}
      {loading ? (
        <div className="bg-card rounded-2xl border border-border/50 p-8 flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="font-outfit text-muted-foreground text-sm">
            {t("loading")}
          </span>
        </div>
      ) : error ? (
        <div className="bg-card rounded-2xl border border-border/50 p-8 text-center">
          <Info className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-outfit text-muted-foreground text-sm">{error}</p>
          <p className="font-outfit text-muted-foreground/60 text-xs mt-2">
            {t("add_address_hint")}
          </p>
        </div>
      ) : weather ? (
        <>
          {/* Current conditions card */}
          <section className="bg-card backdrop-blur-2xl rounded-[2rem] border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.4)] overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 pointer-events-none" />
            <div className="p-6 md:p-8 relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Temperature */}
                <div className="flex items-center gap-4">
                  <div className="text-5xl md:text-6xl font-jakarta font-bold text-foreground tracking-tighter">
                    {getWeatherLabel(weather.current.weatherCode).icon}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl md:text-5xl font-jakarta font-bold text-foreground tracking-tight">
                        {Math.round(weather.current.temperature)}°
                      </span>
                    </div>
                    <p className="font-outfit text-sm text-muted-foreground mt-1">
                      {getWeatherLabel(weather.current.weatherCode).label}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-wrap gap-4 md:gap-6 md:ml-auto">
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-muted-foreground" />
                    <span className="font-plex-mono text-sm text-foreground">
                      {Math.round(weather.current.windSpeed)} km/h
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-outfit text-sm text-muted-foreground truncate max-w-[200px]">
                      {weather.address}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 7-Day Forecast */}
          <section>
            <h2 className="text-xs font-plex-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
              {t("forecast_title")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {weather.daily.map((day) => {
                const label = getWeatherLabel(day.weatherCode);
                const dayName = new Date(day.date).toLocaleDateString("fr-FR", {
                  weekday: "short",
                });
                const isToday =
                  day.date === new Date().toISOString().split("T")[0];

                return (
                  <div
                    key={day.date}
                    className={`bg-card rounded-xl border p-3 text-center transition-colors ${
                      isToday
                        ? "border-primary/50 shadow-[0_0_15px_rgba(0,229,255,0.1)]"
                        : "border-border/50"
                    }`}
                  >
                    <p
                      className={`font-plex-mono text-[10px] uppercase tracking-wider mb-2 ${
                        isToday ? "text-primary font-bold" : "text-muted-foreground"
                      }`}
                    >
                      {isToday ? t("today") : dayName}
                    </p>
                    <p className="text-2xl mb-1">{label.icon}</p>
                    <div className="flex items-center justify-center gap-1.5 font-plex-mono text-xs">
                      <span className="text-foreground font-semibold">
                        {Math.round(day.tempMax)}°
                      </span>
                      <span className="text-muted-foreground/50">/</span>
                      <span className="text-muted-foreground">
                        {Math.round(day.tempMin)}°
                      </span>
                    </div>
                    {day.precipitationProbability > 30 && (
                      <div className="flex items-center justify-center gap-1 mt-1.5">
                        <CloudRain className="w-3 h-3 text-blue-400" />
                        <span className="font-plex-mono text-[10px] text-blue-400">
                          {day.precipitationProbability}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Weather Alerts */}
          {weather.alerts.length > 0 && (
            <section>
              <h2 className="text-xs font-plex-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                {t("alerts_title")}
              </h2>
              <div className="space-y-3">
                {weather.alerts.map((alert, i) => {
                  const styles = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.advisory;
                  const IconComponent = ALERT_ICONS[alert.type] || AlertTriangle;

                  return (
                    <div
                      key={i}
                      className={`${styles.bg} border ${styles.border} rounded-xl p-4 md:p-5`}
                    >
                      <div className="flex items-start gap-3">
                        <IconComponent className={`w-5 h-5 ${styles.icon} shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-outfit font-semibold text-sm ${styles.text}`}>
                            {alert.message}
                          </h3>
                          <p className="font-outfit text-sm text-foreground/70 mt-1">
                            {alert.recommendation}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 font-plex-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${styles.bg} ${styles.text} border ${styles.border}`}
                        >
                          {alert.severity === "critical"
                            ? t("severity_critical")
                            : alert.severity === "warning"
                            ? t("severity_warning")
                            : t("severity_advisory")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      ) : null}

      {/* Food Cost Alerts (existing) */}
      <section>
        <h2 className="text-xs font-plex-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
          {t("cost_alerts_title")}
        </h2>
        <DynamicFoodCostAlerts />
      </section>
    </div>
  );
}
