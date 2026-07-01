import { FolderIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/utils/format-number';
import { Skeleton } from '@/components/ui/skeleton';
import { useTopProjects } from '../data/dashboard';

export function TopProjects() {
  const { t } = useTranslation();
  const { data: topProjects, isLoading, error } = useTopProjects(5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="skeleton-shimmer h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="skeleton-shimmer h-4 w-[120px]" />
              <Skeleton className="skeleton-shimmer h-3 w-[160px]" />
            </div>
            <Skeleton className="skeleton-shimmer h-4 w-[60px]" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
        {t('dashboard.charts.errorLoadingTopProjects')} {error.message}
      </div>
    );
  }

  if (!topProjects || topProjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
          <FolderIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{t('dashboard.charts.noProjectData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {topProjects.map((project) => (
        <div key={project.projectId} className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10 transition-shadow group-hover:ring-primary/20">
            <FolderIcon className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-[13px] font-medium leading-none tracking-tight">
              {project.projectName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {project.projectDescription}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-sm font-semibold tabular-nums tracking-tight">
              {formatNumber(project.requestCount)}
            </span>
            <span className="ml-1 text-[11px] text-muted-foreground/70">
              {t('dashboard.stats.requests')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
