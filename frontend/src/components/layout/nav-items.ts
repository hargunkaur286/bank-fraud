import {
  ArrowLeftRight,
  CreditCard,
  LayoutDashboard,
  Send,
  Settings,
  ShieldCheck,
  Wallet,
} from "lucide-react";

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Accounts", href: "/accounts", icon: Wallet },
  { label: "Send Money", href: "/send-money", icon: Send },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Payments", href: "/payments", icon: CreditCard },
  { label: "Fraud & Security", href: "/fraud-security", icon: ShieldCheck },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;
