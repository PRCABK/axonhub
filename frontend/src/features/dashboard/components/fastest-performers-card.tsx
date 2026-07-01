'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { UseQueryResult } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, type TooltipProps } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { formatNumber } from '@/utils/format-number';
import { TimePeriodSelector, type FastestTimeWindow } from '@/components/time-period-selector';
import { safeNumber, safeToFixed, sanitizeChartData, type ChartData } from '../utils/chart-helpers';
import { ChartLegend, type ChartLegendItem } from './chart-legend';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

interface HorizontalBarChartProps {
  data: ChartData[];
  total: number;
  height?: number;
  noDataLabel: string;
}

function HorizontalBarChart({ data, total, height = 260, noDataLabel }: HorizontalBarChartProps) {
  const safeData = sanitizeChartData(data);
  const safeTotal = safeNumber(total);

  if (safeData.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
            <span className="text-sm text-muted-foreground">—</span>
          </div>
          <span className="text-sm text-muted-foreground">{noDataLabel}</span>
        </div>
      </div>
    );
  }

  const tooltipContent = (props: TooltipProps<number, string>) => {
    const { active, payload } = props;
    if (!active || !payload?.length) return null;

    const item = payload[0].payload as ChartData;
    const safeThroughput = safeNumber(item.throughput);
    const percent = safeTotal > 0 ? (safeThroughput / safeTotal) * 100 : 0;

    return (
      <div className="chart-tooltip rounded-lg border px-3 py-2.5 text-xs shadow-sm">
        <div className="mb-1 text-sm font-semibold tracking-tight">{item.name}</div>
        <div className="space-y-1">
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Throughput</span>
            <span className="font-medium tabular-nums">{safeToFixed(safeThroughput, 0)} tok/s</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Share</span>
            <span className="font-medium tabular-nums">{safeToFixed(percent, 0)}%</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Requests</span>
            <span className="font-medium tabular-nums">{formatNumber(safeNumber(item.requestCount))}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={safeData}
        layout="vertical"
        barSize={28}
        margin={{ left: 10, right: 10, top: 5, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          strokeOpacity={0.4}
          horizontal={false}
        />
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={10} tick={false} tickLine={false} axisLine={false} />
        <Tooltip content={tooltipContent} cursor={{ fill: 'var(--muted)', opacity: 0.3 }} />
        <Bar dataKey="throughput" radius={[0, 6, 6, 0]} animationDuration={600} animationEasing="ease-out">
          {safeData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface ThroughputData {
  throughput?: number;
  requestCount?: number;
}

interface FastestPerformersCardProps<T extends ThroughputData> {
  title: string;
  description: (totalRequests: number) => string;
  noDataLabel: string;
  useData: (timeWindow: string) => UseQueryResult<T[], Error>;
  getName: (item: T) => string | null;
}

export function FastestPerformersCard<T extends ThroughputData>({
  title,
  description,
  noDataLabel,
  useData,
  getName,
}: FastestPerformersCardProps<T>) {
  const { t } = useTranslation();
  const [timeWindow, setTimeWindow] = useState<FastestTimeWindow>('month');

  const { data: items, isLoading, isFetching, error } = useData(timeWindow);

  if (isLoading && !items) {
    return (
      <Card className="hover-card h-full">
        <CardHeader>
          <Skeleton className="skeleton-shimmer h-5 w-[180px]" />
          <Skeleton className="skeleton-shimmer h-4 w-[120px]" />
        </CardHeader>
        <CardContent>
          <div className="flex h-[250px] items-center justify-center">
            <Skeleton className="skeleton-shimmer h-[200px] w-full rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="hover-card h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-red-500">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
            {t('common.loadError')}: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData: ChartData[] = (items || [])
    .slice(0, 5)
    .filter((item) => item != null)
    .map((item) => ({
      name: getName(item) ?? 'Unknown',
      throughput: safeNumber(item.throughput ?? 0),
      requestCount: safeNumber(item.requestCount ?? 0),
    }))
    .sort((a, b) => b.throughput - a.throughput);

  const total = chartData.reduce((sum, item) => sum + safeNumber(item.throughput), 0);
  const totalRequests = chartData.reduce((sum, item) => sum + item.requestCount, 0);

  const legendItems: ChartLegendItem[] = chartData.map((item, index) => ({
    name: item.name,
    index: index + 1,
    color: COLORS[index % COLORS.length],
    primaryValue: `${safeToFixed(item.throughput, 0)} tok/s`,
    secondaryValue: `${formatNumber(item.requestCount)} req`,
  }));

  return (
    <Card className="hover-card h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
          <CardDescription>{description(totalRequests)}</CardDescription>
        </div>
        <TimePeriodSelector value={timeWindow} onChange={setTimeWindow} periods={['month', 'week', 'day']} />
      </CardHeader>
      <CardContent className="relative">
        <div className="space-y-4">
          <HorizontalBarChart data={chartData} total={total} noDataLabel={noDataLabel} />
          <ChartLegend items={legendItems} columns={1} />
        </div>
        {isFetching && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
