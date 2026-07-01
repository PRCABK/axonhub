import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { BarChart3, Brain, Key, Zap, ChevronDown, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/header';
import { formatNumber } from '@/utils/format-number';
import { TimePeriodSelector, type TimePeriod } from '@/components/time-period-selector';
import { ChannelSuccessRate } from './components/channel-success-rate';
import { DailyRequestStats } from './components/daily-requests-stats';
import { RequestsByChannelChart } from './components/requests-by-channel-chart';
import { RequestsByModelChart } from './components/requests-by-model-chart';
import { RequestsByAPIKeyChart } from './components/requests-by-api-key-chart';
import { TokensByAPIKeyChart } from './components/tokens-by-api-key-chart';
import { TokensByChannelChart } from './components/tokens-by-channel-chart';
import { TokensByModelChart } from './components/tokens-by-model-chart';
import { SuccessRateCard } from './components/success-rate-card';
import { TokenStatsCard } from './components/token-stats-card';
import { RequestsCard } from './components/requests-card';
import { FastestChannelsCard } from './components/fastest-channels-card';
import { FastestModelsCard } from './components/fastest-models-card';
import { ModelPerformanceStats } from './components/model-performance-stats';
import { ChannelPerformanceStats } from './components/channel-performance-stats';
import { useDashboardStats } from './data/dashboard';

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  storageKey: string;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, icon, children, storageKey, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(`dashboard-section-${storageKey}`);
      return stored !== null ? stored === 'true' : defaultOpen;
    } catch {
      return defaultOpen;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`dashboard-section-${storageKey}`, isOpen.toString());
    } catch {
      // Silently fail - persistence is a nice-to-have, not critical
    }
  }, [isOpen, storageKey]);

  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="dashboard-section-trigger flex w-full items-center justify-between rounded-2xl bg-card px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10">
            {icon}
          </div>
          <span className="text-base font-semibold tracking-tight">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { isLoading, error } = useDashboardStats();
  const [modelTotalRequests, setModelTotalRequests] = useState(0);
  const [channelTotalRequests, setChannelTotalRequests] = useState(0);

  const [channelTimePeriod, setChannelTimePeriod] = useState<TimePeriod>('allTime');
  const [channelTokensTimePeriod, setChannelTokensTimePeriod] = useState<TimePeriod>('allTime');
  const [modelTimePeriod, setModelTimePeriod] = useState<TimePeriod>('allTime');
  const [modelTokensTimePeriod, setModelTokensTimePeriod] = useState<TimePeriod>('allTime');
  const [apiKeyTimePeriod, setApiKeyTimePeriod] = useState<TimePeriod>('allTime');
  const [apiKeyTokensTimePeriod, setApiKeyTokensTimePeriod] = useState<TimePeriod>('allTime');

  const modelPerformanceDescription = useMemo(() => {
    return t('dashboard.charts.performanceDescription', { count: formatNumber(modelTotalRequests) });
  }, [t, modelTotalRequests]);

  const channelPerformanceDescription = useMemo(() => {
    return t('dashboard.charts.performanceDescription', { count: formatNumber(channelTotalRequests) });
  }, [t, channelTotalRequests]);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <Skeleton className="skeleton-shimmer h-8 w-[200px]" />
        </div>
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="skeleton-shimmer h-[200px] rounded-2xl" />
            <Skeleton className="skeleton-shimmer h-[200px] rounded-2xl" />
            <Skeleton className="skeleton-shimmer h-[200px] rounded-2xl" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <Skeleton className="skeleton-shimmer col-span-1 h-[380px] rounded-2xl lg:col-span-4" />
            <Skeleton className="skeleton-shimmer col-span-1 h-[380px] rounded-2xl lg:col-span-3" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-950/30">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/50">
            <LayoutDashboard className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">{t('common.loadError')}</p>
            <p className="text-xs text-red-500 dark:text-red-500">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <Header />

      {/* Overview — KPI cards */}
      <section className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <TokenStatsCard />
          <SuccessRateCard />
          <RequestsCard />
        </div>

        {/* Charts row */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="hover-card col-span-1 lg:col-span-4">
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight">
                {t('dashboard.charts.dailyRequestOverview')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <DailyRequestStats />
            </CardContent>
          </Card>
          <Card className="hover-card col-span-1 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight">
                {t('dashboard.charts.channelSuccessRate')}
              </CardTitle>
              <CardDescription>{t('dashboard.charts.channelSuccessRateDescription')}</CardDescription>
              <CardAction>
                <Link
                  to="/dashboard/channel-success-rates"
                  className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  {t('dashboard.viewAll')} →
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent>
              <ChannelSuccessRate />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Channel Analytics */}
      <CollapsibleSection
        title={t('dashboard.sections.channels')}
        icon={<BarChart3 className="h-4 w-4 text-primary" />}
        storageKey="channels"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight">
                {t('dashboard.charts.requestsCostByChannel')}
              </CardTitle>
              <CardDescription>{t('dashboard.charts.requestsCostByChannelDescription')}</CardDescription>
              <CardAction>
                <TimePeriodSelector value={channelTimePeriod} onChange={setChannelTimePeriod} />
              </CardAction>
            </CardHeader>
            <CardContent>
              <RequestsByChannelChart timePeriod={channelTimePeriod} />
            </CardContent>
          </Card>
          <Card className="hover-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight">
                {t('dashboard.charts.tokensByChannel')}
              </CardTitle>
              <CardDescription>{t('dashboard.charts.tokensByChannelDescription')}</CardDescription>
              <CardAction>
                <TimePeriodSelector value={channelTokensTimePeriod} onChange={setChannelTokensTimePeriod} />
              </CardAction>
            </CardHeader>
            <CardContent>
              <TokensByChannelChart timePeriod={channelTokensTimePeriod} />
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      {/* Model Analytics */}
      <CollapsibleSection
        title={t('dashboard.sections.models')}
        icon={<Brain className="h-4 w-4 text-primary" />}
        storageKey="models"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight">
                {t('dashboard.charts.requestsCostByModel')}
              </CardTitle>
              <CardDescription>{t('dashboard.charts.requestsCostByModelDescription')}</CardDescription>
              <CardAction>
                <TimePeriodSelector value={modelTimePeriod} onChange={setModelTimePeriod} />
              </CardAction>
            </CardHeader>
            <CardContent>
              <RequestsByModelChart timePeriod={modelTimePeriod} />
            </CardContent>
          </Card>
          <Card className="hover-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight">
                {t('dashboard.charts.tokensByModel')}
              </CardTitle>
              <CardDescription>{t('dashboard.charts.tokensByModelDescription')}</CardDescription>
              <CardAction>
                <TimePeriodSelector value={modelTokensTimePeriod} onChange={setModelTokensTimePeriod} />
              </CardAction>
            </CardHeader>
            <CardContent>
              <TokensByModelChart timePeriod={modelTokensTimePeriod} />
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      {/* API Key Analytics */}
      <CollapsibleSection
        title={t('dashboard.sections.apiKeys')}
        icon={<Key className="h-4 w-4 text-primary" />}
        storageKey="apiKeys"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight">
                {t('dashboard.charts.requestsCostByAPIKey')}
              </CardTitle>
              <CardDescription>{t('dashboard.charts.requestsCostByAPIKeyDescription')}</CardDescription>
              <CardAction>
                <TimePeriodSelector value={apiKeyTimePeriod} onChange={setApiKeyTimePeriod} />
              </CardAction>
            </CardHeader>
            <CardContent>
              <RequestsByAPIKeyChart timePeriod={apiKeyTimePeriod} />
            </CardContent>
          </Card>
          <Card className="hover-card">
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight">
                {t('dashboard.charts.tokensByAPIKey')}
              </CardTitle>
              <CardDescription>{t('dashboard.charts.tokensByAPIKeyDescription')}</CardDescription>
              <CardAction>
                <TimePeriodSelector value={apiKeyTokensTimePeriod} onChange={setApiKeyTokensTimePeriod} />
              </CardAction>
            </CardHeader>
            <CardContent>
              <TokensByAPIKeyChart timePeriod={apiKeyTokensTimePeriod} />
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      {/* Performance */}
      <CollapsibleSection
        title={t('dashboard.sections.performance')}
        icon={<Zap className="h-4 w-4 text-primary" />}
        storageKey="performance"
      >
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
          <Card className="hover-card col-span-1 lg:col-span-4">
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight">
                {t('dashboard.charts.modelPerformance')}
              </CardTitle>
              <CardDescription>{modelPerformanceDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <ModelPerformanceStats onTotalRequestsChange={setModelTotalRequests} />
            </CardContent>
          </Card>
          <div className="col-span-1 lg:col-span-3">
            <FastestModelsCard />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
          <Card className="hover-card col-span-1 lg:col-span-4">
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight">
                {t('dashboard.charts.channelPerformance')}
              </CardTitle>
              <CardDescription>{channelPerformanceDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChannelPerformanceStats onTotalRequestsChange={setChannelTotalRequests} />
            </CardContent>
          </Card>
          <div className="col-span-1 lg:col-span-3">
            <FastestChannelsCard />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
