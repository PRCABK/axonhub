'use client';

import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts';
import { Loader2 } from 'lucide-react';
import { formatNumber } from '@/utils/format-number';
import { Skeleton } from '@/components/ui/skeleton';
import { useGeneralSettings } from '../../system/data/system';
import { useRequestsByAPIKey, useCostByAPIKey } from '../data/dashboard';
import type { TimePeriod } from '@/components/time-period-selector';
import { ChartLegend } from './chart-legend';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)'];

interface RequestsByAPIKeyChartProps {
  timePeriod: TimePeriod;
}

export function RequestsByAPIKeyChart({ timePeriod }: RequestsByAPIKeyChartProps) {
  const { t, i18n } = useTranslation();

  const { data: apiKeyData, isLoading: isRequestsLoading, isFetching: isRequestsFetching, error: requestsError } = useRequestsByAPIKey(timePeriod);
  const { data: costData, isLoading: isCostLoading, isFetching: isCostFetching, error: costError } = useCostByAPIKey(timePeriod);
  const { data: generalSettings, isLoading: isSettingsLoading, isFetching: isSettingsFetching } = useGeneralSettings();

  const isLoading = isRequestsLoading || isCostLoading || isSettingsLoading;
  const isFetching = isRequestsFetching || isCostFetching || isSettingsFetching;
  const error = requestsError || costError;

  const currencyCode = generalSettings?.currencyCode || 'USD';
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

  const { chartData, totalRequests, totalCost } = useMemo(() => {
    if (!apiKeyData) return { chartData: [], totalRequests: 0, totalCost: 0 };

    const costMap = new Map((costData ?? []).map((item) => [item.apiKeyName, item.cost]));

    const data = apiKeyData
      .map((item) => ({
        name: item.apiKeyName,
        requests: item.count,
        cost: costMap.get(item.apiKeyName) ?? 0,
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);

    const totalReq = data.reduce((sum, item) => sum + item.requests, 0);
    const totalC = data.reduce((sum, item) => sum + item.cost, 0);

    return { chartData: data, totalRequests: totalReq, totalCost: totalC };
  }, [apiKeyData, costData]);

  if (isLoading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <Skeleton className="skeleton-shimmer h-[250px] w-full rounded-xl" />
      </div>
    );
  }

  const hasError = error;

  const legendItems = chartData.map((item, index) => ({
    name: item.name,
    index: index + 1,
    color: COLORS[index % COLORS.length],
    primaryValue: formatNumber(item.requests),
    secondaryValue: formatCurrency(item.cost, 4),
  }));

  type CombinedTooltipProps = TooltipProps<number, string> & {
    payload?: Array<{
      name?: string;
      value?: number;
      payload?: {
        name: string;
        requests: number;
        cost: number;
      };
    }>;
  };

  const tooltipContent = (props: CombinedTooltipProps) => {
    const payload = props.payload;
    if (!props.active || !payload?.length) return null;

    const data = payload[0].payload;
    if (!data) return null;

    const reqPercent = totalRequests ? (data.requests / totalRequests) * 100 : 0;
    const costPercent = totalCost ? (data.cost / totalCost) * 100 : 0;

    return (
      <div className="chart-tooltip rounded-lg border px-3.5 py-3 text-xs shadow-sm">
        <div className="mb-2 text-sm font-semibold tracking-tight">{data.name}</div>
        <div className="space-y-1.5">
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">{t('dashboard.stats.requests')}</span>
            <span className="font-medium tabular-nums">{formatNumber(data.requests)} ({reqPercent.toFixed(0)}%)</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">{t('dashboard.stats.totalCost')}</span>
            <span className="font-medium tabular-nums">{formatCurrency(data.cost, 4)} ({costPercent.toFixed(0)}%)</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative space-y-6">
      {hasError ? (
        <div className="flex h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
              <span className="text-sm font-bold text-red-500">!</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {t('dashboard.charts.errorLoadingAPIKeyData')} {error.message}
            </span>
          </div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
              <span className="text-sm text-muted-foreground">—</span>
            </div>
            <span className="text-sm text-muted-foreground">{t('dashboard.charts.noAPIKeyData')}</span>
          </div>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} barSize={28}>
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
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                width={55}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                width={65}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickFormatter={(value) => formatCurrency(value, 0)}
              />
              <Tooltip content={tooltipContent} cursor={{ fill: 'var(--muted)', opacity: 0.3 }} />
              <Bar
                yAxisId="left"
                dataKey="requests"
                radius={[6, 6, 0, 0]}
                animationDuration={600}
                animationEasing="ease-out"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
              <Bar
                yAxisId="right"
                dataKey="cost"
                radius={[6, 6, 0, 0]}
                fill="var(--chart-5)"
                opacity={0.35}
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
