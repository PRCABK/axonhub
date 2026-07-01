'use client';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart, Legend } from 'recharts';
import { formatNumber } from '@/utils/format-number';
import { Skeleton } from '@/components/ui/skeleton';
import { useGeneralSettings } from '../../system/data/system';
import { useDailyRequestStats } from '../data/dashboard';

export function DailyRequestStats() {
  const { t, i18n } = useTranslation();
  const { data: dailyStats, isLoading: isStatsLoading, error } = useDailyRequestStats();
  const { data: generalSettings, isLoading: isSettingsLoading } = useGeneralSettings();

  const isLoading = isStatsLoading || isSettingsLoading;

  const currencyCode = generalSettings?.currencyCode || 'USD';
  const timezone = generalSettings?.timezone || 'UTC';
  const locale = i18n.language.startsWith('zh') ? 'zh-CN' : 'en-US';

  const formatCurrency = useCallback(
    (val: number, fractionDigits: number) =>
      t('currencies.format', {
        val,
        currency: currencyCode,
        locale,
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }),
    [currencyCode, locale, t]
  );

  const formatCostTick = useCallback(
    (value: number | string) => formatCurrency(Number(value), 0),
    [formatCurrency]
  );

  const tooltipFormatter = useCallback(
    (value: number | string, name: string) => {
      if (name === t('dashboard.stats.totalCost')) {
        return [formatCurrency(Number(value), 2), name];
      }
      return [formatNumber(Number(value)), name];
    },
    [formatCurrency, t]
  );

  if (isLoading) {
    return (
      <div className="flex h-[350px] items-center justify-center">
        <Skeleton className="skeleton-shimmer h-full w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[350px] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
            <span className="text-lg">!</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {t('dashboard.charts.errorLoadingChart')} {error.message}
          </span>
        </div>
      </div>
    );
  }

  const chartData =
    dailyStats?.map((stat) => {
      const [year, month, day] = stat.date.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return {
        name: date.toLocaleDateString(locale, {
          month: '2-digit',
          day: '2-digit',
          timeZone: timezone,
        }),
        requests: stat.count,
        tokens: stat.tokens,
        cost: stat.cost,
      };
    }) || [];

  const maxRequests = Math.max(...chartData.map((d) => d.requests), 0);
  const maxTokens = Math.max(...chartData.map((d) => d.tokens), 0);
  const maxCost = Math.max(...chartData.map((d) => d.cost), 0);

  const requestsMax = Math.max(10, Math.ceil(maxRequests * 1.1));
  const tokensMax = Math.max(1000, Math.ceil(maxTokens * 1.1));
  const costMax = Math.max(0.1, maxCost * 1.1);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          strokeOpacity={0.5}
          vertical={false}
        />
        <XAxis
          dataKey="name"
          stroke="var(--muted-foreground)"
          strokeOpacity={0.5}
          fontSize={11}
          tickLine={false}
          axisLine={false}
          padding={{ right: 24 }}
        />
        <YAxis
          yAxisId="left"
          stroke="var(--chart-1)"
          strokeOpacity={0.6}
          fontSize={11}
          tickLine={false}
          axisLine={false}
          domain={[0, requestsMax]}
          tickFormatter={(value) => formatNumber(value)}
          width={40}
          tickMargin={8}
        />
        <YAxis
          yAxisId="tokens"
          orientation="right"
          stroke="var(--chart-2)"
          strokeOpacity={0.6}
          fontSize={11}
          tickLine={false}
          axisLine={false}
          domain={[0, tokensMax]}
          tickFormatter={(value) => formatNumber(value)}
          width={40}
          tickMargin={8}
        />
        <YAxis
          yAxisId="cost"
          orientation="right"
          stroke="var(--chart-3)"
          strokeOpacity={0.6}
          fontSize={11}
          tickLine={false}
          axisLine={false}
          domain={[0, costMax]}
          tickFormatter={formatCostTick}
          width={60}
          tickMargin={8}
        />
        <Tooltip
          formatter={tooltipFormatter}
          contentStyle={{
            backgroundColor: 'var(--popover)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
          itemStyle={{ padding: '3px 0' }}
        />
        <Legend
          verticalAlign="top"
          height={36}
          iconType="circle"
          iconSize={8}
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="requests"
          name={t('dashboard.stats.requests')}
          stroke="var(--chart-1)"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorRequests)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--background)' }}
          animationDuration={800}
          animationEasing="ease-out"
        />
        <Area
          yAxisId="tokens"
          type="monotone"
          dataKey="tokens"
          name={t('dashboard.stats.totalTokens')}
          stroke="var(--chart-2)"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorTokens)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--background)' }}
          animationDuration={800}
          animationEasing="ease-out"
        />
        <Area
          yAxisId="cost"
          type="monotone"
          dataKey="cost"
          name={t('dashboard.stats.totalCost')}
          stroke="var(--chart-3)"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorCost)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--background)' }}
          animationDuration={800}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
