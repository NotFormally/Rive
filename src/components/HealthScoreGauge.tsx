'use client';

import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { getGradeColor, getGradeLabel, getConfidenceLabel } from '@/lib/health-score';
import type { HealthGrade } from '@/lib/health-score';

type Props = {
  score: number;
  grade: HealthGrade;
  confidence: number;
  size?: number;
};

const GRADE_FILL: Record<HealthGrade, string> = {
  A: '#10b981',
  B: '#06b6d4',
  C: '#f59e0b',
  D: '#f97316',
  F: '#ef4444',
};

export default function HealthScoreGauge({ score, grade, confidence, size = 220 }: Props) {
  const data = [{ value: score, fill: GRADE_FILL[grade] }];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <RadialBarChart
          width={size}
          height={size}
          innerRadius="70%"
          outerRadius="100%"
          data={data}
          startAngle={210}
          endAngle={-30}
          barSize={14}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: 'rgba(255,255,255,0.05)' }}
            dataKey="value"
            cornerRadius={10}
            angleAxisId={0}
          />
        </RadialBarChart>

        {/* Center text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${getGradeColor(grade)}`}>{score}</span>
          <span className={`text-lg font-semibold ${getGradeColor(grade)}`}>{grade}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {getGradeLabel(grade)}
          </span>
        </div>
      </div>

      <div className="text-center">
        <span className="text-xs text-muted-foreground">
          {getConfidenceLabel(confidence)}
        </span>
        <div className="w-24 h-1 bg-white/10 rounded-full mt-1 mx-auto overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${confidence * 100}%`,
              backgroundColor: GRADE_FILL[grade],
            }}
          />
        </div>
      </div>
    </div>
  );
}
