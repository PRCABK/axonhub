import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/utils/format-number';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '../data/dashboard';

/**
 * Circular progress ring — Apple Watch-style gauge.
 * Uses SVG stroke-dasharray for the arc.
 */
function CircularGauge({ value }: { value: number }) {
  // value: 0–100
  const clamped = Math.min(100, Math.max(0, value));
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  // Color mapping: red (<80) → amber (80–95) → green (>95)
  const strokeColor =
    clamped >= 95
      ? 'var(--chart-4)'
      : clamped >= 80
        ? 'var(--chart-5)'
        : 'var(--destructive)';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
        {/* Background track */}
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="circular-progress"
        />
      </svg>
      {/* Center text */}
      <span className="absolute text-lg font-bold tabular-nums tracking-tight">
        {clamped.toFixed(0)}
        <span className="text-[10px] font-semibold text-muted-foreground">%</span>
      </span>
    </div>
  );
}

export function SuccessRateCard() {
  const { t } = useTranslation();
  const { data: stats, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="skeleton-shimmer h-5 w-[120px]" />
          <Skeleton className="skeleton-shimmer h-4 w-4" />
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Skeleton className="skeleton-shimmer h-[88px] w-[88px] rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="skeleton-shimmer h-4 w-[100px]" />
            <Skeleton className="skeleton-shimmer h-4 w-[80px]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="hover-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/10 ring-1 ring-blue-500/10">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
            </div>
            <CardTitle className="text-sm font-semibold tracking-tight">
              {t('dashboard.cards.successRate')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">{t('common.loadError')}</div>
        </CardContent>
      </Card>
    );
  }

  const successRate =
    stats && stats.totalRequests > 0
      ? ((stats.totalRequests - stats.failedRequests) / stats.totalRequests) * 100
      : 100;

  return (
    <Card className="hover-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/10 ring-1 ring-blue-500/10">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </div>
          <CardTitle className="text-sm font-semibold tracking-tight">
            {t('dashboard.cards.successRate')}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-5">
          <CircularGauge value={successRate} />
          <div className="space-y-2">
            <div>
              <div className="text-sm font-semibold tabular-nums tracking-tight">
                {formatNumber(stats?.totalRequests || 0)}
              </div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                {t('dashboard.stats.total')}
              </span>
            </div>
            <div>
              <div className="text-sm font-semibold tabular-nums tracking-tight text-red-500">
                {formatNumber(stats?.failedRequests || 0)}
              </div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                {t('dashboard.stats.failedRequests')}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
