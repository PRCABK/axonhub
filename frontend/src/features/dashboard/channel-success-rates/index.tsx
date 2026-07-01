import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useChannelSuccessRates, useTokensByChannel, type TokensByChannel } from '../data/dashboard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityIcon, AlertTriangleIcon, CheckCircle2Icon, CoinsIcon, XCircleIcon, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import ContentSection from '@/features/settings/components/content-section';

type SortField = 'totalCount' | 'successCount' | 'failedCount' | 'successRate' | 'inputTokens' | 'outputTokens' | 'totalTokens';
type SortOrder = 'asc' | 'desc';

const PAGE_SIZE = 20;

export default function DashboardChannelSuccessRates() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [timeWindow, setTimeWindow] = useState<string>('day');
  const [sortField, setSortField] = useState<SortField>('successRate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<string>('all');
  const [showWarningsOnly, setShowWarningsOnly] = useState(false);

  const { data: channels, isLoading, error } = useChannelSuccessRates(undefined, timeWindow);
  const { data: tokenData } = useTokensByChannel(timeWindow);

  const tokenByChannel = useMemo(() => {
    if (!tokenData) return new Map<string, TokensByChannel>();
    const map = new Map<string, TokensByChannel>();
    tokenData.forEach((t) => map.set(t.channelId, t));
    return map;
  }, [tokenData]);

  const channelTypes = useMemo(() => {
    if (!channels) return [];
    const types = new Set<string>();
    channels.forEach((c) => {
      if (c.channelType) types.add(c.channelType);
    });
    return Array.from(types).sort();
  }, [channels]);

  const filteredChannels = useMemo(() => {
    if (!channels) return [];
    let result = [...channels];

    if (filterType !== 'all') {
      result = result.filter((c) => c.channelType === filterType);
    }

    if (showWarningsOnly) {
      result = result.filter((c) => c.channelDisabled);
    }

    return result;
  }, [channels, filterType, showWarningsOnly]);

  const sortedChannels = useMemo(() => {
    return [...filteredChannels].sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortField) {
        case 'successCount':
          aVal = a.successCount;
          bVal = b.successCount;
          break;
        case 'failedCount':
          aVal = a.failedCount;
          bVal = b.failedCount;
          break;
        case 'successRate':
          aVal = a.successRate;
          bVal = b.successRate;
          break;
        case 'inputTokens':
          aVal = tokenByChannel.get(a.channelId)?.inputTokens ?? 0;
          bVal = tokenByChannel.get(b.channelId)?.inputTokens ?? 0;
          break;
        case 'outputTokens':
          aVal = tokenByChannel.get(a.channelId)?.outputTokens ?? 0;
          bVal = tokenByChannel.get(b.channelId)?.outputTokens ?? 0;
          break;
        case 'totalTokens':
          aVal = tokenByChannel.get(a.channelId)?.totalTokens ?? 0;
          bVal = tokenByChannel.get(b.channelId)?.totalTokens ?? 0;
          break;
        default:
          aVal = a.totalCount;
          bVal = b.totalCount;
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filteredChannels, sortField, sortOrder, tokenByChannel]);

  const totalPages = Math.ceil(sortedChannels.length / PAGE_SIZE);
  const paginatedChannels = sortedChannels.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [timeWindow, filterType, showWarningsOnly, sortField, sortOrder]);

  const handleBack = () => {
    navigate({ to: '/' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function getSuccessRateColor(rate: number): string {
    if (rate >= 95) return 'text-emerald-600 dark:text-emerald-400';
    if (rate >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  }

  function getProgressBarColor(rate: number): string {
    if (rate >= 95) return 'bg-emerald-500';
    if (rate >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  }

  function formatNumber(num: number): string {
    return num.toLocaleString();
  }

  if (error) {
    return (
      <ContentSection title={t('dashboard.channelSuccessRates.pageTitle')} desc="">
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-950/30">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/50">
            <XCircleIcon className="h-4 w-4 text-red-500" />
          </div>
          <span className="text-sm text-red-600 dark:text-red-400">
            {t('dashboard.channelSuccessRates.pageTitle')}: {error.message}
          </span>
        </div>
      </ContentSection>
    );
  }

  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, sortedChannels.length);
  const total = sortedChannels.length;

  return (
    <div className="flex flex-1 flex-col gap-6 p-8 pt-6">
      <Header
        title={t('dashboard.channelSuccessRates.pageTitle')}
        description={t('dashboard.channelSuccessRates.description', { defaultValue: 'View channel success rate statistics' })}
      />
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Button onClick={handleBack} variant="outline" size="sm" className="self-start gap-2 rounded-xl">
            <ArrowLeft className="h-4 w-4" />
            {t('dashboard.channelSuccessRates.backToDashboard')}
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={timeWindow} onValueChange={setTimeWindow}>
              <SelectTrigger className="w-[120px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">{t('dashboard.stats.today')}</SelectItem>
                <SelectItem value="week">{t('dashboard.stats.thisWeek')}</SelectItem>
                <SelectItem value="month">{t('dashboard.stats.thisMonth')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('dashboard.channelSuccessRates.allTypes')}</SelectItem>
                {channelTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <label className="flex items-center gap-2 whitespace-nowrap text-sm">
              <Checkbox checked={showWarningsOnly} onCheckedChange={(checked) => setShowWarningsOnly(checked === true)} />
              {t('dashboard.channelSuccessRates.showWarnings')}
            </label>

            <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
              <SelectTrigger className="w-[150px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="totalCount">{t('dashboard.channelSuccessRates.sortByTotal')}</SelectItem>
                <SelectItem value="successCount">{t('dashboard.channelSuccessRates.sortBySuccess')}</SelectItem>
                <SelectItem value="failedCount">{t('dashboard.channelSuccessRates.sortByFailed')}</SelectItem>
                <SelectItem value="successRate">{t('dashboard.channelSuccessRates.sortByRate')}</SelectItem>
                <SelectItem value="inputTokens">{t('dashboard.channelSuccessRates.sortByInputTokens')}</SelectItem>
                <SelectItem value="outputTokens">{t('dashboard.channelSuccessRates.sortByOutputTokens')}</SelectItem>
                <SelectItem value="totalTokens">{t('dashboard.channelSuccessRates.sortByTotalTokens')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
              <SelectTrigger className="w-[100px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">{t('dashboard.channelSuccessRates.desc')}</SelectItem>
                <SelectItem value="asc">{t('dashboard.channelSuccessRates.asc')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="skeleton-shimmer h-9 w-9 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="skeleton-shimmer h-4 w-[140px]" />
                      <Skeleton className="skeleton-shimmer h-3 w-[80px]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <Skeleton className="skeleton-shimmer h-8 w-[80px]" />
                      <Skeleton className="skeleton-shimmer h-3 w-[72px]" />
                    </div>
                    <Skeleton className="skeleton-shimmer h-2 w-full rounded-full" />
                  </div>
                  <div className="flex gap-3">
                    <Skeleton className="skeleton-shimmer h-4 w-[64px]" />
                    <Skeleton className="skeleton-shimmer h-4 w-[64px]" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && paginatedChannels.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <ActivityIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {t('dashboard.channelSuccessRates.noData', { defaultValue: 'No data available' })}
            </p>
          </div>
        )}

        {/* Channel cards grid */}
        {!isLoading && paginatedChannels.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedChannels.map((channel) => {
              const tokens = tokenByChannel.get(channel.channelId);
              const showTokens = tokens && tokens.totalTokens > 0;

              return (
                <Card key={channel.channelId} className="hover-card min-w-0">
                  <CardContent className="space-y-4 p-5">
                    {/* Channel info */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10">
                        <ActivityIcon className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold tracking-tight">{channel.channelName}</p>
                        <span className="text-[11px] text-muted-foreground">{channel.channelType}</span>
                      </div>
                      {channel.channelDisabled && (
                        <div className="flex h-6 items-center gap-1.5 rounded-full bg-red-100 px-2 text-[11px] font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                          <AlertTriangleIcon className="h-3 w-3" />
                          Disabled
                        </div>
                      )}
                    </div>

                    {/* Success rate display */}
                    <div>
                      <div className="mb-1.5 flex items-baseline justify-between">
                        <span className={`text-2xl font-bold tabular-nums tracking-tight ${getSuccessRateColor(channel.successRate)}`}>
                          {channel.successRate.toFixed(1)}%
                        </span>
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          {formatNumber(channel.totalCount)} total
                        </span>
                      </div>

                      {/* Progress bar — refined */}
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressBarColor(channel.successRate)}`}
                          style={{ width: `${channel.successRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Success/Failed counts */}
                    <div className="flex gap-4 text-[13px]">
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
                        <span className="font-medium tabular-nums">{formatNumber(channel.successCount)}</span>
                        <span className="text-muted-foreground/60">success</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <XCircleIcon className="h-4 w-4 text-red-400" />
                        <span className="font-medium tabular-nums">{formatNumber(channel.failedCount)}</span>
                        <span className="text-muted-foreground/60">failed</span>
                      </span>
                    </div>

                    {/* Token consumption */}
                    {showTokens && (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
                        <CoinsIcon className="h-3.5 w-3.5 shrink-0" />
                        <span>In: {formatNumber(tokens.inputTokens)}</span>
                        <span className="text-border/60">|</span>
                        <span>Out: {formatNumber(tokens.outputTokens)}</span>
                        <span className="text-border/60">|</span>
                        <span className="font-medium">Total: {formatNumber(tokens.totalTokens)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {t('dashboard.channelSuccessRates.showing', { start, end, total })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="rounded-xl"
              >
                {t('dashboard.channelSuccessRates.prev')}
              </Button>
              <span className="text-sm font-medium tabular-nums">
                {currentPage} / {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="rounded-xl"
              >
                {t('dashboard.channelSuccessRates.next')}
              </Button>
              <Button onClick={scrollToTop} variant="outline" size="sm" className="rounded-xl">
                ↑ Top
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
