import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export interface ChartLegendItem {
  name: string;
  index?: number;
  color?: string;
  primaryValue: string;
  secondaryValue?: string;
}

export interface ChartLegendProps {
  items: ChartLegendItem[];
  columns?: 1 | 2;
  showIndex?: boolean;
}

export function ChartLegend({ items, columns, showIndex = true }: ChartLegendProps) {
  const isMobile = useIsMobile();
  const effectiveColumns = columns ?? (isMobile ? 1 : 2);
  const rows = effectiveColumns === 2 ? Math.ceil(items.length / 2) : items.length;

  return (
    <div
      className={cn('grid gap-x-5 gap-y-3')}
      style={{
        gridTemplateRows: effectiveColumns === 2 ? `repeat(${rows}, auto)` : undefined,
        gridAutoFlow: effectiveColumns === 2 ? 'column' : undefined,
      }}
    >
      {items.map((item, index) => (
        <div
          key={`${item.name}-${index}`}
          className="legend-item-hover grid w-full cursor-default grid-cols-[auto_auto_1fr_auto] items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 -mx-2"
        >
          {showIndex && item.index !== undefined && (
            <span className="w-7 text-right text-[11px] font-semibold tabular-nums text-muted-foreground/60">
              {item.index.toString().padStart(2, '0')}
            </span>
          )}
          {item.color && (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/5 dark:ring-white/10"
              style={{ backgroundColor: item.color }}
            />
          )}
          <span className="min-w-0 truncate text-[13px] font-medium tracking-tight">
            {item.name}
          </span>
          <div className="shrink-0 text-right leading-tight">
            <div className="text-[13px] font-semibold tabular-nums tracking-tight">
              {item.primaryValue}
            </div>
            {item.secondaryValue && (
              <div className="text-[11px] tabular-nums text-muted-foreground/70">
                {item.secondaryValue}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
