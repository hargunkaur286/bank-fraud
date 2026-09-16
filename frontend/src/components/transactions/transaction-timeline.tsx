import { Check, KeyRound, Loader2, ScanSearch, ShieldAlert, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionStatus } from "@/lib/api";

interface Step {
  key: string;
  label: string;
  icon: typeof Check;
}

const STEPS: Step[] = [
  { key: "initiated", label: "Transfer Initiated", icon: Check },
  { key: "fraud-check", label: "Fraud Check", icon: ScanSearch },
  { key: "verification", label: "Verification", icon: KeyRound },
  { key: "completed", label: "Completed", icon: Check },
];

type StepState = "done" | "active" | "pending" | "error";

function resolveStepStates(status: TransactionStatus): StepState[] {
  switch (status) {
    case "PENDING":
    case "PROCESSING":
      return ["done", "active", "pending", "pending"];
    case "PENDING_VERIFICATION":
      return ["done", "done", "active", "pending"];
    case "COMPLETED":
      return ["done", "done", "done", "done"];
    case "FLAGGED":
      return ["done", "done", "error", "pending"];
    case "FAILED":
      return ["done", "error", "pending", "pending"];
    default:
      return ["done", "pending", "pending", "pending"];
  }
}

export function TransactionTimeline({ status }: { status: TransactionStatus }) {
  const states = resolveStepStates(status);

  return (
    <div className="flex items-start">
      {STEPS.map((step, index) => {
        const state = states[index];
        const isLast = index === STEPS.length - 1;
        const Icon =
          state === "error" ? (step.key === "fraud-check" ? XCircle : ShieldAlert) : step.icon;

        return (
          <div key={step.key} className={cn("flex flex-1 flex-col items-center", isLast && "flex-none")}>
            <div className="flex w-full items-center">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium",
                  state === "done" && "border-status-good bg-status-good text-white",
                  state === "active" &&
                    "border-chart-1 bg-chart-1/10 text-chart-1",
                  state === "pending" && "border-border bg-muted text-muted-foreground",
                  state === "error" && "border-status-critical bg-status-critical/10 text-status-critical",
                )}
              >
                {state === "active" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Icon className="size-4" />
                )}
              </div>
              {!isLast ? (
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    states[index + 1] !== "pending" || state === "done"
                      ? "bg-status-good"
                      : "bg-border",
                  )}
                />
              ) : null}
            </div>
            <p
              className={cn(
                "mt-2 max-w-20 text-center text-[11px] leading-tight",
                state === "pending" ? "text-muted-foreground" : "font-medium text-foreground",
              )}
            >
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
