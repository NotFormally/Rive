'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type HistoryPoint = {
  recorded_at: string;
  total_score: number;
};

type Props = {
  history: HistoryPoint[];
  forecast: number[];
};

export default function HealthScoreTrend({ history, forecast }: Props) {
  // Build chart data: history (solid) + forecast (dashed)
  const chartData = history.map((h) => ({
    date: new Date(h.recorded_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    score: h.total_score,
    forecast: null as number | null,
  }));

  // Add forecast points
  if (forecast.length > 0 && history.length > 0) {
    const lastDate = new Date(history[history.length - 1].recorded_at);
    const lastScore = history[history.length - 1].total_score;

    // Bridge point
    chartData[chartData.length - 1].forecast = lastScore;

    for (let i = 0; i < forecast.length; i++) {
      const d = new Date(lastDate);
      d.setDate(d.getDate() + 7 * (i + 1));
      chartData.push({
        date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        score: null as unknown as number,
        forecast: forecast[i],
      });
    }
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Score history will appear after your first calculation
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fill: '#64748b', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#64748b', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={30}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke="#06b6d4"
          strokeWidth={2}
          fill="url(#scoreGrad)"
          connectNulls={false}
          dot={{ r: 3, fill: '#06b6d4' }}
        />
        <Area
          type="monotone"
          dataKey="forecast"
          stroke="#a78bfa"
          strokeWidth={2}
          strokeDasharray="5 5"
          fill="url(#forecastGrad)"
          connectNulls={false}
          dot={{ r: 3, fill: '#a78bfa' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
