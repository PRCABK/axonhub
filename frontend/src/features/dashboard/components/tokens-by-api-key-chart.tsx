'use client';

import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';
import { Loader2 } from 'lucide-react';
import { formatNumber } from '@/utils/format-number';
import { Skeleton } from '@/components/ui/skeleton';
import { useTokensByAPIKey } from '../data/dashboard';
import type { TimePeriod } from '@/components/time-period-selector';
import { ChartLegend } from './chart-legend';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)'];

const TOKEN_COLORS = {
  input: 'var(--chart-1)',
  output: 'var(--chart-2)',
  cached: 'var(--chart-3)',
};

interface TokensByAPIKeyChartProps {
  timePeriod: TimePeriod;
}

export function TokensByAPIKeyChart({ timePeriod }: TokensByAPIKeyChartProps) {
  const { t } = useTranslation();
  const { data: tokenData, isLoading, isFetching, error } = useTokensByAPIKey(timePeriod);

  if (isLoading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <Skeleton className="skeleton-shimmer h-[250px] w-full rounded-xl" />
      </div>
    );
  }

  const hasError = error;

  const chartData = tokenData
    ?.map((item) => ({
      name: item.apiKeyName,
      inputTokens: item.inputTokens,
      outputTokens: item.outputTokens,
      cachedTokens: item.cachedTokens,
      totalTokens: item.totalTokens,
    }))
    .slice(0, 10) ?? [];

  const totalAllKeys = chartData.reduce((sum, item) => sum + item.totalTokens, 0);

  type TokenTooltipProps = TooltipProps<number, string> & {
    payload?: Array<{
      payload: {
        name: string;
        inputTokens: number;
        outputTokens: number;
        cachedTokens: number;
        totalTokens: number;
      };
    }>;
  };

  const tooltipContent = (props: TokenTooltipProps) => {
    if (!props.active || !props.payload?.length) return null;

    const data = props.payload[0].payload;
    const percent = totalAllKeys ? ((data.totalTokens ?? 0) / totalAllKeys) * 100 : 0;

    return (
      <div className="chart-tooltip rounded-lg border px-3.5 py-3 text-xs shadow-sm">
        <div className="mb-2 text-sm font-semibold tracking-tight">{data.name}</div>
        <div className="space-y-1.5">
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">{t('dashboard.stats.inputTokens')}</span>
            <span className="font-medium tabular-nums">{formatNumber(data.inputTokens)}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">{t('dashboard.stats.outputTokens')}</span>
            <span className="font-medium tabular-nums">{formatNumber(data.outputTokens)}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">{t('dashboard.stats.cachedTokens')}</span>
            <span className="font-medium tabular-nums">{formatNumber(data.cachedTokens)}</span>
          </div>
          <div className="flex justify-between gap-6 border-t border-border pt-1.5">
            <span className="font-medium">{t('dashboard.stats.totalTokens')}</span>
            <span className="font-semibold tabular-nums">{formatNumber(data.totalTokens)} ({percent.toFixed(1)}%)</span>
          </div>
        </div>
      </div>
    );
  };

  const legendItems = chartData.map((item, index) => {
    const percent = totalAllKeys ? (item.totalTokens / totalAllKeys) * 100 : 0;
    return {
      name: item.name,
      index: index + 1,
      color: COLORS[index % COLORS.length],
      primaryValue: formatNumber(item.totalTokens),
      secondaryValue: `${percent.toFixed(1)}%`,
    };
  });

  return (
    <div className="relative space-y-6">
      {hasError ? (
        <div className="flex h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
              <span className="text-sm font-bold text-red-500">!</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {t('dashboard.charts.errorLoadingTokenData')} {error.message}
            </span>
          </div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
              <span className="text-sm text-muted-foreground">—</span>
            </div>
            <span className="text-sm text-muted-foreground">{t('dashboard.charts.noTokenData')}</span>
          </div>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                strokeOpacity={0.4}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={55}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickFormatter={(value) => formatNumber(value)}
              />
              <Tooltip content={tooltipContent} cursor={{ fill: 'var(--muted)', opacity: 0.3 }} />
              <Bar
                dataKey="inputTokens"
                fill={TOKEN_COLORS.input}
                name={t('dashboard.stats.inputTokens')}
                radius={[6, 6, 0, 0]}
                animationDuration={600}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="outputTokens"
                fill={TOKEN_COLORS.output}
                name={t('dashboard.stats.outputTokens')}
                radius={[6, 6, 0, 0]}
                animationDuration={600}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="cachedTokens"
                fill={TOKEN_COLORS.cached}
                name={t('dashboard.stats.cachedTokens')}
                radius={[6, 6, 0, 0]}
                animationDuration={600}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>

          <ChartLegend items={legendItems} />
        </>
      )}
      {isFetching && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
