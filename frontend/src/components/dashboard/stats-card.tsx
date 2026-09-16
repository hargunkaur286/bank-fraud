import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Accent = "neutral" | "critical" | "good" | "info" | "violet";

const ACCENT_CLASSES: Record<Accent, { icon: string; border: string }> = {
  neutral: { icon: "text-muted-foreground", border: "border-t-border" },
  critical: { icon: "text-status-critical", border: "border-t-status-critical" },
  good: { icon: "text-status-good", border: "border-t-status-good" },
  info: { icon: "text-chart-1", border: "border-t-chart-1" },
  violet: { icon: "text-chart-5", border: "border-t-chart-5" },
};

interface StatsCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  accent?: Accent;
  /** Data derived client-side with no matching backend endpoint yet. */
  demo?: boolean;
  /** No backend endpoint exists at all - shown as unavailable rather than a fabricated number. */
  unavailableReason?: string;
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "neutral",
  demo,
  unavailableReason,
}: StatsCardProps) {
  const { icon: iconClass, border: borderClass } = ACCENT_CLASSES[accent];

  return (
    <Card className={cn("border-t-2", borderClass)}>
      <CardContent className="px-5 py-4">
        <div className="flex items-center gap-1.5">
          <Icon className={cn("size-3.5", iconClass)} />
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {demo ? (
            <Badge variant="outline" className="h-4.5 px-1.5 text-[10px] font-normal">
              Demo
            </Badge>
          ) : null}
          {unavailableReason ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-56">{unavailableReason}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
          {unavailableReason ? "—" : value}
        </p>
        {hint && !unavailableReason ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
