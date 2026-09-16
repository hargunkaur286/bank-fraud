"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { eachDayOfInterval, format, isSameDay, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { TransactionResponse } from "@/lib/api";

function buildSeries(transactions: TransactionResponse[]) {
  const days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
  return days.map((day) => {
    const onDay = transactions.filter((t) => isSameDay(new Date(t.createdAt), day));
    return {
      date: format(day, "MMM d"),
      clean: onDay.filter((t) => t.status === "COMPLETED").length,
      verification: onDay.filter((t) => t.status === "PENDING_VERIFICATION").length,
      flagged: onDay.filter((t) => t.status === "FLAGGED").length,
    };
  });
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-popover-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-medium text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function FraudActivityChart({ transactions }: { transactions: TransactionResponse[] }) {
  const data = useMemo(() => buildSeries(transactions), [transactions]);
  const hasData = transactions.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fraud detection activity</CardTitle>
        <CardDescription>
          Transactions scanned in the last 14 days, by outcome
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  interval={1}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={28}
                  allowDecimals={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
                />
                <Bar dataKey="clean" name="Clean" stackId="a" fill="var(--status-good)" radius={[0, 0, 0, 0]} />
                <Bar
                  dataKey="verification"
                  name="Verification"
                  stackId="a"
                  fill="var(--status-warning)"
                />
                <Bar
                  dataKey="flagged"
                  name="Flagged"
                  stackId="a"
                  fill="var(--status-critical)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            No transactions scanned yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
