'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { NearbyCompetitor } from '@/lib/google-places';

type Props = {
  myName: string;
  myRating: number;
  myReviewCount: number;
  competitors: NearbyCompetitor[];
};

export default function CompetitorSnapshot({ myName, myRating, myReviewCount, competitors }: Props) {
  if (competitors.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Link your Google Business Profile to see competitor data
      </div>
    );
  }

  const chartData = [
    { name: truncate(myName, 15), rating: myRating, reviews: myReviewCount, isYou: true },
    ...competitors.slice(0, 5).map((c) => ({
      name: truncate(c.name, 15),
      rating: c.rating,
      reviews: c.reviewCount,
      isYou: false,
    })),
  ].sort((a, b) => b.rating - a.rating);

  return (
    <div className="space-y-4">
      {/* Rating comparison */}
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
          Google Rating
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 10 }}>
            <XAxis type="number" domain={[0, 5]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value) => [`${value}`, 'Rating']}
            />
            <Bar dataKey="rating" radius={[0, 4, 4, 0]} barSize={16}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.isYou ? '#06b6d4' : 'rgba(255,255,255,0.15)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Review count table */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
          Review Count
        </p>
        {chartData.map((entry, i) => (
          <div
            key={i}
            className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs ${
              entry.isYou ? 'bg-cyan-500/10 text-cyan-400' : 'text-muted-foreground'
            }`}
          >
            <span className="truncate flex-1">{entry.name}</span>
            <span className="font-mono">{entry.reviews}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '...' : str;
}
