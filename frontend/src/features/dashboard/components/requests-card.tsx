import { Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/utils/format-number';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '../data/dashboard';

function KpiLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
      {children}
    </span>
  );
}

function KpiValue({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-sm font-semibold tabular-nums tracking-tight ${className}`}>
      {children}
    </span>
  );
}

export function RequestsCard() {
  const { t } = useTranslation();
  const { data: stats, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="skeleton-shimmer h-5 w-[120px]" />
          <Skeleton className="skeleton-shimmer h-4 w-4 rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="skeleton-shimmer h-8 w-[80px]" />
            <Skeleton className="skeleton-shimmer h-3 w-[100px]" />
            <div className="grid grid-cols-3 gap-4 pt-1">
              <Skeleton className="skeleton-shimmer h-5 w-[60px]" />
              <Skeleton className="skeleton-shimmer h-5 w-[60px]" />
              <Skeleton className="skeleton-shimmer h-5 w-[60px]" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="hover-card min-w-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 ring-1 ring-emerald-500/10">
              <Activity className="h-4 w-4 text-emerald-500" />
            </div>
            <CardTitle className="text-sm font-semibold tracking-tight">
              {t('dashboard.stats.requests')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">{t('common.loadError')}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover-card min-w-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 ring-1 ring-emerald-500/10">
            <Activity className="h-4 w-4 text-emerald-500" />
          </div>
          <CardTitle className="text-sm font-semibold tracking-tight">
            {t('dashboard.stats.requests')}
          </CardTitle>
        </div>
        <div className="pulse-dot" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Hero number — Today */}
          <div>
            <div className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
              {formatNumber(stats?.requestStats?.requestsToday || 0)}
            </div>
            <KpiLabel>{t('dashboard.stats.today')}</KpiLabel>
          </div>

          {/* Sub-metrics */}
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border/40">
            <div className="space-y-0.5">
              <KpiValue>{formatNumber(stats?.totalRequests || 0)}</KpiValue>
              <KpiLabel>{t('dashboard.stats.all')}</KpiLabel>
            </div>
            <div className="space-y-0.5">
              <KpiValue>{formatNumber(stats?.requestStats?.requestsThisWeek || 0)}</KpiValue>
              <KpiLabel>{t('dashboard.stats.thisWeek')}</KpiLabel>
            </div>
            <div className="space-y-0.5">
              <KpiValue>{formatNumber(stats?.requestStats?.requestsThisMonth || 0)}</KpiValue>
              <KpiLabel>{t('dashboard.stats.thisMonth')}</KpiLabel>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
