"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { eachDayOfInterval, format, isSameDay, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { TransactionResponse } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

function buildSeries(transactions: TransactionResponse[]) {
  const days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
  return days.map((day) => {
    const total = transactions
      .filter((t) => t.status === "COMPLETED" && isSameDay(new Date(t.createdAt), day))
      .reduce((sum, t) => sum + t.amount, 0);
    return { date: format(day, "MMM d"), amount: total };
  });
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-popover-foreground">{label}</p>
      <p className="mt-0.5 text-muted-foreground">
        Sent <span className="font-medium text-foreground">{formatCurrency(payload[0].value)}</span>
      </p>
    </div>
  );
}

export function ActivityChart({ transactions }: { transactions: TransactionResponse[] }) {
  const data = useMemo(() => buildSeries(transactions), [transactions]);
  const hasData = data.some((d) => d.amount > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending activity</CardTitle>
        <CardDescription>Completed transfers sent over the last 14 days</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                  width={56}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  tickFormatter={(v: number) =>
                    v === 0 ? "0" : `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                  }
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#activityFill)"
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No completed transfers in the last 14 days yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
