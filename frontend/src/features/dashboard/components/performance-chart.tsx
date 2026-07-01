import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { formatNumber } from '@/utils/format-number';
import { formatDuration } from '@/utils/format-duration';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGeneralSettings } from '../../system/data/system';

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const k = String(item[key]);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
];

const MAX_CHART_THROUGHPUT = 1000;
const MAX_CHART_TTFT_MS = 60000;

export type PerformanceDisplayMode = 'throughput' | 'ttft';

export interface LegendItem {
  id: string;
  name: string;
  color: string;
  avgThroughput: number;
  avgTtft: number;
}

export interface PerformanceDataPoint {
  date: string;
  id: string;
  name?: string;
  throughput: number | null;
  ttftMs: number | null;
  requestCount: number;
}

interface PerformanceChartProps {
  data: PerformanceDataPoint[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onTotalRequestsChange?: (total: number) => void;
  emptyMessage: string;
  errorMessage: string;
  idField: 'modelId' | 'channelId';
  nameField?: 'channelName';
}

interface TooltipPayloadItem {
  dataKey: string;
  value: number | null;
  name: string;
  color: string;
  payload: Record<string, string | number | null>;
}

interface PerformanceTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  displayMode: PerformanceDisplayMode;
}

function PerformanceTooltip({ active, payload, label, displayMode }: PerformanceTooltipProps) {
  const { t } = useTranslation();

  if (!active || !payload || payload.length === 0) return null;

  const dataPoint = payload[0]?.payload as Record<string, string | number | null> | undefined;
  if (!dataPoint) return null;

  const filteredPayload = displayMode === 'throughput'
    ? payload.filter((item) => item.dataKey.toString().includes('-capped') && !item.dataKey.toString().includes('-ttft') && item.value != null && item.value > 0)
    : payload.filter((item) => item.dataKey.toString().includes('-ttft-capped') && item.value != null && item.value > 0);

  const itemData = filteredPayload
    .map((item) => {
      const dataKey = item.dataKey.toString();
      const id = displayMode === 'throughput'
        ? dataKey.replace('-capped', '')
        : dataKey.replace('-ttft-capped', '');
      const throughputValue = dataPoint[id] as number ?? 0;
      const ttftValue = dataPoint[`${id}-ttft`] as number ?? 0;
      return {
        id,
        name: item.name,
        throughput: throughputValue,
        ttft: ttftValue,
        color: item.color,
      };
    })
    .sort((a, b) => displayMode === 'throughput' ? b.throughput - a.throughput : a.ttft - b.ttft);

  if (itemData.length === 0) return null;

  return (
    <div className="chart-tooltip rounded-lg border px-3.5 py-3 text-xs shadow-sm">
      <div className="mb-2 text-sm font-semibold tracking-tight">{label}</div>
      <div className="space-y-2">
        {itemData.map((item) => (
          <div key={item.id}>
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate text-sm font-medium">{item.name}</span>
            </div>
            <div className="ml-4 mt-0.5 text-muted-foreground">
              {displayMode === 'throughput' ? (
                <>{formatNumber(item.throughput, { digits: 0 })} {t('dashboard.stats.throughput')}</>
              ) : (
                <>{t('dashboard.stats.ttft')} {formatDuration(item.ttft)}</>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PerformanceChart({
  data,
  isLoading,
  error,
  onTotalRequestsChange,
  emptyMessage,
  errorMessage,
  idField,
  nameField,
}: PerformanceChartProps) {
  const { t, i18n } = useTranslation();
  const { data: generalSettings, isLoading: isSettingsLoading } = useGeneralSettings();
  const [activeSeries, setActiveSeries] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<PerformanceDisplayMode>('throughput');

  const isLoadingData = isLoading || isSettingsLoading;

  const timezone = generalSettings?.timezone || 'UTC';
  const locale = i18n.language.startsWith('zh') ? 'zh-CN' : 'en-US';

  const memoizedSafeData = useMemo(() => data ?? [], [data]);

  const groupedById = useMemo(() => groupBy(memoizedSafeData, 'id'), [memoizedSafeData]);

  const { dates, topItems, legendItems, totalRequests } = useMemo(() => {
    const uniqueDates = [...new Set(memoizedSafeData.map((stat) => stat.date))].sort();

    const uniqueIds = [...new Set(memoizedSafeData.map((stat) => stat.id))].sort();

    const lItems = uniqueIds.map((id, index) => {
      const itemStatsList = groupedById[id] ?? [];
      const name = nameField && itemStatsList[0]?.name
        ? itemStatsList[0].name
        : id;
      const totalRequests = itemStatsList.reduce((sum, s) => sum + s.requestCount, 0);
      const weightedThroughput = totalRequests > 0
        ? itemStatsList.reduce((sum, s) => sum + (s.throughput ?? 0) * s.requestCount, 0) / totalRequests
        : 0;
      const weightedTtft = totalRequests > 0
        ? itemStatsList.reduce((sum, s) => sum + (s.ttftMs ?? 0) * s.requestCount, 0) / totalRequests
        : 0;

      return {
        id,
        name,
        color: COLORS[index % COLORS.length],
        avgThroughput: weightedThroughput,
        avgTtft: weightedTtft,
      };
    });

    lItems.sort((a, b) => a.name.localeCompare(b.name));

    const total = memoizedSafeData.reduce((sum, s) => sum + s.requestCount, 0);

    return { dates: uniqueDates, topItems: uniqueIds, legendItems: lItems, totalRequests: total };
  }, [memoizedSafeData, nameField, groupedById]);

  useEffect(() => {
    onTotalRequestsChange?.(totalRequests);
  }, [totalRequests, onTotalRequestsChange]);

  const statsMap = useMemo(() => {
    return memoizedSafeData.reduce((acc, stat) => {
      if (!acc[stat.date]) acc[stat.date] = {};
      acc[stat.date][stat.id] = stat;
      return acc;
    }, {} as Record<string, Record<string, typeof memoizedSafeData[0]>>);
  }, [memoizedSafeData]);

  const seriesDateRanges = useMemo(() => {
    const ranges: Record<string, {
      throughput: { first: string | null; last: string | null };
      ttft: { first: string | null; last: string | null };
    }> = {};
    topItems.forEach((id) => {
      const throughputDates = dates.filter((date) => statsMap[date]?.[id]?.throughput != null);
      const ttftDates = dates.filter((date) => statsMap[date]?.[id]?.ttftMs != null);
      ranges[id] = {
        throughput: throughputDates.length > 0
          ? { first: throughputDates[0], last: throughputDates[throughputDates.length - 1] }
          : { first: null, last: null },
        ttft: ttftDates.length > 0
          ? { first: ttftDates[0], last: ttftDates[ttftDates.length - 1] }
          : { first: null, last: null },
      };
    });
    return ranges;
  }, [dates, statsMap, topItems]);

  const dateIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    dates.forEach((date, index) => map.set(date, index));
    return map;
  }, [dates]);

  if (isLoadingData) {
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
            <span className="text-lg font-bold text-red-500">!</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {errorMessage} {error.message}
          </span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0 || topItems.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <span className="text-sm text-muted-foreground">—</span>
          </div>
          <span className="text-sm text-muted-foreground">{emptyMessage}</span>
        </div>
      </div>
    );
  }

  const chartData = dates.map((date) => {
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    const dataPoint: Record<string, string | number | null> = {
      name: dateObj.toLocaleDateString(locale, {
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC',
      }),
    };

    const dateIndex = dateIndexMap.get(date) ?? -1;

    topItems.forEach((id) => {
      const stat = statsMap[date]?.[id];
      const ranges = seriesDateRanges[id];

      const throughputRange = ranges.throughput;
      const throughputFirstIndex = throughputRange.first != null ? (dateIndexMap.get(throughputRange.first) ?? -1) : -1;
      const throughputLastIndex = throughputRange.last != null ? (dateIndexMap.get(throughputRange.last) ?? -1) : -1;
      const isThroughputOutsideRange = dateIndex < throughputFirstIndex || dateIndex > throughputLastIndex;

      const ttftRange = ranges.ttft;
      const ttftFirstIndex = ttftRange.first != null ? (dateIndexMap.get(ttftRange.first) ?? -1) : -1;
      const ttftLastIndex = ttftRange.last != null ? (dateIndexMap.get(ttftRange.last) ?? -1) : -1;
      const isTtftOutsideRange = dateIndex < ttftFirstIndex || dateIndex > ttftLastIndex;

      dataPoint[id] = stat?.throughput ?? (isThroughputOutsideRange ? 0 : null);
      dataPoint[`${id}-ttft`] = stat?.ttftMs ?? (isTtftOutsideRange ? 0 : null);
      dataPoint[`${id}-capped`] = Math.min(stat?.throughput ?? 0, MAX_CHART_THROUGHPUT);
      dataPoint[`${id}-ttft-capped`] = Math.min(stat?.ttftMs ?? 0, MAX_CHART_TTFT_MS);
    });

    return dataPoint;
  });

  const throughputValues = memoizedSafeData
    .filter((s) => s.throughput != null && topItems.includes(s.id))
    .map((s) => s.throughput!)
    .sort((a, b) => a - b);

  const maxThroughput = throughputValues.length > 10
    ? throughputValues[Math.floor(throughputValues.length * 0.9)] || throughputValues[throughputValues.length - 1]
    : throughputValues.length > 0
      ? throughputValues[throughputValues.length - 1]
      : 0;
  const throughputMax = Math.max(10, Math.ceil(maxThroughput * 1.1));

  const maxTtft = memoizedSafeData
    .filter((s) => s.ttftMs != null && s.ttftMs > 0 && topItems.includes(s.id))
    .reduce((max, s) => Math.max(max, s.ttftMs!), 0);
  const ttftMax = Math.max(100, Math.ceil(maxTtft * 1.1));

  const visibleItems = activeSeries ? [activeSeries] : topItems;

  const yAxisDomain = displayMode === 'throughput'
    ? [0, Math.min(throughputMax, MAX_CHART_THROUGHPUT)]
    : [0, Math.min(ttftMax, MAX_CHART_TTFT_MS)];
  const yAxisTickFormatter = displayMode === 'throughput'
    ? (value: number) => formatNumber(value, { digits: 0 })
    : (value: number) => formatDuration(value);

  const gradientPrefix = idField === 'modelId' ? 'model' : 'channel';

  return (
    <div>
      <div className="mb-3 flex items-center justify-end">
        <Tabs value={displayMode} onValueChange={(v) => setDisplayMode(v as PerformanceDisplayMode)}>
          <TabsList className="h-8 p-0.5 rounded-lg bg-muted/60">
            <TabsTrigger
              value="throughput"
              className="h-7 px-3 text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              {t('dashboard.stats.throughput')}
            </TabsTrigger>
            <TabsTrigger
              value="ttft"
              className="h-7 px-3 text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              {t('dashboard.stats.ttft')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {topItems.map((id, index) => (
              <linearGradient key={`${id}-fill`} id={`${gradientPrefix}-${displayMode}-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            strokeOpacity={0.4}
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
            stroke="var(--muted-foreground)"
            strokeOpacity={0.5}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={yAxisDomain}
            tickFormatter={yAxisTickFormatter}
            width={50}
            tickMargin={8}
            tickCount={6}
          />
          <Tooltip content={<PerformanceTooltip displayMode={displayMode} />} />
          {topItems.map((id, index) => {
            const color = COLORS[index % COLORS.length];
            const isActive = !activeSeries || activeSeries === id;
            const opacity = isActive ? 1 : 0.15;
            const itemName = legendItems.find((item) => item.id === id)?.name || id;
            const dataKey = displayMode === 'throughput' ? `${id}-capped` : `${id}-ttft-capped`;
            return (
              <Area
                key={id}
                type="monotone"
                dataKey={dataKey}
                name={itemName}
                stroke={color}
                strokeWidth={isActive ? 2 : 1}
                fill={`url(#${gradientPrefix}-${displayMode}-${id})`}
                fillOpacity={1}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--background)' }}
                connectNulls={true}
                strokeOpacity={opacity}
                hide={!visibleItems.includes(id)}
                animationDuration={600}
                animationEasing="ease-out"
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {legendItems.map((item) => {
          const isActive = !activeSeries || activeSeries === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => setActiveSeries((current) => (current === item.id ? null : item.id))}
              className={`legend-item-hover flex flex-col gap-1 rounded-lg border px-2.5 py-2 text-left text-sm transition 2xl:flex-row 2xl:items-center 2xl:justify-between ${
                isActive
                  ? 'border-primary/30 bg-primary/5 text-foreground shadow-sm'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/5 dark:ring-white/10"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate text-[13px] font-medium">{item.name}</span>
              </span>
              <span className="text-[11px] text-muted-foreground/70 tabular-nums 2xl:text-right">
                {formatNumber(item.avgThroughput, { digits: 0 })} {t('dashboard.stats.throughput')} · {t('dashboard.stats.ttft')} {formatDuration(item.avgTtft)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
