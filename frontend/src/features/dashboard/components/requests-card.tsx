import { Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/utils/format-number';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStats } from '../data/dashboard';

export function RequestsCard() {
  const { t } = useTranslation();
  const { data: stats, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <Skeleton className='h-5 w-[120px]' />
          <Skeleton className='h-4 w-4' />
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <Skeleton className='h-7 w-[80px]' />
            <Skeleton className='h-4 w-[120px]' />
            <div className='grid grid-cols-2 gap-4 pt-1'>
              <Skeleton className='h-4 w-[80px]' />
              <Skeleton className='h-4 w-[80px]' />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <div className='flex items-center gap-2'>
            <div className='bg-primary/10 text-primary dark:bg-primary/20 rounded-lg p-1.5'>
              <Activity className='h-4 w-4' />
            </div>
            <CardTitle className='text-sm font-medium'>{t('dashboard.stats.requests')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className='text-sm text-red-500'>{t('common.loadError')}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='hover-card min-w-0'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <div className='flex items-center gap-2'>
          <div className='bg-primary/10 text-primary dark:bg-primary/20 rounded-lg p-1.5'>
            <Activity className='h-4 w-4' />
          </div>
          <CardTitle className='text-sm font-medium'>{t('dashboard.stats.requests')}</CardTitle>
        </div>
        <div className='bg-primary h-2 w-2 animate-ping rounded-full' />
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          {/* Today's requests - prominent */}
          <div>
            <div className='font-mono text-xl font-bold'>
              {formatNumber(stats?.requestStats?.requestsToday || 0)}
            </div>
            <div className='text-muted-foreground text-xs'>{t('dashboard.stats.today')}</div>
          </div>
          {/* Total, week, month - secondary row */}
          <div className='grid grid-cols-3 gap-3 pt-1'>
            <div>
              <div className='font-mono text-sm font-semibold'>{formatNumber(stats?.totalRequests || 0)}</div>
              <div className='text-muted-foreground text-xs'>{t('dashboard.stats.all')}</div>
            </div>
            <div>
              <div className='font-mono text-sm font-semibold'>{formatNumber(stats?.requestStats?.requestsThisWeek || 0)}</div>
              <div className='text-muted-foreground text-xs'>{t('dashboard.stats.thisWeek')}</div>
            </div>
            <div>
              <div className='font-mono text-sm font-semibold'>{formatNumber(stats?.requestStats?.requestsThisMonth || 0)}</div>
              <div className='text-muted-foreground text-xs'>{t('dashboard.stats.thisMonth')}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
