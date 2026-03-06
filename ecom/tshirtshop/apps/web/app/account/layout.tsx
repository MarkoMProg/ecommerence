import type { ReactNode } from "react";
import { AccountShell } from "./_components/AccountShell";

export const metadata = {
  title: "Account | Darkloom",
  description: "Manage your orders, addresses, payment methods, and settings",
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
