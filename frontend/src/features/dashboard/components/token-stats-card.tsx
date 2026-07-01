import { useState } from 'react';
import { BarChart4 } from 'lucide-react';
import { IconInfoCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/utils/format-number';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTokenStats } from '../data/dashboard';

type TimeRange = 'allTime' | 'thisMonth' | 'thisWeek' | 'thisDay';

function formatLastUpdated(timestamp: string | null, locale: string): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

interface LastUpdatedInfoProps {
  lastUpdated: string | null;
  locale: string;
  t: (key: string, options?: Record<string, string>) => string;
}

function LastUpdatedInfo({ lastUpdated, locale, t }: LastUpdatedInfoProps) {
  if (!lastUpdated) return null;

  const formattedTime = formatLastUpdated(lastUpdated, locale);
  const label = t('dashboard.stats.updated', { time: formattedTime });

  return (
    <>
      <div className="hidden sm:block">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <IconInfoCircle className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <span>{label}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="sm:hidden">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <IconInfoCircle className="h-5 w-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-fit">
            <span className="text-sm">{label}</span>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}

function formatTokenToYi(value: number): string {
  const yi = value / 100_000_000;
  if (yi >= 1) {
    const raw = yi.toFixed(2).replace(/\.?0+$/, '');
    return `≈${raw}亿`;
  }
  return '';
}

/**
 * KPI label — small, muted, uppercase for that Apple/Stripe look
 */
function KpiLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
      {children}
    </span>
  );
}

/**
 * KPI value — prominent, tabular-nums, tight tracking
 */
function KpiValue({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-sm font-semibold tabular-nums tracking-tight ${className}`}>
      {children}
    </span>
  );
}

export function TokenStatsCard() {
  const { t, i18n } = useTranslation();
  const { data: stats, isLoading, error } = useTokenStats();
  const [timeRange, setTimeRange] = useState<TimeRange>('thisDay');

  if (isLoading) {
    return (
      <Card className="min-w-0">
        <CardHeader className="flex flex-wrap items-start sm:items-center justify-between gap-2 pb-2">
          <Skeleton className="skeleton-shimmer h-5 w-[120px]" />
          <Skeleton className="skeleton-shimmer h-5 w-[200px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="skeleton-shimmer h-8 w-[120px]" />
            <Skeleton className="skeleton-shimmer h-3 w-[60px]" />
            <div className="grid grid-cols-3 gap-4 pt-1">
              <Skeleton className="skeleton-shimmer h-5 w-[80px]" />
              <Skeleton className="skeleton-shimmer h-5 w-[80px]" />
              <Skeleton className="skeleton-shimmer h-5 w-[80px]" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="hover-card min-w-0">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-blue-500/10 ring-1 ring-violet-500/10 shrink-0">
              <BarChart4 className="h-4 w-4 text-violet-500" />
            </div>
            <CardTitle className="text-sm font-semibold tracking-tight truncate">
              {t('dashboard.cards.tokenStats')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">{t('common.loadError')}</div>
        </CardContent>
      </Card>
    );
  }

  const getTokens = (range: TimeRange) => {
    if (range === 'allTime') {
      return {
        input: stats?.totalInputTokensAllTime || 0,
        output: stats?.totalOutputTokensAllTime || 0,
        cached: stats?.totalCachedTokensAllTime || 0,
      };
    }
    if (range === 'thisDay') {
      return {
        input: stats?.totalInputTokensToday || 0,
        output: stats?.totalOutputTokensToday || 0,
        cached: stats?.totalCachedTokensToday || 0,
      };
    }
    if (range === 'thisMonth') {
      return {
        input: stats?.totalInputTokensThisMonth || 0,
        output: stats?.totalOutputTokensThisMonth || 0,
        cached: stats?.totalCachedTokensThisMonth || 0,
      };
    }
    return {
      input: stats?.totalInputTokensThisWeek || 0,
      output: stats?.totalOutputTokensThisWeek || 0,
      cached: stats?.totalCachedTokensThisWeek || 0,
    };
  };

  const tokens = getTokens(timeRange);
  const total = tokens.input + tokens.output;
  const yiText = formatTokenToYi(total);

  return (
    <Card className="hover-card min-w-0">
      <CardHeader className="flex flex-wrap items-start sm:items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-blue-500/10 ring-1 ring-violet-500/10 shrink-0">
            <BarChart4 className="h-4 w-4 text-violet-500" />
          </div>
          <CardTitle className="text-sm font-semibold tracking-tight">
            {t('dashboard.cards.tokenStats')}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <TabsList className="h-7 p-0.5 rounded-lg bg-muted/60">
              <TabsTrigger value="allTime" className="h-6 px-2.5 text-[11px] rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                {t('dashboard.stats.all')}
              </TabsTrigger>
              <TabsTrigger value="thisMonth" className="h-6 px-2.5 text-[11px] rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                {t('dashboard.stats.month')}
              </TabsTrigger>
              <TabsTrigger value="thisWeek" className="h-6 px-2.5 text-[11px] rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                {t('dashboard.stats.week')}
              </TabsTrigger>
              <TabsTrigger value="thisDay" className="h-6 px-2.5 text-[11px] rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                {t('dashboard.stats.day')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {timeRange === 'allTime' && (
            <LastUpdatedInfo
              lastUpdated={stats?.lastUpdated ?? null}
              locale={i18n.language}
              t={t}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Hero number */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                {total.toLocaleString()}
              </span>
              {yiText && (
                <span className="text-sm font-medium text-muted-foreground">{yiText}</span>
              )}
            </div>
            <KpiLabel>{t('dashboard.stats.totalTokens')}</KpiLabel>
          </div>

          {/* Sub-metrics */}
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border/40">
            <div className="space-y-0.5">
              <KpiValue>{tokens.input.toLocaleString()}</KpiValue>
              <KpiLabel>{t('dashboard.stats.input')}</KpiLabel>
            </div>
            <div className="space-y-0.5">
              <KpiValue>{tokens.output.toLocaleString()}</KpiValue>
              <KpiLabel>{t('dashboard.stats.output')}</KpiLabel>
            </div>
            <div className="space-y-0.5">
              <KpiValue className="text-muted-foreground">{tokens.cached.toLocaleString()}</KpiValue>
              <KpiLabel>{t('dashboard.stats.cached')}</KpiLabel>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
