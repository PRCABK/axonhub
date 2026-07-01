import { ActivityIcon, CheckCircle2Icon, XCircleIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/utils/format-number';
import { Skeleton } from '@/components/ui/skeleton';
import { useChannelSuccessRates } from '../data/dashboard';

export function ChannelSuccessRate() {
  const { t } = useTranslation();
  const { data: channels, isLoading, error } = useChannelSuccessRates();

  if (isLoading) {
    return (
      <div className="@container">
        <div
          tabIndex={0}
          className="grid max-h-[322px] grid-cols-1 gap-x-6 gap-y-6 overflow-y-auto [scrollbar-gutter:stable] @md:grid-cols-2 @2xl:grid-cols-3"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="skeleton-shimmer h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="skeleton-shimmer h-4 w-[100px]" />
                <Skeleton className="skeleton-shimmer h-3 w-[140px]" />
              </div>
              <Skeleton className="skeleton-shimmer h-4 w-[50px]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/50 p-3 dark:border-red-800 dark:bg-red-950/30">
        <XCircleIcon className="h-4 w-4 shrink-0 text-red-500" />
        <span className="text-sm text-red-600 dark:text-red-400">
          {t('dashboard.charts.errorLoadingChannelSuccessRate')} {error.message}
        </span>
      </div>
    );
  }

  if (!channels || channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
          <ActivityIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{t('dashboard.charts.noChannelData')}</p>
      </div>
    );
  }

  return (
    <div className="@container">
      <div
        tabIndex={0}
        className="grid max-h-[322px] grid-cols-1 gap-x-6 gap-y-6 overflow-y-auto [scrollbar-gutter:stable] @md:grid-cols-2 @2xl:grid-cols-3"
      >
        {channels.map((channel) => (
          <div key={channel.channelId} className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10 transition-shadow group-hover:ring-primary/20">
              <ActivityIcon className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate text-[13px] font-medium leading-none tracking-tight">
                {channel.channelName || '-'}
              </p>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2Icon className="h-3 w-3 text-emerald-500" />
                  {formatNumber(channel.successCount)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <XCircleIcon className="h-3 w-3 text-red-400" />
                  {formatNumber(channel.failedCount)}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-sm font-semibold tabular-nums tracking-tight">
              {channel.successRate.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
