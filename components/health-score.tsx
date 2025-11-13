/**
 * 사이트 Health 점수 표시 컴포넌트
 */

'use client';

import { getHealthScoreColor, getHealthScoreBgColor } from '@/lib/seo/health-score';

interface HealthScoreProps {
  score: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export default function HealthScore({ score, high, medium, low, total }: HealthScoreProps) {
  const scoreColor = getHealthScoreColor(score);
  const bgColor = getHealthScoreBgColor(score);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">사이트 Health</h2>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">점수</span>
          <span className={`text-3xl font-bold ${scoreColor}`}>{score}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full transition-all duration-300 ${bgColor.replace('bg-', 'bg-')}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{high}</div>
          <div className="text-xs text-gray-600">High</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{medium}</div>
          <div className="text-xs text-gray-600">Medium</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{low}</div>
          <div className="text-xs text-gray-600">Low</div>
        </div>
      </div>

      {total === 0 && (
        <div className="mt-4 rounded-md bg-green-50 p-3 text-center">
          <p className="text-sm text-green-800">발견된 이슈가 없습니다! 🎉</p>
        </div>
      )}
    </div>
  );
}

